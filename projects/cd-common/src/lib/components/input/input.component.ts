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

/* eslint-disable max-lines */

// prettier-ignore
import { ChangeDetectionStrategy, Component, Directive, ChangeDetectorRef, ElementRef, ViewChild, Input, OnDestroy, TemplateRef, HostBinding, Output, EventEmitter } from '@angular/core';
import { coerceBooleanProperty } from '@angular/cdk/coercion';
import { Subscription, fromEvent, merge } from 'rxjs';
import { map, filter, distinctUntilKeyChanged } from 'rxjs/operators';
import { IStepperChange } from './input-stepper/input-stepper.component';
import { RichTooltipDirective } from '../../directives/tooltip/rich-tooltip.directive';
import { parseUnits, generateIValue, isIValue } from 'cd-common/utils';
import { isObject } from 'cd-utils/object';
import { KEYS } from 'cd-utils/keycodes';
import { clamp } from 'cd-utils/numeric';
import { UnitTypes } from 'cd-metadata/units';
import * as consts from './input.consts';
import * as utils from './input.utils';
import * as cd from 'cd-interfaces';

@Directive({ selector: '[cdInputLeft]' })
export class InputLeftDirective {}

@Component({
  selector: 'cd-input',
  templateUrl: './input.component.html',
  styleUrls: ['./input.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InputComponent implements OnDestroy {
  private _showError = false;
  private _center = false;
  private _outline = false;
  private _focus = false;
  private _active = false;
  private _large = false;
  private _disabled = false;
  private _showLeft = false;
  private _shiftKeyDown = false;
  private _hideStepper = false;
  private _resetNumberOnDelete = false;
  private _value: cd.InputValueType = '';
  private _subscriptions = Subscription.EMPTY;
  private _min = Number.MIN_SAFE_INTEGER;
  private _max = Number.MAX_SAFE_INTEGER;

  @Input() autofocus?: boolean;
  @Input() bottomLabel?: string;
  @Input() innerLabel?: string;
  @Input() selectedIndex = -1;
  @Input() placeholder?: string;
  @Input() defaultUnits = UnitTypes.Pixels;
  @Input() acceptedUnitTypes: UnitTypes[] = consts.DEFAULT_ACCEPTED_UNIT_TYPES;
  @Input() rightTemplateRef?: TemplateRef<any>;
  @Input() leftTemplateRef?: TemplateRef<any>;
  @Input() type: cd.InputType = cd.InputType.Text;
  @Input() data: cd.ISelectItem[] = [];
  @Input() step = 1;
  @Input() helpText?: cd.IRichTooltip;

  @Input()
  set min(value: number) {
    this._min = value ?? Number.MIN_SAFE_INTEGER;
  }
  get min() {
    return this._min;
  }

  @Input()
  set max(value: number) {
    this._max = value ?? Number.MAX_SAFE_INTEGER;
  }
  get max() {
    return this._max;
  }

  @Input()
  errorText?: cd.IRichTooltip;

  @Input()
  @HostBinding('class.show-error')
  set showError(showError: boolean) {
    this._showError = showError;
  }
  get showError() {
    return this.errorText !== undefined || this._showError;
  }

  @Input()
  set value(value: cd.InputValueType) {
    this._value = value;
  }
  get value(): cd.InputValueType {
    return this._value;
  }

  /** When deleting a number should it be undefined or zero */
  @Input()
  set resetNumberOnDelete(value: string | boolean) {
    this._resetNumberOnDelete = coerceBooleanProperty(value);
  }
  get resetNumberOnDelete() {
    return this._resetNumberOnDelete;
  }

  @Input()
  @HostBinding('class.show-left')
  set showLeft(show: boolean) {
    this._showLeft = coerceBooleanProperty(show);
  }
  get showLeft(): boolean {
    return this._showLeft;
  }

  @Input()
  @HostBinding('class.active')
  set active(active: boolean) {
    this._active = coerceBooleanProperty(active);
  }
  get active(): boolean {
    return this._active;
  }

  @Input()
  @HostBinding('class.large')
  set large(large: boolean) {
    this._large = coerceBooleanProperty(large);
  }
  get large(): boolean {
    return this._large;
  }

  @Input()
  @HostBinding('class.focused')
  set focus(focus: boolean) {
    this._focus = focus;
  }
  get focus(): boolean {
    return this._focus;
  }

  @Input()
  @HostBinding('class.disabled')
  set disabled(disabled) {
    this._disabled = coerceBooleanProperty(disabled);
  }
  get disabled() {
    return this._disabled;
  }

  @Input()
  @HostBinding('class.center')
  set center(center) {
    this._center = coerceBooleanProperty(center);
  }
  get center() {
    return this._center;
  }

  @Input()
  @HostBinding('class.outline')
  set outline(outline) {
    this._outline = coerceBooleanProperty(outline);
  }
  get outline() {
    return this._outline;
  }

  @HostBinding('class.select-input')
  get isSelectInput() {
    return this.type === cd.InputType.Select;
  }

  @Input()
  set hideStepper(hide: boolean) {
    this._hideStepper = coerceBooleanProperty(hide);
  }
  get hideStepper() {
    return this._hideStepper;
  }

  @HostBinding('class.has-stepper')
  get hasInnerLabel() {
    return this.showStepper;
  }

  @ViewChild('wrapperRef', { read: ElementRef, static: true }) wrapperRef!: ElementRef;
  @ViewChild('inputRef', { read: ElementRef, static: true }) inputRef!: ElementRef;

  @ViewChild(RichTooltipDirective, { read: RichTooltipDirective })
  _richTooltip?: RichTooltipDirective;

  @Output() focused = new EventEmitter<boolean>();
  @Output() change = new EventEmitter<cd.InputValueType>();

  constructor(protected _cdRef: ChangeDetectorRef, protected _elemRef: ElementRef) {}

  get placeholderValue() {
    const { isUnitType, placeholder } = this;
    return isUnitType ? placeholder || consts.AUTO_VALUE : placeholder;
  }

  get wrapperBounds(): DOMRect {
    return this.wrapperRef.nativeElement.getBoundingClientRect();
  }

  set numberValue(value: number) {
    const { min, max } = this;
    this.value = clamp(value, min, max).toString();
    this.outputValue(this.value);
  }

  get numberValue(): number {
    const num = Number(this.value);
    return Number.isNaN(num) ? 0 : num;
  }

  get isUnitType() {
    return this.type === cd.InputType.Units;
  }

  get isNumber() {
    const { type } = this;
    return type === cd.InputType.Number || type === cd.InputType.Percent;
  }

  get showStepper() {
    const { isNumber, focus, hideStepper } = this;
    return isNumber && !focus && !hideStepper;
  }

  get inputValue() {
    return this.inputRefElem.value;
  }

  set inputValue(value: string) {
    this.inputRefElem.value = value;
  }

  get isDisabled() {
    return this._disabled || this.isSelectInput;
  }

  get inputRefElem(): HTMLInputElement {
    return this.inputRef?.nativeElement;
  }

  get innerLabelValue() {
    if (!this.isUnitType) return this.innerLabel;
    return this.inputValue ? this.iValue?.units ?? this.defaultUnits : '';
  }

  get inputType() {
    const { type } = this;
    const isNumberType = type === cd.InputType.Number || type === cd.InputType.Percent;
    return isNumberType ? cd.InputType.Number : cd.InputType.Text;
  }

  get element(): HTMLElement {
    return this._elemRef.nativeElement;
  }

  get bounds() {
    return this.element.getBoundingClientRect();
  }

  set focusValue(focus: boolean) {
    this.focus = focus;
    this._cdRef.markForCheck();
    this.focused.emit(focus);
  }

  triggerComponentFocus() {
    this.inputRefElem.focus();
  }

  onInputBlur = () => {
    this.focusValue = false;
    this.removeEvents();
  };

  onInputFocus() {
    this.focusValue = true;
    this.attachEvents();
  }

  onShiftKey = (down: boolean) => {
    this._shiftKeyDown = down;
  };

  /** Only attach events on focus */
  attachEvents() {
    const KEYDOWN_EVENT = 'keydown';
    const blur$ = fromEvent<FocusEvent>(this.inputRefElem, 'blur');
    const keydown$ = fromEvent<KeyboardEvent>(this.inputRefElem, KEYDOWN_EVENT);
    const keyup$ = fromEvent<KeyboardEvent>(this.inputRefElem, 'keyup');
    const shiftKeyDown$ = merge(keydown$, keyup$).pipe(
      filter((e: KeyboardEvent) => e.key === KEYS.Shift),
      distinctUntilKeyChanged('type'),
      map((value) => value.type === KEYDOWN_EVENT)
    );

    this._subscriptions = new Subscription();
    this._subscriptions.add(keydown$.subscribe(this.onKeyDown));
    this._subscriptions.add(blur$.subscribe(this.onInputBlur));
    this._subscriptions.add(shiftKeyDown$.subscribe(this.onShiftKey));
  }

  onKeyDown = (e: KeyboardEvent) => {
    const { key } = e;
    if (this.isNumber || this.isUnitType) this.handleNumberKeyEvents(e);
    if (key === KEYS.Escape) this.handleInputCancel();
  };

  handleInputCancel() {
    this.inputValue = String(this.value);
    this._cdRef.markForCheck();
    this.inputRefElem.blur();
  }

  handleNumberKeyEvents(e: KeyboardEvent) {
    const { key } = e;
    const upKeyActive = key === KEYS.ArrowUp;
    const downKeyActive = key === KEYS.ArrowDown;
    if (upKeyActive || downKeyActive) {
      e.preventDefault();
      this.increment(upKeyActive);
    }
  }

  increment(increase: boolean, shiftKey?: boolean) {
    const { _shiftKeyDown, step, min, max } = this;
    const [parsedValue] = parseUnits(this.inputRefElem.value);
    const numberValue = Number(parsedValue) || 0;
    const holdingShift = shiftKey || _shiftKeyDown;
    const direction = increase ? 1 : -1;
    const update = utils.processIncrement(numberValue, direction, holdingShift, step, min, max);
    if (this.isUnitType) return this.handleUnitTypeInputChange(update);
    this.numberValue = update;
  }

  removeEvents() {
    this._subscriptions.unsubscribe();
  }

  ngOnDestroy() {
    this.removeEvents();
  }

  handleNumberUpdate(value: string) {
    if (this._resetNumberOnDelete) return this.outputValue(value);
    this.numberValue = Number(value);
  }

  get iValue() {
    return this.value as cd.IValue;
  }

  get currentUnits() {
    return this.currentUnitIValue?.units || this.defaultUnits;
  }

  private convertValueToIValueWithUnits(value: cd.InputValueType): cd.IValue {
    const [parsedValue, unit] = parseUnits(String(value), this.acceptedUnitTypes);
    const units = unit === UnitTypes.None ? this.currentUnits : unit;
    const undefinedOrNaN = utils.isValidValue(parsedValue);
    return undefinedOrNaN ? generateIValue() : generateIValue(parsedValue, units);
  }

  resetIValue() {
    const resetValue = generateIValue();
    this.change.emit(resetValue);
    this.inputValue = '';
  }

  get currentUnitIValue(): cd.IValue {
    const { value } = this;
    return isIValue(value) ? value : generateIValue(this.inputValue, this.defaultUnits);
  }

  onUnitSelection({ value }: cd.IMenuConfig) {
    // undefined value such as Auto
    if (!value) return this.resetIValue();
    const units = value as cd.Units;
    const { currentUnitIValue } = this;
    const processedValue = utils.clampPercentageValue(currentUnitIValue.value, units);
    const update = { ...currentUnitIValue, value: processedValue, units };
    this.change.emit(update);
  }

  handleUnitTypeInputChange(value: string | number) {
    const update = this.convertValueToIValueWithUnits(value);
    this.inputValue = String(update.value) || '';
    this.change.emit(update);
  }

  onChange(e: Event) {
    e.preventDefault();
    e.stopPropagation();
    const { inputValue } = this;
    if (this.isUnitType) return this.handleUnitTypeInputChange(inputValue);
    if (this.value === inputValue) return;
    if (this.isNumber) return this.handleNumberUpdate(inputValue);
    this.outputValue(inputValue);
  }

  handleNumberReset() {
    this.change.emit(undefined);
  }

  outputValue(value: cd.InputValueType) {
    const isNumber = this.inputType === cd.InputType.Number;

    if (this._resetNumberOnDelete && isNumber && !value) {
      return this.handleNumberReset();
    }

    // TODO: clean this up
    const val = isNumber && !isObject(value) ? Number(value) : value;
    this.change.emit(val);
  }

  onSelect(item: cd.ISelectItem) {
    this.change.emit(item);
  }

  onStepperChange({ shiftKey, increment }: IStepperChange) {
    this.increment(increment, shiftKey);
  }

  get richTooltipActive() {
    return this._richTooltip?.active;
  }

  get richTooltipIcon() {
    const { errorText, richTooltipActive } = this;
    if (errorText) return richTooltipActive ? 'error' : 'error_outline';
    return richTooltipActive ? 'help' : 'help_outline';
  }

  onShowRichTooltip(e: MouseEvent) {
    const element = e.currentTarget as HTMLElement;
    const bounds = element.getBoundingClientRect();
    this._richTooltip?.show(bounds);
  }
}
