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
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  HostBinding,
} from '@angular/core';
import { IDesignSystem, ISelectItem, IValue } from 'cd-interfaces';
import { AbstractPropListDirective } from '../abstract/abstract.proplist';
import { isString } from 'cd-utils/string';
import { coerceBooleanProperty } from '@angular/cdk/coercion';
@Component({
  selector: 'cd-background-props',
  templateUrl: './background-props.component.html',
  styleUrls: ['./background-props.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BackgroundPropsComponent extends AbstractPropListDirective {
  private _data: IValue[] = [];

  @HostBinding('class.no-padding') noPadding = false;

  @Input() designSystem!: IDesignSystem;

  @Input()
  set noBottomPadding(value: boolean) {
    this.noPadding = coerceBooleanProperty(value);
  }

  get data(): IValue[] {
    return this._data;
  }
  @Input() set data(value: IValue[]) {
    const val = value || [];
    this._data = isString(val) ? [{ value: val }] : [...val];
  }

  @Output() change = new EventEmitter<IValue[]>();

  onSelect(item: ISelectItem, i: number) {
    if (item.action) {
      this.action.emit(item);
    } else {
      const { id, value } = item;
      this.data[i] = { id, value };
      this.sendUpdate();
    }
  }

  onChange(value: any, i: number): void {
    this.data[i] = { value };
    this.sendUpdate();
  }

  sendUpdate() {
    this.change.emit([...this.data]);
  }
}
