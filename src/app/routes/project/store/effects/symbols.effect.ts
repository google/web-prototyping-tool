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

import { InteractionService } from '../../services/interaction/interaction.service';
import { isString } from 'cd-utils/string';
import { createEffect, Actions, ofType } from '@ngrx/effects';
import { getElementProperties, getSymbolMap, getIsolatedSymbolId, getProject } from '../selectors';
import { Injectable } from '@angular/core';
import { IProjectState } from '../reducers';
import { RETRY_ATTEMPTS } from 'src/app/database/database.utils';
import { DatabaseChangesService } from 'src/app/database/changes/database-change.service';
import { map, filter, switchMap, withLatestFrom, retry, catchError } from 'rxjs/operators';
import { packRectanglesAndGenerateBounds } from '../../utils/symbol.packing.utils';
import { generateIValue, buildPropertyUpdatePayload, getElementBaseStyles } from 'cd-common/utils';
import { generateSymbolInstanceDefaults } from '../../utils/symbol-overrides';
import { ConfirmationDialogComponent, OverlayService } from 'cd-common';
import { Observable, race, of, combineLatest, EMPTY } from 'rxjs';
import { Store, select, Action } from '@ngrx/store';
import { UnitTypes } from 'cd-metadata/units';
import * as symUtils from '../../utils/symbol-input.utils';
import * as symbolConf from '../../configs/symbol.config';
import * as utils from '../../utils/symbol.utils';
import * as models from 'cd-common/models';
import * as actions from '../actions';
import * as cd from 'cd-interfaces';

@Injectable()
export class SymbolsEffect {
  constructor(
    private actions$: Actions,
    private _projectStore: Store<IProjectState>,
    private _databaseChangesService: DatabaseChangesService,
    private _interactionService: InteractionService,
    private _overlayService: OverlayService
  ) {}

  create$: Observable<actions.ElementPropertiesAction | actions.SelectionAction> = createEffect(
    () =>
      this.actions$.pipe(
        ofType<actions.SymbolCreate>(actions.SYMBOL_CREATE),
        map(({ payload }) => {
          const properties = payload.propertyModels || [];
          return properties.filter(
            ({ elementType }) => elementType !== cd.ElementEntitySubType.Board
          );
        }),
        filter((elements) => elements.length > 0),
        withLatestFrom(this._projectStore.pipe(select(getElementProperties))),
        withLatestFrom(this._projectStore.pipe(select(getSymbolMap))),
        withLatestFrom(this._projectStore.pipe(select(getProject))),
        filter(([, proj]) => proj !== undefined),
        switchMap(([[[elements, elementProperties], symbolMap], project]) => {
          if (!project) return EMPTY;
          const rootElements = models.sortAndFilterElements(elements, elementProperties);
          const firstRootName = (rootElements.length === 1 && rootElements[0]?.name) || undefined;
          const name = utils.incrementedSymbolName(symbolMap, firstRootName);

          const dimension = this._getDefaultSymbolDimension(rootElements);
          const { renderRects } = this._interactionService;
          const { symbol, symbolInstance, updates, deletions } = utils.createSymbolFromElements(
            name,
            project.id,
            rootElements,
            elementProperties,
            renderRects,
            dimension,
            symbolMap
          );

          const ids = new Set([symbolInstance.id]);
          return [
            new actions.ElementPropertiesCreate([symbol], true, updates, deletions),
            new actions.SelectionSet(ids, false, cd.EntityType.Element, true),
          ];
        })
      )
  );

  delete$: Observable<actions.ElementPropertiesAction | actions.SelectionAction> = createEffect(
    () =>
      this.actions$.pipe(
        ofType<actions.SymbolDelete>(actions.SYMBOL_DELETE),
        withLatestFrom(this._projectStore.pipe(select(getElementProperties))),
        withLatestFrom(this._projectStore.pipe(select(getSymbolMap))),
        switchMap(([[action, elementProperties], definitions]) => {
          const { payload: symbol } = action;
          const instances = utils.findAllInstancesOfSymbol(symbol.id, elementProperties);
          const { updates } = utils.unpackInstances(instances, definitions, elementProperties);
          const elementsInSymbol = models.getChildren(symbol.id, elementProperties);
          const deletions = [symbol, ...elementsInSymbol, ...instances];

          return [
            new actions.ElementPropertiesDelete(deletions, true, updates),
            new actions.SelectionDeselectAll(),
          ];
        })
      )
  );

  enterSymbolIsolation$ = createEffect(() =>
    this.actions$.pipe(
      ofType<actions.PanelStopRecording>(actions.PANEL_ISOLATE_SYMBOL),
      withLatestFrom(this._projectStore.pipe(select(getElementProperties))),
      switchMap(([action, props]: any) => {
        /**
         * HOTFIX:
         * We need to remove width & height from legacy symbols
         * Dimenions of a symbol are initally defined by the symbol's frame
         * but ultimately determined how a user sets the dimensions on an instance
         */
        const symbolId = action.payload.propertyModels[0]?.inputs?.referenceId;
        const symbol = symbolId && props[symbolId];
        if (!symbol) return [];
        // Grab the current width and height from the symbol
        const baseStyles = getElementBaseStyles(symbol);
        const symbolWidth = baseStyles?.width;
        const symbolHeight = baseStyles?.height;
        if (symbolWidth === undefined && symbolHeight === undefined) return [];
        console.warn('Detected style dimensions on symbol');
        // Grab the width / height value or use the symbol's frame as a fallback
        const width = symbolWidth || generateIValue(symbol.frame.width, UnitTypes.Pixels);
        const height = symbolHeight || generateIValue(symbol.frame.width, UnitTypes.Pixels);
        // Collect symbol instances that do not have width and height applied (previously inheriting)
        const updates = utils.symbolInstanceUpdatesForMissingSize(symbolId, props, width, height);
        // Remove the width and height styles of a symbol
        const symbolUpdate = utils.buildPropertiesUpdateForWidthAndHeight(symbolId, null, null);
        return [new actions.ElementPropertiesUpdate([symbolUpdate, ...updates], false, true)];
      })
    )
  );

  unpackInstances$: Observable<actions.ElementPropertiesAction | actions.SelectionAction> =
    createEffect(() =>
      this.actions$.pipe(
        ofType<actions.SymbolUnpackInstance>(actions.SYMBOL_UNPACK_INSTANCE),
        map(({ payload }) => {
          const properties = payload.propertyModels || [];
          return properties.filter((p) => {
            return models.isSymbolInstance(p);
          }) as cd.ISymbolInstanceProperties[];
        }),
        filter((elements) => elements.length > 0),
        switchMap((instances) => {
          const config = { noPadding: true };
          const overlayCmpRef = this._overlayService.attachComponent(
            ConfirmationDialogComponent,
            config
          );

          overlayCmpRef.instance.title = symbolConf.SYMBOL_CONFIRM_UNPACK_TITLE;
          overlayCmpRef.instance.message = symbolConf.SYMBOL_CONFIRM_UNPACK_MESSAGE;

          const confirm$ = overlayCmpRef.instance.confirm.asObservable();
          const dismiss$ = overlayCmpRef.instance.cancel.asObservable();

          const result$ = race(confirm$, dismiss$);
          result$.subscribe(() => this._overlayService.close());

          return combineLatest([result$, of(instances)]);
        }),
        filter(([confirmed]) => confirmed),
        withLatestFrom(this._projectStore.pipe(select(getElementProperties))),
        withLatestFrom(this._projectStore.pipe(select(getSymbolMap))),
        switchMap(([[[_confirmed, instances], elementProperties], definitions]) => {
          const { rootIds, updates } = utils.unpackInstances(
            instances,
            definitions,
            elementProperties
          );

          this._projectStore.dispatch(new actions.SymbolUnpackInstanceConfirm());

          return [
            new actions.ElementPropertiesDelete(instances, true, updates, true),
            new actions.SelectionSet(new Set(rootIds), false),
          ];
        })
      )
    );

  // Note: We could do a lot more optimization here. Currently this effect recomputes all
  // symbol inputs every time there is any type of update. It would be possible to only
  // recompute inputs for elements that changed

  updateSymbolInputs$ = createEffect(() =>
    this.actions$.pipe(
      ofType(
        actions.ELEMENT_PROPS_CREATE,
        actions.ELEMENT_PROPS_UPDATE,
        actions.ELEMENT_PROPS_DELETE,
        // Fix issue where undo / redo wasnt updating symbol instances
        actions.HISTORY_UNDO,
        actions.HISTORY_REDO
      ),
      withLatestFrom(this._projectStore.pipe(select(getIsolatedSymbolId))),
      filter(([, isolatedSymbolId]) => !!isolatedSymbolId),
      filter(([action]) => {
        // filter out the update action produced by this effect (prevent infinit loop of updates)
        const isUpdate = action.type === actions.ELEMENT_PROPS_UPDATE;
        if (!isUpdate) return true;
        const isInputUpdate = (action as actions.ElementPropertiesUpdate).symbolInputsUpdate;
        return !isInputUpdate;
      }),
      withLatestFrom(this._projectStore.pipe(select(getElementProperties))),
      // Ensure that symbol model exists
      filter(([[, isolatedSymbolId], elementProperties]) => {
        return !!isolatedSymbolId && isolatedSymbolId in elementProperties;
      }),
      map(([[, isolatedSymbolId], elementProperties]) => {
        // Calculate new symbol inputs
        const id = isolatedSymbolId as string;
        const symbol = elementProperties[id] as cd.ISymbolProperties;
        const symbolChildren = models.getChildren(symbol.id, elementProperties);
        const rootChildren = models.sortAndFilterElements(symbolChildren, elementProperties);
        const rootIds = rootChildren.map((child) => child.id);
        const orderedElemIds = models.getAllIdsDepthFirst(elementProperties, rootIds);
        const instanceInputs = generateSymbolInstanceDefaults(symbolChildren);
        const prevInputs = symUtils.processPrevSymbolInputs(symbol, instanceInputs);
        const changes = symUtils.processInstanceToNullifyChanges(instanceInputs, prevInputs);
        const exposedInputs = utils.updateExposedSymbolInputs(symbol, symbolChildren);
        const symUpdate = utils.getSymInstUpdate(id, changes, exposedInputs, orderedElemIds);
        // Propagate updated inputs to all instances of this symbol
        const instances = utils.findAllInstancesOfSymbol(symbol.id, elementProperties);
        const updates = symUtils.mergeNewInputsIntoInstances(instanceInputs, prevInputs, instances);
        return new actions.ElementPropertiesUpdate([symUpdate, ...updates], false, true);
      })
    )
  );

  /**
   * In the effect above (updateSymbolInputs$), whenever any element within an isolated symbol is
   * modifed, we create updates to the symbolInputs stored on the symbol defintion and for each
   * instance of that symbol. These updates are not directly undoable (i.e. they are not added to
   * the undo/redo stack).
   *
   * However, whenever an undo/redo is triggered in symbol isolation mode, we need to sync the
   * remote database with the state of the symbol instances in the state of the store
   * that was reverted to. For though the updates to symbolInputs and symbol instance are not
   * directly undoable, undo/redo causes reverting the store to a state prior to those updates
   * being made.
   *
   * This effect listens for any undo/redo actions that occur in symbol isolation mode and sync's
   * the current state of the symbol definition and any instances of it to the remote database
   */

  undoRedoSymbolInputsChangesInDB$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(actions.BUNDLED_UNDOABLE, actions.HISTORY_UNDO, actions.HISTORY_REDO),
        withLatestFrom(this._projectStore.pipe(select(getIsolatedSymbolId))),
        filter(([, isolatedSymbolId]) => isString(isolatedSymbolId)),
        withLatestFrom(this._projectStore.pipe(select(getElementProperties))),
        withLatestFrom(this._projectStore.pipe(select(getProject))),
        switchMap(([[[, isolatedSymbolId], elementProperties], project]) => {
          const symbolId = isolatedSymbolId as string;
          const symbol = elementProperties[symbolId] as cd.ISymbolProperties;
          if (!symbol || !project) return [];
          const instances = utils.findAllInstancesOfSymbol(symbol.id, elementProperties);
          const allModels = [symbol, ...instances];
          return this._databaseChangesService.modifyElements(project, elementProperties, allModels);
        }),
        retry(RETRY_ATTEMPTS),
        catchError(() => of(new actions.ElementPropertiesUpdateFailure()))
      ),
    { dispatch: false }
  );

  // When a symbol gets renamed, we need to rename all instances of the symbol,
  // and also the publish entry (if published and is owner)

  symbolRename$ = createEffect(() =>
    this.actions$.pipe(
      ofType<actions.SymbolRename>(actions.SYMBOL_RENAME),
      withLatestFrom(this._projectStore.pipe(select(getElementProperties))),
      filter(([action, elementProperties]) => {
        const elem = elementProperties[action.id];
        return !!elem && elem?.elementType === cd.ElementEntitySubType.Symbol;
      }),
      switchMap(([action, elementProperties]) => {
        const { id, name } = action;
        const symbol = elementProperties[id] as cd.ISymbolProperties;
        const { name: currentName } = symbol;
        const updates: cd.IPropertiesUpdatePayload[] = [];
        const instances = utils.findAllInstancesOfSymbol(symbol.id, elementProperties);
        const resultActions: Action[] = [];
        // add update to rename actual symbol definition
        updates.push(buildPropertyUpdatePayload(id, { name }));

        // add update for each instance of symbol
        for (const instance of instances) {
          // Only update instance if user has not modified
          if (currentName === instance.name) {
            updates.push(buildPropertyUpdatePayload(instance.id, { name }));
          }
        }

        if (symbol.publishId) {
          resultActions.push(new actions.PublishEntryUpdate(symbol.publishId.entryId, { name }));
        }

        resultActions.push(new actions.ElementPropertiesUpdate(updates));
        return resultActions;
      })
    )
  );

  private _getDefaultSymbolDimension = (
    symbolRootElements: cd.PropertyModel[] // assumed that these are all sibling elements at root of new symbol
  ): cd.Dimensions => {
    const allIds = symbolRootElements.map(({ id }) => id);
    const sortedRects = allIds.reduce<cd.IRect[]>((acc, id) => {
      const rect = this._interactionService.renderRects.get(id);
      if (rect) acc.push(rect.frame);
      return acc;
    }, []);
    return packRectanglesAndGenerateBounds(sortedRects);
  };
}
