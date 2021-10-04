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
  <mat-chip-list
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
    >
    <mat-chip
      matNativeControl
      *ngFor="let chip of props?.inputs?.chips;"
      [color]="props?.inputs?.color"
      [disabled]="chip?.disabled"
      [selected]="chip?.selected"
      (click)="onOutputChange(chip.value,elementId,'chips',false)"
    >
      {{ chip?.name }}
    </mat-chip>
  </mat-chip-list>
`;

const simpleTemplate = `
  <mat-chip-list class="chips_list__test-id">
    <mat-chip color="primary" selected="true"> Chip 1 </mat-chip>
    <mat-chip color="primary">Chip 2</mat-chip>
    <mat-chip color="primary">Chip 3</mat-chip>
  </mat-chip-list>
`;

runTemplateTests(cd.ElementEntitySubType.ChipList, internalTemplate, simpleTemplate);

runInstanceTests(cd.ElementEntitySubType.ChipList, {
  name: 'Chips List',
  elementType: cd.ElementEntitySubType.ChipList,
  styles: {
    base: {
      style: {
        display: cd.Display.Block,
        position: cd.PositionType.Relative,
      },
    },
  },
  inputs: {
    color: mat.DEFAULT_THEME_COLOR,
    chips: [
      { name: 'Chip 1', value: '1', selected: true },
      { name: 'Chip 2', value: '2' },
      { name: 'Chip 3', value: '3' },
    ],
  } as cd.IChipListInputs,
});
