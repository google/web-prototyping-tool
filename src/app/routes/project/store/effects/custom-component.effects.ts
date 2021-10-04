/*
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { SymbolScreenshotsService } from '../../services/symbol-screenshots/symbol-screenshots.service';
import { ToastsService } from 'src/app/services/toasts/toasts.service';
import { catchError, map, switchMap, tap, withLatestFrom } from 'rxjs/operators';
import { getModels, isSymbolDefinition } from 'cd-common/models';
import { projectPathForId } from 'src/app/database/path.utils';
import { DatabaseService } from 'src/app/database/database.service';
import { DuplicateService } from 'src/app/services/duplicate/duplicate.service';
import { AnalyticsService } from 'src/app/services/analytics/analytics.service';
import { Observable, forkJoin, EMPTY, of } from 'rxjs';
import { createEffect, Actions, ofType } from '@ngrx/effects';
import { Store, select, Action } from '@ngrx/store';
import { Injectable } from '@angular/core';
import * as utils from '../../utils/import.utils';
import * as actions from '../actions';
import * as cd from 'cd-interfaces';
import { findAllInstancesOfSymbol } from '../../utils/symbol.utils';
import { constructCodeComponentPath } from 'src/app/utils/route.utils';
import { AppGo } from 'src/app/store/actions';
import {
  ISOLATED_SYMBOL_ID_QUERY_PARAM,
  SYMBOL_MODE_QUERY_PARAM,
} from 'src/app/configs/routes.config';
import { getRouterState, IAppState } from 'src/app/store';
import { ProjectContentService } from 'src/app/database/changes/project-content.service';
import { buildPropertyUpdatePayload } from 'cd-common/utils';

interface IImportPayload {
  publishEntries: cd.IPublishEntry[];
  newAssets: cd.IProjectAsset[];
  newElements: cd.PropertyModel[];
  newCodeComponents: cd.ICodeComponentDocument[];
  newDatasets: cd.ProjectDataset[];
}

@Injectable()
export class CustomComponentEffect {
  private _importToastId?: string;

  constructor(
    private actions$: Actions,
    private _toastService: ToastsService,
    private _databaseService: DatabaseService,
    private _analyticsService: AnalyticsService,
    private _duplicateService: DuplicateService,
    private _appStore: Store<IAppState>,
    private _symbolScreenshotsService: SymbolScreenshotsService,
    private _projectContentService: ProjectContentService
  ) {}

  importComponents$ = createEffect(() =>
    this.actions$.pipe(
      ofType<actions.CustomComponentImport>(actions.CUSTOM_COMPONENT_IMPORT),
      withLatestFrom(this._projectContentService.project$),
      // Log Analytics Events
      tap(([action]) => {
        for (const entry of action.publishEntries) {
          const evt = utils.analyticsEventForType(entry.type);
          if (!evt) continue;
          this._analyticsService.logEvent(evt);
        }
      }),
      tap(([action]) => {
        this._showImportToast(action.publishEntries);
      }),
      switchMap(([action, project]) => {
        if (!project) return EMPTY;
        const { publishEntries, specificVersionId } = action;
        return this._getImportPayload(project, publishEntries, specificVersionId);
      }),
      switchMap((importPayload: IImportPayload) => {
        const { publishEntries, newElements, newCodeComponents: codeCmps } = importPayload;
        this._utilizeExistingScreenshotsForImports(publishEntries, newElements, codeCmps);
        this._hideImportToast();
        this._showSuccessToast(publishEntries);
        return this._getActionsForImportPayload(importPayload);
      }),
      catchError((err) => {
        this._hideImportToast();
        throw new Error(`Component import failed: ${err}`);
      })
    )
  );

  swapSymbolVersion$ = createEffect(() =>
    this.actions$.pipe(
      ofType<actions.SymbolSwapVersion>(actions.SYMBOL_SWAP_VERSION),
      withLatestFrom(this._projectContentService.elementProperties$),
      withLatestFrom(this._projectContentService.project$),
      switchMap(([[swapAction, elementProperties], project]) => {
        const { payload, navigateToComponent } = swapAction;
        const { publishEntry: entry, updatedVersion, componentId } = payload;
        const { symbolId } = updatedVersion; // id of the published symbol we're importing
        const oldSymbol = elementProperties[componentId] as cd.ISymbolProperties;
        if (!project || !symbolId || !oldSymbol) return EMPTY;
        const importPayload$ = this._getImportPayload(project, [entry], updatedVersion.id);
        return forkJoin([
          importPayload$,
          of(oldSymbol),
          of(elementProperties),
          of(navigateToComponent),
        ]);
      }),
      withLatestFrom(this._appStore.pipe(select(getRouterState))),
      switchMap(
        ([[importPayload, oldSymbol, elementProperties, navigateToComponent], routerState]) => {
          const { publishId } = oldSymbol;
          if (!publishId) return EMPTY;
          const importedSymbols = importPayload.newElements.filter(isSymbolDefinition);
          // Find new symbol that has the same publish entry Id as the symbol being swapped
          const newSymbol = importedSymbols.find((s) => s.publishId?.entryId === publishId.entryId);
          if (!newSymbol) return EMPTY;

          // Update all instance of old Symbol to point to new symbol
          const instances = findAllInstancesOfSymbol(oldSymbol.id, elementProperties);
          const instanceUpdates: cd.IPropertiesUpdatePayload[] = instances.map((inst) => {
            const inputs = { ...inst.inputs, referenceId: newSymbol.id };
            return buildPropertyUpdatePayload(inst.id, { inputs });
          });

          const importActions = this._getActionsForImportPayload(importPayload);

          // Dispatch actions to:
          // 1. Import new symbol version (and all dependencies)
          // 2. Update all instance of all old symbol to point to new symbol version
          // 3. Delete old symbol
          // 4. Optionally, navigate to URL for new symbol (symbol isolation mode)
          const actionResults: Action[] = [
            ...importActions,
            new actions.ElementPropertiesUpdate(instanceUpdates),
            new actions.SymbolDelete(oldSymbol, false),
          ];

          if (navigateToComponent) {
            const query = { ...routerState.state.queryParams };
            query[SYMBOL_MODE_QUERY_PARAM] = true;
            query[ISOLATED_SYMBOL_ID_QUERY_PARAM] = newSymbol.id;
            const navigateAction = new AppGo({ path: [], query });
            actionResults.push(navigateAction);
          }

          return actionResults;
        }
      )
    )
  );

  swapCodeComponentVersion$ = createEffect(() =>
    this.actions$.pipe(
      ofType<actions.CodeComponentSwapVersion>(actions.CODE_COMPONENT_SWAP_VERSION),
      withLatestFrom(this._projectContentService.elementProperties$),
      withLatestFrom(this._projectContentService.project$),
      withLatestFrom(this._projectContentService.codeCmpMap$),
      switchMap(([[[swapAction, elementProperties], project], codeCmps]) => {
        const { payload, navigateToComponent } = swapAction;
        const { publishEntry: entry, updatedVersion, componentId } = payload;
        const { codeComponentId } = updatedVersion; // id of the published code cmp we're importing
        const oldCodeComponent = codeCmps[componentId];
        if (!project || !codeComponentId || !oldCodeComponent) return EMPTY;
        const importPayload$ = this._getImportPayload(project, [entry], updatedVersion.id);
        return forkJoin([
          importPayload$,
          of(oldCodeComponent),
          of(elementProperties),
          of(project),
          of(navigateToComponent),
        ]);
      }),
      switchMap(
        ([importPayload, oldCodeComponent, elementProperties, project, navigateToComponent]) => {
          const { publishId } = oldCodeComponent;
          if (!publishId) return EMPTY;
          const { entryId } = publishId;
          const { newCodeComponents } = importPayload;
          // Find new code compponent that has the same publish entry Id as the one being swapped
          const importedCodeCmp = newCodeComponents.find((c) => c.publishId?.entryId === entryId);
          if (!importedCodeCmp) return EMPTY;

          const allElements = getModels(elementProperties);
          const instances = allElements.filter((e) => e.elementType === oldCodeComponent.id);
          const instanceUpdates: cd.IPropertiesUpdatePayload[] = instances.map((inst) => {
            return buildPropertyUpdatePayload(inst.id, { elementType: importedCodeCmp.id });
          });

          const importActions = this._getActionsForImportPayload(importPayload);

          // Dispatch actions to:
          // 1. Import new symbol version (and all dependencies)
          // 2. Update all instance of all old symbol to point to new symbol version
          // 3. Delete old symbol
          // 4. Optionally, navigate to URL for new component (code component editor)
          const actionResults: Action[] = [
            ...importActions,
            new actions.ElementPropertiesUpdate(instanceUpdates),
            new actions.CodeComponentDelete(oldCodeComponent, false),
          ];

          if (navigateToComponent) {
            const pathToCodeComponent = constructCodeComponentPath(project.id, importedCodeCmp.id);
            const navigateAction = new AppGo({ path: [pathToCodeComponent] });
            actionResults.push(navigateAction);
          }

          return actionResults;
        }
      )
    )
  );

  private _importPublishEntry = (
    version: cd.IPublishVersion,
    project: cd.IProject
  ): Observable<cd.IProjectContentDocument[]> => {
    const owner = project.owner;
    const versionPath = projectPathForId(version.projectId);
    return this._databaseService.getDocumentData<cd.IProject>(versionPath).pipe(
      switchMap((versionProject) => {
        if (!versionProject) {
          const errMsg = `Project not found for latest version of publish entry. Project id: ${version.projectId}`;
          throw Error(errMsg);
        }
        return this._duplicateService.createProjectDuplicates(versionProject, owner);
      }),
      map(({ contents }) => {
        // copy in everything except for design system
        const filteredContents = contents.filter((d) => d.type !== cd.EntityType.DesignSystem);

        // assign all new docs as child of projectId
        const projectContents = filteredContents.map((doc) => ({ ...doc, projectId: project.id }));
        return projectContents;
      })
    );
  };

  private _showImportToast = (publishEntries: cd.IPublishEntry[]) => {
    const message = utils.generateImportMessage(publishEntries);
    const toast = { message, showLoader: true, duration: -1 };
    this._importToastId = this._toastService.addToast(toast);
  };

  private _showSuccessToast = (publishEntries: cd.IPublishEntry[]) => {
    const message = utils.generateImportSuccessMessage(publishEntries);
    this._importToastId = this._toastService.addToast({ message });
  };

  private _hideImportToast = () => {
    if (this._importToastId) this._toastService.removeToast(this._importToastId);
  };

  private _generateImportsForEntries = (
    publishEntries: cd.IPublishEntry[],
    project: cd.IProject,
    specificVersionId?: string
  ) => {
    // If specificVersionId is passed in, only 1 publish entry will be loaded
    if (specificVersionId) {
      const version = publishEntries[0]?.versions.find((v) => v.id === specificVersionId);
      if (!version) return [];
      return [this._importPublishEntry(version, project)];
    }
    return publishEntries.map((entry) => {
      const [first] = entry.versions;
      return this._importPublishEntry(first, project);
    });
  };

  private _utilizeExistingScreenshotsForImports = (
    importedEntries: cd.IPublishEntry[],
    newElements: ReadonlyArray<cd.PropertyModel>,
    newCodeComponents: ReadonlyArray<cd.ICodeComponentDocument>
  ) => {
    const screenshots = new Map(this._symbolScreenshotsService.componentScreenshots$.value);
    const newSymbols = newElements.filter(isSymbolDefinition);
    const newComponents: cd.CustomComponent[] = [...newSymbols, ...newCodeComponents];

    for (const cmp of newComponents) {
      const { id, publishId } = cmp;
      if (!publishId) continue;

      const entryData = importedEntries.find((e) => e.id === publishId.entryId);
      if (!entryData) continue;

      const versionData = entryData.versions.find((v) => v.id === publishId.versionId);
      if (!versionData) continue;

      const componentId = versionData.symbolId || versionData.codeComponentId;
      if (!componentId) continue;

      const currentScreenshot = screenshots.get(componentId);
      if (!currentScreenshot) continue;

      // map current screenshot to id of new symbol
      screenshots.set(id, currentScreenshot);
    }

    this._symbolScreenshotsService.componentScreenshots$.next(screenshots);
  };

  private _getImportPayload(
    project: cd.IProject,
    publishEntries: cd.IPublishEntry[],
    specificVersionId?: string
  ): Observable<IImportPayload> {
    const imports = this._generateImportsForEntries(publishEntries, project, specificVersionId);

    return forkJoin(imports).pipe(
      switchMap((contentSets) => {
        const newProjectContents = contentSets.flat();
        const newAssets = utils.filterAssets(newProjectContents);
        const newElements = utils.filterElements(newProjectContents) as cd.PropertyModel[];
        const newCodeComponents = utils.filterCodeComponents(newProjectContents);
        const newDatasets = utils.filterDatasets(newProjectContents);

        return of({
          publishEntries,
          newAssets,
          newElements,
          newCodeComponents,
          newDatasets,
        });
      })
    );
  }

  private _getActionsForImportPayload = (payload: IImportPayload): Action[] => {
    const { publishEntries, newAssets, newElements, newCodeComponents, newDatasets } = payload;

    const list: Action[] = [];
    if (newAssets.length) list.push(new actions.AssetsCreateDocuments(newAssets));
    if (newCodeComponents.length) list.push(new actions.CodeComponentCreate(newCodeComponents));
    if (newDatasets.length) list.push(new actions.DatasetCreate(newDatasets));
    if (newElements.length) list.push(new actions.ElementPropertiesCreate(newElements, false));
    const loadEntryAction = new actions.PublishEntriesLoaded(publishEntries);
    list.push(loadEntryAction);
    return list;
  };
}
