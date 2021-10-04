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

import {
  Component,
  ChangeDetectionStrategy,
  Input,
  Output,
  EventEmitter,
  ViewChildren,
  QueryList,
  ChangeDetectorRef,
} from '@angular/core';
import { removeValueFromArrayAtIndex } from 'cd-utils/array';
import { createKeyValue } from './key-value.utils';
import { KeyValueRowComponent } from './key-value-row/key-value-row.component';
import { deepCopy } from 'cd-utils/object';
import { parseCss } from 'cd-utils/css';
import { InputValidationMode } from 'cd-common/consts';
import { validCSSForKeyValue } from 'cd-common/utils';
import * as cd from 'cd-interfaces';

@Component({
  selector: 'cd-key-value-editor',
  templateUrl: './key-value-editor.component.html',
  styleUrls: ['./key-value-editor.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KeyValueEditorNextComponent {
  @Input() autoAddWhenEmpty: cd.IKeyValue[] = [];
  @Input() valueMenuDataMap: cd.IStringMap<string[]> = {};
  @Input() data: ReadonlyArray<cd.IKeyValue> = [];
  @Input() removable = false;
  @Input() designSystem?: cd.IDesignSystem;
  @Input() keyMenuData: string[] = [];
  @Input() groupTitle = '';
  @Input() inputMode = InputValidationMode.NONE;

  @Output() dataChange = new EventEmitter<cd.IKeyValue[]>();
  @Output() deleteGroup = new EventEmitter<void>();

  @ViewChildren('rowRef') rows?: QueryList<KeyValueRowComponent>;

  constructor(private _cdRef: ChangeDetectorRef) {}

  onDeleteGroup() {
    this.deleteGroup.emit();
  }

  getNewLineData() {
    const autoKey = this.autoAddWhenEmpty || [];
    return this.data?.length ? this.getCloneOfData() : deepCopy(autoKey);
  }

  onAddLine() {
    const update = this.getNewLineData();
    const empty = createKeyValue();
    this.emitChange([...update, empty]);
    this.focusOnLastItem();
  }

  onDelete(idx: number) {
    const clone = this.getCloneOfData();
    const update = removeValueFromArrayAtIndex(idx, clone);
    this.emitChange(update);
  }

  onPaste(text: string, i: number) {
    if (!text || this.inputMode !== InputValidationMode.CSS) return;
    const styles = parseCss(text);
    const list = Object.entries(styles)
      .map(([name, value]) => ({ name, value }))
      .filter((item) => validCSSForKeyValue(item));
    if (!list.length) return;
    const update = this.getCloneOfData();
    update.splice(i, 1, ...list);
    this.emitChange(update);
  }

  getCloneOfData(): cd.IKeyValue[] {
    const clone = this.data ? deepCopy(this.data) : [];
    return clone as cd.IKeyValue[];
  }

  onKeyValueChange(item: cd.IKeyValue, idx: number) {
    const clone = this.getCloneOfData();
    clone[idx] = { ...item };
    this.emitChange(clone);
  }

  emitChange(change: cd.IKeyValue[]) {
    this.data = change;
    this.dataChange.emit(change);
  }

  trackByFn(_idx: number, item: cd.IKeyValue) {
    // Force update when validation changes, but only when an item.value exists for tabbing to the next field
    const tracked = !!item.value && item.invalid === true;
    return `${_idx}${tracked}`;
  }

  focusOnLastItem() {
    this._cdRef.detectChanges();
    const lastIdx = this.data.length - 1;
    this.focusOnNextInput(lastIdx);
  }

  focusOnNextInput(i: number) {
    const rows = this.rows?.toArray();
    rows?.[i].focusOnKey();
  }

  onNextLine(isLast: boolean, index: number) {
    if (isLast) {
      this.onAddLine();
    } else if (!isLast) {
      this.focusOnNextInput(index + 1);
    }
  }
}
