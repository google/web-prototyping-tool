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
  CODE_COMPONENTS_STORAGE_PATH_PREFIX,
  DATASETS_STORAGE_PATH_PREFIX,
} from 'cd-common/consts';

const storagePathForId = (folderPrefix: string, id: string, filename: string): string => {
  return `${folderPrefix}/${id}/${filename}`;
};

export const storagePathForCodeComponentBundle = (id: string, filename: string): string => {
  return storagePathForId(CODE_COMPONENTS_STORAGE_PATH_PREFIX, id, filename);
};

export const storagePathForJsonDatasetFile = (id: string, filename: string): string => {
  return storagePathForId(DATASETS_STORAGE_PATH_PREFIX, id, filename);
};
