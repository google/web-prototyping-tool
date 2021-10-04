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

export const PUBLISH = '[Publish]';

export const PUBLISH_RESULT = `${PUBLISH} publish result`;

export const PUBLISH_ENTRIES_LOADED = `${PUBLISH} publish entries loaded`;

export const PUBLISH_ENTRY_UPDATE = `${PUBLISH} publish entry update`;
export const PUBLISH_ENTRY_DELETE = `${PUBLISH} publish entry delete`;

export class PublishResult implements Action {
  readonly type = PUBLISH_RESULT;
  constructor(public result: cd.IPublishResult) {}
}

export class PublishEntriesLoaded implements Action {
  readonly type = PUBLISH_ENTRIES_LOADED;
  constructor(public payload: cd.IPublishEntry[]) {}
}

export class PublishEntryUpdate implements Action {
  readonly type = PUBLISH_ENTRY_UPDATE;
  constructor(public id: string, public update: cd.PublishEntryUpdatePayload) {}
}

export class PublishEntryDelete implements Action {
  readonly type = PUBLISH_ENTRY_DELETE;
  constructor(public publishEntry: cd.IPublishEntry) {}
}

export type PublishAction =
  | PublishResult
  | PublishEntriesLoaded
  | PublishEntryUpdate
  | PublishEntryDelete;
