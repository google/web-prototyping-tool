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
  HostBinding,
  Output,
  EventEmitter,
  ChangeDetectorRef,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { getDefaultStateForInputType } from './input-card.utils';
import { ICON_STYLE_CLASSES, IconStyle } from 'cd-themes';
import { Subject, Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { clamp } from 'cd-utils/numeric';
import { toCamelCase, trimChar } from 'cd-utils/string';
import * as consts from 'cd-common/consts';
import * as config from '../../code-comp.config';
import * as utils from 'cd-common/utils';
import * as cd from 'cd-interfaces';

const UNLABELED_INPUT_NAME = 'Unlabeled';

@Component({
  selector: 'app-input-card',
  templateUrl: './input-card.component.html',
  styleUrls: ['./input-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InputCardComponent implements OnDestroy, OnInit {
  private _subscription = new Subscription();
  private _nameValidation$ = new Subject<string>();
  private _nameWasEdited = false;

  public PropertyInput = cd.PropertyInput;
  public BindingType = cd.BindingType;
  public UNLABELED_INPUT_NAME = UNLABELED_INPUT_NAME;
  public INPUT_TYPES_MENU_DATA = config.INPUT_TYPES_MENU_DATA;
  public INPUT_BINDING_TYPES_MENU_DATA = config.INPUT_BINDING_TYPES_MENU_DATA;
  public iconClass = ICON_STYLE_CLASSES[IconStyle.MATERIAL_ICONS_FILLED];
  public inputTypeHelpText: cd.IRichTooltip = { text: config.INPUT_TYPE_TEXT };
  public inputCssNameHelpText: cd.IRichTooltip = { text: config.INPUT_CSS_NAME_TEXT };
  public inputPropAttrNameHelpText: cd.IRichTooltip = { text: config.INPUT_PROP_ATTR_NAME_TEXT };
  public color?: cd.IValue;
  public nameErrorText?: cd.IRichTooltip;
  public dataToAttributeErrorText?: cd.IRichTooltip;

  @Input() colorMenuData: ReadonlyArray<cd.ISelectItem> = [];
  @Input() datasetsMenuItems: cd.ISelectItem[] = [];
  @Input() colors: cd.IStringMap<cd.IDesignColor> = {};
  @Input() input?: Readonly<cd.IPropertyGroup>;
  @Input() allInputs?: ReadonlyArray<cd.IPropertyGroup> = [];
  @Input() allOutputs?: ReadonlyArray<cd.IOutputProperty> = [];

  @Input()
  @HostBinding('class.drag-preview')
  previewCard = false;

  @Output() update = new EventEmitter<cd.IPropertyGroup>();
  @Output() delete = new EventEmitter<void>();

  constructor(private _cdRef: ChangeDetectorRef) {}

  ngOnInit(): void {
    const validName$ = this._nameValidation$.pipe(
      debounceTime(consts.INPUT_VALIDATION_DEBOUNCE_TIME)
    );
    this._subscription.add(validName$.subscribe(this.validateName));
  }

  ngOnDestroy() {
    this._subscription.unsubscribe();
  }

  get canShowContents(): boolean {
    return !this.previewCard && !this.collapsed;
  }

  get nameValue(): string {
    return this.input?.name || '';
  }

  get labelValue(): string {
    return this.input?.label || '';
  }

  get collapsed(): boolean | undefined {
    return this.input?.collapsed;
  }

  /**
   * Should auto-generate the name on label change if:
   * 1) User had not yet edited the name and ...
   * 2) Name is empty -or- name is still the default "myInput"
   */
  get shouldAutogenName(): boolean {
    if (!this.input?.name) return true;
    const defaultName = config.DEFAULT_NEW_INPUT.name as string;
    const hasDefaultName = this.toCamelCaseInputName(this.input?.name).startsWith(defaultName);
    return !this._nameWasEdited && hasDefaultName;
  }

  onDelete() {
    this.delete.emit();
  }

  onLabelChange(label: string) {
    let name = this.input?.name;

    // Auto-generate default name based on label
    if (label && this.shouldAutogenName) {
      name = this.autoGenerateName(label, this.input?.bindingType);
    }

    const update = { ...this.input, name, label };
    this.update.emit(update);
  }

  onNameChange(name: string) {
    const bindingType = this.input?.bindingType;
    const isValid =
      this.validateDuplicateInputName(name, bindingType) || this.validateName(name, bindingType);
    if (!isValid || this.nameValue === name) return;
    const update = { ...this.input, name };
    this.update.emit(update);
    this._nameWasEdited = true;
  }

  onTypeChange(item: cd.ISelectItem) {
    const inputType = item.value as cd.PropertyInput;
    const isValid = this.validateInputAndBindingType(inputType, this.input?.bindingType);
    if (!isValid) return;
    const defaultState = getDefaultStateForInputType(inputType);
    const update = { ...this.input, ...defaultState, inputType };
    this.update.emit(update);
  }

  onBindingTypeChange(item: cd.ISelectItem) {
    const bindingType = item.value as cd.BindingType;
    let name = this.input?.name as string;

    // Convert name between camelCase and --css-var format
    if (!this._nameWasEdited && name) {
      name = this.autoGenerateName(name, bindingType);
    }

    const isValid =
      this.validateInputAndBindingType(this.input?.inputType, bindingType) &&
      this.validateName(name, bindingType);

    if (!isValid) return;
    const update = { ...this.input, name, bindingType };
    this.update.emit(update);
  }

  toggleCollapsed() {
    const collapsed = !this.input?.collapsed;
    const update = { ...this.input, collapsed };
    this.update.emit(update);
  }

  updateDefaultValue(defaultValue: cd.PropertyValue) {
    const updatedInput = { ...this.input, defaultValue };
    this.update.emit(updatedInput);
  }

  // Checkbox Updates
  onCheckboxChange(value: boolean) {
    this.updateDefaultValue(value);
  }

  // Color updates
  onColorChange(value: string | cd.ISelectItem) {
    // If binding is CSS variable and value is an ISelectItem, convert to IValue
    // Otherwise, use raw string type for property/attribute bindings
    const isCSSVar = utils.isIValue(value) && this.input?.bindingType === cd.BindingType.CssVar;
    const processed = isCSSVar ? utils.iValueFromAny(value) : utils.valueFromIValue(value);
    this.updateDefaultValue(processed);
  }

  // Number update
  onNumberChange(num: number) {
    this.updateDefaultValue(num);
  }

  // Range updates
  onMinChange(min: number) {
    const { input } = this;
    if (!input) return;
    const max = input.max ?? 0;
    if (min > max) min = max; // prevent min from being greater than max
    const defaultValue = this.clampDefaultValue(input.defaultValue, min, max);
    const update = { ...input, min, defaultValue };
    this.update.emit(update);
  }

  clampDefaultValue(
    value: cd.PropertyValue | undefined,
    min: number,
    max: number
  ): number | undefined {
    return value === undefined ? value : clamp(Number(value), min, max);
  }

  onMaxChange(max: number) {
    const { input } = this;
    if (!input) return;
    const min = input.min ?? 0;
    if (max < min) max = min; // prevent max from being less than min
    const defaultValue = this.clampDefaultValue(input.defaultValue, min, max);
    const update = { ...input, max, defaultValue };
    this.update.emit(update);
  }

  onRangeChange(value: number) {
    this.updateDefaultValue(value);
  }

  // Text update
  onTextChange(text: string) {
    this.updateDefaultValue(text);
  }

  // Icon update
  onIconChange(iconName: string) {
    this.updateDefaultValue(iconName);
  }

  // dataset update
  onDatasetChange(datasetItem: cd.ISelectItem) {
    this.updateDefaultValue(datasetItem.value);
  }

  requestNameValidation(inputEvent: Event) {
    const { value } = inputEvent.target as HTMLInputElement;
    this._nameValidation$.next(value);
  }

  /** Check to ensure name is not empty, and matches the correct pattern. */
  private validateName = (name: string, bindingType?: cd.BindingType): boolean => {
    let isValid = true;
    const isCssVar = (bindingType || this.input?.bindingType) === cd.BindingType.CssVar;

    // Skip validation if setting name back to initial value
    if (this.nameValue === name) {
      this.nameErrorText = undefined;
    }
    // Check if name is defined
    if (!name) {
      isValid = false;
      this.nameErrorText = isCssVar
        ? config.NO_CSS_VAR_NAME_ERROR_TEXT
        : config.NO_INPUT_NAME_ERROR_TEXT;
    }
    // Check if name is a valid CSS var pattern
    else if (isCssVar && !utils.validateCssVarName(name)) {
      isValid = false;
      this.nameErrorText = config.getInvalidNameErrorText(name, config.NameErrorType.CssVar);
    }
    // Check if name is a valid input name
    else if (!isCssVar && !utils.validateInputOutputName(name)) {
      isValid = false;
      this.nameErrorText = config.getInvalidNameErrorText(name, config.NameErrorType.Input);
    }
    // Else remove error state from input
    else {
      this.nameErrorText = undefined;
    }

    this._cdRef.markForCheck();
    return isValid;
  };

  /**
   * Check to ensure that we don't assign Data input type to Attribute binding.
   * Attributes are always strings, so assigning data to an attribute wont work.
   */
  private validateInputAndBindingType = (
    inputType?: cd.PropertyInput,
    bindingType?: cd.BindingType
  ): boolean => {
    const isAttribute = bindingType && bindingType === cd.BindingType.Attribute;
    const isDataSelect = inputType && inputType === cd.PropertyInput.DatasetSelect;
    const isValid = !(isAttribute === true && isDataSelect === true);
    this.dataToAttributeErrorText = isValid ? undefined : config.DATA_BOUND_TO_ATTRIBUTE_ERROR_TEXT;
    this._cdRef.markForCheck();
    return isValid;
  };

  /** Check if name is a duplicate of an existing input or output name. */
  private validateDuplicateInputName(name: string, bindingType?: cd.BindingType): boolean {
    const isValid = utils.checkIfDuplicateInputOutputName(name, this.allInputs, this.allOutputs);

    if (isValid) return true;
    const isCSSVar = bindingType === cd.BindingType.CssVar;
    const nameErrorType = isCSSVar ? config.NameErrorType.CssVar : config.NameErrorType.Input;
    this.nameErrorText = config.getDuplicateNameErrorText(name, nameErrorType);
    return false;
  }

  /** Converts to camelCase, but accounts for possible CSS var prefix "--". */
  private toCamelCaseInputName(name: string) {
    return toCamelCase(trimChar('-', name));
  }

  /** Auto-generates the property name based on the label and bindingType. */
  private autoGenerateName(label: string, bindingType?: cd.BindingType): string {
    const isCssVar = bindingType === cd.BindingType.CssVar;
    // Create name in --css-var-format if CSS var
    if (isCssVar) return utils.toCssVarName(label);
    // Create name in camelCase if attribute/property
    return this.toCamelCaseInputName(label);
  }
}
