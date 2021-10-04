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

import { ISelectItem, IMenuConfig, IConfig } from 'cd-interfaces';
import * as cdDatasets from 'cd-common/datasets';
import { IPanelZeroStateItem } from '../../zero-state-menu/zero-state.interface';
export const DEFAULT_DATASET_FILENAME = 'data.json';

export enum DataMenuAction {
  UploadFile = 'upload',
  DirectInput = 'input',
  GoogleSheets = 'sheets',
  SampleTableData = 'SampleTableData',
  GenericEndpoint = 'genericEndpoint',
  Help = 'help',
}

const SAMPLE_TABLE_DATA_ITEMS: IConfig[] = [
  {
    id: cdDatasets.INSTANCE_GROUPS_DATASET.id,
    title: cdDatasets.INSTANCE_GROUPS_DATASET.name,
    action: DataMenuAction.SampleTableData,
  },
  {
    id: cdDatasets.INSTANCE_TEMPLATES_DATASET.id,
    title: cdDatasets.INSTANCE_TEMPLATES_DATASET.name,
    action: DataMenuAction.SampleTableData,
  },
  {
    id: cdDatasets.KUBERNETES_CLUSTERS_DATASET.id,
    title: cdDatasets.KUBERNETES_CLUSTERS_DATASET.name,
    action: DataMenuAction.SampleTableData,
  },
  {
    id: cdDatasets.LOG_FILES_DATASET.id,
    title: cdDatasets.LOG_FILES_DATASET.name,
    action: DataMenuAction.SampleTableData,
  },
  {
    id: cdDatasets.MICROKITCHENS_DATASET.id,
    title: cdDatasets.MICROKITCHENS_DATASET.name,
    action: DataMenuAction.SampleTableData,
  },
  {
    id: cdDatasets.PEOPLE_DATASET.id,
    title: cdDatasets.PEOPLE_DATASET.name,
    action: DataMenuAction.SampleTableData,
  },
  {
    id: cdDatasets.STORAGE_BUCKETS_DATASET.id,
    title: cdDatasets.STORAGE_BUCKETS_DATASET.name,
    action: DataMenuAction.SampleTableData,
  },
  {
    id: cdDatasets.VM_IMAGES_DATASET.id,
    title: cdDatasets.VM_IMAGES_DATASET.name,
    action: DataMenuAction.SampleTableData,
  },
  {
    id: cdDatasets.VM_INSTANCES_DATASET.id,
    title: cdDatasets.VM_INSTANCES_DATASET.name,
    action: DataMenuAction.SampleTableData,
  },
];

const EXTERNAL_SOURCE_ITEMS: IConfig[] = [
  {
    id: DataMenuAction.GenericEndpoint,
    title: 'URL...',
    icon: 'http',
    action: DataMenuAction.GenericEndpoint,
  },
  {
    id: DataMenuAction.GoogleSheets,
    title: 'Google Sheets...',
    icon: 'view_list',
    action: DataMenuAction.GoogleSheets,
  },
];

export const DATA_MENU: ISelectItem[] & IMenuConfig[] = [
  {
    title: 'Direct input...',
    icon: 'edit',
    value: DataMenuAction.DirectInput,
  },
  {
    title: 'Upload JSON file...',
    icon: 'file_upload',
    value: DataMenuAction.UploadFile,
  },
  {
    title: 'Sample table data',
    icon: 'table_chart',
    value: DataMenuAction.SampleTableData,
    children: SAMPLE_TABLE_DATA_ITEMS,
  },
  {
    title: 'External source',
    icon: 'cloud circle',
    value: DataMenuAction.GenericEndpoint,
    children: EXTERNAL_SOURCE_ITEMS,
    divider: true,
  },
  {
    title: 'Help',
    icon: 'help_outline',
    value: DataMenuAction.Help,
  },
];

export const DATA_ZEROSTATE_ITEMS: IPanelZeroStateItem[] = [
  {
    id: DataMenuAction.DirectInput,
    title: 'Direct input',
    desc: 'Create a JSON object that can be bound to components',
    icon: 'edit',
  },
  {
    id: DataMenuAction.UploadFile,
    title: 'Upload file',
    desc: 'Select a .json file to import into this project',
    icon: 'file_upload',
  },
  {
    id: DataMenuAction.GoogleSheets,
    title: 'Google Sheets',
    desc: 'Import data from Google Sheets into this project',
    icon: 'view_list',
  },
];

export const COPY_ID_MESSAGE = 'Dataset ID copied to clipboard';
export const UPLOADING_MESSAGE = 'Uploading JSON dataset...';
export const UPLOAD_SUCCESS_MESSAGE = 'Succesfully added dataset';
export const UPLOAD_FAILED_MESSAGE = 'Failed to add dataset';
export const REPLACE_SUCCESS_MESSAGE = 'Succesfully replaced dataset';
export const REPLACE_FAILED_MESSAGE = 'Failed to replace dataset';
export const REMOVE_DATASET_TITLE = 'Remove dataset?';
export const REMOVE_DATASET_MESSAGE = 'This will permently remove this dataset from the project.';
export const DUPLICATING_MESSAGE = 'Duplicating JSON dataset...';
export const DUPLICATE_SUCCESS_MESSAGE = 'Succesfully duplicated dataset';
export const DUPLICATE_FAILED_MESSAGE = 'Failed to duplicate dataset';
export const INVALID_JSON_FILE_TOAST = {
  id: 'invalidJsonFileToast',
  message: 'Error: File contains invalid JSON',
  iconName: 'error_outline',
};
export const UPLOAD_TOAST_ID = 'uploadToastId';
export const UPLOADING_TOAST = {
  id: UPLOAD_TOAST_ID,
  message: UPLOADING_MESSAGE,
  showLoader: true,
};
export const DUPLICATE_TOAST_ID = 'duplicateToastId';
export const DUPLICATING_TOAST = {
  id: DUPLICATE_TOAST_ID,
  message: DUPLICATING_MESSAGE,
  showLoader: true,
};

export enum DataSetAction {
  Rename = 'Rename',
  Duplicate = 'Duplicate',
  Replace = 'Replace',
  Download = 'Download',
  Delete = 'Delete',
  CopyId = 'Copy Id',
}

export const DATASET_LIST_ITEM_MENU_DATA: IMenuConfig[] = [
  {
    id: DataSetAction.Rename,
    title: DataSetAction.Rename,
    icon: 'edit',
  },
  {
    id: DataSetAction.Duplicate,
    title: DataSetAction.Duplicate,
    icon: 'file_copy',
  },
  {
    id: DataSetAction.Replace,
    title: DataSetAction.Replace,
    icon: 'swap_calls',
  },
  {
    id: DataSetAction.Download,
    title: DataSetAction.Download,
    icon: 'cloud_download',
  },
  {
    id: DataSetAction.CopyId,
    title: DataSetAction.CopyId,
    icon: 'content_copy',
    divider: true,
  },
  {
    id: DataSetAction.Delete,
    title: DataSetAction.Delete,
    icon: 'delete',
  },
];

export const DIRECT_INPUT_INITIAL_JSON = {
  key: 'value',
};
