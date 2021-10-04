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

import * as cd from 'cd-interfaces';
import { getAssetUrl } from './assets.utils';
import { camelCaseToSpaces } from 'cd-utils/string';
import { sortDesignSystemValues } from 'cd-themes';

export const menuFromDesignSystemAttributes = (
  attributes: cd.IStringMap<cd.IDesignVariable | cd.IDesignColor>,
  type = cd.SelectItemType.Default
): cd.ISelectItem[] => {
  return Object.entries(attributes)
    .map(([id, value]) => ({ ...value, id }))
    .filter((item) => !!!(item as cd.IDesignColor).hidden)
    .sort(sortDesignSystemValues)
    .map((item) => {
      const { name: title, value: val, id } = item;
      const value = String(val);
      return { title, value, id, type };
    });
};

export const menuFromProjectAssets = (
  assets: ReadonlyArray<cd.IProjectAsset>
): cd.ISelectItem[] => {
  const type = cd.SelectItemType.Image;
  const menu: cd.ISelectItem[] = assets.map((asset, idx) => {
    const { name, urls, id } = asset;
    const title = name;
    const value = getAssetUrl(urls, cd.AssetSizes.SmallThumbnail);
    const divider = idx === assets.length - 1;
    return { title, id, value, type, divider };
  });
  return menu;
};

export const menuFromEnum = (e: any, selectedValue?: string): cd.ISelectItem[] => {
  return Object.entries(e).reduce<cd.ISelectItem[]>((menu, enumValue) => {
    const [enumTitle, value] = enumValue;
    const selected = selectedValue && selectedValue === value;
    const title = camelCaseToSpaces(enumTitle);
    menu.push({ title, value, selected } as cd.ISelectItem);
    return menu;
  }, []);
};

/** Convert a list of datasets to menu items for cd-select-input */
export const menuFromProjectDatasets = (datasets: cd.ProjectDataset[]): cd.ISelectItem[] => {
  return datasets.map<cd.ISelectItem>((d) => ({ id: d.id, value: d.id, title: d.name }));
};
