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
  ContentChildren,
  QueryList,
  Input,
  Output,
  EventEmitter,
  HostBinding,
  HostListener,
  AfterContentInit,
  ChangeDetectorRef,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { ToggleButtonDirective } from '../button/toggle-button.directive';
import { coerceBooleanProperty } from '@angular/cdk/coercion';
import { closestChildIndexForEvent } from 'cd-common/utils';

@Component({
  selector: 'cd-toggle-button-group',
  templateUrl: './toggle-button-group.component.html',
  styleUrls: ['./toggle-button-group.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToggleButtonGroupComponent implements AfterContentInit, OnChanges {
  @Input()
  set columns(length: number) {
    this.columnStyles = new Array(length).fill('1fr').join(' ');
  }

  @Input()
  set showBackground(value: boolean) {
    this._showBackground = coerceBooleanProperty(value);
  }

  @Input()
  set separatedButtons(value: boolean) {
    this._separatedButtons = coerceBooleanProperty(value);
  }

  @Input() childValues: string[] = [];
  @Input() value: string = '';

  @Output() valueChange = new EventEmitter<string>();

  @HostBinding('class.show-bkd') _showBackground = false;
  @HostBinding('class.separated-buttons') _separatedButtons = false;
  @HostBinding('style.gridTemplateColumns') columnStyles = '';

  @ContentChildren(ToggleButtonDirective) _contentChildren!: QueryList<ToggleButtonDirective>;

  constructor(private _cdRef: ChangeDetectorRef) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.value || changes.childValues) {
      this.updateButtons();
    }
  }

  get toggleButtons(): ToggleButtonDirective[] {
    return this._contentChildren?.toArray() || [];
  }

  triggerComponentFocus() {
    this.toggleButtons[0].triggerFocus();
  }

  /** Child buttons have been added */
  ngAfterContentInit(): void {
    this.updateButtons();
  }

  @HostListener('click', ['$event'])
  handleButtonClick = (e: MouseEvent) => {
    const targetIndex = closestChildIndexForEvent(e, 'button');
    if (targetIndex === -1) return;
    const targetButton = this.toggleButtons[targetIndex];
    this.valueChange.emit(targetButton.value);
  };

  updateButtons() {
    const { value, childValues, toggleButtons } = this;
    if (!toggleButtons.length) return;
    let didSelect = false;

    for (let i = 0; i < toggleButtons.length; i++) {
      const button = toggleButtons[i];
      const btnValue = childValues[i] ?? button.value;
      const selected = btnValue === value;
      button.selected = selected;
      if (selected) didSelect = true;
    }

    if (!didSelect) {
      const [first] = toggleButtons;
      first.selected = true;
    }
    this._cdRef.markForCheck();
  }
}
