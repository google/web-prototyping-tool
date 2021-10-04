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

import {
  Component,
  ChangeDetectionStrategy,
  Input,
  OnChanges,
  SimpleChanges,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
} from '@angular/core';
import { SelectionContextService } from '../../../services/selection-context/selection.context.service';
import { configFromActionString } from '../../../services/selection-context/selection.context.utils';
import { OUTLET_FRAME_MAX_SIZE, OUTLET_FRAME_MIN_SIZE } from '../../../configs/outlet-frame.config';
import { areSymbolInputsExposedForElement, generateTrackBy } from './dynamic-properties.utils';
import { ProjectContentService } from 'src/app/database/changes/project-content.service';
import { bkdSizeConfig, sizeConfig } from '../../../configs/root-element.properties.config';
import { ContextBindingPipe, ITemplateContext, StyleBindingPipe } from '../properties.pipe';
import { InteractionService } from '../../../services/interaction/interaction.service';
import { ToastsService } from 'src/app/services/toasts/toasts.service';
import { AssetsService } from '../../../services/assets/assets.service';
import { IProjectState } from '../../../store';
import { DataPickerService } from 'cd-common';
import { Subscription } from 'rxjs';
import { toDecimal } from 'cd-utils/numeric';
import { Store } from '@ngrx/store';
import * as config from '../../../configs/properties.config';
import * as actions from '../../../store/actions';
import * as utils from '../properties.utils';
import * as consts from 'cd-common/consts';
import * as cdUtils from 'cd-common/utils';
import * as cd from 'cd-interfaces';

@Component({
  selector: 'app-dynamic-properties',
  templateUrl: './dynamic-properties.component.html',
  styleUrls: ['./dynamic-properties.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DynamicPropertiesComponent implements OnInit, OnChanges, OnDestroy {
  private subscriptions = new Subscription();
  public exposedSymbolInputs = false;
  public PropertyType = cd.PropertyType;
  public PropertyInput = cd.PropertyInput;
  public ElementEntitySubType = cd.ElementEntitySubType;
  public opacityAutocomplete = consts.opacityMenuConfig;
  public radiusAutocomplete = consts.sizeMenuConfigAlt;
  public maxRadiusWidth = config.DEFAULT_SIZE;
  public maxPadding = config.DEFAULT_SIZE;
  public maxBoardSize = OUTLET_FRAME_MAX_SIZE;
  public minBoardSize = OUTLET_FRAME_MIN_SIZE;

  public bkdSizeMenuData = bkdSizeConfig;
  public asset?: cd.IProjectAsset;
  public frame?: cd.ILockingRect;
  public sizeConfig = sizeConfig;

  public styles: cd.IStyleDeclaration = {};
  public mergedProps!: cd.PropertyModel;
  public parentStyles: cd.IStyleDeclaration = {};
  public mergedParentProps?: cd.PropertyModel;
  public elementProps: cd.ElementPropertiesMap = {};
  public loadedData: Record<string, any> = {};
  public selectedIds: ReadonlyArray<string> = [];
  /** This is the properties configuration */
  @Input() properties: cd.IPropertyGroup[] = [];
  /** These are the selected element values */
  @Input() props: cd.PropertyModel[] = [];
  @Input() parentProps: cd.PropertyModel[] = [];
  /** Meant to be used when dynamic props panels are nested (Ex. Dyn List Group) */
  @Input() parentMergedProps?: cd.PropertyModel;
  @Input() boards: cd.IBoardProperties[] = [];
  @Input() portals: cd.ISelectItem[] = [];
  @Input() designSystem!: cd.IDesignSystem;
  @Input() colorMenuData: ReadonlyArray<cd.ISelectItem> = [];
  @Input() assetsMenuData: ReadonlyArray<cd.ISelectItem> = [];
  @Input() datasetsMenuData: cd.ISelectItem[] = [];
  @Input() symbolInputs: cd.IPropertyGroup[] = [];
  @Input() isolatedSymbol?: cd.ISymbolProperties;
  @Output() propsChange = new EventEmitter<Partial<cd.PropertyModel>>();
  @Output() siblingUpdate = new EventEmitter<cd.IPropertiesUpdatePayload[]>();
  @Output() action = new EventEmitter<cd.ISelectItem>();

  constructor(
    private _interactionService: InteractionService,
    private _projectStore: Store<IProjectState>,
    private _assetService: AssetsService,
    private _selectionContextService: SelectionContextService,
    private _projectContentService: ProjectContentService,
    private _cdRef: ChangeDetectorRef,
    private _toastsService: ToastsService,
    public dataPickerService: DataPickerService
  ) {}

  ngOnInit() {
    const { elementProperties$ } = this._projectContentService;
    const { loadedData$ } = this.dataPickerService;

    this.subscriptions.add(elementProperties$.subscribe(this.onElementPropsSubscription));
    this.subscriptions.add(loadedData$.subscribe(this.onLoadedDataSubscription));
  }

  get isBoard(): boolean {
    return this.mergedProps.elementType === cd.ElementEntitySubType.Board;
  }

  get isSymbol(): boolean {
    return this.mergedProps.elementType === cd.ElementEntitySubType.Symbol;
  }

  get canShowExposedSymbolProps() {
    return this.isolatedSymbol && !this.isSymbol && this.props.length === 1;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.props) this.generateProperties();
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  onElementPropsSubscription = (props: cd.ElementPropertiesMap) => (this.elementProps = props);

  onLoadedDataSubscription = (loadedData: Record<string, any>) => {
    this.loadedData = loadedData;
    this._cdRef.markForCheck();
  };

  onActiveValue(value: string) {
    this._interactionService.highlightElement(value);
  }

  generateProperties() {
    this.selectedIds = this.props.map((item) => item.id);
    this.generateMergedProps();
    this.updateMaxBorderRadius();
    this.getFrameRect();
  }

  get uid() {
    return this.mergedProps.id + this.props.length;
  }

  get renderRects(): cd.RenderRectMap {
    const propIds = this.props.map((item) => item.id);
    return this._interactionService.renderRectsForIds(true, ...propIds);
  }

  onExcludeBoardFromPreview(exclude: boolean, prop?: cd.IPropertyGroup) {
    this.writeInputsValue({ exclude }, prop);
  }

  onLockChange(frame: cd.ILockingRect, prop?: cd.IPropertyGroup) {
    this.writeRootValue({ frame }, prop);
  }

  onBackgroundAdd(context: ITemplateContext) {
    const added = { ...config.DEFAULT_BACKGROUND_COLOR };
    const styles = new StyleBindingPipe().transform(context.target);
    const currentBackgrounds = (styles.background as []) || [];
    const background = [...currentBackgrounds, added];
    this.writeActiveStyle({ background }, context.prop);
  }

  onBackgroundChange(background: cd.IValue[], prop?: cd.IPropertyGroup) {
    this.writeActiveStyle({ background }, prop);
  }

  onShadowUpdate(boxShadow: cd.IShadowStyle[], prop?: cd.IPropertyGroup) {
    this.writeActiveStyle({ boxShadow }, prop);
  }

  onOpacityChange(val: number, prop?: cd.IPropertyGroup) {
    const value = toDecimal(val);
    const opacity = { opacity: { value } };
    this.writeActiveStyle(opacity, prop);
  }

  onPercentRangeChange(val: number, context: ITemplateContext) {
    const value = toDecimal(val);
    this.writeBinding(value, context);
  }

  updateMaxBorderRadius() {
    this.maxRadiusWidth = utils.generateMaxBorderRadius(this.renderRects, config.DEFAULT_SIZE);
  }

  getFrameRect() {
    const [first] = this.props;
    const frame = utils.buildFrameFromPropsAndRenderRects(first, this.renderRects);
    this.maxPadding = utils.calculateMaxPadding(frame) || config.DEFAULT_SIZE;
    this.frame = frame;
  }

  generateMergedProps() {
    this.mergedParentProps = this.parentProps?.[0];
    this.mergedProps = this.props[0];
    const imgProps = this.mergedProps?.inputs as cd.IImageInputs;

    this.generateImageAssetProps(imgProps);
    this.buildStyles();
    if (!this.canShowExposedSymbolProps) return;
    this.buildSymbolChildProps();
  }

  buildStyles() {
    const { mergedProps, mergedParentProps } = this;
    const state = mergedProps.state || cd.State.Default;
    this.styles = mergedProps.styles[state]?.style || {};
    this.parentStyles = mergedParentProps?.styles?.[state]?.style || {};
  }

  generateImageAssetProps(imgProps?: cd.IImageInputs) {
    if (!imgProps) return;
    const assetId = imgProps.src?.id;
    const asset = assetId && this._assetService.getAssetForId(assetId);
    this.asset = asset ? asset : undefined;
  }

  writeSelectValue(item: cd.SelectItemOutput, context: ITemplateContext) {
    const { value } = item as cd.ISelectItem;
    this.writeBinding(value, context);
  }

  /** Write to the inputs object on a model. */
  writeInputsValue(value: any, prop?: cd.IPropertyGroup) {
    // Currently using targetId instead of inputId for dirty tracking
    const overrideTarget = prop && prop.targetId;
    const inputs = { inputs: value };
    const output = this.buildOutput(overrideTarget, inputs);
    this.writeRootValue(output);
  }

  buildOutput(overrideTarget: string | undefined, value: any) {
    return overrideTarget
      ? { dirtyInputs: { [overrideTarget]: true }, instanceInputs: { [overrideTarget]: value } }
      : value;
  }

  /**
   * Writes directly to the ElementProperties Model
   * Use writeInputs to write to the { inputs } object or writeActiveStyle for active style
   */
  writeRootValue(value: any, prop?: cd.IPropertyGroup) {
    // currently using targetId instead of inputId for dirty tracking
    const overrideTarget = prop && prop.targetId;
    const output = this.buildOutput(overrideTarget, value);
    this.propsChange.emit(output);
  }

  writeActiveStyle(obj: any, prop?: cd.IPropertyGroup) {
    const { state } = this;
    const styles = { [state]: { style: { ...obj } } };
    this.writeRootValue({ styles }, prop);
  }

  get state() {
    const { mergedProps } = this;
    return mergedProps?.state || cd.State.Default;
  }

  get symbolInstanceInputs() {
    return (this.mergedProps as cd.ISymbolInstanceProperties)?.instanceInputs;
  }

  onSymbolOverrideDisabled(input: cd.IPropertyGroup, hidden: boolean) {
    const { targetId } = input;
    if (!targetId) return;
    this.writeInputsValue({ hidden }, input);
  }

  trackByFn(idx: number, input: cd.IPropertyGroup) {
    return generateTrackBy(idx, input);
  }

  trackSymbolByFn(idx: number, input: cd.IPropertyGroup) {
    return generateTrackBy(idx, input, 'sym');
  }

  binder(binding: string, value: any) {
    return { [binding]: value };
  }

  /**
   * When databound value is removed, string value of previous binding is passed as any update.
   * For data, we don't want to use this value, so for anything other than a data-bound value
   * write an empty string to remove any value for the input
   */
  onDataBoundDatasetSelect(value: cd.IDataBoundValue | null | string, context: ITemplateContext) {
    if (!cdUtils.isDataBoundValue(value)) return this.writeBinding('', context);
    const { enforceTablularData } = context.prop;
    const data = cdUtils.lookupDataBoundValue(value, this.elementProps, this.loadedData);
    const valid = !enforceTablularData || cdUtils.isTabularData(data);
    if (valid) return this.writeBinding(value, context);
    this._toastsService.addToast(config.INVALID_TABLE_DATA_TOAST);
  }

  onDatasetSelect(item: cd.SelectItemOutput, context: ITemplateContext) {
    const { action, value } = item as cd.ISelectItem;
    if (action) return this.onStoreAction(item as cd.ISelectItem); // add dataset action
    const { enforceTablularData } = context.prop;
    const valid = !enforceTablularData || cdUtils.validateDatasetForTable(value, this.loadedData);
    if (valid) return this.writeSelectValue(item as cd.ISelectItem, context);
    this._toastsService.addToast(config.INVALID_TABLE_DATA_TOAST);
  }

  onSelectedOptionChange(selectedIndex: number, context: ITemplateContext) {
    const { name, propertyTransformer, siblingTransformer } = context.prop;
    const value = { selectedIndex };
    const { loadedData } = this;
    const props = context.target as cd.PropertyModel;

    if (name && propertyTransformer) {
      const bindingValue = new ContextBindingPipe().transform(context);
      const output = propertyTransformer(bindingValue, props, loadedData);
      const boundValue = this.binder(name, output);
      Object.assign(value, boundValue);
    }

    if (siblingTransformer) {
      const siblingUpdate = siblingTransformer(value, props, loadedData);
      this.siblingUpdate.emit(siblingUpdate);
    }

    this.writeInputsValue(value, context.prop);
  }

  onSelectedValueChange(value: cd.PropertyValue, context: ITemplateContext) {
    this.writeInputsValue({ value }, context.prop);
  }

  /**
   * Writes a bound property value to the model.  If the value is bound to a
   * style, then it is written to `styles`, otherwise it is written to `inputs`.
   * @param value - The new value that was changed.
   */
  writeBinding(value: any, context: ITemplateContext) {
    const { name, propertyTransformer, siblingTransformer, bindingType } = context.prop;
    if (!name) throw new Error('Missing `name` for dynamic prop');
    const { loadedData } = this;
    const props = context.target as cd.PropertyModel;

    if (propertyTransformer) {
      const transformOutput = propertyTransformer(value, props, loadedData);
      return this.writeRootValue(transformOutput, context.prop);
    }

    if (siblingTransformer) {
      const siblingUpdate = siblingTransformer(value, props, loadedData);
      this.siblingUpdate.emit(siblingUpdate);
    }

    const boundValue = this.binder(name, value);

    // Style binding
    if (bindingType === cd.BindingType.Style) {
      this.writeActiveStyle(boundValue, context.prop);
    }
    // Input binding
    else {
      this.writeInputsValue(boundValue, context.prop);
    }
  }

  writeFrame(partial: Partial<cd.ILockingRect>) {
    for (const prop of this.props) {
      const frame = { ...prop.frame, ...partial };
      // Prevent flash when changing board frame values
      this._interactionService.updateElementRect(prop.id, frame, true);
    }
  }

  onSizeChange(frame: Partial<cd.ILockingRect>) {
    this.writeFrame(frame);
  }

  get selectedIndex() {
    return (this.mergedProps as cd.ITabProperties).inputs.selectedIndex;
  }

  get selectedValue() {
    return (this.mergedProps as cd.ISelectProperties).inputs.value;
  }

  // IMAGE SOURCE
  get source() {
    return (this.mergedProps as cd.IImageProperties).inputs.src;
  }

  onResetImage() {
    const resetConfig = configFromActionString(actions.IMAGES_RESET_SIZE);
    const storeAction = this._selectionContextService.actionForMenuSelection(resetConfig);
    if (!storeAction) return;
    this._projectStore.dispatch(storeAction);
  }

  onTypographyChange(font: cd.ITypographyStyle, prop?: cd.IPropertyGroup) {
    this.writeActiveStyle({ font }, prop);
  }

  onTextShadowAdd(target: cd.PropertyModel, prop?: cd.IPropertyGroup) {
    const styles = new StyleBindingPipe().transform(target);
    const { textShadow: ts } = styles;
    const textShadow = ts ? [...ts] : [];
    textShadow.push({ ...config.DEFAULT_TEXTSHADOW_CONFIG });
    this.writeActiveStyle({ textShadow }, prop);
  }

  onTextShadowUpdate(textShadow: cd.IShadowStyle[], prop?: cd.IPropertyGroup) {
    this.writeActiveStyle({ textShadow }, prop);
  }

  onCheckboxListChange(_children: string[], prop?: cd.IPropertyGroup) {
    this.writeInputsValue({ _children }, prop);
  }

  onPortalListChange(childPortals: cd.IGenericConfig[], prop?: cd.IPropertyGroup) {
    this.writeInputsValue({ childPortals }, prop);
  }

  onBoardPortalChange(item: cd.SelectItemOutput, prop?: cd.IPropertyGroup) {
    const { value } = item as cd.ISelectItem;
    const referenceId = value || consts.EMPTY_REFERENCE_ID;
    this.writeInputsValue({ referenceId }, prop);
  }

  onPortalSlotChange(item: cd.SelectItemOutput, context: ITemplateContext) {
    const { value } = item as cd.ISelectItem;
    const portalReferenceId = value || consts.EMPTY_REFERENCE_ID;
    this.writeBinding(portalReferenceId, context);
  }

  onStoreAction(evt: cd.ISelectItem) {
    this.action.emit(evt);
  }

  onGenericColorInput(value: string | cd.ISelectItem, context: ITemplateContext) {
    // Handles when the user selects "New Theme Color..."
    if ((value as cd.ISelectItem).action) return this.onStoreAction(value as cd.ISelectItem);

    // If binding is CSS variable and value is an ISelectItem, convert to IValue
    // Otherwise, use raw string type for property/attribute bindings
    const isCssVar = context.prop.bindingType === cd.BindingType.CssVar;
    const processed =
      cdUtils.isIValue(value) && isCssVar
        ? cdUtils.iValueFromAny(value)
        : cdUtils.valueFromIValue(value);
    this.writeBinding(processed, context);
  }

  buildSymbolChildProps() {
    const { isolatedSymbol, mergedProps } = this;
    const id = mergedProps.id;
    this.exposedSymbolInputs = areSymbolInputsExposedForElement(id, isolatedSymbol);
    this._cdRef.markForCheck();
  }

  onToggleExposedSymbolProps(disabled: boolean) {
    const { isolatedSymbol, mergedProps } = this;
    if (!isolatedSymbol) return;
    const value = !disabled;
    const id = mergedProps.id;
    const exposed = isolatedSymbol.exposedInputs ?? {};
    const exposedInputs = { ...exposed, [id]: value };
    const update = cdUtils.buildPropertyUpdatePayload(isolatedSymbol.id, { exposedInputs });
    this.siblingUpdate.emit([update]);
  }
}
