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
import { TextType, ColorType } from 'cd-themes';
import { UnitTypes } from 'cd-metadata/units';
import { ICON_SIZE } from './icon';
import * as cd from 'cd-interfaces';

const internalTemplate = `
  <cd-icon-element
    *ngIf="props?.inputs?.iconName | isCloudIconPipe; else primitiveIconRef"
    [icon]="props?.inputs?.iconName"
    [class.cd-render-rect-marker]="!instanceId"
    class="cd-rendered-element"
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
  ></cd-icon-element>
  <ng-template #primitiveIconRef>
    <i
      class="cd-primitive-icon material-icons cd-rendered-element"
      [class.cd-render-rect-marker]="!instanceId"
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
      {{ props?.inputs?.iconName }}
    </i>
  </ng-template>
`;

const simpleTemplate = `
  <i class="icon__test-id material-icons">local_florist</i>
`;

runTemplateTests(cd.ElementEntitySubType.Icon, internalTemplate, simpleTemplate);

runInstanceTests(cd.ElementEntitySubType.Icon, {
  name: 'Icon',
  elementType: cd.ElementEntitySubType.Icon,
  styles: {
    base: {
      style: {
        width: { value: ICON_SIZE, units: UnitTypes.Pixels },
        height: { value: ICON_SIZE, units: UnitTypes.Pixels },
        color: { value: '#000000', id: ColorType.Text } as cd.IValue,
        display: cd.Display.InlineBlock,
        boxSizing: cd.BoxSizing.ContentBox,
        verticalAlign: cd.VerticalAlign.Top,
        fontSize: { value: ICON_SIZE, units: UnitTypes.Pixels },
        fontFamily: { id: TextType.IconFontFamily },
      },
    },
  },
  inputs: { iconName: 'local_florist' } as cd.IIconInputs,
  frame: { locked: true, x: 0, y: 0, width: 0, height: 0 } as any,
});
