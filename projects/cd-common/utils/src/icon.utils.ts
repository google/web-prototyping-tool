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
import { isObject } from 'cd-utils/object';
import { isString } from 'cd-utils/string';

export const isIcon = (value: any): value is cd.IIconsetIconConfig => {
  if (!value || !isObject(value)) return false;
  const Icon = value as cd.IIconsetIconConfig;
  return !!(Icon.iconset && Icon.name && Icon.size);
};

/**
 * Test to see if selected icon in a Material icon. By convention, we assume that simple string
 * specification for an icon is a Material icon
 */
export const isMaterialIcon = (icon?: cd.SelectedIcon): icon is string => {
  return isString(icon);
};

/** Converts the config object for a iconset icon into the lookup string needed by mat-icon */
export const convertIconConfigToLookup = (config: cd.IIconsetIconConfig): string => {
  const { name, iconset, size } = config;
  return `${iconset}-${size}:${name}`;
};
