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

import { BUILT_IN_DATASET_LOOKUP } from 'cd-common/datasets';
import { createChangeMarker } from './change.utils';
import { isObject, isPrimitive } from 'cd-utils/object';
import { isString } from 'cd-utils/string';
import * as consts from 'cd-common/consts';
import * as cd from 'cd-interfaces';

const JSON_EXTENSION = '.json';

const DATA_SOURCE_REGEX = /source="([^"]+)"/g;

export const isDatasetDoc = (doc: cd.IProjectContentDocument): doc is cd.ProjectDataset => {
  return doc.type === cd.EntityType.Dataset;
};

export const isJsonDataset = (dataset: cd.ProjectDataset): dataset is cd.IJsonDataset => {
  return dataset.datasetType === cd.DatasetType.Json;
};

export const isStoredDataset = (dataset: cd.IDataset): dataset is cd.IStoredDataset => {
  return !!(dataset as cd.IStoredDataset).storagePath;
};

export const createJsonDataset = (
  id: string,
  projectId: string,
  name: string,
  storagePath: string
): cd.IJsonDataset => {
  const type = cd.EntityType.Dataset;
  const datasetType = cd.DatasetType.Json;
  const changeMarker = createChangeMarker();
  return { id, projectId, changeMarker, type, datasetType, name, storagePath };
};

export const createGenericEndpointDataset = (
  id: string,
  projectId: string,
  name: string,
  storagePath: string,
  url: string
): cd.IGenericEndpointDataset => {
  const type = cd.EntityType.Dataset;
  const datasetType = cd.DatasetType.GenericEndpoint;
  return { id, projectId, type, datasetType, name, storagePath, url };
};

export const createSheetsDataset = (
  id: string,
  projectId: string,
  name: string,
  storagePath: string,
  sheetId: string,
  tabId: string
): cd.IGoogleSheetsDataset => {
  const type = cd.EntityType.Dataset;
  const datasetType = cd.DatasetType.GoogleSheets;
  return { id, projectId, type, datasetType, name, storagePath, tabId, sheetId };
};

export const filterStoredDatasets = (datasets: cd.ProjectDataset[]): cd.IStoredDataset[] => {
  return datasets.filter((d) => !!(d as cd.IStoredDataset).storagePath) as cd.IStoredDataset[];
};

/**
 * Add .json to filename if not already present
 */
export const addJsonFileExtension = (fileName: string) => {
  const extensionPresent = fileName.endsWith(JSON_EXTENSION);
  return extensionPresent ? fileName : `${fileName}${JSON_EXTENSION}`;
};

/**
 * Given a '.' seporated key, convert to an array of keys
 * i.e foo.bar.baz = ['foo','bar','baz]
 */
export const convertDataSourceLookupToKeys = (lookup: string | undefined): string[] => {
  return lookup ? lookup.split(consts.DATASET_DELIMITER) : [];
};

export const lookupValueInData = (data: Record<string, any>, lookupPath?: string): any => {
  if (!data) return undefined;
  const keys = convertDataSourceLookupToKeys(lookupPath);
  return lookupObjectValueWithKeysWithinObject(data, keys);
};

/**
 * Return new object with a value written to a specified path within data
 */
export const writeValueInData = (value: any, data?: any, lookupPath?: string) => {
  if (!data || !lookupPath) return value;
  const keys = convertDataSourceLookupToKeys(lookupPath);
  return writeValueIntoObjectAtKeysLocation(value, data, keys);
};

/** Ensure each key is available within the data source */
export const validateKeysInData = (data: Record<string, any>, lookupPath?: string): boolean => {
  const keys = convertDataSourceLookupToKeys(lookupPath);
  let value = data;
  for (const key of keys) {
    if (key in value) {
      value = value[key];
    } else {
      return false;
    }
  }
  return true;
};

export const lookupDataBoundValue = (
  dataBoundValue: cd.IDataBoundValue | undefined,
  elementProperties: cd.ElementPropertiesMap,
  datasetData: Record<string, any>,
  previousLookups = new Set<string>()
): any => {
  if (!dataBoundValue) return undefined;
  const { _$coDatasetId: id, lookupPath } = dataBoundValue;
  const data = id === consts.ELEMENT_PROPS_DATASET_KEY ? elementProperties : datasetData[id];
  if (!data) return undefined;
  const isRootNode = id === lookupPath;
  const value = isRootNode ? data : lookupValueInData(data, lookupPath);
  if (!isDataBoundValue(value)) return value;

  // If we've already tried to lookup this data-bound value,
  // than a circular data-binding exists
  const lookupKey = `${value._$coDatasetId}-${value.lookupPath}`;
  if (previousLookups.has(lookupKey)) return undefined;

  previousLookups.add(lookupKey);
  return lookupDataBoundValue(value, elementProperties, datasetData, previousLookups);
};

/**
 * Given an object and array of keys, find the value
 * ['foo','bar','baz] => [{ foo:{bar:{baz:true} } } = true
 */
export const lookupObjectValueWithKeysWithinObject = (
  obj: Record<string, any>,
  keys: string[]
): unknown => {
  let value = obj;
  for (const key of keys) {
    if (!value) return undefined;
    value = value[key];
  }
  return value;
};

/**
 * Given an object and array of keys, write a new value at location specified by keys the value
 * ['foo','bar','baz] => obj.foo.bar.baz = value;
 */
export const writeValueIntoObjectAtKeysLocation = (
  value: any,
  obj: Record<string, any> | any[],
  keys: string[]
) => {
  if (!keys.length) return value; // if there are no keys, simply return value as the new object
  const newObj = Array.isArray(obj) ? [...obj] : { ...obj }; // copy the object

  // Lookup object location minus the last key, then write with last key to that object
  const lastKey = keys.pop() as string;
  const writeLocation = keys.length ? lookupObjectValueWithKeysWithinObject(newObj, keys) : newObj;
  const validWriteLocation = isObject(writeLocation);
  if (validWriteLocation) (writeLocation as any)[lastKey] = value;
  return newObj;
};

export const isDataBoundValue = (value: any): value is cd.IDataBoundValue => {
  return isObject(value) && isString(value?._$coDatasetId) && isString(value?.lookupPath);
};

/** returns true if this is a data-bound value that is also bound to another element */
export const isElementDataBoundValue = (value: any): boolean => {
  return isDataBoundValueToDataset(value, consts.ELEMENT_PROPS_DATASET_KEY);
};

export const isDataBoundValueToDataset = (value: any, datasetId: string): boolean => {
  return !!(isDataBoundValue(value) && value._$coDatasetId === datasetId);
};

export const createDataBoundValue = (datasetId: string, lookupPath: string): cd.IDataBoundValue => {
  return { _$coDatasetId: datasetId, lookupPath };
};

/** For an element, return an array of data bound input values that are bound to other elements */
export const getElementDataBoundInputs = (element?: cd.PropertyModel): cd.IDataBoundValue[] => {
  return element?.inputs ? Object.values(element.inputs).filter(isElementDataBoundValue) : [];
};

/** For an element, return a set of input keys values that have data-bound values */
export const getDataBoundInputKeys = (element: cd.PropertyModel): Set<string> => {
  if (!element?.inputs) return new Set();
  const inputEntries = Object.entries(element?.inputs);

  return inputEntries.reduce<Set<string>>((acc, curr) => {
    const [key, value] = curr;
    if (isDataBoundValue(value)) acc.add(key);
    return acc;
  }, new Set());
};

/** returns all of the inputs that are bound to a specific dataset */
export const getDataBoundInputsToDataset = (
  element: cd.PropertyModel,
  datasetId: string
): cd.IStringMap<cd.IDataBoundValue> | undefined => {
  if (!element.inputs) return undefined;
  const inputEntries = Object.entries(element.inputs);
  return inputEntries.reduce<cd.IStringMap<cd.IDataBoundValue>>((acc, [key, value]) => {
    if (!isDataBoundValueToDataset(value, datasetId)) return acc;
    acc[key] = value;
    return acc;
  }, {});
};

/**
 * For each input, replace the data-binding with the current value lookup.
 * If the current value is not a primitive value, it is replaced with null
 */
export const replaceDataBindingsWithValue = (
  inputs: cd.IStringMap<cd.IDataBoundValue>,
  elementProperties: cd.ElementPropertiesMap,
  datasetData: Record<string, any>
): cd.IStringMap<any> => {
  const inputEntries = Object.entries(inputs);
  return inputEntries.reduce<cd.IStringMap<any>>((acc, [key, value]) => {
    const boundValue = lookupDataBoundValue(value, elementProperties, datasetData);
    const primitiveValue = isPrimitive(boundValue);

    // If the bound value is not a primitive, we remove it
    acc[key] = primitiveValue ? boundValue : null;
    return acc;
  }, {});
};

/** Given a Element databound value (i.e. bound to an element input) returns the id*/
export const getDataBindingElementId = (databoundValue: cd.IDataBoundValue): string => {
  return convertDataSourceLookupToKeys(databoundValue.lookupPath)[0];
};

/**
 * Given an element databound value (i.e. bound to an element input) returns the input key
 * that it is bound to
 */
export const getDataBindingInputKey = (databoundValue: cd.IDataBoundValue): string | undefined => {
  return convertDataSourceLookupToKeys(databoundValue.lookupPath).pop();
};

/** For an element, return true if any of its inputs are data bound to other elements */
export const hasElementDataBoundInputs = (element?: cd.PropertyModel): boolean => {
  return element?.inputs ? Object.values(element.inputs).some(isElementDataBoundValue) : false;
};

export const getDataSourceReferencesFromHtml = (html?: any): string[] => {
  const matches = Array.from(String(html).matchAll(DATA_SOURCE_REGEX));
  return matches.map((m) => m[1]);
};

/**
 * An element can be bound to a dataset via a string value that represents a datasetId
 * (e.g. the table) or via a dataBound value that points to a path within a dataset
 *
 * This function return an array of dataset ids used by the element
 */
const getElementDatasetIds = (allDatasetIds: Set<string>, element?: cd.PropertyModel): string[] => {
  let datasetIds: string[] = [];
  if (!element?.inputs) return datasetIds;
  const inputEntries = Object.entries(element.inputs);

  // Using a for loop for performance - potentially looping over inputs of many elements
  for (const [key, value] of inputEntries) {
    if (allDatasetIds.has(value)) {
      datasetIds.push(value);
      continue;
    }
    if (isDataBoundValue(value) && value._$coDatasetId !== consts.ELEMENT_PROPS_DATASET_KEY) {
      datasetIds.push(value._$coDatasetId);
      continue;
    }
    // check for data chips inside of rich text
    if (key === consts.INNER_HTML && value) {
      const sourceIds = getDataSourceReferencesFromHtml(value);
      const ids = sourceIds.filter((s) => s !== consts.ELEMENT_PROPS_DATASET_KEY);
      datasetIds = [...datasetIds, ...ids];
    }
  }

  // filter out any dataset reference that may be invalid
  return datasetIds.filter((id) => allDatasetIds.has(id));
};

export const getDatasetIdsUsedByElements = (
  datasetIds: Set<string>,
  elements: cd.PropertyModel[]
): Set<string> => {
  const datasetsUsedByElements = elements.map((e) => getElementDatasetIds(datasetIds, e)).flat();
  return new Set(datasetsUsedByElements);
};

/**
 * Test that the passed in data is an array of objects or at least an empty array
 */
export const isTabularData = (data: any): boolean => {
  if (!Array.isArray(data)) return false;
  return data.every(isObject);
};

export const validateDatasetForTable = (
  datasetId: string,
  loadedData: Record<string, any>
): boolean => {
  if (!datasetId) return true; // Allow 'None' dataset
  if (BUILT_IN_DATASET_LOOKUP[datasetId]) return true;
  return isTabularData(loadedData[datasetId]);
};

/**
 * Test to make sure that file contents are valid JSON
 */
export const validateJsonFile = async (jsonFile?: File): Promise<boolean> => {
  if (!jsonFile) return false;
  try {
    const fileText = await jsonFile.text();
    JSON.parse(fileText);
    return true;
  } catch {
    return false;
  }
};
