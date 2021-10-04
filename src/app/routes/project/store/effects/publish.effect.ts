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

import * as cd from 'cd-interfaces';
import { Injectable } from '@angular/core';
import { Observable, forkJoin } from 'rxjs';
import { createEffect, Actions, ofType } from '@ngrx/effects';
import * as actions from '../actions';
import { filter, switchMap, map, withLatestFrom } from 'rxjs/operators';
import { DatabaseChangesService } from 'src/app/database/changes/database-change.service';
import { DatabaseService } from 'src/app/database/database.service';
import { publishEntryPathForId } from 'src/app/database/path.utils';
import { Store, select, Action } from '@ngrx/store';
import { IProjectState } from '../reducers';
import { selectPublishEntries } from '../selectors';
import { ProjectContentService } from 'src/app/database/changes/project-content.service';
import { buildPropertyUpdatePayload } from 'cd-common/utils';

@Injectable()
export class PublishEffect {
  constructor(
    private actions$: Actions,
    private _projectStore: Store<IProjectState>,
    private _databaseChangesService: DatabaseChangesService,
    private _databaseService: DatabaseService,
    private _projectContentService: ProjectContentService
  ) {}

  // When project first loads, lookup up publish entries for all symbols and code components in project
  loadComponentPublishEntries$ = createEffect(() => {
    return this._projectContentService.elementsLoaded$.pipe(
      filter((loaded) => loaded),
      withLatestFrom(this._projectContentService.elementProperties$),
      withLatestFrom(this._projectContentService.codeCmpArray$),
      withLatestFrom(this._projectContentService.symbolIds$),
      map(([[[_loaded, elementProperties], codeComponents], symbolIds]) => {
        // get all symbol models
        const symbols = symbolIds
          .map((id) => elementProperties[id])
          .filter((p) => p !== undefined) as cd.ISymbolProperties[];

        // combine all symbol and code component models
        const components: cd.CustomComponent[] = [...symbols, ...codeComponents];

        // get all defined publish ids from symbol and code component models
        return components
          .map((p) => p.publishId)
          .filter((pubId) => pubId !== undefined) as cd.IPublishId[];
      }),
      filter((publishIds) => publishIds.length > 0),
      switchMap((publishIds) => {
        const publishEntryLookups = publishIds.map((id) => this._getPublishEntry(id));
        return forkJoin([...publishEntryLookups]) as Observable<(cd.IPublishEntry | undefined)[]>;
      }),
      map((publishEntries: (cd.IPublishEntry | undefined)[]) => {
        const definedEntries = publishEntries.filter((p) => p !== undefined) as cd.IPublishEntry[];
        return new actions.PublishEntriesLoaded(definedEntries);
      })
    ) as Observable<actions.PublishEntriesLoaded>;
    // TODO: figure out why this "as" cast is necessary for typings to work
  });

  // If this project has been published as a template, get it's publish entry
  getProjectPublishEntry$ = createEffect(() =>
    this._projectContentService.project$.pipe(
      filter((project) => !!project?.publishId),
      switchMap((project) => {
        const publishId = project?.publishId as cd.IPublishId;
        return this._getPublishEntry(publishId);
      }),
      filter((publishEntry) => !!publishEntry),
      map((publishEntry) => {
        return new actions.PublishEntriesLoaded([publishEntry as cd.IPublishEntry]);
      })
    )
  );

  publishResult$ = createEffect(() =>
    this.actions$.pipe(
      ofType<actions.PublishResult>(actions.PUBLISH_RESULT),
      switchMap(({ result }) => {
        const { id, type, publishId, publishEntry } = result;
        const resultingActions: Action[] = [];
        const properties = { publishId };

        // Update symbol to set publishId
        if (type === cd.PublishType.Symbol) {
          const symbolUpdate = buildPropertyUpdatePayload(id, properties);
          const symbolUpdateAction = new actions.ElementPropertiesUpdate([symbolUpdate], false);
          resultingActions.push(symbolUpdateAction);
        }
        // Update code componenent to set publish id
        else if (type === cd.PublishType.CodeComponent) {
          const codeCmpUpdate = new actions.CodeComponentUpdate(id, properties, false);
          resultingActions.push(codeCmpUpdate);
        }
        // Update project to set publish id
        else if (type === cd.PublishType.Template) {
          const projectUpdate = new actions.ProjectDataUpdate({ publishId }, false, false);
          resultingActions.push(projectUpdate);
        }

        // Add action to load new publish entry
        resultingActions.push(new actions.PublishEntriesLoaded([publishEntry]));
        return resultingActions;
      })
    )
  );

  updatePublishEntry$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType<actions.PublishEntryUpdate>(actions.PUBLISH_ENTRY_UPDATE),
        withLatestFrom(this._projectStore.pipe(select(selectPublishEntries))),
        filter(([action, publishEntries]) => !!publishEntries[action.id]),
        map(([action, publishEntries]) => {
          const { id, update } = action;
          const publishEntry = publishEntries[id];
          if (!publishEntry) return;
          return this._databaseChangesService.updatePublishEntry(publishEntry, update);
        })
      ),
    { dispatch: false }
  );

  deletePublishEntry$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType<actions.PublishEntryDelete>(actions.PUBLISH_ENTRY_DELETE),
        map(({ publishEntry }) => this._databaseChangesService.deletePublishEntry(publishEntry))
      ),
    { dispatch: false }
  );

  private _getPublishEntry = (
    publishId: cd.IPublishId
  ): Observable<cd.IPublishEntry | undefined> => {
    const { entryId } = publishId;
    const publishEntryPath = publishEntryPathForId(entryId);
    return this._databaseService.getDocumentData<cd.IPublishEntry>(publishEntryPath);
  };
}
