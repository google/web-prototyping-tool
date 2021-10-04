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
  ViewChild,
  ElementRef,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
  OnChanges,
  SimpleChanges,
} from '@angular/core';

import { HSVColor, TRANSPARENT } from 'cd-utils/color';
import { ColorPickerDirective } from '../../input/color/picker.directive';
import { OverlayService } from '../../overlay/overlay.service';
import { Subscription, fromEvent, merge } from 'rxjs';
import { map, auditTime, distinctUntilChanged } from 'rxjs/operators';
import { KEYS } from 'cd-utils/keycodes';
import { InputValidationMode } from 'cd-common/consts';
import * as utils from '../key-value.utils';
import * as cd from 'cd-interfaces';

const VALID_GRADIENT_KEYS = ['background', 'background-image'];
const MULTI_BKD_REGEX = /(gradient|url)/g;
const FOCUS_IN = 'focusin';

@Component({
  selector: 'li[cd-key-value-row]',
  templateUrl: './key-value-row.component.html',
  styleUrls: ['./key-value-row.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KeyValueRowComponent implements OnInit, OnDestroy, OnChanges {
  public markForFocusOnValue = false;
  private _subscription = Subscription.EMPTY;
  public focused = false;

  @Input() warn = false;
  @Input() inputMode = InputValidationMode.NONE;
  @Input() isLast = false;
  @Input() keyValue: cd.IKeyValue = utils.createKeyValue();
  @Input() keyMenuData: string[] = [];
  @Input() designSystem?: cd.IDesignSystem;
  @Input() valueMenuDataMap: cd.IStringMap<string[]> = {};

  @Output() keyValueChange = new EventEmitter<cd.IKeyValue>();
  @Output() pasted = new EventEmitter<string>();
  @Output() delete = new EventEmitter<void>();
  @Output() nextLine = new EventEmitter<void>();

  @ViewChild('keyRef', { read: ElementRef }) keyRef?: ElementRef;
  @ViewChild('valueRef', { read: ElementRef }) valueRef?: ElementRef;
  @ViewChild(ColorPickerDirective, { read: ColorPickerDirective }) picker?: ColorPickerDirective;

  constructor(
    private _overlayService: OverlayService,
    private _elemRef: ElementRef,
    private _cdRef: ChangeDetectorRef
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.keyValue) {
      if (this.markForFocusOnValue) {
        this.markForFocusOnValue = false;
        this._cdRef.detectChanges();
        this.focusOnValue();
      }
    }
  }

  ngOnDestroy(): void {
    this._subscription.unsubscribe();
  }

  get element() {
    return this._elemRef.nativeElement;
  }

  ngOnInit(): void {
    const { element } = this;
    const focusIn$ = fromEvent<FocusEvent>(element, FOCUS_IN);
    const focusOut$ = fromEvent<FocusEvent>(element, 'focusout');
    this._subscription = merge(focusOut$, focusIn$)
      .pipe(
        map((value) => value.type === FOCUS_IN),
        auditTime(0),
        distinctUntilChanged()
      )
      .subscribe(this.onFocusWithin);
  }

  get keyRefElem(): HTMLInputElement {
    return this.keyRef?.nativeElement;
  }

  get valueRefElem(): HTMLInputElement | undefined {
    return this.valueRef?.nativeElement;
  }

  get isChecked() {
    return !this.keyValue.disabled;
  }

  get isInvalid() {
    return false;
  }

  get showWarning() {
    return this.focused === false && this.keyValue?.invalid === true;
  }

  emitUpdate(update: cd.IKeyValue) {
    const payload = this.validateKey(update);
    this.keyValueChange.emit(payload);
  }

  validateKey(update: cd.IKeyValue): cd.IKeyValue {
    return utils.checkInputValidity(update, this.inputMode);
  }

  keyValueUpdate(update: Partial<cd.IKeyValue>) {
    const payload = { ...this.keyValue, ...update };
    this.emitUpdate(payload);
  }

  onCheckedChange(value: boolean) {
    const disabled = !value;
    this.keyValueUpdate({ disabled });
  }

  getInputValueFromEvent(e: Event) {
    return (e.currentTarget as HTMLInputElement).value;
  }

  onKeyInputSelect(item: cd.ISelectItem) {
    const name = item.value;
    this.markForFocusOnValue = true;
    this.keyValueUpdate({ name });
  }

  onKeyChange(e: Event) {
    const name = this.getInputValueFromEvent(e);
    if (name === '') return this.onDelete(); // Remove empty keys
    this.markForFocusOnValue = true;
    this.keyValueUpdate({ name });
  }

  onValueChange(e: Event) {
    const value = this.getInputValueFromEvent(e);
    this.keyValueUpdate({ value });
  }

  onValueSelect(item: cd.ISelectItem) {
    const { id, value } = item;
    const { keyValue } = this;
    const payload = id ? { ...keyValue, value, id } : { ...keyValue, value };
    this.emitUpdate(payload);
  }

  onSwatchClick() {
    const { name, value } = this.keyValue;
    const colorValue = String(value) || TRANSPARENT;
    // Don't show the color picker if we detect multiple backgrounds
    // b/145316265
    const multipleBackground = colorValue.match(MULTI_BKD_REGEX);
    if (multipleBackground && multipleBackground.length > 1) return;

    const canShowGradient = name && VALID_GRADIENT_KEYS.includes(name);
    const disableGradient = !!!canShowGradient;
    this.picker?.createColorPicker(colorValue, disableGradient);
  }

  onGradientPick(value: string) {
    this.keyValueUpdate({ value });
  }

  onColorPick(color: HSVColor) {
    const value = color.alpha < 1 ? color.rgbaString : color.hexString;
    this.keyValueUpdate({ value });
  }

  onRemoveChip() {
    const { id, name, value } = this.keyValue;
    const fallbackValue = utils.fallbackToDesignSystemValue(id, this.designSystem) || value;
    const update = { name, value: fallbackValue };

    this.emitUpdate(update);
  }

  onChipSelect(value: cd.ISelectItem) {
    this.onValueSelect(value);
  }

  onDelete() {
    this.delete.emit();
  }

  goToNextLine() {
    this.nextLine.emit();
    this.valueRefElem?.blur();
  }

  focusOnValue() {
    this.valueRefElem?.focus();
  }

  focusOnKey() {
    this.keyRefElem?.focus();
  }

  onFocusWithin = (value: boolean) => {
    const hasFocus = this.isKeyInputFocused || this.isValueInputFocused;
    if (value !== hasFocus) return;
    this.focused = value;
    if (value === false) this.deleteKeyIfEmpty(this.keyValue.name);
    this._cdRef.markForCheck();
  };

  get isKeyInputFocused() {
    return utils.isElementFocused(this.keyRefElem);
  }

  get isValueInputFocused() {
    return utils.isElementFocused(this.valueRefElem);
  }

  onValueKeydown(e: KeyboardEvent) {
    const { key, shiftKey } = e;

    if (key === KEYS.Enter || (!shiftKey && key === KEYS.Tab)) {
      e.preventDefault();
      this.goToNextLine();
    }

    if (key === KEYS.Escape && this.isValueInputFocused) {
      this.valueRefElem?.blur();
    }
  }

  deleteKeyIfEmpty(value: string) {
    if (value === '') return this.onDelete();
  }

  updateValueToKeyInput() {
    this.keyValue = { ...this.keyValue, name: this.keyRefElem.value };
  }

  get keyValueName() {
    return this.keyValue.name;
  }

  onKeyDown(e: KeyboardEvent) {
    const { key, shiftKey } = e;
    const advance = key === KEYS.Colon || key === KEYS.Tab;
    const inputValue = this.keyRefElem.value;
    const didValueChange = this.keyValueName !== inputValue;

    if (!shiftKey && advance && didValueChange) {
      e.preventDefault();
      e.stopPropagation();
      this.updateValueToKeyInput();
      this.markForFocusOnValue = true;
      this.deleteKeyIfEmpty(inputValue);
      this._overlayService.close();
      this.keyRefElem.blur();
    }

    if (key === KEYS.Escape && this.isKeyInputFocused) {
      this.keyRefElem.blur();
    }
  }

  onPaste(e: ClipboardEvent) {
    const { clipboardData, currentTarget } = e;
    const text = clipboardData?.getData('text');
    if (text && text.includes(':')) {
      e.stopPropagation();
      e.preventDefault();
      this._overlayService.close(); // close any open overlays
      (currentTarget as HTMLInputElement).blur();
      this.pasted.emit(text);
    }
  }
}
