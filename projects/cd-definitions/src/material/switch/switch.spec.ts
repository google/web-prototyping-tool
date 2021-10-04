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
  >
    <mat-slide-toggle
      [class.mat-has-hint]="props?.inputs?.hint"
      [color]="props?.inputs?.color"
      [labelPosition]="props?.inputs?.labelPosition"
      [checked]="props?.inputs?.checked | dataBindingLookupPipe:dataBindingRefreshTrigger | coerceBooleanPipe"
      [disabled]="props?.inputs?.disabled | dataBindingLookupPipe:dataBindingRefreshTrigger | coerceBooleanPipe"
      (change)="onOutputChange($event.checked,elementId,'checked')"
    >
      <mat-label
        cdMatLabelFix
        [value]="labelValue"
        *ngIf="props?.inputs?.label | dataBindingLookupPipe:dataBindingRefreshTrigger | coerceStringPipe; let labelValue"
      >
        {{ labelValue }}
      </mat-label>
      <mat-hint align="start" *ngIf="props?.inputs?.hint">
        {{ props?.inputs?.hint | dataBindingLookupPipe:dataBindingRefreshTrigger |
        coerceStringPipe }}
      </mat-hint>
    </mat-slide-toggle>
  </div>
`;

const simpleTemplate = `
  <mat-slide-toggle class="switch__test-id mat-has-hint" color="primary" labelPosition="after" checked disabled>
    <mat-label>My Label</mat-label>
    <mat-hint class="switch__test-id" align="start">My hint</mat-hint>
  </mat-slide-toggle>
`;

runTemplateTests(cd.ElementEntitySubType.Switch, internalTemplate, simpleTemplate, {
  disabled: true,
  checked: true,
  label: 'My Label',
  hint: 'My hint',
});

runInstanceTests(cd.ElementEntitySubType.Switch, {
  name: 'Switch',
  elementType: cd.ElementEntitySubType.Switch,
  inputs: {
    color: mat.DEFAULT_THEME_COLOR,
    label: mat.DEFAULT_LABEL_NAME,
    labelPosition: mat.DEFAULT_LABEL_POS,
    disabled: false,
    checked: false,
  } as cd.ISwitchInputs,
});
