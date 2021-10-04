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

const internalTemplate = `
  <ng-container
    ><div
      *ngIf="!props?.inputs?.matRipple"
      [class.cd-render-rect-marker]="!instanceId"
      class="cd-rendered-element cd-fit-content cd-generic-div"
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
      <ng-container
        *ngIf="props?.childIds; let childIds"
        [ngTemplateOutlet]="children"
        [ngTemplateOutletContext]="{ $implicit:childIds }"
      ></ng-container>
    </div>
    <div
      matRipple
      *ngIf="props?.inputs?.matRipple"
      [class.cd-render-rect-marker]="!instanceId"
      class="cd-rendered-element cd-fit-content cd-generic-div"
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
      [matRippleCentered]="props?.inputs?.matRippleCentered"
    >
      <ng-container
        *ngIf="props?.childIds; let childIds"
        [ngTemplateOutlet]="children"
        [ngTemplateOutletContext]="{ $implicit:childIds }"
      ></ng-container></div
  ></ng-container>
`;

const simpleTemplate = `<div class="element__test-id"></div>`;

runTemplateTests(cd.ElementEntitySubType.Generic, internalTemplate, simpleTemplate);

runInstanceTests(cd.ElementEntitySubType.Generic, {
  name: 'Element',
  elementType: cd.ElementEntitySubType.Generic,
  styles: {
    base: {
      style: {
        width: { value: 100, units: UnitTypes.Pixels },
        height: { value: 100, units: UnitTypes.Pixels },
        background: [{ value: '#EEEEEE' }],
        display: cd.Display.Block,
        overflow: { x: cd.Overflow.Hidden, y: cd.Overflow.Hidden },
      },
    },
  },
  inputs: { matRipple: false } as cd.IGenericInputs,
});
