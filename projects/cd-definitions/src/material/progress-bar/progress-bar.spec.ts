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

import { runTemplateTests, runInstanceTests } from '../../test.utils';
import { UnitTypes } from 'cd-metadata/units';
import * as cd from 'cd-interfaces';
import * as mat from '../material-shared';

const internalTemplate = `
  <div
    [class.cd-render-rect-marker]="!instanceId"
    class="cd-rendered-element cd-fit-content"
    [attr.data-id]="elementId"
    [attr.data-full-id-path]="elementId | fullIdPathPipe : ancestors"
    [cdStyle]="styleMap[elementId]"
    [classPrefix]="elementClassPrefix"
    [class.cd-preview-styles]="props?.showPreviewStyles"
    [cdHidden]="props?.inputs?.hidden | dataBindingLookupPipe:dataBindingRefreshTrigger | coerceBooleanPipe"
    [cdCoTooltip]="props?.inputs?.tooltipLabel"
    [cdCoTooltipPosition]="props?.inputs?.tooltipPosition"
    [cdAttrs]="props?.attrs"
    [cdA11yAttrs]="props?.a11yInputs"
  >
    <mat-progress-bar
      [color]="props?.inputs?.color"
      [mode]="props?.inputs?.mode"
      [value]="props?.inputs?.value | dataBindingLookupPipe:dataBindingRefreshTrigger | coerceNumberPipe"
      [bufferValue]="props?.inputs?.bufferValue | dataBindingLookupPipe:dataBindingRefreshTrigger | coerceNumberPipe"
    ></mat-progress-bar>
  </div>
`;

const simpleTemplate = `
  <mat-progress-bar
    class="progress_bar__test-id"
    color="primary"
    mode="determinate"
    value="50"
    bufferValue="75"
  ></mat-progress-bar>
`;

runTemplateTests(cd.ElementEntitySubType.ProgressBar, internalTemplate, simpleTemplate);

runInstanceTests(cd.ElementEntitySubType.ProgressBar, {
  name: 'Progress Bar',
  elementType: cd.ElementEntitySubType.ProgressBar,
  styles: {
    base: {
      style: {
        width: { value: 200, units: UnitTypes.Pixels },
      },
    },
  },
  inputs: {
    color: mat.DEFAULT_THEME_COLOR,
    mode: cd.ProgressBarMode.Determinate,
    value: 50,
    bufferValue: 75,
  } as cd.IProgressBarInputs,
});
