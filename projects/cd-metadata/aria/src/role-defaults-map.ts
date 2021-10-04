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

import { PropertyInput, IStringMap, IA11yAttr } from 'cd-interfaces';

export default {
  alert: [
    { name: 'aria-live', value: 'assertive' },
    { name: 'aria-atomic', value: 'true' },
  ],
  alertdialog: [],
  article: [],
  application: [],
  banner: [],
  button: [],
  cell: [],
  checkbox: [
    {
      name: 'aria-checked',
      value: 'false',
      required: true,
    },
  ],
  columnheader: [],
  combobox: [
    { name: 'aria-haspopup', value: 'listbox' },
    { name: 'aria-expanded', value: 'false' },
  ],
  complementary: [],
  contentinfo: [],
  definition: [],
  dialog: [],
  directory: [],
  document: [],
  feed: [],
  figure: [],
  form: [],
  grid: [],
  gridcell: [],
  group: [],
  heading: [{ name: 'aria-level', value: '2', required: true }],
  img: [],
  link: [],
  list: [],
  listbox: [{ name: 'aria-orientation', value: 'vertical' }],
  listitem: [],
  log: [{ name: 'aria-live', value: 'polite' }],
  main: [],
  marquee: [{ name: 'aria-live', value: 'off' }],
  math: [],
  menu: [{ name: 'aria-orientation', value: 'vertical' }],
  menubar: [{ name: 'aria-orientation', value: 'horizontal' }],
  menuitem: [],
  menuitemcheckbox: [
    {
      name: 'aria-checked',
      value: 'false',
      required: true,
    },
  ],
  menuitemradio: [
    {
      name: 'aria-checked',
      value: 'false',
      required: true,
      type: PropertyInput.Checkbox,
    },
  ],
  navigation: [],
  none: [],
  note: [],
  option: [
    {
      name: 'aria-selected',
      value: 'false',
      required: true,
    },
  ],
  presentation: [],
  progressbar: [],
  radio: [
    {
      name: 'aria-checked',
      value: 'false',
      required: true,
      type: PropertyInput.Checkbox,
    },
  ],
  radiogroup: [],
  region: [],
  row: [],
  rowgroup: [],
  rowheader: [],
  scrollbar: [
    {
      name: 'aria-orientation',
      value: 'vertical',
      required: true,
    },
    {
      name: 'aria-valuemax',
      value: '100',
      required: true,
    },
    {
      name: 'aria-valuemin',
      value: '0',
      required: true,
    },
    {
      name: 'aria-valuenow',
      value: '50',
      required: true,
    },
  ],
  search: [],
  searchbox: [],
  separator: [
    {
      name: 'aria-orientation',
      value: 'horizontal',
    },
  ],
  slider: [
    {
      name: 'aria-orientation',
      value: 'horizontal',
    },
    {
      name: 'aria-valuemax',
      value: '100',
      required: true,
    },
    {
      name: 'aria-valuemin',
      value: '0',
      required: true,
    },
    {
      name: 'aria-valuenow',
      value: '50',
      required: true,
    },
  ],
  spinbutton: [
    {
      name: 'aria-valuemax',
      value: '100',
      required: true,
    },
    {
      name: 'aria-valuemin',
      value: '0',
      required: true,
    },
    {
      name: 'aria-valuenow',
      value: '0',
      required: true,
    },
  ],
  status: [
    { name: 'aria-atomic', value: 'true' },
    { name: 'aria-live', value: 'polite' },
  ],
  switch: [{ name: 'aria-checked', value: 'false', type: PropertyInput.Checkbox }],
  tab: [{ name: 'aria-selected', value: 'false' }],
  table: [],
  tablist: [{ name: 'aria-orientation', value: 'horizontal' }],
  tabpanel: [],
  term: [],
  textbox: [],
  timer: [{ name: 'aria-live', value: 'off' }],
  toolbar: [{ name: 'aria-orientation', value: 'horizontal' }],
  tooltip: [],
  tree: [{ name: 'aria-orientation', value: 'vertical' }],
  treegrid: [],
  treeitem: [],
} as IStringMap<IA11yAttr[]>;
