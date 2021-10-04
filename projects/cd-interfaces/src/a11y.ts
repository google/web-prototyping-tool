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

import { IKeyValue } from './index';
import { PropertyInput } from './properties';

/** Unique a11y properties for key/value */
export interface IA11yAttr extends IKeyValue {
  type?: PropertyInput; // Value type used for inputs
  required?: boolean; // Required for user to complete
}

export enum GreenlineType {
  Flow = 'flow',
  Landmark = 'landmark',
  Heading = 'heading',
  GroupChild = 'groupchild',
  Element = 'element',
  Focus = 'focus',
  Mask = 'mask',
}

export interface IFocusTrapGroup {
  parents: string[];
  children: string[];
}

export interface IA11yModeState {
  panel: boolean;
  flow: boolean;
  landmarks: boolean;
  headings: boolean;
}

export interface IElementA11yInfo {
  tag?: string;
  aria?: IKeyValue[];
}
