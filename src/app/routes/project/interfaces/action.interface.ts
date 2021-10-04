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
import { ConfigTargetType, IConfig, PropertyModel, LayoutMode, ICanvas } from 'cd-interfaces';

export interface IConfigPayload {
  propertyModels?: PropertyModel[];
  canvas?: ICanvas;
  layout?: LayoutMode;
  zoom?: number;
}

export interface IConfigAction extends Action {
  type: string;
  targetType: ConfigTargetType;
  config: IConfig | null;
  payload: IConfigPayload;
  event?: Event;
  undoable: boolean;
}

export interface IUndoableAction extends Action {
  readonly undoable: boolean;
}

export class ConfigAction implements IConfigAction, IUndoableAction {
  // TODO: These props should have default values or be initialized in ctor
  public type!: string;
  public targetType!: ConfigTargetType;
  constructor(
    public config: IConfig | null,
    public payload: IConfigPayload,
    public event?: Event,
    public undoable = false
  ) {
    if (config === null || config.action === undefined) return;
    this.type = config.action;
  }
}
