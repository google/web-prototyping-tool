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

import { IStringMap } from 'cd-interfaces';

/* Global aria attrs allowed on all roles */
export const globalAriaAttrs = [
  'aria-atomic',
  'aria-busy',
  'aria-controls',
  'aria-current',
  'aria-describedby',
  'aria-details',
  'aria-disabled',
  'aria-errormessage',
  'aria-flowto',
  'aria-haspopup',
  'aria-hidden',
  'aria-invalid',
  'aria-keyshortcuts',
  'aria-label',
  'aria-labelledby',
  'aria-live',
  'aria-owns',
  'aria-relevant',
  'aria-roledescription',
];

/* Additional aria attrs allowed per role */
export default {
  alert: ['aria-expanded'],
  alertdialog: ['aria-expanded', 'aria-modal'],
  application: ['aria-activedescendant'],
  article: ['aria-expanded', 'aria-posinset', 'aria-setsize'],
  banner: ['aria-expanded'],
  button: ['aria-expanded', 'aria-pressed'],
  cell: ['aria-colindex', 'aria-colspan', 'aria-expanded', 'aria-rowindex', 'aria-rowspan'],
  checkbox: ['aria-checked', 'aria-readonly'],
  columnheader: [
    'aria-colindex',
    'aria-colspan',
    'aria-expanded',
    'aria-readonly',
    'aria-required',
    'aria-rowindex',
    'aria-rowspan',
    'aria-selected',
    'aria-sort ',
  ],
  combobox: [
    'aria-activedescendant',
    'aria-autocomplete',
    'aria-expanded',
    'aria-orientation',
    'aria-readonly',
    'aria-required',
  ],
  complementary: ['aria-expanded'],
  contentinfo: ['aria-expanded'],
  definition: ['aria-expanded'],
  dialog: ['aria-expanded', 'aria-modal'],
  directory: ['aria-expanded'],
  document: ['aria-expanded'],
  feed: ['aria-expanded'],
  figure: ['aria-expanded'],
  form: ['aria-expanded'],
  grid: [
    'aria-activedescendent',
    'aria-colcount',
    'aria-expanded',
    'aria-level',
    'aria-multiselectable',
    'aria-readonly',
    'aria-rowcount',
  ],
  gridcell: [
    'aria-colindex',
    'aria-colspan',
    'aria-expanded',
    'aria-readonly',
    'aria-required',
    'aria-rowindex',
    'aria-rowspan',
    'aria-selected',
  ],
  group: ['aria-activedescendant', 'aria-expanded'],
  heading: ['aria-expanded', 'aria-level'],
  img: ['aria-expanded'],
  link: ['aria-expanded'],
  list: ['aria-expanded'],
  listbox: [
    'aria-activedescendant',
    'aria-expanded',
    'aria-multiselectable',
    'aria-orientation',
    'aria-readonly',
    'aria-required',
  ],
  listitem: ['aria-expanded', 'aria-level', 'aria-posinset', 'aria-setsize'],
  log: ['aria-expanded'],
  main: ['aria-expanded'],
  marquee: ['aria-expanded'],
  math: ['aria-expanded'],
  menu: ['aria-activedescendant', 'aria-expanded', 'aria-orientation'],
  menubar: ['aria-activedescendant', 'aria-expanded', 'aria-orientation'],
  menuitem: ['aria-posinset', 'aria-setsize'],
  menuitemcheckbox: ['aria-checked', 'aria-posinset', 'aria-readonly', 'aria-setsize'],
  menuitemradio: ['aria-checked', 'aria-posinset', 'aria-readonly', 'aria-setsize'],
  navigation: ['aria-expanded'],
  none: [],
  note: ['aria-expanded'],
  option: ['aria-checked', 'aria-posinset', 'aria-selected', 'aria-setsize'],
  presentation: [],
  progressbar: [
    'aria-expanded',
    'aria-valuemax',
    'aria-valuemin',
    'aria-valuenow',
    'aria-valuetext',
  ],
  radio: ['aria-checked', 'aria-posinset', 'aria-setsize'],
  radiogroup: ['aria-activedescendant', 'aria-orientation', 'aria-readonly', 'aria-required'],
  region: ['aria-expanded'],
  row: [
    'aria-activedescendant',
    'aria-expanded',
    'aria-colindex',
    'aria-level',
    'aria-rowindex',
    'aria-selected',
  ],
  rowgroup: [],
  rowheader: [
    'aria-colindex',
    'aria-colspan',
    'aria-expanded',
    'aria-readonly',
    'aria-required',
    'aria-rowindex',
    'aria-rowspan',
    'aria-selected',
    'aria-sort',
  ],
  scrollbar: [
    'aria-orientation',
    'aria-valuemax',
    'aria-valuemin',
    'aria-valuenow',
    'aria-valuetext',
  ],
  search: ['aria-expanded'],
  searchbox: [
    'aria-activedescendant',
    'aria-autocomplete',
    'aria-multiline',
    'aria-placeholder',
    'aria-readonly',
    'aria-required',
  ],
  separator: [
    'aria-orientation',
    'aria-valuemax',
    'aria-valuemin',
    'aria-valuenow',
    'aria-valuetext',
  ],
  slider: [
    'aria-orientation',
    'aria-readonly',
    'aria-valuemax',
    'aria-valuemin',
    'aria-valuenow',
    'aria-valuetext',
  ],
  spinbutton: [
    'aria-activedescendant',
    'aria-readonly',
    'aria-required',
    'aria-valuemax',
    'aria-valuemin',
    'aria-valuenow',
    'aria-valuetext',
  ],
  status: ['aria-expanded'],
  switch: ['aria-checked', 'aria-readonly'],
  tab: ['aria-expanded', 'aria-posinset', 'aria-selected', 'aria-setsize'],
  table: ['aria-colcount', 'aria-expanded', 'aria-rowcount'],
  tablist: ['aria-activedescendant', 'aria-level', 'aria-multiselectable', 'aria-orientation'],
  tabpanel: ['aria-expanded'],
  term: ['aria-expanded'],
  textbox: [
    'aria-activedescendant',
    'aria-autocomplete',
    'aria-multiline',
    'aria-placeholder',
    'aria-readonly',
    'aria-required',
  ],
  timer: [],
  toolbar: ['aria-activedescendant', 'aria-expanded', 'aria-orientation'],
  tooltip: ['aria-expanded'],
  tree: ['aria-activedescendant', 'aria-multiselectable', 'aria-orientation', 'aria-required'],
  treegrid: [
    'aria-activedescendant',
    'aria-colcount',
    'aria-expanded',
    'aria-level',
    'aria-multiselectable',
    'aria-orientation',
    'aria-readonly',
    'aria-required',
    'aria-rowcount',
  ],
  treeitem: [
    'aria-checked',
    'aria-expanded',
    'aria-level',
    'aria-posinset',
    'aria-selected',
    'aria-setsize',
  ],
} as IStringMap<string[]>;
