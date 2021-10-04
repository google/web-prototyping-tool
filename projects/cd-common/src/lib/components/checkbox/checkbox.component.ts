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

import { Component, Input, ChangeDetectionStrategy, HostBinding, ViewChild } from '@angular/core';
import { coerceBooleanProperty } from '@angular/cdk/coercion';
import { AbstractCheckboxDirective } from './abstract/abstract.checkbox';
import { CheckboxInputComponent } from './checkbox-input/checkbox.input.component';
import { ComponentSize, IRichTooltip } from 'cd-interfaces';
import { RichTooltipDirective } from '../../directives/tooltip/rich-tooltip.directive';

const DEFAULT_CHECKBOX = ['check_box_outline_blank', 'check_box'];
const ROUND_CHECKBOX = ['radio_button_unchecked', 'check_circle'];

@Component({
  selector: 'cd-checkbox',
  templateUrl: './checkbox.component.html',
  styleUrls: ['./checkbox.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckboxComponent extends AbstractCheckboxDirective {
  private _rounded = false;
  private _large = false;
  private _hideRipple = false;
  private _dragApply = false;

  @Input() tabindex = 0;
  @Input() label?: string;
  @Input() helpText?: IRichTooltip;

  @Input()
  get dragApply() {
    return this._dragApply;
  }
  set dragApply(value) {
    this._dragApply = coerceBooleanProperty(value);
  }

  @Input()
  set rounded(value) {
    this._rounded = coerceBooleanProperty(value);
  }
  get rounded() {
    return this._rounded;
  }

  @Input()
  @HostBinding('class.large')
  set large(large: boolean) {
    this._large = coerceBooleanProperty(large);
  }
  get large(): boolean {
    return this._large;
  }

  get iconSize() {
    return this._large ? ComponentSize.Large : ComponentSize.Medium;
  }

  @Input()
  set hideRipple(value) {
    this._hideRipple = coerceBooleanProperty(value);
  }
  get hideRipple() {
    return this._hideRipple;
  }

  @HostBinding('class.has-label')
  get hasLabel(): boolean {
    return this.label !== undefined;
  }

  get iconName(): string {
    const { _checked, rounded } = this;
    const style = rounded ? ROUND_CHECKBOX : DEFAULT_CHECKBOX;
    const index = Number(_checked);
    return style[index];
  }

  @ViewChild(CheckboxInputComponent) checkboxRef!: CheckboxInputComponent;

  @ViewChild(RichTooltipDirective, { read: RichTooltipDirective })
  _richTooltip?: RichTooltipDirective;

  get richTooltipActive(): boolean | undefined {
    return this._richTooltip?.active;
  }

  get richTooltipIcon(): string {
    return this.richTooltipActive ? 'help' : 'help_outline';
  }

  triggerComponentFocus() {
    this.checkboxRef?.focusCheckbox();
  }

  onShowRichTooltip(e: MouseEvent) {
    const element = e.currentTarget as HTMLElement;
    const bounds = element.getBoundingClientRect();
    this._richTooltip?.show(bounds);
  }
}
