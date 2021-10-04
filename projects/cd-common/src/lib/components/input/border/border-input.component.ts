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
  ElementRef,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
} from '@angular/core';
import { InputCollectionDirective } from '../abstract/abstract.input.collection';
import { IBorderStyle, LineStyle, ISelectItem, IDesignSystem } from 'cd-interfaces';

@Component({
  selector: 'cd-border-input',
  templateUrl: './border-input.component.html',
  styleUrls: ['./border-input.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BorderInputComponent extends InputCollectionDirective {
  public borderStyles: ISelectItem[] = [
    { title: 'solid', value: 'solid' },
    { title: 'dashed', value: 'dashed' },
    { title: 'dotted', value: 'dotted' },
  ];

  @Input() designSystem?: IDesignSystem;
  @Input() colorData: ISelectItem[] = [];
  @Input() value!: IBorderStyle;

  @Output() valueChange = new EventEmitter<IBorderStyle>();

  constructor(protected _elemRef: ElementRef) {
    super(_elemRef);
  }

  writeValue(value: Partial<IBorderStyle>) {
    const update = { ...this.value, ...value };
    this.valueChange.emit(update);
  }

  onLineStyleChange(style: ISelectItem): void {
    const updatedValue = { lineStyle: style.value as LineStyle };
    this.writeValue(updatedValue);
  }

  onLineWidthChange(value: number): void {
    const updatedValue = { borderWidth: Number(value) };
    this.writeValue(updatedValue);
  }

  onColorMenuSelect(item: ISelectItem) {
    const { id, action, value } = item;
    if (action) {
      this.action.emit(item);
    } else {
      const updatedValue = { borderColor: { id, value } };
      this.writeValue(updatedValue);
    }
  }

  onColorPickerSelect(value: any) {
    const updatedValue = { borderColor: { id: null, value } };
    this.writeValue(updatedValue);
  }
}
