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
import * as consts from 'cd-common/consts';
import * as mat from '../material-shared';
import { DEFAULT_INPUT_TYPE } from './input';

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
    [ngSwitch]="props?.inputs?.type"
  >
    <mat-form-field
      cdMatGapFix
      *ngSwitchDefault
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
      <mat-chip-list
        #chipList
        cdMatInputChips
        [disabled]="props?.inputs?.disabled | dataBindingLookupPipe:dataBindingRefreshTrigger | coerceBooleanPipe"
        [required]="props?.inputs?.required | dataBindingLookupPipe:dataBindingRefreshTrigger | coerceBooleanPipe"
        (valueChange)="onOutputChange($event,elementId,'value')"
        *ngIf="props?.inputs?.useChips"
      >
        <mat-chip
          cdMatInputChip
          [value]="chip"
          [removable]="true"
          [selectable]="false"
          [index]="i"
          [color]="props?.inputs?.color"
          *ngFor="let chip of props?.inputs?.value | dataBindingLookupPipe:dataBindingRefreshTrigger | coerceStringPipe | commaStringToArrayPipe; let i = index"
        >
          {{ chip }}
          <mat-icon matChipRemove>cancel</mat-icon>
        </mat-chip>
        <input
          matInput
          autocomplete="off"
          [disabled]="props?.inputs?.disabled | dataBindingLookupPipe:dataBindingRefreshTrigger | coerceBooleanPipe"
          [required]="props?.inputs?.required | dataBindingLookupPipe:dataBindingRefreshTrigger | coerceBooleanPipe"
          [placeholder]="props?.inputs?.placeholder | dataBindingLookupPipe:dataBindingRefreshTrigger | coerceStringPipe"
          [type]="props?.inputs?.inputType | dataBindingLookupPipe:dataBindingRefreshTrigger | coerceStringPipe"
          (focus)="onOutputChange($event,elementId,'focus',false)"
          (blur)="onOutputChange($event,elementId,'blur',false)"
          [matChipInputFor]="chipList"
        />
      </mat-chip-list>
      <input
        matInput
        autocomplete="off"
        [disabled]="props?.inputs?.disabled | dataBindingLookupPipe:dataBindingRefreshTrigger | coerceBooleanPipe"
        [required]="props?.inputs?.required | dataBindingLookupPipe:dataBindingRefreshTrigger | coerceBooleanPipe"
        [placeholder]="props?.inputs?.placeholder | dataBindingLookupPipe:dataBindingRefreshTrigger | coerceStringPipe"
        [type]="props?.inputs?.inputType | dataBindingLookupPipe:dataBindingRefreshTrigger | coerceStringPipe"
        (focus)="onOutputChange($event,elementId,'focus',false)"
        (blur)="onOutputChange($event,elementId,'blur',false)"
        [value]="props?.inputs?.value | dataBindingLookupPipe:dataBindingRefreshTrigger | coerceStringPipe"
        (input)="onOutputChange($event.target?.value,elementId,'value')"
        *ngIf="!props?.inputs?.useChips"
      />
      <cd-icon-element
        matSuffix
        *ngIf="props?.inputs?.icon"
        [icon]="props?.inputs?.icon"
        [cdCoTooltip]="props?.inputs?.iconTooltipLabel"
      ></cd-icon-element>
      <mat-hint align="start" *ngIf="props?.inputs?.hint">
        {{ props?.inputs?.hint | dataBindingLookupPipe:dataBindingRefreshTrigger |
        coerceStringPipe }}
      </mat-hint>
    </mat-form-field>
    <mat-form-field
      cdMatGapFix
      [appearance]="props?.inputs?.appearance"
      [color]="props?.inputs?.color"
      *ngSwitchCase="'textarea'"
    >
      <mat-label
        cdMatLabelFix
        [value]="labelValue"
        *ngIf="props?.inputs?.label | dataBindingLookupPipe:dataBindingRefreshTrigger | coerceStringPipe; let labelValue"
      >
        {{ labelValue }}
      </mat-label>
      <textarea
        matInput
        cdkTextareaAutosize
        [cdkAutosizeMinRows]="props?.inputs?.rowMin | dataBindingLookupPipe:dataBindingRefreshTrigger"
        [cdkAutosizeMaxRows]="props?.inputs?.rowMax | dataBindingLookupPipe:dataBindingRefreshTrigger"
        autocomplete="off"
        [disabled]="props?.inputs?.disabled | dataBindingLookupPipe:dataBindingRefreshTrigger | coerceBooleanPipe"
        [required]="props?.inputs?.required | dataBindingLookupPipe:dataBindingRefreshTrigger | coerceBooleanPipe"
        [placeholder]="props?.inputs?.placeholder | dataBindingLookupPipe:dataBindingRefreshTrigger | coerceStringPipe"
        [type]="props?.inputs?.inputType | dataBindingLookupPipe:dataBindingRefreshTrigger | coerceStringPipe"
        (focus)="onOutputChange($event,elementId,'focus',false)"
        (blur)="onOutputChange($event,elementId,'blur',false)"
        [value]="props?.inputs?.value | dataBindingLookupPipe:dataBindingRefreshTrigger | coerceStringPipe"
        (input)="onOutputChange($event.target?.value,elementId,'value')"
      ></textarea>
      <mat-hint align="start" *ngIf="props?.inputs?.hint">
        {{ props?.inputs?.hint | dataBindingLookupPipe:dataBindingRefreshTrigger |
        coerceStringPipe }}
      </mat-hint>
    </mat-form-field>
  </div>
`;

const simpleTemplate = `
  <mat-form-field>
    <mat-label>Label</mat-label>
    <input matInput type="text" />
  </mat-form-field>
`;

runTemplateTests(cd.ElementEntitySubType.Input, internalTemplate, simpleTemplate);

runInstanceTests(cd.ElementEntitySubType.Input, {
  name: 'Material Input',
  elementType: cd.ElementEntitySubType.Input,
  styles: {
    base: {
      style: {
        width: { value: mat.DEFAULT_FORM_FIELD_WIDTH, units: UnitTypes.Pixels },
      },
    },
  },
  inputs: {
    type: consts.INPUT_TAG,
    inputType: DEFAULT_INPUT_TYPE,
    color: mat.DEFAULT_THEME_COLOR,
    disabled: false,
    required: false,
    placeholder: '',
    hint: '',
    value: '',
    label: mat.DEFAULT_LABEL_NAME,
    appearance: cd.MatInputAppearance.Outline,
    rowMin: 0,
    rowMax: 0,
    useChips: false,
  } as cd.IInputElementInputs,
});
