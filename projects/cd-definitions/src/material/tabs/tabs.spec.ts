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
import * as mat from '../material-shared';

const internalTemplate = `
  <mat-tab-group
    [class.cd-render-rect-marker]="!instanceId"
    class="cd-rendered-element cd-mat-tab-group"
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
    [selectedIndex]="props?.inputs?.selectedIndex"
    [color]="props?.inputs?.color"
    (selectedIndexChange)="onOutputChange($event,elementId,'selectedIndex')"
  >
    <mat-tab
      *ngFor="let tab of props?.inputs?.childPortals; let i = index"
      [disabled]="props?.inputs?.childPortals[i]?.disabled"
    >
      <ng-template mat-tab-label>
        <ng-container *ngIf="!!props?.inputs?.childPortals[i]?.icon">
          <cd-icon-element
            *ngIf="props?.inputs?.childPortals[i]?.icon | isCloudIconPipe; else primitiveIconRef"
            [icon]="props?.inputs?.childPortals[i]?.icon"
          ></cd-icon-element>
          <ng-template #primitiveIconRef>
            <i class="cd-primitive-icon material-icons">
              {{ props?.inputs?.childPortals[i]?.icon }}
            </i>
          </ng-template>
        </ng-container>
        <span *ngIf="props?.inputs?.childPortals[i]?.name">
          {{ props?.inputs?.childPortals[i]?.name }}
        </span>
      </ng-template>
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
    </mat-tab>
  </mat-tab-group>
`;

const simpleTemplate = `
  <mat-tab-group class="tabs__test-id">
    <mat-tab>
      <ng-template mat-tab-label><span>Tab 1</span></ng-template>
    </mat-tab>
    <mat-tab>
      <ng-template mat-tab-label><span>Tab 2</span></ng-template>
    </mat-tab>
  </mat-tab-group>
`;

runTemplateTests(cd.ElementEntitySubType.Tabs, internalTemplate, simpleTemplate);

runInstanceTests(cd.ElementEntitySubType.Tabs, {
  name: 'Tabs',
  elementType: cd.ElementEntitySubType.Tabs,
  styles: {
    base: {
      style: {
        width: { value: 540, units: UnitTypes.Pixels },
        height: { value: 360, units: UnitTypes.Pixels },
        display: null,
      },
    },
  },
  inputs: {
    color: mat.DEFAULT_THEME_COLOR,
    selectedIndex: 0,
    childPortals: [{ name: 'Tab 1' }, { name: 'Tab 2' }],
  } as cd.ITabInputs,
});
