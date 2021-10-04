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
    <mat-slider
      [color]="props?.inputs?.color"
      [value]="props?.inputs?.value | dataBindingLookupPipe:dataBindingRefreshTrigger | coerceNumberPipe"
      [min]="props?.inputs?.min"
      [max]="props?.inputs?.max"
      [step]="props?.inputs?.step"
      [thumbLabel]="props?.inputs?.thumbLabel"
      [vertical]="props?.inputs?.vertical"
      [invert]="props?.inputs?.invert"
      [disabled]="props?.inputs?.disabled | dataBindingLookupPipe:dataBindingRefreshTrigger | coerceBooleanPipe"
      (input)="onOutputChange($event.value,elementId,'value')"
    ></mat-slider>
  </div>
`;

const simpleTemplate = `
  <mat-slider
    class="slider__test-id"
    color="primary"
    value="35"
    min="0"
    max="100"
    step="1"
    thumbLabel
    vertical
    invert
  ></mat-slider>
`;

runTemplateTests(cd.ElementEntitySubType.Slider, internalTemplate, simpleTemplate, {
  thumbLabel: true,
  vertical: true,
  invert: true,
});

runInstanceTests(cd.ElementEntitySubType.Slider, {
  name: 'Slider',
  elementType: cd.ElementEntitySubType.Slider,
  inputs: {
    color: mat.DEFAULT_THEME_COLOR,
    disabled: false,
    value: 35,
    thumbLabel: false,
    vertical: false,
    invert: false,
    min: 0,
    max: 100,
    step: 1,
  } as cd.ISliderInputs,
});
