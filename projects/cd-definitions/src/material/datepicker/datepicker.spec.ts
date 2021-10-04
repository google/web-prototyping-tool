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
import { getTodayAsISOString } from 'cd-common/utils';
import { UnitTypes } from 'cd-metadata/units';
import * as cd from 'cd-interfaces';
import * as mat from '../material-shared';

const TEST_DATE = 'Tue Oct 29 2019 17:00:00 GMT-0700 (Pacific Daylight Time)';

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
      <input
        matInput
        [matDatepicker]="picker"
        [disabled]="props?.inputs?.disabled | dataBindingLookupPipe:dataBindingRefreshTrigger | coerceBooleanPipe"
        [required]="props?.inputs?.required | dataBindingLookupPipe:dataBindingRefreshTrigger | coerceBooleanPipe"
        [value]="props?.inputs?.value | matDateFix"
        (dateInput)="onOutputChange($event.value,elementId,'value')"
      />
      <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
      <mat-datepicker #picker></mat-datepicker>
      <mat-hint align="start" *ngIf="props?.inputs?.hint">
        {{ props?.inputs?.hint | dataBindingLookupPipe:dataBindingRefreshTrigger |
        coerceStringPipe }}
      </mat-hint>
    </mat-form-field>
  </div>
`;

const simpleTemplate = `
  <mat-form-field class="date_picker__test-id">
  <mat-label>Date</mat-label>
    <input
      [matDatepicker]="picker"
      matInput
      value="${TEST_DATE}"
    />
    <mat-datepicker-toggle [for]="picker" matSuffix></mat-datepicker-toggle>
    <mat-datepicker #picker></mat-datepicker>
  </mat-form-field>
`;

const exportInputs = { value: TEST_DATE };
runTemplateTests(
  cd.ElementEntitySubType.Datepicker,
  internalTemplate,
  simpleTemplate,
  exportInputs
);

runInstanceTests(cd.ElementEntitySubType.Datepicker, {
  name: 'Date Picker',
  elementType: cd.ElementEntitySubType.Datepicker,
  styles: {
    base: {
      style: {
        width: { value: mat.DEFAULT_FORM_FIELD_WIDTH, units: UnitTypes.Pixels },
      },
    },
  },
  inputs: {
    color: mat.DEFAULT_THEME_COLOR,
    disabled: false,
    required: false,
    hint: '',
    label: 'Date',
    value: getTodayAsISOString(),
    appearance: cd.MatInputAppearance.Outline,
  } as cd.IDatePickerInputs,
});
