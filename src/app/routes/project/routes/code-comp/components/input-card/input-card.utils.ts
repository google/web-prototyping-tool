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

import { LayerIcons } from 'cd-common/consts';
import { PropertyInput, IPropertyGroup } from 'cd-interfaces';

export const getDefaultStateForInputType = (inputType: PropertyInput): Partial<IPropertyGroup> => {
  // prettier-ignore
  switch (inputType) {
    case PropertyInput.Range:             return { min: 0, max: 100, defaultValue: 0, };
    case PropertyInput.Number:            return { defaultValue: 0, };
    case PropertyInput.Color:             return { defaultValue: '#FF0000', };
    case PropertyInput.Icon:              return { defaultValue: LayerIcons.Icon };
    case PropertyInput.Checkbox:          return { defaultValue: false };
    case PropertyInput.Text:              return { defaultValue: '', };
    case PropertyInput.DatasetSelect:     return { defaultValue: '', };
    default:                              return { defaultValue: undefined };
  }
};
