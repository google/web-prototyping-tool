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
  ChangeDetectorRef,
  ElementRef,
  Input,
  ViewChild,
  OnDestroy,
  ComponentRef,
  EventEmitter,
  Output,
  HostBinding,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { OverlayService } from '../../overlay/overlay.service';
import { SelectComponent } from '../../select/select.component';
import { ISelectItem, SelectItemType, SelectItemOutput, IRichTooltip } from 'cd-interfaces';
import { Subscription } from 'rxjs';
import { InputComponent } from '../input.component';
import { coerceBooleanProperty } from '@angular/cdk/coercion';
import { injectResetState, getSelectedIndexForData } from './select-input.utils';
import { assignMenuIndex } from '../input.utils';
import { KEYS } from 'cd-utils/keycodes';

@Component({
  selector: 'cd-select-input',
  templateUrl: './select-input.component.html',
  styleUrls: ['./select-input.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [OverlayService],
})
export class SelectInputComponent implements OnDestroy, OnChanges {
  private _subscriptions: Subscription = Subscription.EMPTY;
  private _componentRef?: ComponentRef<SelectComponent>;
  private _active = false;
  private _showLeft = false;
  private _outline = false;
  private _disabled = false;

  public menuData: ReadonlyArray<ISelectItem> = [];
  public selectedIndex = -1;

  @Input() bindingId?: string;
  @Input() data?: ISelectItem[] = [];
  @Input() resetState?: string;
  @Input() bottomLabel?: string;
  @Input() placeholder?: string;
  @Input() value: string | number = '';
  @Input() helpText?: IRichTooltip;
  @Input() errorText?: IRichTooltip;

  @Input()
  @HostBinding('class.disabled')
  set disabled(disabled) {
    this._disabled = coerceBooleanProperty(disabled);
  }
  get disabled() {
    return this._disabled;
  }

  @Input()
  @HostBinding('class.show-left')
  set showLeft(show: string | boolean) {
    this._showLeft = coerceBooleanProperty(show);
  }
  get showLeft() {
    return this._showLeft;
  }

  @Input()
  @HostBinding('class.outline')
  set outline(outline) {
    this._outline = coerceBooleanProperty(outline);
  }
  get outline() {
    return this._outline;
  }

  @Input()
  @HostBinding('class.active')
  set active(active: boolean) {
    this._active = coerceBooleanProperty(active);
  }
  get active(): boolean {
    return this._active;
  }

  @Input() focus = false;

  @ViewChild('btnRef', { read: ElementRef }) _btnRef?: ElementRef;
  @ViewChild('inputCompRef', { read: InputComponent, static: true }) _inputCompRef?: InputComponent;

  /** Used to highlight active element on the design surface */
  @Output() activeValue = new EventEmitter<string>();
  @Output() focused = new EventEmitter<boolean>();
  @Output() blur = new EventEmitter<FocusEvent>();
  @Output() change = new EventEmitter<SelectItemOutput>();
  @Output() valueChange = new EventEmitter<SelectItemOutput>();

  constructor(
    protected _elemRef: ElementRef,
    protected _cdRef: ChangeDetectorRef,
    protected _overlayService: OverlayService
  ) {}

  createSelectOnKey(e: KeyboardEvent) {
    if (this.active === false && e.key === KEYS.ArrowDown) {
      return this.createSelect(e);
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.data || changes.resetState || changes.bindingId) {
      this.menuData = assignMenuIndex(injectResetState(this.data, this.resetState));
      this.selectedIndex = getSelectedIndexForData(this.menuData, this.bindingId);
    }
  }

  get element(): HTMLElement {
    return this._elemRef.nativeElement;
  }

  get btnElement(): HTMLButtonElement {
    return this._btnRef?.nativeElement;
  }

  handleActiveValue = (value: string) => {
    this.activeValue.emit(value);
  };

  get bounds() {
    return this._inputCompRef?.wrapperBounds || this._btnRef?.nativeElement.getBoundingClientRect();
  }

  createSelect(e: MouseEvent | KeyboardEvent): void {
    e.preventDefault();
    e.stopPropagation();

    // Handle empty data
    if (this.menuData.length === 0) return this.focusOnButton();

    // Only show one instance of the component
    this.cleanupComponentRef();

    this.active = true;
    const parentRect = this.bounds;
    const config = { parentRect };
    const componentRef = this._overlayService.attachComponent(SelectComponent, config);
    componentRef.instance.width = parentRect.width;
    componentRef.instance.selectedIndex = this.selectedIndex;
    componentRef.instance.data = this.menuData;
    componentRef.instance.showFilter = true; // Auto show for select inputs
    // Attach overlay service to main subscription
    this._subscriptions = this._overlayService.closed.subscribe(this.handleCloseSubscription);
    // Component refs manage their own subscriptions
    const subscriptions = new Subscription();
    subscriptions.add(componentRef.instance.selected.subscribe(this.handleSelectionSubscription));
    subscriptions.add(componentRef.instance.close.subscribe(this.handleCloseSubscription));
    subscriptions.add(componentRef.instance.activeValue.subscribe(this.handleActiveValue));
    componentRef.onDestroy(() => subscriptions.unsubscribe());

    this._componentRef = componentRef;
  }

  focusOnButton() {
    this.btnElement.focus();
  }

  triggerComponentFocus() {
    this.focusOnButton();
  }

  handleCloseSubscription = (focus: boolean) => {
    this.handleActiveValue('');
    this.cleanupComponentRef();
    this.active = false;
    this.focusOnButton();

    // Maintain focus if the user closes the menu with Esc
    if (!focus && this._btnRef) {
      this._btnRef.nativeElement.blur();
    }

    this._cdRef.markForCheck();
  };

  outputValue(value: string | number | ISelectItem) {
    this.change.emit(value);
    this.valueChange.emit(value);
  }

  handleSelectionSubscription = (index: number) => {
    const item = this.menuData[index];
    if (!item) return;
    if (!item.action) {
      const isEmptyType = item.type === SelectItemType.Empty;
      this.value = isEmptyType ? '' : item.title;
      this.selectedIndex = index;
      this.focusOnButton();
      this._cdRef.markForCheck();
    }

    this.outputValue({ ...item });
  };

  cleanupComponentRef() {
    this._subscriptions.unsubscribe();

    if (this._componentRef) {
      this._overlayService.close();
      this._componentRef.destroy();
      this._componentRef = undefined;
    }
  }

  ngOnDestroy(): void {
    this.cleanupComponentRef();
  }

  emitFocus() {
    this.focused.emit(this.focus);
  }

  onButtonBlur = () => {
    if (this.focus === false) return;
    if (this.active === true) return;
    this.focus = false;
    this.emitFocus();
  };

  onButtonFocus() {
    this.focus = true;
    this.emitFocus();
  }
}
