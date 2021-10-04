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

import { Injectable } from '@angular/core';
import { DATASET_DELIMITER, ELEMENT_PROPS_DATASET_KEY } from 'cd-common/consts';
import * as utils from 'cd-common/utils';
import * as cd from 'cd-interfaces';
import { isObject } from 'cd-utils/object';
import { createJsonBlob } from 'cd-utils/files';
import { BehaviorSubject, Subject } from 'rxjs';
import { isStoredDataset } from 'cd-common/utils';

const ELEMENT_PROPS_CONFIG: cd.IPickerDataset = {
  id: ELEMENT_PROPS_DATASET_KEY,
  name: 'Project elements',
  pickerType: cd.DataPickerType.ProjectElements,
};

const SYMBOL_PROPS_CONFIG: cd.IPickerDataset = {
  id: ELEMENT_PROPS_DATASET_KEY,
  name: 'Component elements',
  pickerType: cd.DataPickerType.ProjectElements,
};

@Injectable({ providedIn: 'root' })
export class DataPickerService {
  private _isoloatedSymbolId?: string;
  private _elementProperties?: cd.ElementPropertiesMap | null;
  private _datasets = new Map<string, cd.IPickerDataset>();
  private _data = new Map<string, any>();
  private _loadedStoragePaths = new Set<string>();
  public loadedData$ = new BehaviorSubject<Record<string, any>>({});
  public updateData$ = new Subject<cd.IPickerDataset>();
  public openAddDatasetMenu$ = new Subject<void>();

  exitSymbolIsolationMode() {
    this._isoloatedSymbolId = undefined;
  }

  setSymbolIsolationMode(id: string) {
    this._isoloatedSymbolId = id;
  }

  setElementProperties(props: cd.ElementPropertiesMap) {
    this._elementProperties = props;
  }

  addDataSource(dataset: cd.IDataset, value: any, pickerType = cd.DataPickerType.Default) {
    const { id, name } = dataset;
    this._datasets.set(id, { id, name, pickerType });
    this._data.set(id, value);
    if (isStoredDataset(dataset)) this._loadedStoragePaths.add(dataset.storagePath);
    this.emitLoadedDataChange();
  }

  updateDataSourceName(datasetId: string, name: string) {
    const currentValue = this._datasets.get(datasetId);
    if (!currentValue) return;
    this._datasets.set(datasetId, { ...currentValue, name });
  }

  addDataSourceWithBlobValue = async (dataset: cd.IDataset, blobValue: Blob) => {
    try {
      const pickerType = cd.DataPickerType.Default;
      const blobText = await blobValue.text();
      const value = JSON.parse(blobText);
      this.addDataSource(dataset, value, pickerType);
    } catch (e) {
      console.warn('Tried to load invalid data into data picker', e);
    }
  };

  emitLoadedDataChange() {
    const loadedData = this.getLoadedData();
    this.loadedData$.next(loadedData);
  }

  updateDataSource(datasetId: string, value: any) {
    if (!this._data.has(datasetId)) return;
    this._data.set(datasetId, value);
    this.emitLoadedDataChange();
  }

  updateBlobDataSource = async (datasetId: string, blob: Blob) => {
    const blobText = await blob.text();
    const value = JSON.parse(blobText);
    return this.updateDataSource(datasetId, value);
  };

  removeDataSource(id: string) {
    this._datasets.delete(id);
    this._data.delete(id);
  }

  hasDatasetData(dataset: cd.ProjectDataset): boolean {
    // For a stored dataset, we lookup if the storage path to its JSON file is loaded.
    // This path can change as edits are made, so don't rely on just the dataset id
    if (utils.isStoredDataset(dataset)) return this._loadedStoragePaths.has(dataset.storagePath);

    // For other types of datasets, we just use the id
    // return this._data.has(dataset.id);
    return false;
  }

  get elemPropsConfig() {
    return this._isoloatedSymbolId ? SYMBOL_PROPS_CONFIG : ELEMENT_PROPS_CONFIG;
  }

  getSourceList(): cd.IPickerDataset[] {
    return [this.elemPropsConfig, ...this._datasets.values()];
  }

  stringifyData(data?: {}): string {
    return data ? JSON.stringify(data, null, 1) : '';
  }

  dataSetForKey(id: string) {
    return id === ELEMENT_PROPS_DATASET_KEY ? this.elemPropsConfig : this._datasets.get(id);
  }

  getElementProperties() {
    return this._elementProperties;
  }

  dataForKey(id: string): cd.ElementPropertiesMap | {} | undefined {
    return id === ELEMENT_PROPS_DATASET_KEY ? this._elementProperties : this._data.get(id);
  }

  getValue(value?: cd.IDataBoundValue): any {
    if (!utils.isDataBoundValue(value)) return;
    const data = this.dataForKey(value._$coDatasetId);
    if (!data) return;
    const item = utils.lookupValueInData(data, value.lookupPath);
    if (isObject(item)) return JSON.stringify(item);
    return item;
  }

  getParsedDataSourceForId(id: string): cd.IPickerDataset | undefined {
    const dataSet = this.dataSetForKey(id);
    if (!dataSet) return;
    const data = this.dataForKey(id);
    const value = this.stringifyData(data);
    const symbolId = this._isoloatedSymbolId;
    return { ...dataSet, value, symbolId };
  }

  getDataRefFromId(id: string) {
    const [refId] = id.split(DATASET_DELIMITER);
    return refId;
  }

  getLoadedData(): Record<string, any> {
    return Object.fromEntries(this._data.entries());
  }

  getLoadedDataBlobs(): Record<string, Blob> {
    const entries = Object.entries(this.loadedData$.value);
    const blobEntries = entries.map<[string, Blob]>(([key, value]) => [key, createJsonBlob(value)]);
    return Object.fromEntries(blobEntries);
  }

  /** Used by the data picker demo for debug purposes */
  get sources(): cd.IPickerDataset[] {
    const data = [...(this._datasets.values() || [])];
    const mapped = data.map(({ id }) => this.getParsedDataSourceForId(id)) as cd.IPickerDataset[];
    const element = this.getParsedDataSourceForId(ELEMENT_PROPS_DATASET_KEY);
    const elem = element ? [element] : [];
    return [...elem, ...mapped];
  }

  sourceUpdate(value: cd.IPickerDataset) {
    this.updateData$.next(value);
  }

  reset() {
    this._elementProperties = null;
    this._datasets.clear();
    this._data.clear();
  }
}
