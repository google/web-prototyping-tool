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
import * as mat from '../material-shared';

const internalTemplate = `
  <mat-button-toggle-group
    cdMatToggleButtonGroup
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
    [groupValue]="props?.inputs?.value"
    [variant]="props?.inputs?.variant"
    [color]="props?.inputs?.color"
    [class.cd-button-toggle-group-small]="props?.inputs?.small | dataBindingLookupPipe:dataBindingRefreshTrigger | coerceBooleanPipe"
    [disabled]="props?.inputs?.disabled"
    [multiple]="props?.inputs?.multiple"
    [vertical]="props?.inputs?.vertical"
    (buttonSelected)="onOutputChange($event,elementId,'buttonSelected')"
    (buttonUnselected)="onOutputChange($event,elementId,'buttonUnselected')"
    (change)="onOutputChange($event.value,elementId,'value')"
  >
    <div class="mat-button-toggle-group-wrapper">
      <mat-button-toggle
        *ngFor="let button of props?.inputs?.buttons;"
        [value]="button?.value"
        [disabled]="button?.disabled"
        [aria-label]="button?.tooltipLabel"
        [cdCoTooltip]="button?.tooltipLabel"
        cdCoTooltipPosition="bottom"
        [class.cd-button-has-text]="button?.name"
      >
        <ng-container *ngIf="!!button?.icon">
          <cd-icon-element
            *ngIf="button?.icon | isCloudIconPipe; else primitiveIconRef"
            [icon]="button?.icon"
          ></cd-icon-element>
          <ng-template #primitiveIconRef>
            <i class="cd-primitive-icon material-icons">{{ button?.icon }}</i>
          </ng-template>
        </ng-container>
        {{ button?.name }}
      </mat-button-toggle>
    </div>
  </mat-button-toggle-group>
`;

const simpleTemplate = `
  <mat-button-toggle-group class="button_group__test-id" value="btn1">  
    <mat-button-toggle value="btn1">Button 1</mat-button-toggle>
    <mat-button-toggle value="btn2">Button 2</mat-button-toggle>
    <mat-button-toggle value="btn3">Button 3</mat-button-toggle>
  </mat-button-toggle-group>
`;

const BUTTONS: cd.IGenericConfig[] = [
  { name: 'Button 1', value: 'btn1' },
  { name: 'Button 2', value: 'btn2' },
  { name: 'Button 3', value: 'btn3' },
];

runTemplateTests(cd.ElementEntitySubType.ToggleButtonGroup, internalTemplate, simpleTemplate);

runInstanceTests(cd.ElementEntitySubType.ToggleButtonGroup, {
  name: 'Button Group',
  elementType: cd.ElementEntitySubType.ToggleButtonGroup,
  inputs: {
    variant: cd.ButtonVariant.Basic,
    color: mat.DEFAULT_THEME_COLOR,
    buttons: BUTTONS,
    multiple: false,
    vertical: false,
    small: false,
    disabled: false,
    value: BUTTONS[0].value,
  } as cd.IToggleButtonGroupInputs,
});

/* eslint-disable max-lines */
