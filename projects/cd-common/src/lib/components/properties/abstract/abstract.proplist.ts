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

import { Input, Output, EventEmitter, Directive } from '@angular/core';
import { ISelectItem } from 'cd-interfaces';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';

@Directive()
export abstract class AbstractPropListDirective {
  @Input() declare abstract data: any[];
  @Input() colorMenuData: ReadonlyArray<ISelectItem> = [];
  @Output() change = new EventEmitter<any[]>();
  @Output() action = new EventEmitter<ISelectItem>();

  trackFn(idx: number) {
    return `item-${idx}`;
  }

  isLastElement(index: number, list: any[]): boolean {
    return index === list.length - 1;
  }

  onChange(item: any, i: number): void {
    this.data[i] = { ...item };
    this.change.emit(this.data);
  }

  onDelete(index: number) {
    this.data.splice(index, 1);
    this.change.emit(this.data);
  }

  drop(event: CdkDragDrop<string[]>) {
    moveItemInArray(this.data, event.previousIndex, event.currentIndex);
  }

  onAction(evt: ISelectItem) {
    this.action.emit(evt);
  }
}
