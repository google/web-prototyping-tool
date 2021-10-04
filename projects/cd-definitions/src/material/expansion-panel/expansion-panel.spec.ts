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
import { UnitTypes } from 'cd-metadata/units';

const internalTemplate = `
  <mat-accordion
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
    [displayMode]="props?.inputs?.displayMode"
    [hideToggle]="props?.inputs?.hideToggle"
    [togglePosition]="props?.inputs?.togglePosition"
    [multi]="props?.inputs?.multi"
  >
    <mat-expansion-panel
      *ngFor="let panel of props?.inputs?.childPortals; let i = index"
      [disabled]="props?.inputs?.childPortals[i]?.disabled"
      [expanded]="props?.inputs?.childPortals[i]?.selected"
    >
      <mat-expansion-panel-header>
        <mat-panel-title>
          {{ props?.inputs?.childPortals[i]?.name }}
        </mat-panel-title>
      </mat-expansion-panel-header>
      <div
        class="cd-portal-wrapper cd-child-content-portal"
        *ngIf="(props?.inputs?.childPortals[i]?.value | circularGuardPipe:ancestors:renderId) && props?.inputs?.childPortals[i]?.value | hasValuePipe:propertiesMap; else portalErrorRef"
      >
      <cd-outlet
        [instanceId]="elementId"
        [renderId]="props?.inputs?.childPortals[i]?.value"
        [elementClassPrefix]="elementId + i | classPrefixPipe : elementClassPrefix"
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
      <ng-template #portalErrorRef
      ><div
        class="cd-portal-zero-state"
        [class.cd-portal-error-state]="props?.inputs?.childPortals[i]?.value | hasValuePipe:propertiesMap"
      ></div></ng-template>
    </mat-expansion-panel>
  </mat-accordion>
`;

const simpleTemplate = `
  <mat-accordion class="expansion_panel__test-id" displayMode="default" togglePosition="after" multi="true">
    <mat-expansion-panel></mat-expansion-panel>
    <mat-expansion-panel></mat-expansion-panel>
  </mat-accordion>
`;

runTemplateTests(cd.ElementEntitySubType.ExpansionPanel, internalTemplate, simpleTemplate);

runInstanceTests(cd.ElementEntitySubType.ExpansionPanel, {
  name: 'Expansion Panel',
  elementType: cd.ElementEntitySubType.ExpansionPanel,
  styles: {
    base: {
      style: {
        width: { value: 100, units: UnitTypes.Percent },
      },
    },
  },
  inputs: {
    childPortals: [{ name: 'Panel 1' }, { name: 'Panel 2' }],
    displayMode: 'default',
    hideToggle: false,
    multi: true,
    togglePosition: 'after',
  } as cd.IExpansionPanelInputs,
});
