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
    <mat-form-field
      cdMatGapFix
      [appearance]="props?.inputs?.appearance"
      [color]="props?.inputs?.color"
    >
      <mat-label
        cdMatLabelFix
        [value]="labelValue"
        *ngIf="props?.inputs?.label | dataBindingLookupPipe:dataBindingRefreshTrigger | coerceStringPipe; let labelValue"
      >
        {{ labelValue }}
      </mat-label>
      <mat-select
        [disabled]="props?.inputs?.disabled | dataBindingLookupPipe:dataBindingRefreshTrigger | coerceBooleanPipe"
        [required]="props?.inputs?.required | dataBindingLookupPipe:dataBindingRefreshTrigger | coerceBooleanPipe"
        [value]="props?.inputs?.value"
        (selectionChange)="onOutputChange($event.value,elementId,'value')"
      >
        <mat-select-trigger>{{ props?.inputs | matSelectFix }}</mat-select-trigger>
        <mat-option
          *ngFor="let option of props?.inputs?.options; let i = index"
          [value]="option?.value"
          [disabled]="option?.disabled"
          [innerText]="option?.name"
        ></mat-option>
      </mat-select>
      <mat-hint align="start" *ngIf="props?.inputs?.hint">
        {{ props?.inputs?.hint | dataBindingLookupPipe:dataBindingRefreshTrigger |
        coerceStringPipe }}
      </mat-hint>
    </mat-form-field>
  </div>
`;

const simpleTemplate = `
  <mat-form-field color="primary">
    <mat-label>Label</mat-label>
    <mat-select>
      <mat-option selected="true">Option 1</mat-option>
      <mat-option>Option 2</mat-option>
      <mat-option>Option 3</mat-option>
    </mat-select>
  </mat-form-field>
`;

runTemplateTests(cd.ElementEntitySubType.Select, internalTemplate, simpleTemplate);

runInstanceTests(cd.ElementEntitySubType.Select, {
  name: 'Select',
  elementType: cd.ElementEntitySubType.Select,
  styles: {
    base: {
      style: {
        width: { value: 200, units: UnitTypes.Pixels },
      },
    },
  },
  inputs: {
    color: mat.DEFAULT_THEME_COLOR,
    label: mat.DEFAULT_LABEL_NAME,
    labelPosition: mat.DEFAULT_LABEL_POS,
    appearance: cd.MatInputAppearance.Outline,
    disabled: false,
    required: false,
    value: '1',
    options: [
      { name: 'Option 1', value: '1' },
      { name: 'Option 2', value: '2' },
      { name: 'Option 3', value: '3' },
    ],
  } as cd.ISelectInputs,
});
