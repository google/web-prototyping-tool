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
import { ILayoutDefinition } from 'cd-interfaces';
import { ConfigAction } from '../../interfaces/action.interface';

export const LAYOUT = '[LAYOUT]';
export const LAYOUT_APPLY_PRESET_TO_SELECTION = `${LAYOUT} apply preset`;
export const LAYOUT_CONVERT_SELECTION = `${LAYOUT} convert to`;

export class LayoutApplyPresetToSelection implements Action {
  readonly type = LAYOUT_APPLY_PRESET_TO_SELECTION;
  constructor(public selectedIds: string[], public preset: ILayoutDefinition) {}
}

export class LayoutConvertSelection extends ConfigAction {
  readonly type = LAYOUT_CONVERT_SELECTION;
}

export type LayoutAction = LayoutApplyPresetToSelection | LayoutConvertSelection;
