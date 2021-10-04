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

import { isNumber } from 'cd-utils/numeric';
import { isString, toKebabCase } from 'cd-utils/string';
import type * as cd from 'cd-interfaces';
import * as utils from './css.transform.utils';
import { isIValue } from './ivalue.utils';

type ExtractFunction = (
  styles: cd.IStyleDeclaration,
  bindings: cd.IProjectBindings
) => cd.IStyleDeclaration;

const isStringOrNumber = (item: any): boolean => isNumber(item) || isString(item);

const iValuesArrayToMap = (
  values: cd.IKeyValue[] = [],
  bindings?: cd.IProjectBindings
): cd.IStringMap<string | number> | void => {
  if (!values) return;
  return values.reduce((acc: cd.IStringMap<string | number>, item) => {
    if (!item.disabled && item.invalid !== true) {
      const value = bindings ? utils.designValueLookup(item, bindings.designSystem) : item.value;
      if (value) acc[item.name] = value;
    }
    return acc;
  }, {});
};

// Takes one model, exports multiple style properties
const modelStyleExtractionMap: cd.ReadonlyRecord<string, ExtractFunction> = {
  font: utils.extractFontsFromStyle,
  color: utils.extractColorForGradient,
  fontSmoothing: utils.extractFontSmoothing,
  backgroundSize: utils.extractBackgroundSizeFromStyle,
  backgroundImage: utils.extractBackgroundImage,
};

export const styleForKey = (key: string, style: any, bindings: cd.IProjectBindings): string => {
  if (style === null) return '';
  const { designSystem } = bindings;
  const transform = utils.transformMap[key];
  // Check if the value exists in the transform map
  if (transform) return transform(style, bindings);
  // If the item is an IValue, lookup in the design system
  if (isIValue(style)) return String(utils.designValueLookup(style, designSystem));
  // If the item is a string or number return the value
  if (isStringOrNumber(style)) return String(style);
  // if Array, assume array, join into a string of ivalues or values
  if (Array.isArray(style)) {
    return style
      .map((item) => (isIValue(item) ? utils.designValueLookup(item, designSystem) : item))
      .join(' ');
  }

  console.warn(`Unknown CSS Transform for ${key} : ${style}`);

  return '';
};

/**
 * Takes a model and extracts properties which can't be combined
 * { font:{ color:'red', fontFamily:'Roboto', ... }} -> {color:'red', font:{fontFamily...}}
 * @param styles
 * @param designSystem
 */
const extractStyles = (
  styles: cd.IStyleDeclaration | undefined,
  bindings: cd.IProjectBindings
): cd.IStyleDeclaration => {
  if (!styles || !bindings) return {} as cd.IStyleDeclaration;
  return Object.keys(modelStyleExtractionMap).reduce(
    (styleClone, key) => {
      const extractFn = key in styleClone && modelStyleExtractionMap[key];
      if (extractFn) styleClone = extractFn(styleClone, bindings);
      return styleClone;
    },
    { ...styles }
  );
};

const buildBaseStyles = (
  style: cd.IStyleDeclaration | undefined,
  bindings: cd.IProjectBindings
): cd.IStringMap<string> => {
  const styleList = extractStyles(style, bindings);
  const stringMap: cd.IStringMap<string> = {};
  for (const [key, styleValue] of Object.entries(styleList)) {
    const value = styleForKey(key, styleValue, bindings);
    if (value === '') continue;
    const convertedKey = toKebabCase(key);
    stringMap[convertedKey] = value;
  }
  return stringMap;
};

export const transformPropsToStyle = (
  { style, overrides }: cd.IStyleGroup,
  bindings: cd.IProjectBindings = createProjectBindings()
): cd.IStringMap<string> => {
  const override = iValuesArrayToMap(overrides, bindings);
  const baseStyles = buildBaseStyles(style, bindings);
  return { ...baseStyles, ...override } as cd.IStringMap<string>;
};

type DesignSystemValue =
  | cd.IDesignColor
  | cd.IFontFamily
  | cd.ITypographyStyle
  | cd.IDesignVariable;

export const lookupDesignSystemValue = (
  id: string,
  designSystem: cd.IDesignSystem
): DesignSystemValue | undefined => {
  const categories = Object.values(designSystem);
  for (const category of categories) {
    if (!category) continue;
    const vars = Object.entries(category);
    for (const [key, value] of vars) {
      if (key === id) return value as DesignSystemValue;
    }
  }
  return;
};

const COLON_CHAR = ':';

export const cssToString = (styles: cd.IStyleList) => {
  return styles.props.map((item) => item.join(COLON_CHAR)).join(';\n');
};

export const createProjectBindings = (
  designSystem?: cd.IDesignSystem,
  assets: cd.AssetMap | undefined = {}
): cd.IProjectBindings => {
  const ds = designSystem ?? ({ colors: {}, fonts: {}, typography: {} } as cd.IDesignSystem);
  return { designSystem: ds, assets };
};

export const generateComputedCSS = (
  styles: cd.IStyleAttributes,
  designSystem?: cd.IDesignSystem,
  assets?: cd.AssetMap
) => {
  const bindings = createProjectBindings(designSystem, assets);

  return Object.entries(styles)
    .reduce((acc: Array<cd.IStyleList>, curr) => {
      const [name, value] = curr;
      const entries = Object.entries(transformPropsToStyle(value as cd.IStyleGroup, bindings));
      const props = entries.map<[string, string]>(([key, val]) => [toKebabCase(key), val]);
      acc.push({ name, props });
      return acc;
    }, [])
    .sort((a, b) => {
      // Ensure pseudo elements are second
      const aMatch = a.name.startsWith(COLON_CHAR);
      const bMatch = b.name.startsWith(COLON_CHAR);
      if (aMatch && !bMatch) return 1;
      if (bMatch) return -1;
      return a.name.localeCompare(b.name);
    });
};

export const getPositionPropsFromStyles = (
  styles: cd.IStyleDeclaration | undefined
): cd.PositionProps => {
  if (!styles) return {};
  const { position, left, top, right, bottom, margin, float } = styles;
  return {
    ...(position ? { position } : {}),
    ...(left ? { left } : {}),
    ...(right ? { right } : {}),
    ...(top ? { top } : {}),
    ...(bottom ? { bottom } : {}),
    ...(margin ? { margin } : {}),
    ...(float ? { float } : {}),
  };
};
