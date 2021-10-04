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
<ng-container [ngSwitch]="props?.inputs?.verticalStepper">
  <div
    *ngSwitchDefault
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
  >
    <ng-container *ngIf="props?.inputs?.selectedIndex >= 0">
      <mat-vertical-stepper
        [selectedIndex]="props?.inputs?.selectedIndex"
        [labelPosition]="props?.inputs?.labelPosition"
        (selectionChange)="onOutputChange($event.selectedIndex,elementId,'selectedIndex')"
      >
        <mat-step
          *ngFor="let step of props?.inputs?.childPortals; let i = index"
          [disabled]="props?.inputs?.childPortals[i]?.disabled"
          [label]="props?.inputs?.childPortals[i]?.name"
          [state]="props?.inputs?.childPortals[i]?.icon"
        >
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
          <ng-template #portalErrorRef>
            <div
              class="cd-portal-zero-state"
              [class.cd-portal-error-state]="props?.inputs?.childPortals[i]?.value | hasValuePipe:propertiesMap"
            ></div>
          </ng-template>
        </mat-step>
      </mat-vertical-stepper>
    </ng-container>
  </div>
  <div
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
    *ngSwitchCase="false"
  >
    <ng-container *ngIf="props?.inputs?.selectedIndex >= 0">
      <mat-horizontal-stepper
        [selectedIndex]="props?.inputs?.selectedIndex"
        [labelPosition]="props?.inputs?.labelPosition"
        (selectionChange)="onOutputChange($event.selectedIndex,elementId,'selectedIndex')"
      >
        <mat-step
          *ngFor="let step of props?.inputs?.childPortals; let i = index"
          [disabled]="props?.inputs?.childPortals[i]?.disabled"
          [label]="props?.inputs?.childPortals[i]?.name"
          [state]="props?.inputs?.childPortals[i]?.icon"
        >
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
          <ng-template #portalErrorRef>
            <div
              class="cd-portal-zero-state"
              [class.cd-portal-error-state]="props?.inputs?.childPortals[i]?.value | hasValuePipe:propertiesMap"
            ></div>
          </ng-template>
        </mat-step>
      </mat-horizontal-stepper>
    </ng-container>
  </div>
</ng-container>
`;

const simpleTemplate = `
  <mat-horizontal-stepper class="stepper__test-id" labelPosition="end">
    <mat-step label="Step 1"></mat-step>
    <mat-step label="Step 2"></mat-step>
    <mat-step label="Step 3"></mat-step>
  </mat-horizontal-stepper>
`;

runTemplateTests(cd.ElementEntitySubType.Stepper, internalTemplate, simpleTemplate);

runInstanceTests(cd.ElementEntitySubType.Stepper, {
  name: 'Stepper',
  elementType: cd.ElementEntitySubType.Stepper,
  styles: {
    base: {
      style: {
        width: { value: 540, units: UnitTypes.Pixels },
        height: { value: 360, units: UnitTypes.Pixels },
      },
    },
  },
  inputs: {
    selectedIndex: 0,
    labelPosition: 'end' as cd.StepperLabelPosition,
    verticalStepper: false,
    childPortals: [{ name: 'Step 1' }, { name: 'Step 2' }, { name: 'Step 3' }],
  } as cd.IStepperInputs,
});
