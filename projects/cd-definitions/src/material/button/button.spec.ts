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

/* eslint-disable max-lines */

import { runTemplateTests, runInstanceTests } from '../../test.utils';
import * as cd from 'cd-interfaces';
import * as mat from '../material-shared';

const internalTemplate = `
  <ng-container [ngSwitch]="props?.inputs?.variant">
    <button
      mat-fab
      [class.cd-render-rect-marker]="!instanceId"
      class="cd-rendered-element cd-mat-button"
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
      [class.cd-small-button]="props?.inputs?.small | dataBindingLookupPipe:dataBindingRefreshTrigger | coerceBooleanPipe"
      [class.cd-right-icon]="props?.inputs?.iconRightSide"
      [color]="props?.inputs?.color"
      [disabled]="props?.inputs?.disabled | dataBindingLookupPipe:dataBindingRefreshTrigger | coerceBooleanPipe"
      *ngSwitchCase="'Fab'"
    >
      <ng-container *ngIf="!!props?.inputs?.iconName">
        <cd-icon-element
          *ngIf="props?.inputs?.iconName | isCloudIconPipe; else primitiveIconRef"
          [icon]="props?.inputs?.iconName"
        ></cd-icon-element>
        <ng-template #primitiveIconRef>
          <i class="cd-primitive-icon material-icons">
            {{ props?.inputs?.iconName }}
          </i>
        </ng-template>
      </ng-container>
      <ng-container *ngIf="props?.inputs?.menu?.length">
        <div
          class="co-mat-menu-trigger"
          [matMenuTriggerFor]="buttonMenu"
          [matMenuTriggerData]="{ $implicit:props?.inputs?.menu }"
        ></div>
      </ng-container>
    </button>
    <button
      mat-icon-button
      [class.cd-render-rect-marker]="!instanceId"
      class="cd-rendered-element cd-mat-button"
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
      [class.cd-small-button]="props?.inputs?.small | dataBindingLookupPipe:dataBindingRefreshTrigger | coerceBooleanPipe"
      [class.cd-right-icon]="props?.inputs?.iconRightSide"
      [color]="props?.inputs?.color"
      [disabled]="props?.inputs?.disabled | dataBindingLookupPipe:dataBindingRefreshTrigger | coerceBooleanPipe"
      *ngSwitchCase="'Icon'"
    >
      <ng-container *ngIf="!!props?.inputs?.iconName">
        <cd-icon-element
          *ngIf="props?.inputs?.iconName | isCloudIconPipe; else primitiveIconRef"
          [icon]="props?.inputs?.iconName"
        ></cd-icon-element>
        <ng-template #primitiveIconRef>
          <i class="cd-primitive-icon material-icons">
            {{ props?.inputs?.iconName }}
          </i>
        </ng-template>
      </ng-container>
      <ng-container *ngIf="props?.inputs?.menu?.length">
        <div
          class="co-mat-menu-trigger"
          [matMenuTriggerFor]="buttonMenu"
          [matMenuTriggerData]="{ $implicit:props?.inputs?.menu }"
        ></div>
      </ng-container>
    </button>
    <ng-container *ngSwitchCase="'Raised'">
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
        *ngIf="props?.inputs?.split; else RaisedButton"
      >
        <span
          class="cd-mat-button-group mat-raised-button-wrapper"
          [class.cd-mat-button-group-disabled]="props?.inputs?.disabled | dataBindingLookupPipe:dataBindingRefreshTrigger | coerceBooleanPipe"
        >
          <button
            mat-raised-button
            class="cd-mat-button"
            [class.cd-small-button]="props?.inputs?.small | dataBindingLookupPipe:dataBindingRefreshTrigger | coerceBooleanPipe"
            [class.cd-right-icon]="props?.inputs?.iconRightSide"
            [color]="props?.inputs?.color"
            [disabled]="props?.inputs?.disabled | dataBindingLookupPipe:dataBindingRefreshTrigger | coerceBooleanPipe"
          >
            <ng-container *ngIf="!!props?.inputs?.iconName">
              <cd-icon-element
                *ngIf="props?.inputs?.iconName | isCloudIconPipe; else primitiveIconRef"
                [icon]="props?.inputs?.iconName"
              ></cd-icon-element>
              <ng-template #primitiveIconRef>
                <i class="cd-primitive-icon material-icons">
                  {{ props?.inputs?.iconName }}
                </i>
              </ng-template>
            </ng-container>
            {{ props?.inputs?.label |
            dataBindingLookupPipe:dataBindingRefreshTrigger |
            coerceStringPipe }}
          </button>
          <button
            mat-raised-button
            cdCaptureMatMenu
            class="cd-split-button-menu cd-mat-button"
            [class.cd-small-button]="props?.inputs?.small | dataBindingLookupPipe:dataBindingRefreshTrigger | coerceBooleanPipe"
            [color]="props?.inputs?.color"
            [disabled]="props?.inputs?.disabled | dataBindingLookupPipe:dataBindingRefreshTrigger | coerceBooleanPipe"
            [matMenuTriggerFor]="buttonMenu"
            [matMenuTriggerData]="{ $implicit:props?.inputs?.menu }"
          >
            <ng-container *ngIf="!!props?.inputs?.splitIcon">
              <cd-icon-element
                *ngIf="props?.inputs?.splitIcon | isCloudIconPipe; else primitiveIconRef"
                [icon]="props?.inputs?.splitIcon"
              ></cd-icon-element>
              <ng-template #primitiveIconRef>
                <i class="cd-primitive-icon material-icons">
                  {{ props?.inputs?.splitIcon }}
                </i>
              </ng-template>
            </ng-container>
          </button>
        </span>
      </div>
      <ng-template #RaisedButton>
        <button
          mat-raised-button
          [class.cd-render-rect-marker]="!instanceId"
          class="cd-rendered-element cd-mat-button"
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
          [class.cd-small-button]="props?.inputs?.small | dataBindingLookupPipe:dataBindingRefreshTrigger | coerceBooleanPipe"
          [class.cd-right-icon]="props?.inputs?.iconRightSide"
          [color]="props?.inputs?.color"
          [disabled]="props?.inputs?.disabled | dataBindingLookupPipe:dataBindingRefreshTrigger | coerceBooleanPipe"
        >
          <ng-container *ngIf="!!props?.inputs?.iconName">
            <cd-icon-element
              *ngIf="props?.inputs?.iconName | isCloudIconPipe; else primitiveIconRef"
              [icon]="props?.inputs?.iconName"
            ></cd-icon-element>
            <ng-template #primitiveIconRef>
              <i class="cd-primitive-icon material-icons">
                {{ props?.inputs?.iconName }}
              </i>
            </ng-template>
          </ng-container>
          {{ props?.inputs?.label |
          dataBindingLookupPipe:dataBindingRefreshTrigger |
          coerceStringPipe }}
          <ng-container *ngIf="props?.inputs?.menu?.length">
            <div
              class="co-mat-menu-trigger"
              [matMenuTriggerFor]="buttonMenu"
              [matMenuTriggerData]="{ $implicit:props?.inputs?.menu }"
            ></div>
          </ng-container>
        </button>
      </ng-template>
    </ng-container>
    <ng-container *ngSwitchCase="'Flat'">
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
        *ngIf="props?.inputs?.split; else FlatButton"
      >
        <span
          class="cd-mat-button-group mat-flat-button-wrapper"
          [class.cd-mat-button-group-disabled]="props?.inputs?.disabled | dataBindingLookupPipe:dataBindingRefreshTrigger | coerceBooleanPipe"
        >
          <button
            mat-flat-button
            class="cd-mat-button"
            [class.cd-small-button]="props?.inputs?.small | dataBindingLookupPipe:dataBindingRefreshTrigger | coerceBooleanPipe"
            [class.cd-right-icon]="props?.inputs?.iconRightSide"
            [color]="props?.inputs?.color"
            [disabled]="props?.inputs?.disabled | dataBindingLookupPipe:dataBindingRefreshTrigger | coerceBooleanPipe"
          >
            <ng-container *ngIf="!!props?.inputs?.iconName">
              <cd-icon-element
                *ngIf="props?.inputs?.iconName | isCloudIconPipe; else primitiveIconRef"
                [icon]="props?.inputs?.iconName"
              ></cd-icon-element>
              <ng-template #primitiveIconRef>
                <i class="cd-primitive-icon material-icons">
                  {{ props?.inputs?.iconName }}
                </i>
              </ng-template>
            </ng-container>
            {{ props?.inputs?.label |
            dataBindingLookupPipe:dataBindingRefreshTrigger |
            coerceStringPipe }}
          </button>
          <button
            mat-flat-button
            cdCaptureMatMenu
            class="cd-split-button-menu cd-mat-button"
            [class.cd-small-button]="props?.inputs?.small | dataBindingLookupPipe:dataBindingRefreshTrigger | coerceBooleanPipe"
            [color]="props?.inputs?.color"
            [disabled]="props?.inputs?.disabled | dataBindingLookupPipe:dataBindingRefreshTrigger | coerceBooleanPipe"
            [matMenuTriggerFor]="buttonMenu"
            [matMenuTriggerData]="{ $implicit:props?.inputs?.menu }"
          >
            <ng-container *ngIf="!!props?.inputs?.splitIcon">
              <cd-icon-element
                *ngIf="props?.inputs?.splitIcon | isCloudIconPipe; else primitiveIconRef"
                [icon]="props?.inputs?.splitIcon"
              ></cd-icon-element>
              <ng-template #primitiveIconRef>
                <i class="cd-primitive-icon material-icons">
                  {{ props?.inputs?.splitIcon }}
                </i>
              </ng-template>
            </ng-container>
          </button>
        </span>
      </div>
      <ng-template #FlatButton>
        <button
          mat-flat-button
          [class.cd-render-rect-marker]="!instanceId"
          class="cd-rendered-element cd-mat-button"
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
          [class.cd-small-button]="props?.inputs?.small | dataBindingLookupPipe:dataBindingRefreshTrigger | coerceBooleanPipe"
          [class.cd-right-icon]="props?.inputs?.iconRightSide"
          [color]="props?.inputs?.color"
          [disabled]="props?.inputs?.disabled | dataBindingLookupPipe:dataBindingRefreshTrigger | coerceBooleanPipe"
        >
          <ng-container *ngIf="!!props?.inputs?.iconName">
            <cd-icon-element
              *ngIf="props?.inputs?.iconName | isCloudIconPipe; else primitiveIconRef"
              [icon]="props?.inputs?.iconName"
            ></cd-icon-element>
            <ng-template #primitiveIconRef>
              <i class="cd-primitive-icon material-icons">
                {{ props?.inputs?.iconName }}
              </i>
            </ng-template>
          </ng-container>
          {{ props?.inputs?.label |
          dataBindingLookupPipe:dataBindingRefreshTrigger |
          coerceStringPipe }}
          <ng-container *ngIf="props?.inputs?.menu?.length">
            <div
              class="co-mat-menu-trigger"
              [matMenuTriggerFor]="buttonMenu"
              [matMenuTriggerData]="{ $implicit:props?.inputs?.menu }"
            ></div>
          </ng-container>
        </button>
      </ng-template>
    </ng-container>
    <ng-container *ngSwitchCase="'Stroked'">
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
        *ngIf="props?.inputs?.split; else StrokedButton"
      >
        <span
          class="cd-mat-button-group mat-stroked-button-wrapper"
          [class.cd-mat-button-group-disabled]="props?.inputs?.disabled | dataBindingLookupPipe:dataBindingRefreshTrigger | coerceBooleanPipe"
        >
          <button
            mat-stroked-button
            class="cd-mat-button"
            [class.cd-small-button]="props?.inputs?.small | dataBindingLookupPipe:dataBindingRefreshTrigger | coerceBooleanPipe"
            [class.cd-right-icon]="props?.inputs?.iconRightSide"
            [color]="props?.inputs?.color"
            [disabled]="props?.inputs?.disabled | dataBindingLookupPipe:dataBindingRefreshTrigger | coerceBooleanPipe"
          >
            <ng-container *ngIf="!!props?.inputs?.iconName">
              <cd-icon-element
                *ngIf="props?.inputs?.iconName | isCloudIconPipe; else primitiveIconRef"
                [icon]="props?.inputs?.iconName"
              ></cd-icon-element>
              <ng-template #primitiveIconRef>
                <i class="cd-primitive-icon material-icons">
                  {{ props?.inputs?.iconName }}
                </i>
              </ng-template>
            </ng-container>
            {{ props?.inputs?.label |
            dataBindingLookupPipe:dataBindingRefreshTrigger |
            coerceStringPipe }}
          </button>
          <button
            mat-stroked-button
            cdCaptureMatMenu
            class="cd-split-button-menu cd-mat-button"
            [class.cd-small-button]="props?.inputs?.small | dataBindingLookupPipe:dataBindingRefreshTrigger | coerceBooleanPipe"
            [color]="props?.inputs?.color"
            [disabled]="props?.inputs?.disabled | dataBindingLookupPipe:dataBindingRefreshTrigger | coerceBooleanPipe"
            [matMenuTriggerFor]="buttonMenu"
            [matMenuTriggerData]="{ $implicit:props?.inputs?.menu }"
          >
            <ng-container *ngIf="!!props?.inputs?.splitIcon">
              <cd-icon-element
                *ngIf="props?.inputs?.splitIcon | isCloudIconPipe; else primitiveIconRef"
                [icon]="props?.inputs?.splitIcon"
              ></cd-icon-element>
              <ng-template #primitiveIconRef>
                <i class="cd-primitive-icon material-icons">
                  {{ props?.inputs?.splitIcon }}
                </i>
              </ng-template>
            </ng-container>
          </button>
        </span>
      </div>
      <ng-template #StrokedButton>
        <button
          mat-stroked-button
          [class.cd-render-rect-marker]="!instanceId"
          class="cd-rendered-element cd-mat-button"
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
          [class.cd-small-button]="props?.inputs?.small | dataBindingLookupPipe:dataBindingRefreshTrigger | coerceBooleanPipe"
          [class.cd-right-icon]="props?.inputs?.iconRightSide"
          [color]="props?.inputs?.color"
          [disabled]="props?.inputs?.disabled | dataBindingLookupPipe:dataBindingRefreshTrigger | coerceBooleanPipe"
        >
          <ng-container *ngIf="!!props?.inputs?.iconName">
            <cd-icon-element
              *ngIf="props?.inputs?.iconName | isCloudIconPipe; else primitiveIconRef"
              [icon]="props?.inputs?.iconName"
            ></cd-icon-element>
            <ng-template #primitiveIconRef>
              <i class="cd-primitive-icon material-icons">
                {{ props?.inputs?.iconName }}
              </i>
            </ng-template>
          </ng-container>
          {{ props?.inputs?.label |
          dataBindingLookupPipe:dataBindingRefreshTrigger |
          coerceStringPipe }}
          <ng-container *ngIf="props?.inputs?.menu?.length">
            <div
              class="co-mat-menu-trigger"
              [matMenuTriggerFor]="buttonMenu"
              [matMenuTriggerData]="{ $implicit:props?.inputs?.menu }"
            ></div>
          </ng-container>
        </button>
      </ng-template>
    </ng-container>
    <ng-container *ngSwitchDefault>
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
        *ngIf="props?.inputs?.split; else BasicButton"
      >
        <span
          class="cd-mat-button-group mat-button-wrapper"
          [class.cd-mat-button-group-disabled]="props?.inputs?.disabled | dataBindingLookupPipe:dataBindingRefreshTrigger | coerceBooleanPipe"
        >
          <button
            mat-button
            class="cd-mat-button"
            [class.cd-small-button]="props?.inputs?.small | dataBindingLookupPipe:dataBindingRefreshTrigger | coerceBooleanPipe"
            [class.cd-right-icon]="props?.inputs?.iconRightSide"
            [color]="props?.inputs?.color"
            [disabled]="props?.inputs?.disabled | dataBindingLookupPipe:dataBindingRefreshTrigger | coerceBooleanPipe"
          >
            <ng-container *ngIf="!!props?.inputs?.iconName">
              <cd-icon-element
                *ngIf="props?.inputs?.iconName | isCloudIconPipe; else primitiveIconRef"
                [icon]="props?.inputs?.iconName"
              ></cd-icon-element>
              <ng-template #primitiveIconRef>
                <i class="cd-primitive-icon material-icons">
                  {{ props?.inputs?.iconName }}
                </i>
              </ng-template>
            </ng-container>
            {{ props?.inputs?.label |
            dataBindingLookupPipe:dataBindingRefreshTrigger |
            coerceStringPipe }}
          </button>
          <button
            mat-button
            cdCaptureMatMenu
            class="cd-split-button-menu cd-mat-button"
            [class.cd-small-button]="props?.inputs?.small | dataBindingLookupPipe:dataBindingRefreshTrigger | coerceBooleanPipe"
            [color]="props?.inputs?.color"
            [disabled]="props?.inputs?.disabled | dataBindingLookupPipe:dataBindingRefreshTrigger | coerceBooleanPipe"
            [matMenuTriggerFor]="buttonMenu"
            [matMenuTriggerData]="{ $implicit:props?.inputs?.menu }"
          >
            <ng-container *ngIf="!!props?.inputs?.splitIcon">
              <cd-icon-element
                *ngIf="props?.inputs?.splitIcon | isCloudIconPipe; else primitiveIconRef"
                [icon]="props?.inputs?.splitIcon"
              ></cd-icon-element>
              <ng-template #primitiveIconRef>
                <i class="cd-primitive-icon material-icons">
                  {{ props?.inputs?.splitIcon }}
                </i>
              </ng-template>
            </ng-container>
          </button>
        </span>
      </div>
      <ng-template #BasicButton>
        <button
          mat-button
          [class.cd-render-rect-marker]="!instanceId"
          class="cd-rendered-element cd-mat-button"
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
          [class.cd-small-button]="props?.inputs?.small | dataBindingLookupPipe:dataBindingRefreshTrigger | coerceBooleanPipe"
          [class.cd-right-icon]="props?.inputs?.iconRightSide"
          [color]="props?.inputs?.color"
          [disabled]="props?.inputs?.disabled | dataBindingLookupPipe:dataBindingRefreshTrigger | coerceBooleanPipe"
        >
          <ng-container *ngIf="!!props?.inputs?.iconName">
            <cd-icon-element
              *ngIf="props?.inputs?.iconName | isCloudIconPipe; else primitiveIconRef"
              [icon]="props?.inputs?.iconName"
            ></cd-icon-element>
            <ng-template #primitiveIconRef>
              <i class="cd-primitive-icon material-icons">
                {{ props?.inputs?.iconName }}
              </i>
            </ng-template>
          </ng-container>
          {{ props?.inputs?.label |
          dataBindingLookupPipe:dataBindingRefreshTrigger |
          coerceStringPipe }}
          <ng-container *ngIf="props?.inputs?.menu?.length">
            <div
              class="co-mat-menu-trigger"
              [matMenuTriggerFor]="buttonMenu"
              [matMenuTriggerData]="{ $implicit:props?.inputs?.menu }"
            ></div>
          </ng-container>
        </button>
      </ng-template>
    </ng-container>
    <mat-menu #buttonMenu="matMenu">
      <ng-template matMenuContent let-data>
        <button
          mat-menu-item
          *ngFor="let item of data"
          [disabled]="item.disabled"
          (click)="onOutputChange(item.value,elementId,'menu',false)"
        >
          <ng-container *ngIf="!!item.icon">
            <cd-icon-element
              *ngIf="item.icon | isCloudIconPipe; else primitiveIconRef"
              [icon]="item.icon"
            ></cd-icon-element>
            <ng-template #primitiveIconRef>
              <i class="cd-primitive-icon material-icons">{{ item.icon }}</i>
            </ng-template>
          </ng-container>
          <span>{{ item.name }}</span>
        </button>
      </ng-template>
    </mat-menu>
  </ng-container>
`;

const simpleTemplate = `<button class="button__test-id" mat-raised-button color="primary">Button</button>`;

runTemplateTests(cd.ElementEntitySubType.Button, internalTemplate, simpleTemplate);

runInstanceTests(cd.ElementEntitySubType.Button, {
  name: 'Button',
  elementType: cd.ElementEntitySubType.Button,
  inputs: {
    color: mat.DEFAULT_THEME_COLOR,
    disabled: false,
    small: false,
    label: 'Button',
    variant: cd.ButtonVariant.Raised,
    iconRightSide: false,
    split: false,
  } as cd.IButtonInputs,
});
