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

import { switchMap, tap, withLatestFrom } from 'rxjs/operators';
import {
  ElementPropertiesChangeRequest,
  LayoutApplyPresetToSelection,
  LayoutConvertSelection,
  LAYOUT_APPLY_PRESET_TO_SELECTION,
  LAYOUT_CONVERT_SELECTION,
  SelectionToggleElements,
} from '../actions';
import { createEffect, Actions, ofType } from '@ngrx/effects';
import { applyLayoutPreset, generateLayout } from '../../utils/layout.utils';
import { ProjectContentService } from 'src/app/database/changes/project-content.service';
import { AnalyticsService } from 'src/app/services/analytics/analytics.service';
import { ToastsService } from 'src/app/services/toasts/toasts.service';
import { isGeneric, isBoard } from 'cd-common/models';
import { copyToClipboard } from 'cd-utils/clipboard';
import { AnalyticsEvent } from 'cd-common/analytics';
import { Injectable } from '@angular/core';
import * as cd from 'cd-interfaces';

@Injectable()
export class LayoutEffects {
  constructor(
    private actions$: Actions,
    private _analyticsService: AnalyticsService,
    private _toastService: ToastsService,
    private _projectContentService: ProjectContentService
  ) {}

  applyLayoutPreset$ = createEffect(() =>
    this.actions$.pipe(
      ofType<LayoutApplyPresetToSelection>(LAYOUT_APPLY_PRESET_TO_SELECTION),
      withLatestFrom(this._projectContentService.elementProperties$),
      switchMap(([action, props]) => {
        const selected = action.selectedIds.map((itemId) => props[itemId]) as cd.PropertyModel[];
        const { changes, insertPointId } = applyLayoutPreset(selected, action.preset, props);
        const actions = [];
        if (changes.length) actions.push(new ElementPropertiesChangeRequest(changes));
        if (insertPointId) actions.push(new SelectionToggleElements([insertPointId])); // Select the insertion location
        this._analyticsService.logEvent(AnalyticsEvent.LayoutPreset, { name: action.preset.label });
        return actions;
      })
    )
  );

  convertToLayout$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType<LayoutConvertSelection>(LAYOUT_CONVERT_SELECTION),
        withLatestFrom(this._projectContentService.elementProperties$),
        tap(async ([action, props]) => {
          const { payload } = action;
          const models = payload.propertyModels || [];
          const [firstElement] = models;
          if (models.length > 1) return this.showToast('Please select one element only');
          const isBoardOrElement = isBoard(firstElement) || isGeneric(firstElement);
          if (!isBoardOrElement) return this.showToast('Only boards or elements are allowed');
          const layout = generateLayout(firstElement, props);
          await copyToClipboard(JSON.stringify(layout));
          this.showToast('Layout copied!');
        })
      ),
    { dispatch: false }
  );

  showToast(message: string) {
    this._toastService.addToast({ message });
  }
}
