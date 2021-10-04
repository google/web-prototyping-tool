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
  QueryList,
  ContentChildren,
  OnInit,
  AfterViewInit,
  OnDestroy,
  OnChanges,
  SimpleChanges,
  ChangeDetectorRef,
} from '@angular/core';
import { Subscription } from 'rxjs';
import { coerceBooleanProperty } from '@angular/cdk/coercion';

import { generateIDWithLength } from 'cd-utils/guid';
import { IRadioData, ComponentSize } from 'cd-interfaces';

import { RadioComponent } from './radio/radio.component';

@Component({
  selector: 'cd-radio-group',
  templateUrl: './radio-group.component.html',
  styleUrls: ['./radio-group.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RadioGroupComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {
  private _disabled = false;
  private _subscriptions = new Subscription();

  @ContentChildren(RadioComponent) _contentRadios!: QueryList<RadioComponent>;

  @Input() label?: string;

  @Input() size: ComponentSize = ComponentSize.Medium;

  @Input() selectedValue = '';

  @Input() name = '';

  @Input() radioData: Array<IRadioData> = [];

  @Input()
  get disabled(): boolean {
    return this._disabled;
  }
  set disabled(disabled: boolean) {
    this._disabled = coerceBooleanProperty(disabled);
  }

  @Output() readonly selectedValueChange = new EventEmitter<string>();

  constructor(public cdRef: ChangeDetectorRef) {}

  ngOnInit() {
    if (!this.name) {
      this.name = `radio-group-${generateIDWithLength(5)}`;
    }
  }

  ngAfterViewInit() {
    if (!this.selectedValue) {
      this.setRadioSelected();
    }

    if (this._contentRadios) {
      for (const radio of this._contentRadios.toArray()) {
        radio.name = this.name;
        radio.size = this.size;
        radio.disabled = radio.disabled || this.disabled;
        radio.selected = this.selectedValue === radio.value;
        this._subscriptions.add(radio.selectedChange.subscribe(this.onSelectedValueChange));

        radio.cdRef.markForCheck();
      }
    }

    this.cdRef.markForCheck();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (this._contentRadios) {
      if (changes.name) {
        this.updateContentRadiosName();
      }
      if (changes.disabled) {
        this.updateContentRadiosDisabled();
      }
      if (changes.size) {
        this.updateContentRadiosSize();
      }
      if (changes.selectedValue) {
        this.updateContentRadiosSelected();
      }
      if (changes.radioData) {
        this.setRadioSelected();
        this.updateContentRadiosSelected();
      }
    }
  }

  ngOnDestroy() {
    this._subscriptions.unsubscribe();
  }

  setRadioSelected() {
    // Determine which radio should be globally selected from any
    // radioData + ng-content radios selected attributes.
    // In case of multiples (illegal!), last wins.
    const lastSelected = [
      ...this.radioData.filter((r) => r.selected),
      ...this._contentRadios.filter((r) => r.selected),
    ].pop();

    this.selectedValue = lastSelected ? lastSelected.value : '';
    this.selectedValueChange.emit(this.selectedValue);
  }

  updateContentRadiosSelected() {
    for (const radio of this._contentRadios.toArray()) {
      radio.selected = this.selectedValue === radio.value;
      radio.cdRef.markForCheck();
    }
  }

  updateContentRadiosName() {
    for (const radio of this._contentRadios.toArray()) {
      radio.name = this.name;
      radio.cdRef.markForCheck();
    }
  }

  updateContentRadiosDisabled() {
    for (const radio of this._contentRadios.toArray()) {
      radio.disabled = this.disabled;
      radio.cdRef.markForCheck();
    }
  }

  updateContentRadiosSize() {
    for (const radio of this._contentRadios.toArray()) {
      radio.size = this.size;
      radio.cdRef.markForCheck();
    }
  }

  onSelectedValueChange = (selection: string) => {
    this.selectedValue = selection;
    if (this._contentRadios) {
      this.updateContentRadiosSelected();
    }
    this.selectedValueChange.emit(this.selectedValue);
  };

  trackByFn(index: number, item: IRadioData) {
    return `${index} ${item.selected} ${item.disabled} ${item.value}`;
  }
}
