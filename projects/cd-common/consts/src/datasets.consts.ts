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

export const DATASETS_STORAGE_PATH_PREFIX = 'datasets';
export const ELEMENT_PROPS_DATASET_KEY = 'cd-element-props';
export const DATASET_SIZE_LIMIT_ERROR = 'Dataset size limit exceeded. Limit is 512 KB';

// TODO: increase limit once data-tree can handle it
export const DATASET_SIZE_LIMIT = 512000; // 512 KB

export const DATA_CHIP_TAG = 'cd-data-chip';
export const DATA_CHIP_SOURCE_ATTR = 'source';
export const DATA_CHIP_LOOKUP_ATTR = 'lookup';

export const DATASET_DELIMITER = '.';
