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

import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Observable } from 'rxjs';
import { switchMap, map, withLatestFrom } from 'rxjs/operators';
import { ClipboardService } from '../../services/clipboard/clipboard.service';
import { EditConfig } from '../../configs/project.config';
import * as action from '../actions';
import { copyToClipboard } from 'cd-utils/clipboard';
import { generateComputedCSS, cssToString } from 'cd-common/utils';
import { AssetsService } from '../../services/assets/assets.service';
import { ToastsService } from '../../../../services/toasts/toasts.service';
import { ProjectContentService } from 'src/app/database/changes/project-content.service';
import { assembleTemplatesWithCSSForExport } from 'cd-common/models';

@Injectable()
export class ClipboardEffects {
  constructor(
    private actions$: Actions,
    private _clipboardService: ClipboardService,
    private _toastService: ToastsService,
    private _assetService: AssetsService,
    private _projectContentService: ProjectContentService
  ) {}

  // On cut, copy to clipboard and delete
  onCut$: Observable<action.ElementPropertiesDeleteElementsAndChildren | undefined> = createEffect(
    () =>
      this.actions$.pipe(
        ofType<action.ClipboardCut>(action.CLIPBOARD_CUT),
        switchMap(({ payload }) => {
          const { propertyModels } = payload;
          if (!propertyModels) return [];
          this._clipboardService.copyModelsToClipboard(propertyModels);
          const update = { propertyModels };
          return [new action.ElementPropertiesDeleteElementsAndChildren(EditConfig.Delete, update)];
        })
      )
  );

  // On copy, just copy to clipboard
  onCopy$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType<action.ClipboardCopy>(action.CLIPBOARD_COPY),
        map(({ payload }) => {
          const { propertyModels } = payload;
          if (propertyModels) {
            this._clipboardService.copyModelsToClipboard(propertyModels);
          }
        })
      ),
    { dispatch: false }
  );

  // On copy json, copy JSON of property models to native clipboard
  // Only including JSON for the actual elements.
  // Not the full clipboard content (datasets, symbols, code components, etc)
  onCopyJSON$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType<action.ClipboardCopy>(action.CLIPBOARD_COPY_JSON),
        map(({ payload }) => {
          const { propertyModels } = payload;
          if (!propertyModels) return;

          try {
            const json = propertyModels.length === 1 ? propertyModels[0] : propertyModels;
            const jsonStr = JSON.stringify(json, null, 2);
            copyToClipboard(jsonStr);
            const toast = {
              message: 'JSON copied to clipboard',
              iconName: '/assets/icons/json-ico.svg',
            };
            this._toastService.addToast(toast);
          } catch (e) {
            console.error(e);
          }
        })
      ),
    { dispatch: false }
  );

  // On copy HTML, assemble template and copy to clipboard
  onCopyHtmlAndCSS$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType<action.ClipboardCopyHtml>(action.CLIPBOARD_COPY_HTML),
        withLatestFrom(this._projectContentService.elementProperties$),
        withLatestFrom(this._assetService.assets$),
        withLatestFrom(this._projectContentService.designSystem$),
        map(([[[act, elementProperties], assets], designSystem]) => {
          const { payload } = act;
          const { propertyModels } = payload;
          if (propertyModels && propertyModels.length) {
            const element = propertyModels[0];
            const htmlTemplate = assembleTemplatesWithCSSForExport(
              [element.id],
              elementProperties,
              designSystem,
              assets
            );

            import('../../utils/prettier.utils').then((module) => {
              const formattedHtml = module.formatHTML(htmlTemplate);
              copyToClipboard(formattedHtml);
              const toast = { message: 'HTML & CSS copied to clipboard', iconName: 'code' };
              this._toastService.addToast(toast);
            });
          }
        })
      ),
    { dispatch: false }
  );

  // On copy css, just copy css to clipboard
  onCopyCss$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType<action.ClipboardCopyCss>(action.CLIPBOARD_COPY_CSS),
        withLatestFrom(this._projectContentService.designSystem$),
        withLatestFrom(this._assetService.assets$),
        map(([[{ payload }, designSystem], assets]) => {
          const { propertyModels } = payload;
          if (propertyModels && propertyModels.length) {
            const element = propertyModels[0];
            const { styles } = element;
            const computedCss = generateComputedCSS(styles, designSystem, assets);
            if (computedCss.length === 0) return;
            // Only grab the base css for now (computedCss[0])
            const computedCssString = cssToString(computedCss[0]);
            copyToClipboard(computedCssString);
            const toast = {
              message: 'CSS styles copied to clipboard',
              iconName: 'palette',
            };
            this._toastService.addToast(toast);
          }
        })
      ),
    { dispatch: false }
  );

  onPaste$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType<action.ClipboardPaste>(action.CLIPBOARD_PASTE),
        map(() => this._clipboardService.paste())
      ),
    { dispatch: false }
  );

  onDisconnectProject$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType<action.DisconnectProject>(action.DISCONNECT_PROJECT),
        map(() => this._clipboardService.disconnectProject())
      ),
    { dispatch: false }
  );
}
