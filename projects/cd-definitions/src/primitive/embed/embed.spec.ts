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
import { getIframeFeaturePolicy, DEFAULT_IFRAME_URL } from 'cd-common/consts';
import { UnitTypes } from 'cd-metadata/units';
import * as cd from 'cd-interfaces';

const internalTemplate = `
  <iframe
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
    [src]="props?.inputs?.src | safeResourceURL"
    allow="${getIframeFeaturePolicy()}"
  ></iframe>
`;

const simpleTemplate = `
  <iframe class="embed__test-id" src="${DEFAULT_IFRAME_URL}" allow="${getIframeFeaturePolicy()}"></iframe>
`;

runTemplateTests(cd.ElementEntitySubType.IFrame, internalTemplate, simpleTemplate);

runInstanceTests(cd.ElementEntitySubType.IFrame, {
  name: 'Embed',
  elementType: cd.ElementEntitySubType.IFrame,
  styles: {
    base: {
      style: {
        background: [{ value: '#EEEEEE' }],
        width: { value: 650, units: UnitTypes.Pixels },
        height: { value: 500, units: UnitTypes.Pixels },
      },
    },
  },
  inputs: { src: DEFAULT_IFRAME_URL, variant: cd.EmbedVariant.Default } as any,
});
