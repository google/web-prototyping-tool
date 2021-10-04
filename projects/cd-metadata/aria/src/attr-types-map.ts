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

import { PropertyInput, IStringMap } from 'cd-interfaces';

export default {
  role: PropertyInput.Select,
  'aria-activedescendant': PropertyInput.ElementPicker,
  'aria-atomic': PropertyInput.Toggle,
  'aria-autocomplete': PropertyInput.Select,
  'aria-busy': PropertyInput.Toggle,
  'aria-checked': PropertyInput.Toggle,
  'aria-colcount': PropertyInput.Integer,
  'aria-colindex': PropertyInput.Integer,
  'aria-colspan': PropertyInput.Integer,
  'aria-controls': PropertyInput.ElementPicker,
  'aria-current': PropertyInput.Select,
  'aria-describedby': PropertyInput.ElementPicker,
  'aria-details': PropertyInput.ElementPicker,
  'aria-disabled': PropertyInput.Toggle,
  'aria-dropeffect': PropertyInput.Select,
  'aria-errormessage': PropertyInput.ElementPicker,
  'aria-expanded': PropertyInput.Toggle,
  'aria-flowto': PropertyInput.ElementPicker,
  'aria-grabbed': PropertyInput.Toggle,
  'aria-haspopup': PropertyInput.Select,
  'aria-hidden': PropertyInput.Toggle,
  'aria-invalid': PropertyInput.Select,
  'aria-keyshortcuts': PropertyInput.Text,
  'aria-label': PropertyInput.Text,
  'aria-labelledby': PropertyInput.ElementPicker,
  'aria-level': PropertyInput.Integer,
  'aria-live': PropertyInput.Select,
  'aria-modal': PropertyInput.Toggle,
  'aria-multiline': PropertyInput.Toggle,
  'aria-multiselectable': PropertyInput.Toggle,
  'aria-orientation': PropertyInput.Toggle,
  'aria-owns': PropertyInput.ElementPicker,
  'aria-placeholder': PropertyInput.Text,
  'aria-posinset': PropertyInput.Integer,
  'aria-pressed': PropertyInput.Toggle,
  'aria-readonly': PropertyInput.Toggle,
  'aria-relevant': PropertyInput.Select,
  'aria-required': PropertyInput.Toggle,
  'aria-roledescription': PropertyInput.Text,
  'aria-rowcount': PropertyInput.Integer,
  'aria-rowindex': PropertyInput.Integer,
  'aria-rowspan': PropertyInput.Integer,
  'aria-selected': PropertyInput.Toggle,
  'aria-setsize': PropertyInput.Integer,
  'aria-sort': PropertyInput.Select,
  'aria-valuemax': PropertyInput.Number,
  'aria-valuemin': PropertyInput.Number,
  'aria-valuenow': PropertyInput.Number,
  'aria-valuetext': PropertyInput.Text,
} as IStringMap<PropertyInput>;
