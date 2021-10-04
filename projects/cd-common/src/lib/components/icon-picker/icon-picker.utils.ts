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

import { convertIconConfigToLookup } from 'cd-common/utils';
import * as cd from 'cd-interfaces';

const DELETE_DISABLE = 'delete-disable';
const COMMON_ICON_CATEGORY = 'common';

export const filterMaterialIcons = (
  filter: string,
  iconCategories: ReadonlyArray<cd.ICategory>
): cd.ICategory[] => {
  const searchText = filter.toLowerCase();
  if (!searchText) return [...iconCategories];
  return iconCategories
    .map((item) => {
      const categoryNameMatch = item.name.toLowerCase().includes(searchText);
      const icons = categoryNameMatch
        ? item.icons
        : item.icons.filter((icon) => icon.id.includes(searchText));
      return { ...item, icons };
    })
    .filter((item) => item.icons.length && item.name !== COMMON_ICON_CATEGORY);
};

export const filterIcons = (
  filter: string,
  iconsets: ReadonlyArray<cd.IProcessedIconset>,
  allowedIconSets?: string[]
): cd.IProcessedIconset[] => {
  const searchText = filter.toLowerCase();
  const allowedSet = new Set(allowedIconSets || []);

  // if allowedIconSets is undefined, all iconsets are allowed
  const iconsetsInAllowedSet = allowedIconSets
    ? iconsets.filter((i) => allowedSet.has(i.name))
    : iconsets;

  const iconsetsWithFilteredIcons = iconsetsInAllowedSet.map((i) => {
    const iconsetName = i.name.toLowerCase();
    const iconsetNameMatch = iconsetName.includes(searchText);
    const processedIcons = iconsetNameMatch
      ? i.processedIcons
      : i.processedIcons.filter((icon) => icon.config.name.toLowerCase().includes(searchText));
    return { ...i, processedIcons };
  });
  // Only return non-empty iconsets
  return iconsetsWithFilteredIcons.filter((i) => i.processedIcons.length);
};

/**
 * Filter to a certain size and generate config objects and
 * svgLookup strings needed to render the icon
 */
export const processIconset = (
  iconData: cd.IIconsetLibrary,
  sizeFilter: cd.IconSize
): cd.IProcessedIconset[] => {
  const iconsetOfSize = iconData.iconsets.filter((i) => i.size === sizeFilter);

  return iconsetOfSize.map<cd.IProcessedIconset>((currIconset) => {
    const { name: iconset, size } = currIconset;
    let { icons } = currIconset;

    // TEMP - HOT FIX
    // filter out delete-disable icon from common-small iconset
    // svg is missing viewBox which breaks resizing
    // TODO: fix svg
    if (iconset === COMMON_ICON_CATEGORY && size === cd.IconSize.Small) {
      icons = icons.filter((i) => i !== DELETE_DISABLE);
    }

    const processedIcons = icons.map((name) => {
      const config = { name, iconset, size };
      const svgLookup = convertIconConfigToLookup(config);
      return { config, svgLookup };
    });
    return { ...currIconset, processedIcons };
  });
};
