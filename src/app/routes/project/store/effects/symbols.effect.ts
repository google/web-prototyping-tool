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
import { createEffect, Actions, ofType } from '@ngrx/effects';
import { Injectable } from '@angular/core';
import { ProjectContentService } from 'src/app/database/changes/project-content.service';
import { map, filter, switchMap, withLatestFrom } from 'rxjs/operators';
import { packRectanglesAndGenerateBounds } from '../../utils/symbol.packing.utils';
import {
  generateIValue,
  buildPropertyUpdatePayload,
  getElementBaseStyles,
  createElementChangePayload,
} from 'cd-common/utils';
import { ConfirmationDialogComponent, OverlayService } from 'cd-common';
import { Observable, race, of, combineLatest, EMPTY } from 'rxjs';
import { Action } from '@ngrx/store';
import { UnitTypes } from 'cd-metadata/units';
import * as symbolConf from '../../configs/symbol.config';
import * as utils from '../../utils/symbol.utils';
import * as models from 'cd-common/models';
import * as actions from '../actions';
import * as cd from 'cd-interfaces';

@Injectable()
export class SymbolsEffect {
  constructor(
    private actions$: Actions,
    private _interactionService: InteractionService,
    private _overlayService: OverlayService,
    private _projectContentService: ProjectContentService
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
        withLatestFrom(this._projectContentService.elementProperties$),
        withLatestFrom(this._projectContentService.symbolsMap$),
        withLatestFrom(this._projectContentService.project$),
        filter(([, proj]) => proj !== undefined),
        switchMap(([[[elements, elementProperties], symbolMap], project]) => {
          if (!project) return EMPTY;
          const rootElements = models.sortAndFilterElements(elements, elementProperties);
          const firstRootName = (rootElements.length === 1 && rootElements[0]?.name) || undefined;
          const name = utils.incrementedSymbolName(symbolMap, firstRootName);

          const dimension = this._getDefaultSymbolDimension(rootElements);
          const { renderRects } = this._interactionService;
          const { symbolInstance, change } = utils.createSymbolFromElements(
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
            new actions.ElementPropertiesChangeRequest([change]),
            new actions.SelectionSet(ids, false, cd.EntityType.Element, true),
          ];
        })
      )
  );

  delete$: Observable<actions.ElementPropertiesAction | actions.SelectionAction> = createEffect(
    () =>
      this.actions$.pipe(
        ofType<actions.SymbolDelete>(actions.SYMBOL_DELETE),
        withLatestFrom(this._projectContentService.elementProperties$),
        withLatestFrom(this._projectContentService.symbolsMap$),
        switchMap(([[action, elementProperties], definitions]) => {
          const { payload: symbol } = action;
          const instances = utils.findAllInstancesOfSymbol(symbol.id, elementProperties);
          const { change } = utils.unpackInstances(instances, definitions, elementProperties);
          const elementsInSymbol = models.getChildren(symbol.id, elementProperties);
          const deletions = [symbol, ...elementsInSymbol, ...instances];
          const deleteIds = deletions.map((d) => d.id);
          const deleteChange = createElementChangePayload(undefined, undefined, deleteIds);
          const allChanges = [change, deleteChange];

          return [
            new actions.ElementPropertiesChangeRequest(allChanges),
            new actions.SelectionDeselectAll(),
          ];
        })
      )
  );

  enterSymbolIsolation$ = createEffect(() =>
    this.actions$.pipe(
      ofType<actions.PanelStopRecording>(actions.PANEL_ISOLATE_SYMBOL),
      withLatestFrom(this._projectContentService.elementProperties$),
      switchMap(([action, props]: any) => {
        /**
         * HOTFIX
         * We need to remove width & height from legacy symbols
         * Dimensions of a symbol are initally defined by the symbol's frame
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
        return [new actions.ElementPropertiesUpdate([symbolUpdate, ...updates], false)];
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
        withLatestFrom(this._projectContentService.elementProperties$),
        withLatestFrom(this._projectContentService.symbolsMap$),
        switchMap(([[[_confirmed, instances], elementProperties], definitions]) => {
          const { rootIds, change } = utils.unpackInstances(
            instances,
            definitions,
            elementProperties
          );

          const deletes = instances.map((i) => i.id);
          const deleteChange = createElementChangePayload(undefined, undefined, deletes);
          const allChanges = [change, deleteChange];

          return [
            new actions.SymbolUnpackInstanceConfirm(),
            new actions.ElementPropertiesChangeRequest(allChanges),
            new actions.SelectionSet(new Set(rootIds), false),
          ];
        })
      )
    );

  // When a symbol gets renamed, we need to rename all instances of the symbol,
  // and also the publish entry (if published and is owner)
  symbolRename$ = createEffect(() =>
    this.actions$.pipe(
      ofType<actions.SymbolRename>(actions.SYMBOL_RENAME),
      withLatestFrom(this._projectContentService.elementProperties$),
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
