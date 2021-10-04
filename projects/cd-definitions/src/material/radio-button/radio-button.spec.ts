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
import { SPACING } from './radio-button';
import * as cd from 'cd-interfaces';
import * as mat from '../material-shared';

const internalTemplate = `
  <mat-radio-group
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
    [color]="props?.inputs?.color"
    [disabled]="props?.inputs?.disabled | dataBindingLookupPipe:dataBindingRefreshTrigger | coerceBooleanPipe"
    [labelPosition]="props?.inputs?.labelPosition"
    [value]="props?.inputs?.value"
    (change)="onOutputChange($event.value,elementId,'value')"
  >
    <mat-radio-button
      *ngFor="let radio of props?.inputs?.radioButtons; let i = index"
      [value]="radio?.value"
      [disabled]="radio?.disabled"
    >
      {{ radio?.name }}
    </mat-radio-button>
  </mat-radio-group>
`;

const simpleTemplate = `
  <mat-radio-group class="radio_button__test-id" color="primary" labelPosition="after">
    <mat-radio-button>Option 1</mat-radio-button>
    <mat-radio-button>Option 2</mat-radio-button>
    <mat-radio-button>Option 3</mat-radio-button>
  </mat-radio-group>
`;

runTemplateTests(cd.ElementEntitySubType.RadioButtonGroup, internalTemplate, simpleTemplate);

runInstanceTests(cd.ElementEntitySubType.RadioButtonGroup, {
  name: 'Radio Button',
  elementType: cd.ElementEntitySubType.RadioButtonGroup,
  styles: {
    base: {
      style: {
        padding: { top: SPACING, left: SPACING, bottom: SPACING, right: SPACING },
        gridRowGap: SPACING,
        display: cd.Display.Grid,
        gridAutoFlow: cd.GridAutoFlow.Row,
        gridAutoRows: cd.GridAutoMode.MinContent,
        alignContent: cd.GridAlign.Start,
        alignItems: cd.GridAlign.Start,
        gridColumnGap: 0,
      },
    },
  },
  inputs: {
    color: mat.DEFAULT_THEME_COLOR,
    disabled: false,
    required: false,
    labelPosition: mat.DEFAULT_LABEL_POS,
    radioButtons: [
      { name: 'Option 1', value: '1' },
      { name: 'Option 2', value: '2' },
      { name: 'Option 3', value: '3' },
    ],
  } as cd.IRadioButtonGroupInputs,
});
