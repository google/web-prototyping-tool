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
import { areObjectsEqual, filterOutKeysFromObject } from 'cd-utils/object';
import { PostMessageRetargetOutlet } from 'cd-common/services';
import { ActionEventMaps } from './interactions/action.utils';
import { DEFAULT_A11Y_MODE_STATE } from 'cd-common/consts';
import { generateStyle } from 'cd-common/utils';
import { isSymbolInstance } from 'cd-common/models';
import { IStateChange } from './utils/interfaces';
import { fetchJSON } from 'cd-utils/files';
import { Subject } from 'rxjs';
import { toKebabCase } from 'cd-utils/string';
import * as utils from 'cd-common/utils';
import type * as cd from 'cd-interfaces';
import { IIdsSummary } from './utils/renderer.utils';

/** We expect this element to be a symbol instance, if it isn't throw a warning */
export const elementIsSymbolInstanceGaurd = (
  element: cd.PropertyModel
): element is cd.ISymbolInstanceProperties => {
  const isInstance = isSymbolInstance(element);
  if (!isInstance) console.warn('Attempt made to update instanceinputs on a non-symbol');
  return isInstance;
};

export const buildStateChange = (
  id: string,
  payload: Record<string, any>,
  instanceId?: string
): IStateChange => {
  return { id, payload, instanceId };
};

export class RendererStateManager {
  public showHotspots = true;
  public boardsMap: cd.IStringMap<cd.IBoardProperties> = {};
  public stylesMap: cd.IStringMap<cd.IStyleAttributes> = {};
  public propertiesLoaded = false;
  public designSystem?: cd.IDesignSystem;
  public assets: cd.AssetMap = {};
  public previewMode = false;
  public a11yMode: cd.IA11yModeState = DEFAULT_A11Y_MODE_STATE;
  public cssVars: cd.KeyValueTuple[] = [];
  public preview?: cd.IElementChangePayload[]; // current drop preview
  public idsInPreview?: IIdsSummary; // ids that are affected by current drop preview
  public applicationTheme: cd.IStringMap<string> = {};
  public codeComponents = new Map<string, cd.ICodeComponentDocument>();
  public codeComponentJsBlobUrls = new Map<string, string>();

  /** Metadata for each dataset currently loaded in the renderer */
  public datasets: Record<string, cd.IBuiltInDataset> = {};

  /** Fetched JSON payload for each dataset currently loaded in the renderer */
  public loadedData: Record<string, any> = {};
  public dataLoaded$ = new Subject<void>();
  public stateDidChange$ = new Subject<void>();
  /**
   * This trigger is passed as a param into each instance of dataBindingLookupPipe.
   * This way we can call dataBindingRefreshTrigger$.next()
   * and it will trigger an update to any data bindings
   */
  public dataBindingRefreshTrigger$ = new Subject<Symbol>();

  /** record set of requested datasets to prevent duplicate requests */
  private requestedDatasets = new Set<string>();

  public retargetOutletInternal$ = new Subject<PostMessageRetargetOutlet>();

  // Flag to mark that renderer is running as an exported standalone projectt
  public exportMode = false;

  private _baseProperties: cd.ElementPropertiesMap = {};
  private _previewProperties?: cd.ElementPropertiesMap;
  // mergedProperties is what elements in compiled template are bound to.
  // It is produced by combining elementProperties and previewProperties above
  // where preview properties overrides what is in elementProperties
  public mergedProperties: cd.ElementPropertiesMap = {};
  public actionEvents = new ActionEventMaps();

  get fonts(): cd.IStringMap<cd.IFontFamily> | undefined {
    return this.designSystem ? this.designSystem.fonts : undefined;
  }

  get baseProperties(): cd.ElementPropertiesMap {
    return this._baseProperties;
  }

  set baseProperties(props: cd.ElementPropertiesMap) {
    this._baseProperties = props;
    this.mergedProperties = this._previewProperties || this._baseProperties;
    if (this.previewMode || this.exportMode) this.actionEvents.update(props);
    this.refreshDataBindings();
    this.stateChangeEvent();
  }

  get previewProperties(): cd.ElementPropertiesMap | undefined {
    return this._previewProperties;
  }

  set previewProperties(props: cd.ElementPropertiesMap | undefined) {
    this._previewProperties = props;
    this.mergedProperties = this._previewProperties || this._baseProperties;
  }

  get boardClickActionElementIds(): Map<string, string[]> {
    return this.actionEvents.boardClickActions;
  }

  stateChangeEvent() {
    this.stateDidChange$.next();
  }

  refreshDataBindings() {
    this.dataBindingRefreshTrigger$.next(Symbol());
  }

  resetActionMaps() {
    this.actionEvents.reset();
  }

  hasElement(id: string): boolean {
    return id in this.mergedProperties;
  }

  getElementById(id: string): cd.PropertyModel | undefined {
    return this.mergedProperties[id];
  }

  doElementsExist(...ids: string[]): boolean {
    return ids.every((id) => this.getElementById(id) !== undefined);
  }

  get projectBindings(): cd.IProjectBindings | undefined {
    const { designSystem, assets } = this;
    if (!designSystem || !assets) return;
    return { designSystem, assets };
  }

  updateInputsOnElement(
    id: string,
    inputs: Partial<cd.PropertyModelInputs>,
    symbolChildId?: string,
    stateChangeRecording = false
  ) {
    if (!inputs) return;
    const element = this.getElementById(id);
    if (!element) return;

    // Prevent overwriting data-bound values with new input values unless this input change is from
    // a user recorded state-change action. Part of that recording may including updating/removing
    // the data-binding which we don't want to prevent
    const dataBoundInputKeys = utils.getDataBoundInputKeys(element);
    const filteredInputs = !stateChangeRecording
      ? filterOutKeysFromObject(inputs, dataBoundInputKeys)
      : inputs;

    // Redirect new inputs values to the data-bound location (i.e. two-way data-binding)
    if (dataBoundInputKeys.size && !stateChangeRecording) {
      this.redirectDataBoundInputUpdates(element, dataBoundInputKeys, inputs, symbolChildId);
    }

    if (symbolChildId) return this.updateInstanceInputs(id, element, filteredInputs, symbolChildId);

    // Normal Input Updates
    element.inputs = { ...element.inputs, ...filteredInputs } as cd.PropertyModelInputs;

    // trigger refresh of any data bindings in case there is a binding setup for these inputs
    this.refreshDataBindings();
    this.stateChangeEvent();
  }

  /**
   * Take the newInput values and redirect each of them to where the element input is data-bound
   *
   * If the input is data-bound to another element, write the new input value to that
   * element's inputs.
   *
   * If the input is data-bound to a dataset, write the new value to the data-binding location
   * within the dataset data
   */
  private redirectDataBoundInputUpdates(
    element: cd.PropertyModel,
    dataBoundInputKeys: Set<string>,
    newInputs: Partial<cd.PropertyModelInputs>,
    symbolChildId?: string
  ) {
    if (!element.inputs || !newInputs) return;
    const currentInputs = Object.entries(element.inputs);
    const dataBoundInputs = currentInputs.filter(([key]) => dataBoundInputKeys.has(key));

    // For each data-bound input on the element, check to see if we have a new value for it
    // If so, write that new value to the data-binding location
    for (const [key, value] of dataBoundInputs) {
      if (!(key in newInputs)) continue;
      const dataBoundValue = value as cd.IDataBoundValue;
      const newValue = (newInputs as any)[key];

      // Redirect new value to element
      if (utils.isElementDataBoundValue(dataBoundValue)) {
        const elementId = utils.getDataBindingElementId(dataBoundValue);
        const inputKey = utils.getDataBindingInputKey(dataBoundValue);
        if (!inputKey) continue;
        const elementInputs = { [inputKey]: newValue };
        this.updateInputsOnElement(elementId, elementInputs, symbolChildId);
      }
      // Redirect new value to dataset
      else {
        const datasetId = dataBoundValue._$coDatasetId;
        const data = this.loadedData[datasetId];
        if (!data) continue;
        const updatedData = utils.writeValueInData(newValue, data, dataBoundValue.lookupPath);
        this.loadedData[datasetId] = updatedData;
      }
    }
  }

  generateStylesForIds = (ids: string[]) => {
    const { designSystem, assets, mergedProperties, stylesMap } = rendererState;
    if (designSystem && assets) {
      const styles: cd.IStyleDeclaration = {};
      for (const id of ids) {
        const props = mergedProperties[id];
        if (!props) continue;
        styles[id] = generateStyle(props.styles, { designSystem, assets });
      }
      this.stylesMap = { ...stylesMap, ...styles };
    }
  };

  updateInstanceInputs(
    id: string,
    element: cd.PropertyModel,
    inputs: Partial<cd.PropertyModelInputs>,
    symbolChildId: string
  ) {
    if (!elementIsSymbolInstanceGaurd(element)) return;
    const payload = { [symbolChildId]: { inputs: { ...inputs } } };
    this.updateSymbolInstance(id, element, symbolChildId, payload);
    this.refreshDataBindings();
  }

  updateSymbolInstance(
    elementId: string,
    element: cd.ISymbolInstanceProperties,
    symbolChildId: string,
    payload: any
  ) {
    const dirtyInputsPayload = { [symbolChildId]: true };
    const instanceInputs = utils.deepMerge(element.instanceInputs, payload);
    const dirtyInputs = utils.deepMerge(element.dirtyInputs, dirtyInputsPayload);
    const instance: cd.ISymbolInstanceProperties = { ...element, instanceInputs, dirtyInputs };
    this.mergedProperties[elementId] = instance;
    this.stateDidChange$.next();
  }

  updateInstanceStyles(
    id: string,
    element: cd.PropertyModel,
    symbolChildId: string,
    key: string,
    value: any
  ): boolean {
    if (!elementIsSymbolInstanceGaurd(element)) return false;
    const instanceValues = element.instanceInputs[symbolChildId];
    const baseStyle: cd.IStyleDeclaration = instanceValues?.styles?.base?.style || {
      styles: { base: { style: {} } },
    };

    if (value === null) {
      if (baseStyle?.[key]) {
        delete baseStyle[key];
        return true;
      }
    } else {
      const originalValue = baseStyle?.[key];
      if (areObjectsEqual(originalValue, value)) return false;
      const style = { [key]: value };
      const payload = { [symbolChildId]: { styles: { base: { style } } } };
      this.updateSymbolInstance(id, element, symbolChildId, payload);
    }

    return true;
  }

  updateStyleMapForElement(
    elementId: string,
    origKey: string,
    value: any,
    symChildId?: string
  ): boolean {
    const key = toKebabCase(origKey);
    const updated = this.updateStyleOnElement(elementId, key, value, symChildId);
    if (!updated) return false;
    const model = this.getElementById(elementId);
    const { projectBindings } = this;
    if (!model || !projectBindings) return false;
    this.stylesMap[elementId] = generateStyle(model.styles, projectBindings);
    return true;
  }

  /**
   * Updates the styles for an element only if style has changed,
   * returns a boolean to know if there was a change
   * */
  updateStyleOnElement(elementId: string, key: string, value: any, symChildId?: string): boolean {
    const element = this.getElementById(elementId);
    if (!element) return false;

    // Handle Symbol instance style changes
    if (symChildId) return this.updateInstanceStyles(elementId, element, symChildId, key, value);

    // Handle Normal style changes
    const baseStyle = utils.getElementBaseStyles(element);

    if (value === null) {
      if (baseStyle?.[key]) {
        delete baseStyle[key];
        return true;
      }
    } else {
      const style = { [key]: value };

      const originalValue = utils.getElementBaseStyles(element)?.[key];
      if (areObjectsEqual(originalValue, value)) return false;
      element.styles.base.style = { ...baseStyle, ...style };
    }

    return true;
  }

  mergeStyleOverrides(styleState: cd.IStyleGroup, overrides: cd.IKeyValue[], didToggle = false) {
    // Generate a list of style keys in the list of overrides i.e [background, border-radius, etc]
    const currentKeys = overrides.map((item) => item.name);
    const current = styleState.overrides || [];
    // out of the currently applied overrides, filter out any items that will be overwritten
    const filterCurrentKeys = current.filter((item) => !currentKeys.includes(item.name));
    // If this is a toggle action, set the current state to the overides (original value)
    // otherwise merge (add) the overrides to the existing state
    return didToggle ? overrides : [...filterCurrentKeys, ...overrides];
  }

  /** Handle css overrides inside symbol instances */
  mergeInstanceStyleOverrides(
    element: cd.PropertyModel,
    symbolChildId: string,
    state: string,
    overrides: cd.IKeyValue[],
    didToggle: boolean
  ) {
    if (!elementIsSymbolInstanceGaurd(element)) return;
    const instanceValues = element.instanceInputs[symbolChildId];
    const styleState = instanceValues?.styles?.[state] as cd.IStyleGroup;
    const currentOverrides = styleState || { overrides: [] };
    const mergedOverrides = this.mergeStyleOverrides(currentOverrides, overrides, didToggle);
    const payload = { [symbolChildId]: { styles: { [state]: { overrides: mergedOverrides } } } };
    this.updateSymbolInstance(element.id, element, symbolChildId, payload);
  }

  replaceStyleOverrides(
    elementId: string,
    state: string,
    overrides: cd.IKeyValue[],
    didToggle = false,
    symChildId?: string
  ) {
    const element = this.getElementById(elementId);
    if (!element) return;
    if (symChildId) {
      return this.mergeInstanceStyleOverrides(element, symChildId, state, overrides, didToggle);
    }

    const styleState = element.styles[state];
    if (styleState) {
      const merged = this.mergeStyleOverrides(styleState, overrides, didToggle);
      Object.assign(styleState, { overrides: merged });
    } else {
      Object.assign(element.styles, { [state]: { overrides } });
    }
  }

  setPreviewMode(mode: boolean) {
    if (this.previewMode === mode) return;
    this.previewMode = mode;
    if (mode === false) return this.resetActionMaps();
    this.actionEvents.update(this._baseProperties);
  }

  setA11yMode(mode: cd.IA11yModeState) {
    if (areObjectsEqual(this.a11yMode, mode)) return;
    this.a11yMode = mode;
  }

  getStyleForKey(key: string, style: any) {
    const { designSystem, assets } = this;
    if (!designSystem) return;
    return utils.styleForKey(key, style, { designSystem, assets });
  }

  resetPreview() {
    this.preview = undefined;
    this.previewProperties = undefined;
    this.idsInPreview = undefined;
  }

  updatePreview(
    preview: cd.IElementChangePayload[],
    previewProperties: cd.ElementPropertiesMap,
    idsInPreview: IIdsSummary
  ) {
    this.preview = preview;
    this.previewProperties = previewProperties;
    this.idsInPreview = idsInPreview;
  }

  reset() {
    this.boardsMap = {};
    this.stylesMap = {};
    this.mergedProperties = {};
    this.propertiesLoaded = false;
    this.designSystem = undefined;
    this.assets = {};
    this.previewMode = false;
    this.a11yMode = DEFAULT_A11Y_MODE_STATE;
    this.preview = undefined;
    this.baseProperties = {};
    this.previewProperties = undefined;
    this.codeComponents = new Map();
    this.codeComponentJsBlobUrls = new Map();
    this.loadedData = {};
    this.requestedDatasets = new Set();
  }

  get codeCompFonts() {
    return [...this.codeComponents.values()].reduce<cd.IStringMap<cd.IFontFamily>>((acc, curr) => {
      const list = curr.fontList || [];
      for (const item of list) {
        acc[item.family] = item;
      }
      return acc;
    }, {});
  }

  get allFonts(): cd.IStringMap<cd.IFontFamily> {
    return { ...this.fonts, ...this.codeCompFonts };
  }

  loadDataForBuiltInDataset = async (datasetId: string) => {
    const { requestedDatasets } = this;
    const dataset = this.datasets[datasetId];
    const url = dataset?.url;
    if (!url || requestedDatasets.has(datasetId)) return;

    try {
      // prevent requesting same dataset more than once
      requestedDatasets.add(datasetId);

      // fetch json payload for dataset
      const data = await fetchJSON<any>(url);

      // save into renderer state, and spread new object to trigger change detection
      this.loadedData = { ...this.loadedData, [datasetId]: data };

      // tell renderer to update outlets
      this.refreshDataBindings();
      this.dataLoaded$.next();
    } catch (err) {
      console.error(`Failed to fetch data for dataset: ${datasetId}`, err);
    }
  };

  addCodeComponentBlobs = async (jsBundleBlobs: Record<string, Blob>) => {
    const entries = Object.entries(jsBundleBlobs);
    for (const [id, blob] of entries) {
      const overriddenBlob = await utils.addCustomElementDefineOverrideToJsBlob(id, blob);
      const url = URL.createObjectURL(overriddenBlob);
      this.codeComponentJsBlobUrls.set(id, url);
    }
  };

  removeCodeComponent(id: string) {
    this.codeComponents.delete(id);
    this.codeComponentJsBlobUrls.delete(id);
  }
}

export const rendererState = new RendererStateManager();
