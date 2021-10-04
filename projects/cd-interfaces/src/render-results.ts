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

import { ElementEntitySubType } from './entity-types';
import { IStringMap, IRect, ILockingRect } from './index';
import { GreenlineType, IElementA11yInfo } from './a11y';

export type RenderRectMap = Map<string, IRenderResult>;
export type RenderElementMap = Map<string, string[]>;
export interface IRenderResult {
  id: string;
  rootId: string;
  frame: IRect & ILockingRect;
  type?: ElementEntitySubType;
}

export interface IGreenlineRenderResult {
  id: string;
  elementId: string;
  type: GreenlineType;
  rect: IRenderResult;
  order?: number;
  label?: string;
  useMask?: boolean;
  info?: IElementA11yInfo;
}

export interface IGreenlineRenderResults {
  flow?: IGreenlineRenderResult[];
  landmarks?: IGreenlineRenderResult[];
  headings?: IGreenlineRenderResult[];
  masks?: IGreenlineRenderResult[];
}

// create map keyed off of both element position and id
// so that either element id or position can be used to lookup render item data
// TODO: use only ID long term?
export type RenderResults = IStringMap<IRenderResult>;
