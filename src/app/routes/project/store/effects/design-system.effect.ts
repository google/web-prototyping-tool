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

import { Store, select } from '@ngrx/store';
import { deepCopy, isObjectLegacy } from 'cd-utils/object';
import { createEffect, Actions, ofType } from '@ngrx/effects';
import { Injectable } from '@angular/core';
import { IProjectState } from '../reducers';
import { loadFontFamilies } from 'cd-common/utils';
import { from } from 'rxjs';
import { withDesignSystem, withDesignSystemDoc } from '../../utils/operators.utils';
import { ofUndoRedo, ofTypeIncludingBundled } from '../../utils/history-ngrx.utils';
import { ROBOTO_FONT as FALLBACK_FONT_ID } from 'cd-themes';
import { switchMap, withLatestFrom, map, filter } from 'rxjs/operators';
import * as utils from '../../utils/design-system.utils';
import * as actions from '../actions';
import * as cd from 'cd-interfaces';
import * as selectors from '../selectors';
import { getModelEntries } from 'cd-common/models';
import { IconPickerService } from 'cd-common';
import { ICON_DATA_SRC } from 'cd-common/consts';
import { DatabaseChangesService } from 'src/app/database/changes/database-change.service';

@Injectable()
export class DesignSystemEffects {
  constructor(
    private actions$: Actions,
    private projectStore: Store<IProjectState>,
    private iconPickerService: IconPickerService,
    private databaseChangesService: DatabaseChangesService
  ) {}

  designSystemReplace$ = createEffect(() =>
    this.actions$.pipe(
      ofType<actions.DesignSystemReplace>(actions.DESIGN_SYSTEM_REPLACE),
      withDesignSystem(this.projectStore),
      switchMap(([action, designSystem]) => {
        const ds = designSystem as cd.IStringMap<any>;
        const themeCopy: cd.IStringMap<any> = deepCopy(action.update);

        // Always remove id, projectId, and globalCssClass from an imported theme
        const { id, projectId, globalCssClass, ...update } = themeCopy;

        for (const key of Object.keys(update)) {
          if (isObjectLegacy(update[key])) {
            update[key] = { ...ds[key], ...update[key] };
          }
        }

        // Don't merge the new globalCssClass, just assign from new theme
        // if undefined, store null to prevent writing undefined to database.
        update.globalCssClass = globalCssClass || null;

        return [new actions.DesignSystemUpdate(update, true)];
      })
    )
  );

  /**
   * When new element data is updated locally. Save it to firestore
   */

  updateDesignSystemInDB$ = createEffect(
    () =>
      this.actions$.pipe(
        ofTypeIncludingBundled<actions.DesignSystemUpdate>(actions.DESIGN_SYSTEM_UPDATE),
        withDesignSystemDoc(this.projectStore),
        switchMap(([, designSystemDoc]) => {
          return from(this.databaseChangesService.updateDesignSystem(designSystemDoc));
        })
      ),
    { dispatch: false }
  );

  /**
   * Inspect undone and redone actions (bundled or not) and pass undone/redone result
   * to database.
   */

  undoRedoInDB$ = createEffect(
    () =>
      this.actions$.pipe(
        ofUndoRedo<actions.DesignSystemUpdate>(this.projectStore, actions.DESIGN_SYSTEM_UPDATE),
        filter(([, , [undoneUpdate]]) => !!undoneUpdate),
        map(([, destState]) => {
          const { designSystem } = destState;
          const { designSystem: designSystemDoc } = designSystem;
          if (!designSystemDoc) return;
          this.databaseChangesService.updateDesignSystem(designSystemDoc);
        })
      ),
    { dispatch: false }
  );

  removeFont$ = createEffect(() =>
    this.actions$.pipe(
      ofType<actions.DesignSystemRemoveFont>(actions.DESIGN_SYSTEM_REMOVE_FONT),
      withDesignSystem(this.projectStore),
      filter(([action, designSystem]) => {
        const font = designSystem.fonts[action.id];
        return font !== undefined;
      }),
      withLatestFrom(this.projectStore.pipe(select(selectors.getElementProperties))),
      map(([[action, designSystem], elementProperties]) => {
        const { id: fontId } = action;
        // 1. Remove the font from the design system
        const fonts = { ...designSystem.fonts };
        if (fonts[fontId].locked) {
          throw Error('Remove Font Error: Should not be able to remove a locked font');
        }

        delete fonts[fontId];

        // 2. Remove the reference to the font from designSystem.typography
        const typography = { ...designSystem.typography };
        for (const item of Object.entries(typography)) {
          const [key, value] = item;
          if (value.fontId === fontId) {
            typography[key] = {
              ...typography[key],
              fontId: FALLBACK_FONT_ID,
            };
          }
        }

        // 3. Remove the reference to the font from the properties map
        const propEntries = getModelEntries(elementProperties);
        const propertiesUpdates = propEntries.reduce((acc: cd.IPropertiesUpdatePayload[], curr) => {
          const [elementId, value] = curr;
          const [properties, didReplaceFont] = utils.replaceFonts(value, fontId);
          if (didReplaceFont) {
            const found = { elementId, properties };
            acc.push(found);
          }
          return acc;
        }, []);

        return new actions.BundledUndoableActions(
          new actions.DesignSystemUpdate({ fonts, typography }),
          new actions.ElementPropertiesUpdate(propertiesUpdates)
        );
      })
    )
  );

  removeTypography$ = createEffect(() =>
    this.actions$.pipe(
      ofType<actions.DesignSystemRemoveTypography>(actions.DESIGN_SYSTEM_REMOVE_TYPOGRAPHY),
      withDesignSystem(this.projectStore),
      withLatestFrom(this.projectStore.pipe(select(selectors.getElementProperties))),
      map(([[action, designSystem], elementProperties]) => {
        const { id: typeId } = action;
        // 1. Remove the typeStyle from the design system
        const typography = { ...designSystem.typography };
        const styleClone = deepCopy(typography[typeId]);

        delete styleClone.id;
        delete typography[typeId];

        // 2. Remove the reference to the typeStyle from the properties map
        const propEntries = getModelEntries(elementProperties);
        const propertiesUpdates = propEntries.reduce((acc: cd.IPropertiesUpdatePayload[], curr) => {
          const [elementId, value] = curr;
          const [properties, didReplaceFont] = utils.replaceTypography(value, typeId, styleClone);
          if (didReplaceFont) {
            const found = { elementId, properties };
            acc.push(found);
          }
          return acc;
        }, []);

        return new actions.BundledUndoableActions(
          new actions.DesignSystemUpdate({ typography }),
          new actions.ElementPropertiesUpdate(propertiesUpdates)
        );
      })
    )
  );

  removeColor$ = createEffect(() =>
    this.actions$.pipe(
      ofType<actions.DesignSystemRemoveColor>(actions.DESIGN_SYSTEM_REMOVE_COLOR),
      withDesignSystem(this.projectStore),
      filter(([action, designSystem]) => {
        const color = designSystem.colors[action.id];
        return color !== undefined;
      }),
      withLatestFrom(this.projectStore.pipe(select(selectors.getElementProperties))),
      map(([[action, designSystem], elementProperties]) => {
        const { id: colorId } = action;
        // 1. Remove the color from the design system
        const colors = { ...designSystem.colors };
        // Create a reference to the color before deleting
        const styleClone = {
          value: colors[colorId].value,
        };
        // remove the color
        delete colors[colorId];

        // 2. Remove the reference to the color from designSystem.typography
        const typography = { ...designSystem.typography };
        for (const item of Object.entries(typography)) {
          const [key, value] = item;
          if (value.color.id === colorId) {
            typography[key] = {
              ...typography[key],
              color: { ...styleClone },
            };
          }
        }

        // 3. Remove the reference to color from the properties map
        const propEntries = getModelEntries(elementProperties);
        const propertiesUpdates = propEntries.reduce((acc: cd.IPropertiesUpdatePayload[], curr) => {
          const [elementId, value] = curr;
          const [properties, didReplaceColor] = utils.replaceColor(value, colorId, styleClone);
          if (didReplaceColor) {
            const found = { elementId, properties };
            acc.push(found);
          }
          return acc;
        }, []);

        return new actions.BundledUndoableActions(
          new actions.DesignSystemUpdate({ colors }),
          new actions.ElementPropertiesUpdate(propertiesUpdates)
        );
      })
    )
  );

  removeGlobalCSS$ = createEffect(() =>
    this.actions$.pipe(
      ofType<actions.DesignSystemRemoveGlobalCSS>(actions.DESIGN_SYSTEM_REMOVE_GLOBAL_CSS),
      withDesignSystem(this.projectStore),
      map(([, designSystem]) => {
        const update = { ...designSystem, themeId: '', globalCssClass: null };
        return new actions.DesignSystemUpdate(update, true);
      })
    )
  );

  removeVariable$ = createEffect(() =>
    this.actions$.pipe(
      ofType<actions.DesignSystemRemoveVariable>(actions.DESIGN_SYSTEM_REMOVE_VARIABLE),
      withDesignSystem(this.projectStore),
      filter(([action, designSystem]) => {
        const vars = designSystem.variables && designSystem.variables[action.id];
        return vars !== undefined;
      }),
      withLatestFrom(this.projectStore.pipe(select(selectors.getElementProperties))),
      filter(([[, designSystem]]) => !!designSystem.variables), // ensure variables exist
      map(([[action, designSystem], elementProperties]) => {
        const { id: variableId } = action;
        // 1. Remove the variable from the design system
        const variables = { ...designSystem.variables };
        // Create a reference to the variable before deleting
        const varItem = variables[variableId];
        const styleClone = { value: `${varItem.value}${varItem.units}` };
        // Delete the variable from current design  system
        delete variables[variableId];

        // 2. Remove the reference to variable from the properties map
        const propEntries = getModelEntries(elementProperties);
        const propertiesUpdates = propEntries.reduce((acc: cd.IPropertiesUpdatePayload[], curr) => {
          const [elementId, value] = curr;
          const [properties, didReplace] = utils.replaceVariable(value, variableId, styleClone);
          if (didReplace) {
            const found = { elementId, properties };
            acc.push(found);
          }
          return acc;
        }, []);

        return new actions.BundledUndoableActions(
          new actions.DesignSystemUpdate({ variables }),
          new actions.ElementPropertiesUpdate(propertiesUpdates)
        );
      })
    )
  );

  /**
   * When new design system document is successfully created locally, save it to firestore
   */

  createDesignSystemInDB$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType<actions.DesignSystemDocumentCreate>(actions.DESIGN_SYSTEM_DOCUMENT_CREATE),
        switchMap((action) => {
          return from(this.databaseChangesService.createDesignSystem(action.payload));
        })
      ),
    { dispatch: false }
  );

  /**
   * When design system gets loaded, load all the fonts
   */

  loadDesignSystemFonts$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType<actions.DesignSystemRemoteAdded>(actions.DESIGN_SYSTEM_REMOTE_ADDED),
        map(({ payload: designSystem }) => loadFontFamilies(designSystem.fonts))
      ),
    { dispatch: false }
  );

  /**
   * When project is opened, make sure all the icon data is loaded
   */

  loadIconData$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(actions.PROJECT_DATA_QUERY),
        map(() => {
          this.iconPickerService.loadMaterialIconData(ICON_DATA_SRC);
        })
      ),
    { dispatch: false }
  );
}
