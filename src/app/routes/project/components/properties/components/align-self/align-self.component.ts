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

import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter } from '@angular/core';
import { LayoutAlignment, ALIGNMENT_TO_GRID_MAP } from 'cd-common/consts';
import * as cd from 'cd-interfaces';

export const layoutAlignmentFromModel = (
  model: cd.IStyleDeclaration
): LayoutAlignment | undefined => {
  const { alignSelf, justifySelf } = model;
  const entries = Object.entries(ALIGNMENT_TO_GRID_MAP);
  for (const item of entries) {
    const [key, value] = item;
    const [align, justify] = value;
    if (align === alignSelf && justify === justifySelf) {
      return key as LayoutAlignment;
    }
  }
  return;
};

@Component({
  selector: 'app-align-self-prop',
  templateUrl: './align-self.component.html',
  styleUrls: ['./align-self.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AlignSelfComponent {
  public value?: LayoutAlignment;
  public menu: cd.ISelectItem[] = Object.values(LayoutAlignment).map((value) => {
    return { title: value, value };
  });

  @Input()
  set model(model: cd.IStyleDeclaration) {
    const value = layoutAlignmentFromModel(model);
    if (!value || value !== this.value) {
      this.value = value;
    }
  }

  @Output() modelChange = new EventEmitter<cd.IStyleDeclaration>();

  onMenuChange(item: cd.SelectItemOutput) {
    const align = (item as cd.ISelectItem).value as LayoutAlignment;
    if (align) {
      const [alignSelf, justifySelf] = ALIGNMENT_TO_GRID_MAP[align];
      this.modelChange.emit({ alignSelf, justifySelf });
    } else {
      this.modelChange.emit({ alignSelf: null, justifySelf: null });
    }
  }
}
