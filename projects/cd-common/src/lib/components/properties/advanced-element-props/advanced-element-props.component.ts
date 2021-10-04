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

import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { menuFromEnum } from 'cd-common/utils';
import * as cd from 'cd-interfaces';
import { CursorState, CursorStateType } from 'cd-utils/css';
import { AbstractPropContainerDirective } from '../abstract/abstract.prop.container';

@Component({
  selector: 'cd-advanced-element-props',
  templateUrl: './advanced-element-props.component.html',
  styleUrls: ['./advanced-element-props.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdvancedElementPropsComponent extends AbstractPropContainerDirective {
  public cursorMenu: cd.ISelectItem[] = menuFromEnum(CursorState);
  public CursorState = CursorState;

  @Input() zIndex: number | undefined = 1;

  @Input() cursor: CursorStateType = CursorState.Default;

  onZIndexSliderchange(value?: number) {
    const zIndex = value === undefined ? null : value;
    this.modelChange.emit({ zIndex });
  }

  onCursorChange(item: cd.SelectItemOutput) {
    const { value } = item as cd.ISelectItem;
    const cursor = value === CursorState.Default ? null : value;
    this.modelChange.emit({ cursor });
  }
}
