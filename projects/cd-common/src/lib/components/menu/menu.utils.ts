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

import { IMenuConfig, MenuConfigList } from 'cd-interfaces';

export const itemFromPos = (pos: number[], data: MenuConfigList): [IMenuConfig, number] => {
  let item = data[pos[0]] as IMenuConfig;
  let len = data.length;
  for (let i = 1; i < pos.length; i++) {
    if (item.children) {
      len = item.children.length;
      item = item.children[pos[i]];
    }
  }
  return [item, len];
};

/**
 * Takes in an array or double array of IMenuConfig and flattens
 * Note that this also applies to nested children inside an IMenuConfig
 * @param configs IMenuConfig[] | IMenuConfig[][]
 */
export const flattenWithDividers = (configs: MenuConfigList): IMenuConfig[] =>
  configs.reduce((acc: IMenuConfig[], current: IMenuConfig[] | IMenuConfig) => {
    const lastLen = acc.length - 1;
    const lastItem = acc[lastLen] as IMenuConfig;
    const isArray = Array.isArray(current);
    if (lastItem && isArray) {
      const lastItemClone = { ...lastItem };
      lastItemClone.divider = true;
      acc[lastLen] = lastItemClone;
    }

    if (isArray) {
      const currentArray = current as IMenuConfig[];
      for (const child of currentArray) {
        if (child.children) {
          const flat = flattenWithDividers(child.children);
          child.children = [...flat];
        }
      }
      return [...acc, ...currentArray];
    }

    return [...acc, current as IMenuConfig];
  }, []);
