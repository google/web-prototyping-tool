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

import { FontStyle } from 'cd-metadata/fonts';
import * as cd from 'cd-interfaces';
import * as utils from './css.vars.utils';
import * as consts from 'cd-common/consts';
import { isString } from 'cd-utils/string';
import { isIValue } from './ivalue.utils';
import { isGradient } from 'cd-utils/color';

export const styleFromWeight = (
  value: string
): { fontStyle: string | undefined; fontWeight: string } => {
  return {
    fontStyle: value.includes(FontStyle.Italic) ? FontStyle.Italic : undefined,
    fontWeight: value.replace(FontStyle.Italic, ''),
  };
};

const concatValues = (...values: any[]): string => values.join(' ');

const applyUnits = (value: string | number, units: string): string => value + units;

export const applyDefaultUnits = (
  value: string | number,
  units: string = consts.DEFAULT_UNITS
): string => value + units;

const applyValue = (value: string | number = '', units = consts.DEFAULT_UNITS): string => {
  if (value === consts.NORMAL_VALUE) return value;
  const un = value === consts.AUTO_VALUE ? '' : units;
  return applyUnits(value, un);
};

const inferUnits = (value: string | number = '', _bindings?: cd.IProjectBindings) => {
  return applyUnits(value, consts.DEFAULT_UNITS);
};

const applySize = ({ value, units }: cd.IValue) => applyValue(value, units);
/**
 * Map design system values to IDs
 * @param param0 iValue
 * @param designSystem
 */
export const designValueLookup = (
  ivalue: cd.IValue,
  designSystem: cd.IDesignSystem
): string | number => {
  const { id, value, units = '' } = ivalue;
  if (!id) return applyValue(value, units);

  for (const item of Object.values(designSystem)) {
    if (!item) continue;
    const found = item?.[id];
    if (found) {
      const key = utils.generateCSSVarKey(id);
      const fallback = found.units ? found.value + found.units : found.value;
      return utils.applyCSSVar(key, fallback);
    }
  }
  // If an id exists but has been removed from the design system fallback on the assigned value
  return value || '';
};

const assetUrlLookup = (ivalue: cd.IValue, projectAssets: cd.AssetMap) => {
  const id = ivalue?.id;
  const value = ivalue?.value || '';
  if (!id) return value;
  const asset = projectAssets[id];
  return asset?.urls?.original ?? value;
};

// PADDING, MARGIN, BORDER RADIUS
const concatEdgeStyle = (spacing: cd.IValue | cd.IEdgeStyle): string => {
  if (spacing === undefined) return '';
  if (isIValue(spacing) && spacing.value !== null) return applySize(spacing);

  const { top, right, bottom, left } = spacing as cd.IEdgeStyle;
  // TODO: USE IVAULE MAPPING + DESIGN SYSTEM
  const t = applyUnits(top, consts.DEFAULT_UNITS);
  const r = applyUnits(right, consts.DEFAULT_UNITS);
  const b = applyUnits(bottom, consts.DEFAULT_UNITS);
  const l = applyUnits(left, consts.DEFAULT_UNITS);
  return concatValues(t, r, b, l);
};

// OVERFLOW
const overflowStyle = ({ x, y }: cd.IOverflowStyle): string => {
  return [x || cd.Overflow.Visible, y || cd.Overflow.Visible].join(' ');
};

// BACKGROUND
const generateFlatBackgroundGradientList = (
  backgrounds: cd.IValue[],
  { designSystem }: cd.IProjectBindings
): string => {
  const list = backgrounds.map((item) => {
    const color = designValueLookup(item, designSystem);
    return `${consts.LINEAR_GRADIENT}(0deg, ${color} 0%, ${color} 100%)`;
  });
  return list.join(', ');
};

const backgroundStyle = (item: cd.IValue[] | cd.IValue, bindings: cd.IProjectBindings): string => {
  const { designSystem } = bindings;
  if (isString(item)) return item;
  if (!Array.isArray(item)) return String(item.value);
  if (item.length === 1) return String(designValueLookup(item[0], designSystem));
  return generateFlatBackgroundGradientList(item, bindings);
};

const backgroundImageStyle = (item: cd.IValue, { assets }: cd.IProjectBindings): string => {
  const assetUrl = assetUrlLookup(item, assets);
  return assetUrl ? `url(${assetUrl})` : '';
};

// BORDER
const borderStyle = (
  border: cd.IBorderStyle | cd.IBorderStyle[],
  { designSystem }: cd.IProjectBindings
): string => {
  const borderValue = Array.isArray(border) ? border[0] : border;
  if (!borderValue) return '';
  const { borderWidth, units, lineStyle, borderColor } = borderValue;
  const size = applyUnits(borderWidth, units);
  const color = designValueLookup(borderColor, designSystem);
  return concatValues(size, lineStyle, color);
};

// SHADOW
const shadowStyle = (shadows: cd.IShadowStyle[], _bindings: cd.IProjectBindings): string => {
  if (!shadows || (shadows && shadows.length === 0)) return '';
  return shadows
    .map((item) => {
      const { blurRadius, color, inset, offsetX, offsetY, spreadRadius, units } = item;
      const props = [];
      if (inset !== undefined) props.push(consts.SHADOW_INSET[+inset]);
      props.push(applyUnits(offsetX, units));
      props.push(applyUnits(offsetY, units));
      props.push(applyUnits(blurRadius, units));
      if (spreadRadius) props.push(applyUnits(spreadRadius, units));
      props.push(color.value);
      return concatValues(...props);
    })
    .join(', ');
};

// FONT
const typographyLookup = (
  font: cd.ITypographyStyle,
  { designSystem }: cd.IProjectBindings
): cd.ITypographyStyle => {
  const { id } = font;
  const typeRef = id && designSystem.typography[id];
  return typeRef || font;
};

const fontFamilyLookup = (
  fontId: string | undefined,
  { designSystem }: cd.IProjectBindings
): string => {
  if (!fontId) return '';
  const fontLookup = fontId && designSystem.fonts[fontId];
  return fontLookup && fontLookup.family;
};

const getFontFamily = (
  { id, fontId }: cd.ITypographyStyle,
  bindings: cd.IProjectBindings
): string => {
  const fontFamily = (fontId && fontFamilyLookup(fontId, bindings)) || consts.AUTO_VALUE;
  return utils.cssVarFromKeyWithFallback(id, utils.TypographySuffix.FontFamily, fontFamily);
};

const getFontWeight = (typeStyle: cd.ITypographyStyle): string => {
  const { id, weight } = typeStyle;
  const value = utils.parseFontWeight(weight);
  return utils.cssVarFromKeyWithFallback(id, utils.TypographySuffix.FontWeight, value);
};

const getLineHeight = ({ id, lineHeight, lineHeightUnits }: cd.ITypographyStyle): string => {
  const value = lineHeight ? applyValue(lineHeight, lineHeightUnits) : consts.NORMAL_VALUE;
  return utils.cssVarFromKeyWithFallback(id, utils.TypographySuffix.LineHeight, value);
};

const getFontSize = ({ id, size, sizeUnits }: cd.ITypographyStyle): string => {
  const value = applyValue(size, sizeUnits);
  return utils.cssVarFromKeyWithFallback(id, utils.TypographySuffix.FontSize, value);
};

const getLetterSpacing = ({
  id,
  letterSpacing,
  letterSpacingUnits,
}: cd.ITypographyStyle): string => {
  const value = letterSpacing ? applyValue(letterSpacing, letterSpacingUnits) : consts.NORMAL_VALUE;
  return utils.cssVarFromKeyWithFallback(id, utils.TypographySuffix.LetterSpacing, value);
};

/**
 * When this type style has no id, immediately return the color IValue ( will get handled in a later step: designValueLookup)
 * If there is an ID, look up the color for a fallback value and apply it.
 * @param param0 typeStyle
 * @param color colorValue
 * @param ds design system
 * @example {id:'text-color', value:'#000'} OR var(--co-heading-1-color, #000)
 */
const getFontColor = (
  { id }: cd.ITypographyStyle,
  color: cd.IValue,
  ds: cd.IStringMap<cd.IDesignColor>
): string | cd.IValue => {
  if (!id) return color;
  const colorRef = color.id && ds[color.id];
  const value = colorRef ? colorRef.value : (color.value as string);
  return utils.cssVarFromKeyWithFallback(id, utils.TypographySuffix.Color, value);
};

const fontStyle = (typeStyle: cd.ITypographyStyle, bindings: cd.IProjectBindings): string => {
  if (!typeStyle) return '';
  const fontFamily = getFontFamily(typeStyle, bindings);
  const fontWeight = getFontWeight(typeStyle);
  const lineHeightValue = getLineHeight(typeStyle);
  const fontSize = getFontSize(typeStyle);
  const adjustedFontSize = lineHeightValue ? `${fontSize}/${lineHeightValue}` : fontSize;
  return `${fontWeight} ${adjustedFontSize} ${fontFamily}`;
};

export const extractColorForGradient = (
  styles: cd.IStyleDeclaration,
  _bindings: cd.IProjectBindings
): cd.IStyleDeclaration => {
  const { color } = styles;
  const colorValue = designValueLookup(color, _bindings.designSystem);
  if (isGradient(String(colorValue))) {
    styles.color = 'transparent';
    styles['-webkit-text-fill-color'] = 'transparent';
    styles.background = colorValue;
    styles['-webkit-background-clip'] = 'text';
  }
  return styles;
};

// Takes ITypography and breaks it into font, color and letter spacing
export const extractFontsFromStyle = (
  styles: cd.IStyleDeclaration,
  bindings: cd.IProjectBindings
): cd.IStyleDeclaration => {
  const { designSystem } = bindings;
  const fontRef = typographyLookup(styles.font, bindings);
  const { color, letterSpacing, letterSpacingUnits, ...font } = fontRef;
  styles.font = { ...styles.font, ...font }; // Includes id after locating in design system
  styles.color = getFontColor(styles.font, color, designSystem.colors);
  styles.letterSpacing = getLetterSpacing(styles.font);
  return styles;
};

export const extractFontSmoothing = (styles: cd.IStyleDeclaration): cd.IStyleDeclaration => {
  const { fontSmoothing, ...extractedStyles } = styles;
  extractedStyles[consts.FONT_SMOOTHING] = fontSmoothing;
  return extractedStyles;
};

const getBackgroundValue = (
  item: string | cd.IValue[] | cd.IValue | undefined
): string | cd.IValue | undefined => {
  if (isString(item) || !Array.isArray(item)) return item;
  if (item.length === 1) return item[0];
  return;
};

export const extractBackgroundImage = (styles: cd.IStyleDeclaration): cd.IStyleDeclaration => {
  const image = styles.backgroundImage && styles.backgroundImage.id;
  if (!image) return styles;
  const { background, ...extractedStyles } = styles;
  const backgroundColor = getBackgroundValue(background);
  if (!backgroundColor) return styles;
  extractedStyles.backgroundColor = backgroundColor;
  return extractedStyles;
};

// If backgroundSize is auto, convert it to absolute pixel values, as the actual
// asset may be HiDPI, for which its intrinsic size won/
export const extractBackgroundSizeFromStyle = (
  styles: cd.IStyleDeclaration,
  { assets }: cd.IProjectBindings
): cd.IStyleDeclaration => {
  const { backgroundSize, ...extractedStyles } = styles;
  if (backgroundSize !== consts.AUTO_VALUE) return styles;
  const { id } = extractedStyles.backgroundImage;
  const asset = assets[id];
  if (!id || !asset) return styles;
  const { width, height } = asset;
  const w = applyUnits(width, consts.DEFAULT_UNITS);
  const h = applyUnits(height, consts.DEFAULT_UNITS);
  extractedStyles.backgroundSize = `${w} ${h}`;
  return extractedStyles;
};

/**
 * This map takes an interface and transforms it into a style attribute
 * Everything else is handled by IValue evaluation which tries to find a reference in the design system or project assets
 */
type TransformFunction = (item: any, bindings: cd.IProjectBindings) => string;

export const transformMap: cd.ReadonlyRecord<string, TransformFunction> = {
  border: borderStyle,
  borderTop: borderStyle,
  borderRight: borderStyle,
  borderBottom: borderStyle,
  borderLeft: borderStyle,
  background: backgroundStyle,
  gridRowGap: inferUnits,
  gridColumnGap: inferUnits,
  rowGap: inferUnits,
  columnGap: inferUnits,
  gap: inferUnits,
  backgroundImage: backgroundImageStyle,
  boxShadow: shadowStyle,
  textShadow: shadowStyle,
  borderRadius: concatEdgeStyle,
  // margin: spacingStyle,
  padding: concatEdgeStyle,
  overflow: overflowStyle,
  font: fontStyle,
};
