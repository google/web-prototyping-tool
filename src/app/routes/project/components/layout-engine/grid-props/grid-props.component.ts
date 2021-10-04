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

import { Component, ChangeDetectionStrategy, Input, EventEmitter, Output } from '@angular/core';
import { defaultGridValueForUnit } from '../layout-engine.utils';
import { coerceBooleanProperty } from '@angular/cdk/coercion';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { removeValueFromArrayAtIndex } from 'cd-utils/array';
import { IValue, Units } from 'cd-interfaces';
import { UnitTypes } from 'cd-metadata/units';

const GRID_ICONS = ['/assets/icons/grid-fr-col.svg', '/assets/icons/grid-fr.svg'];

@Component({
  selector: 'app-grid-props',
  templateUrl: './grid-props.component.html',
  styleUrls: ['./grid-props.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GridPropsComponent {
  private _data: IValue[] = [];
  public Units = UnitTypes;
  public frIcon = GRID_ICONS[0];

  @Input()
  set vertical(value: string | boolean) {
    const val = coerceBooleanProperty(value);
    this.frIcon = GRID_ICONS[+val];
  }

  @Input()
  set data(value: IValue[]) {
    this._data = value ? [...value] : [];
  }

  get data(): IValue[] {
    return this._data;
  }

  @Output() dataChange = new EventEmitter<IValue[]>();
  @Output() hover = new EventEmitter<number>();
  @Output() hoverOut = new EventEmitter<number>();

  onOver(idx: number) {
    this.hover.emit(idx);
  }

  onOut(idx: number) {
    this.hoverOut.emit(idx);
  }

  onDelete(idx: number) {
    const update = removeValueFromArrayAtIndex(idx, this.data);
    this.sendUpdate(update);
    this.onOut(idx);
  }

  onDrop(e: CdkDragDrop<IValue[]>) {
    moveItemInArray(this._data, e.previousIndex, e.currentIndex);
    this.sendUpdate(this._data);
  }

  onValueChange(value: number, idx: number) {
    this.updateItemAtIndex(idx, { value });
  }

  updateItemAtIndex(idx: number, obj: Partial<IValue>) {
    const item = this.data[idx];
    this.data[idx] = { ...item, ...obj };
    this.sendUpdate(this.data);
  }

  onUnitToggle(value: UnitTypes, idx: number) {
    const units = value as Units;
    const obj = { units };
    const val = defaultGridValueForUnit(units, this._data);
    Object.assign(obj, val);
    this.updateItemAtIndex(idx, obj);
  }

  sendUpdate(value: IValue[]) {
    this.dataChange.emit([...value]);
  }

  trackFn(idx: number) {
    return idx;
    // return `${idx}${item.value} ${item.units}`;
  }
}
