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
import { DEFAULT_THEME_COLOR } from '../material-shared';
import * as cd from 'cd-interfaces';

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
    <mat-progress-spinner
      [mode]="props?.inputs?.mode"
      [color]="props?.inputs?.color"
      [diameter]="props?.inputs?.diameter | dataBindingLookupPipe:dataBindingRefreshTrigger | coerceNumberPipe"
      [strokeWidth]="props?.inputs?.strokeWidth | dataBindingLookupPipe:dataBindingRefreshTrigger | coerceNumberPipe"
      [value]="props?.inputs?.value | dataBindingLookupPipe:dataBindingRefreshTrigger | coerceNumberPipe"
    ></mat-progress-spinner>
  </div>
`;

const simpleTemplate = `
  <mat-progress-spinner
    class="spinner__test-id"
    mode="determinate"
    color="primary"
    diameter="36"
    strokeWidth="2"
    value="65"
  ></mat-progress-spinner>
`;

runTemplateTests(cd.ElementEntitySubType.Spinner, internalTemplate, simpleTemplate);

runInstanceTests(cd.ElementEntitySubType.Spinner, {
  name: 'Spinner',
  elementType: cd.ElementEntitySubType.Spinner,
  inputs: {
    color: DEFAULT_THEME_COLOR,
    mode: cd.ProgressBarMode.Determinate,
    diameter: 36,
    strokeWidth: 2,
    value: 65,
  } as cd.ISpinnerInputs,
});
