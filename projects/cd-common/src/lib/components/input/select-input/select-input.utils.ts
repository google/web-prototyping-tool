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

const RESET_STATE = {
  type: SelectItemType.Empty,
  value: '',
  index: -1,
};

export const injectResetState = (
  data: ISelectItem[] = [],
  resetState: string | undefined
): ISelectItem[] => {
  if (!resetState) return [...data];
  const resetItem = { title: resetState, ...RESET_STATE };
  return [resetItem, ...data];
};

export const getSelectedIndexForData = (
  data: ReadonlyArray<ISelectItem>,
  bindingId?: string
): number => {
  return data.findIndex(({ id, selected }) => (bindingId ? id === bindingId : selected === true));
};
