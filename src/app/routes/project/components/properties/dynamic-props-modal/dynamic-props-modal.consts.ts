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

import { createChangeMarker, generateFrame } from 'cd-common/utils';
import * as cd from 'cd-interfaces';

export interface IInstanceInputs extends cd.IBaseElementInputs {
  [key: string]: cd.PropertyValue;
}

export const MODEL: cd.PropertyModel = {
  projectId: 'project-id',
  id: 'model-id',
  changeMarker: createChangeMarker(),
  name: '',
  actions: [],
  attrs: [],
  childIds: [],
  elementType: cd.ElementEntitySubType.Generic,
  frame: generateFrame(),
  metadata: {},
  rootId: '',
  showPreviewStyles: false,
  styles: { base: { style: {} } },
  type: cd.EntityType.Element,
  inputs: {},
};

export const NAME_VALUE = 'name';
export const DEFAULT_ADD_BUTTON_LABEL = 'Add';

export const DESELECT_TOOLTIP = 'Deselect';
export const SELECT_TOOLTIP = 'Select';

export const INPUT_HEIGHT = 24;
export const EXTRA_PADDING = 16;

export const ADD_X_OFFSET = -125;
export const EDIT_X_OFFSET = -326;
