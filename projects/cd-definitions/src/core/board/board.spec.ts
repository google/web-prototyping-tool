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
import { ColorType } from 'cd-themes';
import * as cd from 'cd-interfaces';

const internalTemplate = `
  <div
    [class.cd-render-rect-marker]="addMarkerToInnerRoot"
    class="cd-rendered-element inner-root"
	  [cdStyle]="styleMap[elementId]"
	  [classPrefix]="elementClassPrefix"
	  [class.cd-preview-styles]="props?.showPreviewStyles"
	  [cdHidden]="props?.inputs?.hidden | dataBindingLookupPipe:dataBindingRefreshTrigger | coerceBooleanPipe"
	  [cdCoTooltip]="props?.inputs?.tooltipLabel"
	  [cdCoTooltipPosition]="props?.inputs?.tooltipPosition"
    [cdAttrs]="props?.attrs"
    [cdA11yAttrs]="props?.a11yInputs"
    [attr.data-id]="(instanceId || elementId)"
    [attr.data-full-id-path]="(instanceId || elementId) | fullIdPathPipe : ancestors"
    [styleId]="(instanceId || elementId)"
    [attr.data-instance]="instanceId"
	>
	  <ng-container
	    *ngIf="props?.childIds; let childIds"
	    [ngTemplateOutlet]="children"
	    [ngTemplateOutletContext]="{ $implicit:childIds }"
	  ></ng-container>
	</div>
`;

const simpleTemplate = `<div class="board__test-id"></div>`;

runTemplateTests(cd.ElementEntitySubType.Board, internalTemplate, simpleTemplate);

runInstanceTests(cd.ElementEntitySubType.Board, {
  name: 'Board',
  elementType: cd.ElementEntitySubType.Board,
  styles: {
    base: {
      style: {
        position: cd.PositionType.Relative,
        display: cd.Display.Block,
        opacity: 1,
        background: [{ value: '#FFFFFF', id: ColorType.Surface }],
        overflow: { x: cd.Overflow.Hidden, y: cd.Overflow.Auto },
      },
    },
  },
  frame: { x: 40, y: 40, width: 800, height: 600 },
});
