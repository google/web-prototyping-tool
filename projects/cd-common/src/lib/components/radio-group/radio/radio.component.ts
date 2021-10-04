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
  EventEmitter,
  Output,
  ChangeDetectorRef,
  HostBinding,
} from '@angular/core';
import { coerceBooleanProperty } from '@angular/cdk/coercion';

import { ComponentSize } from 'cd-interfaces';

@Component({
  selector: 'cd-radio',
  templateUrl: './radio.component.html',
  styleUrls: ['./radio.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RadioComponent {
  private _selected = false;
  private _disabled = false;

  @Input() size: ComponentSize = ComponentSize.Medium;

  @HostBinding('class.small')
  get getSmallRadio() {
    return this.size === ComponentSize.Small;
  }

  @HostBinding('class.large')
  get getLargeRadio() {
    return this.size === ComponentSize.Large;
  }

  @Input() name = '';

  @Input() value = '';

  @Input()
  get selected(): boolean {
    return this._selected;
  }
  set selected(selected: boolean) {
    this._selected = coerceBooleanProperty(selected);
  }

  @Input()
  get disabled(): boolean {
    return this._disabled;
  }
  set disabled(disabled: boolean) {
    this._disabled = coerceBooleanProperty(disabled);
  }

  @Output() selectedChange = new EventEmitter<string>();

  // Provides a public reference to the ChangeDetectorRef so the RadioGroupComponent
  // parent can trigger change detection for radios used as ViewChildren
  constructor(public cdRef: ChangeDetectorRef) {}

  onRadioSelected() {
    if (!this.selected) {
      this.selected = true;

      this.selectedChange.emit(this.value);
    }
  }
}
