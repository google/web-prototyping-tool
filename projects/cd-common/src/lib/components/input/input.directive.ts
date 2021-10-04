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
  Directive,
  Input,
  ElementRef,
  EventEmitter,
  OnDestroy,
  ComponentRef,
  Output,
} from '@angular/core';
import { OverlayService } from '../overlay/overlay.service';
import { SelectComponent } from '../select/select.component';
import { KEYS, keyCheck } from 'cd-utils/keycodes';
import { Subscription, fromEvent, merge } from 'rxjs';
import { filterMenu, assignMenuIndex } from './input.utils';
import { coerceBooleanProperty } from '@angular/cdk/coercion';
import * as cd from 'cd-interfaces';

const OVERLAY_CONFIG = {
  disableAutoFocus: true,
  clipParentRect: true,
  matchWidth: true,
};

@Directive({
  selector: 'input[cdInputAutoComplete]',
  providers: [OverlayService],
})
export class InputAutoCompleteDirective implements OnDestroy {
  private _menuData: cd.ISelectItem[] = [];
  private _useParentBoundsForMenu = false;
  private _baseSubscription = Subscription.EMPTY;
  private _whenFocusedSubscription = Subscription.EMPTY;
  private _componentRef?: ComponentRef<SelectComponent>;
  private _menuSubscription = Subscription.EMPTY;
  private _focused = false;
  private _menuActive = false;

  @Input() selectedIndex = -1;
  @Input()
  get data(): cd.ISelectItem[] {
    return this._menuData;
  }
  set data(value: cd.ISelectItem[]) {
    this._menuData = assignMenuIndex(value);
    if (!value.length) return;
    this.setupSubscription();
    this.createMenuIfActiveElement();
  }

  @Input()
  set useParentBoundsForMenu(value: boolean | string) {
    this._useParentBoundsForMenu = coerceBooleanProperty(value);
  }
  get useParentBoundsForMenu() {
    return this._useParentBoundsForMenu;
  }

  @Output() selectItem = new EventEmitter<cd.ISelectItem>();
  @Output() focused = new EventEmitter<boolean>();

  constructor(private _elemRef: ElementRef, private _overlayService: OverlayService) {}

  get inputElement(): HTMLInputElement {
    return this._elemRef.nativeElement;
  }

  get bounds() {
    return this.inputElement.getBoundingClientRect();
  }

  get parentBounds() {
    return this.inputElement.parentElement?.getBoundingClientRect();
  }

  createMenuIfActiveElement() {
    if (document.activeElement !== this.inputElement) return;
    this.onInputFocus();
  }

  setupSubscription() {
    if (!this.data.length) return;
    this._baseSubscription.unsubscribe();
    const focus$ = fromEvent<FocusEvent>(this.inputElement, 'focus');
    this._baseSubscription = focus$.subscribe(this.onInputFocus);
  }

  onBlur = () => {
    if (!this._focused) return;
    this._focused = false;
    this.destroyMenu();
    this._whenFocusedSubscription.unsubscribe();
  };

  onInputFocus = () => {
    if (this._focused) return;
    this._focused = true;
    const keydown$ = fromEvent<KeyboardEvent>(this.inputElement, 'keydown');
    const blur$ = fromEvent<FocusEvent>(this.inputElement, 'blur');
    const click$ = fromEvent<MouseEvent>(this.inputElement, 'click');
    this._whenFocusedSubscription = new Subscription();
    this._whenFocusedSubscription.add(keydown$.subscribe(this.onKeydown));
    this._whenFocusedSubscription.add(click$.subscribe(this.createMenu));
    this._whenFocusedSubscription.add(blur$.subscribe(this.onBlur));
    this.createMenu();
  };

  createMenu = () => {
    if (!this.data.length) return;
    if (this._menuActive) return;
    this._menuActive = true;
    const parentRect = this.useParentBoundsForMenu ? this.parentBounds : this.bounds;
    const config = { parentRect, ...OVERLAY_CONFIG };
    this._menuSubscription = new Subscription();
    const componentRef = this._overlayService.attachComponent(SelectComponent, config);
    componentRef.instance.width = parentRect?.width;
    componentRef.instance.autoSelectMenuItem = false;
    componentRef.instance.data = this.data;
    componentRef.instance.selectedIndex = this.selectedIndex;

    this._menuSubscription.add(componentRef.instance.selected.subscribe(this.onSelect));
    this._menuSubscription.add(fromEvent(this.inputElement, 'input').subscribe(this.onInputUpdate));

    const close$ = merge(componentRef.instance.close, this._overlayService.closed);
    this._menuSubscription.add(close$.subscribe(this.destroyMenu));
    this._menuSubscription.add(componentRef.onDestroy(this.destroyMenu));

    this._componentRef = componentRef;
  };

  set selectData(data: cd.ISelectItem[]) {
    if (!this._componentRef) return;
    this._componentRef.instance.data = data;
  }

  resetMenuData() {
    if (this._componentRef?.instance.data.length !== 0) return;
    this._componentRef.instance.data = this.data;
  }

  onKeydown = ({ key }: KeyboardEvent) => {
    if (keyCheck(key, KEYS.Tab, KEYS.Escape)) this.destroyMenu();
    if (key === KEYS.ArrowDown && this.inputElement.type !== cd.InputType.Number) {
      if (!this._menuActive || !this._componentRef) return this.createMenu();
      this.resetMenuData();
    }
  };

  get currentValue() {
    return this.inputElement.value;
  }

  set filteredData(filter: string) {
    if (!this._componentRef) return;
    this._componentRef.instance.data = filterMenu(filter, this.data);
  }

  onInputUpdate = () => {
    this.filteredData = this.currentValue.toLocaleLowerCase();
  };

  cleanupRefs() {
    if (!this._componentRef) return;
    this._overlayService.close();
    this._componentRef = undefined;
  }

  destroyMenu = () => {
    if (this._menuActive === false) return;
    this._menuActive = false;
    this._menuSubscription.unsubscribe();
    this.cleanupRefs();
  };

  onSelect = (index: number) => {
    const item = this.data[index];
    if (!item) return;
    if (!item.action) {
      this.inputElement.value = item.value;
    }

    this.selectItem.emit(item);
  };

  ngOnDestroy(): void {
    this.destroyMenu();
    this._baseSubscription.unsubscribe();
    this._whenFocusedSubscription.unsubscribe();
    this._menuSubscription.unsubscribe();
    this.cleanupRefs();
  }
}
