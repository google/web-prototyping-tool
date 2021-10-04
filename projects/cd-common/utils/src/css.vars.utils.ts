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

import type * as cd from 'cd-interfaces';
import { toKebabCase } from 'cd-utils/string';
import { MATERIAL_COLOR_VARIANTS, AUTO_VALUE, DEFAULT_UNITS, NORMAL_VALUE } from 'cd-common/consts';
import { FontWeight, FontStyle } from 'cd-metadata/fonts';
import { rgbFromColorString } from 'cd-utils/color';
import { isIValue } from './ivalue.utils';

// TODO Move this list into cd-metadata
const CSS_VAR_NAMESPACE = 'co';
const CSS_VAR_VARIANT_RGB_SUFFIX = 'rgb';

export enum TypographySuffix {
  FontFamily = 'font-family',
  FontSize = 'font-size',
  // eslint-disable-next-line @typescript-eslint/no-shadow
  FontWeight = 'font-weight',
  LineHeight = 'line-height',
  LetterSpacing = 'letter-spacing',
  // eslint-disable-next-line @typescript-eslint/no-shadow
  FontStyle = 'font-style',
  Color = 'color',
}

/**
 * Converts a string into a css var key e.g --co-primary-500
 * @param key Primary string to convert e.g PrimaryLight becomes kebab case -> --co-primary-light
 * @param suffix Optional suffix used by css color variants and fonts e.g (PrimaryLight, 500) -> --co-primary-light-500
 */
export const generateCSSVarKey = (key: string, suffix?: string): string => {
  const ending = suffix ? `-${suffix}` : '';
  return `--${CSS_VAR_NAMESPACE}-${toKebabCase(key)}${ending}`;
};

/**
 * Takes a key and returns a css var e.g: var(--co-primary-500, #FF0000)
 * @param key The css Var to apply
 * @param fallbackValue Optional fallback value, should be auto generated
 */
export const applyCSSVar = (key: string, fallbackValue?: string): string => {
  const ending = fallbackValue ? `, ${fallbackValue}` : '';
  return `var(${key}${ending})`;
};

const addRgbSuffix = (variantKey: string) => `${variantKey}-${CSS_VAR_VARIANT_RGB_SUFFIX}`;

/**  Given a color string (e.g. #FF0000) return the comma separate rgb values: 255,0,0 */
const getRgbValues = (color: string): string => {
  const rgb = rgbFromColorString(color);
  return rgb.splice(0, 3).toString(); // Ignore alpha
};

/**
 * Index of MATERIAL_COLOR_VARIANTS used to generate variant color suffix
 */
const variantKeyAtIndex = (index: number): string => MATERIAL_COLOR_VARIANTS[index];

const buildCSSColorVariants = (key: string, variants: string[]): cd.KeyValueTuple[] => {
  return variants.reduce<cd.KeyValueTuple[]>((acc, variantColor, index) => {
    const variantSuffix = variantKeyAtIndex(index);
    const variantKey = generateCSSVarKey(key, variantSuffix);
    const rbgVariantKey = addRgbSuffix(variantKey);
    const rgbValues = getRgbValues(variantColor); // Ignore alpha
    acc.push([variantKey, variantColor]);
    acc.push([rbgVariantKey, rgbValues]);
    return acc;
  }, []);
};

/**
 * Creates css variables from a design system
 * @param colors Design system colors
 */
const generateCSSColorVars = (colors: cd.IStringMap<cd.IDesignColor>): cd.KeyValueTuple[] => {
  return Object.entries(colors).reduce<cd.KeyValueTuple[]>((acc, item) => {
    const [key, color] = item;

    let currentColor = color.value;
    let currentColorRgb = getRgbValues(currentColor);

    if (color.variants) {
      const variants = buildCSSColorVariants(key, color.variants);
      acc = [...acc, ...variants];
      // Does the current value exist in the variants list ?
      const idx = color.variants.indexOf(color.value);
      // If so, lets create a reference to that
      if (idx !== -1) {
        // replace current color with found color
        const variantSuffix = variantKeyAtIndex(idx);
        const variantKey = generateCSSVarKey(key, variantSuffix);
        currentColor = applyCSSVar(variantKey);

        // Replace current rgb color wih found color. Every other variant is an RGB value
        const currentRGB = variants[idx * 2 + 1];
        currentColorRgb = applyCSSVar(currentRGB[0]);
      }
    }

    // Assigns the value for the active variant to the main color
    // example: --co-primary: var(--co-primary-700);
    const currentKey = generateCSSVarKey(key);
    const currentValue: cd.KeyValueTuple = [currentKey, currentColor];
    acc.push(currentValue);

    // Add rgb version of active variant also
    // example: --co-primary-rgb: var(--co-primary-700-rgb);
    const currentKeyRgb = addRgbSuffix(currentKey);
    const currentValueRgb: cd.KeyValueTuple = [currentKeyRgb, currentColorRgb];
    acc.push(currentValueRgb);
    return acc;
  }, []);
};

const generateFontColorCSSVar = (
  colors: cd.IStringMap<cd.IDesignColor>,
  key: string,
  style: cd.IValue,
  suffix: TypographySuffix
): cd.KeyValueTuple => {
  const styleId = style.id;
  const inColor = styleId && styleId in colors;
  const value = styleId && inColor ? applyCSSVar(generateCSSVarKey(styleId)) : String(style.value);
  const varKey = generateCSSVarKey(key, suffix);
  return [varKey, value];
};

const isNormalUndefinedOrAuto = (value: string | undefined): boolean => {
  return value !== undefined && value !== AUTO_VALUE && value !== NORMAL_VALUE;
};

const generateFontStyleVar = (
  key: string,
  value: any,
  suffix: TypographySuffix,
  units: string = DEFAULT_UNITS,
  fallback = NORMAL_VALUE
): cd.KeyValueTuple => {
  const varKey = generateCSSVarKey(key, suffix);
  const size = isNormalUndefinedOrAuto(value) ? `${value}${units}` : fallback;

  return [varKey, size];
};

export const parseFontWeight = (weight: string = FontWeight.Regular): string => {
  return weight.replace(FontStyle.Italic, ` ${FontStyle.Italic}`);
};

const generateFontWeightVar = (
  key: string,
  weight: string = FontWeight.Regular,
  suffix: TypographySuffix
): cd.KeyValueTuple[] => {
  const hasItalic = weight.includes(FontStyle.Italic);
  const styleValue = hasItalic ? FontStyle.Italic : FontStyle.Regular;
  const styleVarKey = generateCSSVarKey(key, TypographySuffix.FontStyle);
  const weightValue = weight.replace(FontStyle.Italic, '');
  const weightVarKey = generateCSSVarKey(key, suffix);
  return [
    [weightVarKey, weightValue],
    [styleVarKey, styleValue],
  ];
};

const generateCSSTypographyVars = (
  fonts: cd.IStringMap<cd.IFontFamily>,
  colors: cd.IStringMap<cd.IDesignColor>,
  typography: cd.IStringMap<cd.ITypographyStyle>
): cd.KeyValueTuple[] => {
  return Object.entries(typography).reduce((acc: cd.KeyValueTuple[], curr) => {
    const [key, style] = curr;
    const {
      lineHeight,
      lineHeightUnits = DEFAULT_UNITS,
      letterSpacing,
      letterSpacingUnits,
    } = style;
    const values = [
      generateFontFamilyCSSVar(fonts, key, style),
      generateFontStyleVar(key, style.size, TypographySuffix.FontSize, DEFAULT_UNITS),
      ...generateFontWeightVar(key, style.weight, TypographySuffix.FontWeight),
      generateFontStyleVar(key, lineHeight, TypographySuffix.LineHeight, lineHeightUnits),
      generateFontStyleVar(key, letterSpacing, TypographySuffix.LetterSpacing, letterSpacingUnits),
      generateFontColorCSSVar(colors, key, style.color, TypographySuffix.Color),
    ];
    return [...acc, ...values];
  }, []);
};

/**
 * Returns value for a css property
 * e.g font-weight: var(--co-body-font-weight, 400)
 * @param key key e.g --co-primary
 * @param keySuffix Optional Suffix for key  e.g --co-primary-500
 * @param fallbackValue CSS var fallback value
 */
export const cssVarFromKeyWithFallback = (
  key: string | undefined | null,
  keySuffix: string | undefined,
  fallbackValue: string = ''
): string => {
  if (!key) return fallbackValue;
  const varKey = generateCSSVarKey(key, keySuffix);
  return applyCSSVar(varKey, fallbackValue);
};

const generateFontFamilyCSSVar = (
  fonts: cd.IStringMap<cd.IFontFamily>,
  key: string,
  style: cd.ITypographyStyle
): cd.KeyValueTuple => {
  const fontRef = style.fontId && fonts[style.fontId];
  const varKey = generateCSSVarKey(key, TypographySuffix.FontFamily);
  const family = fontRef ? `"${fontRef.family}"` : AUTO_VALUE;
  return [varKey, family];
};

export const generateIconFontFamilyCSSVar = (icons: cd.IFontFamily): cd.KeyValueTuple => {
  const key = icons.kind || '';
  const varKey = generateCSSVarKey(key, TypographySuffix.FontFamily);
  const family = `"${icons.family}"`;
  return [varKey, family];
};

const generateDesignVariables = (
  variables?: cd.IStringMap<cd.IDesignVariable>
): cd.KeyValueTuple[] => {
  if (!variables) return [];
  return Object.entries(variables).reduce<cd.KeyValueTuple[]>((acc, item) => {
    const [key, varItem] = item;
    const { value, units } = varItem;
    const currentValue: cd.KeyValueTuple = [generateCSSVarKey(key), `${value}${units}`];
    acc.push(currentValue);
    return acc;
  }, []);
};

/**
 * This is called by the renderer to generate css vars from a design system
 * An array of [key, value] is returned
 * @param designSystem
 */
export const generateCSSVars = (designSystem: cd.IDesignSystem): cd.KeyValueTuple[] => {
  const colors = generateCSSColorVars(designSystem.colors);
  const typography = generateCSSTypographyVars(
    designSystem.fonts,
    designSystem.colors,
    designSystem.typography
  );
  const iconFont = generateIconFontFamilyCSSVar(designSystem.icons);
  const variables = generateDesignVariables(designSystem.variables);

  return [...colors, ...typography, iconFont, ...variables];
};

export const createOrReplaceCSSVars = (vars: cd.KeyValueTuple[], doc: Document) => {
  if (!doc.documentElement) return;
  const style = doc.documentElement.style;
  for (const [key, value] of vars) {
    style.setProperty(key, value);
  }
};

/** Convert a name to --css-var-case. */
export const toCssVarName = (name: string): string => {
  return `--${toKebabCase(name)}`;
};

/**
 * Converts input values to CSS var values.  IValues are converted to internal
 * prefixed variables where the `id` is the var name, an `value` is the default.
 * `{ id: 'MyVar', value: '#e3e3e3' }` ->  `var(--co-my-var, #e3e3e3)`
 */
export const cssVarStringFromValue = (val: any): string | undefined => {
  if (!val) return;
  if (isIValue(val)) {
    if (val.id) {
      const fallback = val.value ? String(val.value) : undefined;
      return applyCSSVar(generateCSSVarKey(val.id), fallback);
    }
    return String(val.value);
  }
  return String(val);
};
