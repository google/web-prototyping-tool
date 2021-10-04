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

import type * as cd from 'cd-interfaces';

export const DEFAULT_ELEMENT_CONTENT: cd.ElementContent = {
  idsCreatedInLastChange: new Set<string>(),
  idsUpdatedInLastChange: new Set<string>(),
  idsDeletedInLastChange: new Set<string>(),
  records: {},
  loaded: false,
};

export const DEFAULT_DS_CONTENT: cd.DesignSystemContent = {
  idsCreatedInLastChange: new Set<string>(),
  idsUpdatedInLastChange: new Set<string>(),
  idsDeletedInLastChange: new Set<string>(),
  records: {},
  loaded: false,
};

export const DEFAULT_ASSET_CONTENT: cd.AssetContent = {
  idsCreatedInLastChange: new Set<string>(),
  idsUpdatedInLastChange: new Set<string>(),
  idsDeletedInLastChange: new Set<string>(),
  records: {},
  loaded: false,
};

export const DEFAULT_CODE_CMP_CONTENT: cd.CodeCmpContent = {
  idsCreatedInLastChange: new Set<string>(),
  idsUpdatedInLastChange: new Set<string>(),
  idsDeletedInLastChange: new Set<string>(),
  records: {},
  loaded: false,
};

export const DEFAULT_DATASET_CONTENT: cd.DatasetContent = {
  idsCreatedInLastChange: new Set<string>(),
  idsUpdatedInLastChange: new Set<string>(),
  idsDeletedInLastChange: new Set<string>(),
  records: {},
  loaded: false,
};
