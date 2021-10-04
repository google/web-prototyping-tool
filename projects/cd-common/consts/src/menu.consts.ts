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

import { ISelectItem, SelectItemType } from 'cd-interfaces';

export const sizeMenuConfig: ISelectItem[] = [
  { title: 'None', value: '0', type: SelectItemType.Empty },
  { title: '8px', value: '8' },
  { title: '16px', value: '16' },
  { title: '24px', value: '24' },
  { title: '32px', value: '32' },
  { title: '48px', value: '48' },
];

export const sizeMenuConfigAlt: ISelectItem[] = [
  { title: 'None', value: '0', type: SelectItemType.Empty },
  { title: '2px', value: '2' },
  { title: '4px', value: '4' },
  { title: '6px', value: '6' },
  { title: '8px', value: '8' },
  { title: '12px', value: '12' },
];

export const opacityMenuConfig: ISelectItem[] = [
  { title: '100%', value: '100' },
  { title: '75%', value: '75' },
  { title: '50%', value: '50' },
  { title: '25%', value: '25' },
  { title: '0%', value: '0' },
];
