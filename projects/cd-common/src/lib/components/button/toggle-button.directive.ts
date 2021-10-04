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

import { Directive, Input, HostBinding, ElementRef, OnChanges, SimpleChanges } from '@angular/core';
import { coerceBooleanProperty } from '@angular/cdk/coercion';
import { ButtonComponent } from './button.component';
import { IToggleButton } from 'cd-interfaces';

@Directive({
  selector: '[cdToggleButton]',
})
export class ToggleButtonDirective implements OnChanges {
  private _selected = false;

  @Input() value?: any;
  @Input() unselectedIconName?: string;
  @Input() selectedIconName?: string;
  @Input() states: IToggleButton[] = [];

  @Input()
  set selected(value: string | boolean) {
    const val = coerceBooleanProperty(value);
    if (this._selected === val) return;
    this._selected = val;
  }

  @HostBinding('class.cd-button')
  get btn() {
    return !this.selectedState;
  }

  @HostBinding('class.cd-unelevated-button')
  get selectedState() {
    return !this.multiIcon && this._selected;
  }

  @HostBinding('class.toggle-selected')
  get toggleSelected() {
    return this._selected;
  }

  @HostBinding('class.icon-button')
  get iconButton() {
    return !this._host.hasContent;
  }

  constructor(private _host: ButtonComponent, private _elemRef: ElementRef) {}

  get multiIcon(): boolean {
    return this.selectedIconName !== undefined;
  }

  get classList() {
    return this._elemRef.nativeElement.classList;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.selected || changes.selectedIconName || changes.unselectedIconName) {
      this.updateIcon(this._selected);
    }
  }

  triggerFocus() {
    this._elemRef.nativeElement.focus();
  }

  set hostIcon(iconName: string) {
    if (this._host.iconName === iconName) return;
    this._host.iconName = iconName;
  }

  updateIcon(selected: boolean) {
    const { selectedIconName, unselectedIconName } = this;
    if (selectedIconName && unselectedIconName) {
      this.hostIcon = selected ? selectedIconName : unselectedIconName;
    }
  }
}
