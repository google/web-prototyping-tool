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
  <img
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
    [src]="props?.inputs?.src | imageLookupPipe:assets:imageFallbackUrl | safeResourceURL"
  />
`;

const simpleTemplate = `<img class="image__test-id" />`;

runTemplateTests(cd.ElementEntitySubType.Image, internalTemplate, simpleTemplate);

runInstanceTests(cd.ElementEntitySubType.Image, {
  name: 'Image',
  elementType: cd.ElementEntitySubType.Image,
  styles: {
    base: {
      style: {
        width: { value: 220, units: UnitTypes.Pixels },
        height: { value: 150, units: UnitTypes.Pixels },
        objectFit: cd.ObjectFit.Cover,
        display: cd.Display.Block,
      },
    },
  },
  inputs: { src: { id: null, value: '' } as cd.IValue } as any,
});
