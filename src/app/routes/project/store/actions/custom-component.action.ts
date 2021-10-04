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

import { Action } from '@ngrx/store';
import * as cd from 'cd-interfaces';

const CUSTOM_COMPONENT = '[Custom Components]';
export const CUSTOM_COMPONENT_IMPORT = `${CUSTOM_COMPONENT} import`;

export class CustomComponentImport implements Action {
  readonly type = CUSTOM_COMPONENT_IMPORT;
  constructor(
    public publishEntries: cd.IPublishEntry[],
    public specificVersionId?: string,
    public swapSymbolId?: string
  ) {}
}

export type CustomComponentActions = CustomComponentImport;
