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

import { IStringMap, IFocusTrapGroup } from 'cd-interfaces';

export default {
  grid: {
    parents: ['[role="grid"]'],
    children: ['[role="gridcell"]'],
  },
  select: {
    parents: ['[role="listbox"]', 'datalist', 'select'],
    children: ['[role="option"]', 'option'],
  },
  menu: {
    parents: ['[role="menu"]', '[role="menubar"]'],
    children: ['[role="menuitem"]', '[role="menuitemcheckbox"]', '[role="menuitemradio"]'],
  },
  radiogroup: {
    parents: ['[role="radiogroup"]'],
    children: ['[role="radio"]', 'input[type="radio"]'],
  },
  tablist: {
    parents: ['[role="tablist"]'],
    children: ['[role="tab"]'],
  },
  tree: {
    parents: ['[role="tree"]'],
    children: ['[role="treeitem"]'],
  },
  treegrid: {
    parents: ['[role="treegrid"]'],
    children: ['[role="row"]'],
  },
} as IStringMap<IFocusTrapGroup>;
