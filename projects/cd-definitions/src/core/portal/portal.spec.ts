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

import { runTemplateTests, formatHtml } from '../../test.utils';
import { createInstance, TemplateFactory } from 'cd-common/models';
import templateFunction from './portal.template';
import * as cd from 'cd-interfaces';

const internalTemplate = `
<div
  class="cd-portal-wrapper cd-rendered-element cd-fit-content"
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
  *ngIf="(props?.inputs?.referenceId | circularGuardPipe:ancestors:renderId) && props?.inputs?.referenceId | hasValuePipe:propertiesMap; else portalErrorRef"
>
  <cd-outlet
    [instanceId]="elementId"
    [renderId]="props?.inputs?.referenceId"
    [elementClassPrefix]="elementId | classPrefixPipe : elementClassPrefix"
    [propertiesMap]="propertiesMap"
    [styleMap]="styleMap"
    [assets]="assets"
    [addMarkerToInnerRoot]="false"
    [designSystem]="designSystem"
    outletType="Portal"
    [ancestors]="ancestors"
    [datasets]="datasets"
    [loadedData]="loadedData"
  ></cd-outlet>
</div>
<ng-template #portalErrorRef>
  <div
    class="cd-portal-zero-state cd-rendered-element cd-fit-content"
    [class.cd-portal-error-state]="props?.inputs?.referenceId | hasValuePipe:propertiesMap"
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
    [cdA11yAttrs]="props?.a11yInputs">
  </div>
</ng-template>
`;

const simpleTemplate =
  '<div class="board__boardId"><i class="icon__iconId material-icons">local_florist</i></div>';

runTemplateTests(cd.ElementEntitySubType.BoardPortal, internalTemplate, '');

describe('BoardPortal template tests', () => {
  it('should create a simple template for export', () => {
    const projectId = 'projectId';
    const portalId = 'portalId';
    const boardId = 'boardId';
    const iconId = 'iconId';

    const boardModel = createInstance(cd.ElementEntitySubType.Board, projectId, boardId)
      .addChildId(iconId)
      .build();

    const iconModel = createInstance(cd.ElementEntitySubType.Icon, projectId, iconId)
      .assignParentId(boardId)
      .assignRootId(boardId)
      .build();

    const portalModel = createInstance(cd.ElementEntitySubType.BoardPortal, projectId, portalId)
      .addInputs({ referenceId: boardId })
      .build();

    TemplateFactory.projectProperties = {
      [portalId]: portalModel,
      [boardId]: boardModel,
      [iconId]: iconModel,
    };

    const template = templateFunction(cd.TemplateBuildMode.Simple, portalModel);
    const formattedTemplate = formatHtml(template);
    const expected = formatHtml(simpleTemplate);
    expect(formattedTemplate).toEqual(expected);
  });
});
