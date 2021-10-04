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

import { EntityType } from './entity-types';
import { IProjectContentDocument } from './project';

export interface IBaseDataset {
  /** Unique id of the dataset */
  id: string;

  /** Display name of the dataset */
  name: string;

  /** Property keys within the data that can be bound to */
  dataKeys?: string[];
}

/**
 * This is a legacy interfaced used only for the datasets that we load into the Table.
 * Eventually this should be removed
 * */
export interface IBuiltInDataset extends IBaseDataset {
  /**
   * Url from where to load the JSON payload of the dataset
   * For the Cloud Platform table this data is assumed to be an array of Objects
   * */
  url: string;
}

/** Interfaces for the data picker component */
export enum DataPickerType {
  Default,
  ProjectElements,
  A11yProps,
}

export interface IPickerDataset extends IBaseDataset {
  pickerType: DataPickerType;
  /** Used to let the UI know if you're in symbol isolation mode */
  symbolId?: string;
  /** Actual data value */
  value?: string;
}

/** Interfaces for dataset documents that are dynamically added to a project by the user */
export enum DatasetType {
  Json = 'Json',
  GoogleSheets = 'GoogleSheets',
  GenericEndpoint = 'GenericEndpoint',
}

export interface IDataset extends IBaseDataset, IProjectContentDocument {
  /** Project document type */
  type: EntityType.Dataset;

  /** type of dataset. Informs where to load the data from */
  datasetType: DatasetType;
}

export interface IStoredDataset extends IDataset {
  /** Path in Firebase storage from where to load this dataset */
  storagePath: string;
}

export interface IJsonDataset extends IStoredDataset {
  datasetType: DatasetType.Json;
}

export interface IGoogleSheetsDataset extends IStoredDataset {
  datasetType: DatasetType.GoogleSheets;

  /** ID of the google sheet */
  sheetId: string;

  /** Name of the tab from the Google sheet */
  tabId: string;
}

export interface IGenericEndpointDataset extends IStoredDataset {
  datasetType: DatasetType.GenericEndpoint;

  /** URL used to get data */
  url: string;
}

export type ProjectDataset = IJsonDataset | IGoogleSheetsDataset | IGenericEndpointDataset;

export interface IDataChipInputs {
  source?: string;
  lookup?: string;
}

export type DatasetMap = Record<string, ProjectDataset>;
