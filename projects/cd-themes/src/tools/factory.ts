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
import * as fontLib from '../lib/fonts';
import { commonVariables } from '../lib/variables';
import { ColorType, COLOR_TYPE_NAMES, TColorType } from '../lib/consts';
import { crossPlatformFonts, FontCategory, FontWeight } from 'cd-metadata/fonts';
import { HSVColor } from 'cd-utils/color';
import { createTonalPalette } from './tonal-palette';

interface ITypeStyle {
  fontId: string;
  size: number;
  colorId?: string;
  weight?: FontWeight;
  lineHeight?: number;
  letterSpacing?: number;
}

export class ThemeFactory {
  // default to null so that Themes without a globalCssClass
  // will overwrite class from another theme when merging
  public globalCssClass: string | null = null;

  public colors: cd.IStringMap<cd.IDesignColor> = {};
  public icons: cd.IFontFamily = fontLib.MATERIAL_ICONS;
  public typography: cd.IStringMap<cd.ITypographyStyle> = {};
  public variables: cd.IStringMap<cd.IDesignVariable> = { ...commonVariables };
  public fonts: cd.IStringMap<cd.IFontFamily> = {
    ...crossPlatformFonts,
    ...fontLib.DEFAULT_ICON_FONTS,
    [fontLib.ROBOTO_FONT]: fontLib.ROBOTO,
  };
  public isDarkTheme = false;

  constructor(public id: string, public name: string) {
    this.icons = fontLib.MATERIAL_ICONS;
  }

  assert(predicated: boolean, text: string) {
    console.assert(predicated, `${text} in ${this.name}`);
  }

  buildTypography(type: fontLib.TTextType, style: ITypeStyle) {
    const { colorId, fontId, weight, size, lineHeight, letterSpacing } = style;

    const fontWeight = weight || FontWeight.Regular;
    const colorRefId = colorId || ColorType.Text;
    const colorLookup = this.colors[colorRefId];
    const fontLookup = this.fonts[fontId];

    this.assert(fontLookup !== undefined, `Font ${fontId} is missing for Type style ${type}`);
    this.assert(colorLookup !== undefined, `Color ${colorId} is missing for Type style ${type}`);

    const color: cd.IValue = { id: colorRefId, value: colorLookup.value };
    const name = fontLib.TEXT_TYPE_NAMES[type];
    const typography: cd.ITypographyStyle = { name, fontId, size, color, weight: fontWeight };
    if (letterSpacing !== undefined) {
      typography.letterSpacing = letterSpacing;
    }
    if (lineHeight !== undefined) {
      typography.lineHeight = lineHeight;
    }
    this.assert(this.typography[type] === undefined, `Typography is already defined for ${type}`);
    this.typography[type] = typography;
  }

  buildColor(type: TColorType, value: string, variants: string[] = [], hidden = false) {
    const { length } = variants;
    if (length > 0) {
      const correctLength = length === 10 || length === 14;
      this.assert(correctLength, `Color ${type} should have 10 or 14 variants`);
      this.assert(variants.includes(value), `Color ${value} missing in ${variants} for ${type}`);
    } else {
      variants = createTonalPalette(HSVColor.parse(value)).map((item) => item.rgbaString);
    }

    const name = COLOR_TYPE_NAMES[type] || type;
    const color: cd.IDesignColor = { name, value };
    if (hidden) color.hidden = true;
    if (variants.length) color.variants = variants;
    this.assert(this.colors[type] === undefined, `Color is already defined for ${type}`);
    this.colors[type] = color;
  }

  addColor(key: string, value: string, variants: string[] = []) {
    this.buildColor(key as TColorType, value, variants);
    return this;
  }

  addPrimaryColor(value: string, variants: string[] = []) {
    this.buildColor(ColorType.Primary, value, variants);
    return this;
  }

  addSecondaryColor(value: string, variants: string[] = [], hidden = false) {
    this.buildColor(ColorType.Secondary, value, variants, hidden);
    return this;
  }

  addTextColor(value: string, variants: string[] = []) {
    this.buildColor(ColorType.Text, value, variants);
    return this;
  }

  addElevatedSurfaceColor(value: string, variants: string[] = []) {
    this.buildColor(ColorType.ElevatedSurface, value, variants);
    return this;
  }

  addBackgroundBase(value: string, variants: string[] = []) {
    this.buildColor(ColorType.BackgroundBase, value, variants);
    return this;
  }

  addBorderColor(value: string, variants: string[] = []) {
    this.buildColor(ColorType.Border, value, variants);
    return this;
  }

  addTextDarkColor(value: string, variants: string[] = []) {
    this.buildColor(ColorType.TextDark, value, variants);
    return this;
  }

  addTextLightColor(value: string, variants: string[] = []) {
    this.buildColor(ColorType.TextLight, value, variants);
    return this;
  }

  addSurfaceColor(value: string, variants: string[] = []) {
    this.buildColor(ColorType.Surface, value, variants);
    return this;
  }

  addSuccessColor(value: string, variants: string[] = []) {
    this.buildColor(ColorType.Success, value, variants);
    return this;
  }

  addWarningColor(value: string, variants: string[] = []) {
    this.buildColor(ColorType.Warning, value, variants);
    return this;
  }

  addFont(
    fontId: string,
    category: FontCategory = FontCategory.SansSerif,
    variants: string[] = []
  ) {
    this.fonts[fontId] = { family: fontId, variants, category };
    return this;
  }

  addIconsToTypography() {
    const fontId = this.icons.family;

    this.assert(fontId !== undefined, `Unknown icon font ${fontId}`);
    if (!fontId) return;
    const IconStyle: ITypeStyle = { size: 24, fontId, colorId: ColorType.Text };
    this.buildTypography(fontLib.TextType.IconFontFamily, IconStyle);
    return this;
  }

  addTypeHeadline1(style: ITypeStyle) {
    this.buildTypography(fontLib.TextType.Headline1, style);
    return this;
  }

  addTypeHeadline2(style: ITypeStyle) {
    this.buildTypography(fontLib.TextType.Headline2, style);
    return this;
  }

  addTypeHeadline3(style: ITypeStyle) {
    this.buildTypography(fontLib.TextType.Headline3, style);
    return this;
  }

  addTypeHeadline4(style: ITypeStyle) {
    this.buildTypography(fontLib.TextType.Headline4, style);
    return this;
  }

  addTypeHeadline5(style: ITypeStyle) {
    this.buildTypography(fontLib.TextType.Headline5, style);
    return this;
  }

  addTypeHeadline6(style: ITypeStyle) {
    this.buildTypography(fontLib.TextType.Headline6, style);
    return this;
  }

  addTypeBody1(style: ITypeStyle) {
    this.buildTypography(fontLib.TextType.Body1, style);
    return this;
  }

  addTypeBody2(style: ITypeStyle) {
    this.buildTypography(fontLib.TextType.Body2, style);
    return this;
  }

  addTypeSubtitle1(style: ITypeStyle) {
    this.buildTypography(fontLib.TextType.Subtitle1, style);
    return this;
  }

  addTypeSubtitle2(style: ITypeStyle) {
    this.buildTypography(fontLib.TextType.Subtitle2, style);
    return this;
  }

  addTypeCaption(style: ITypeStyle) {
    this.buildTypography(fontLib.TextType.Caption, style);
    return this;
  }

  addTypeOverline(style: ITypeStyle) {
    this.buildTypography(fontLib.TextType.Overline, style);
    return this;
  }

  addTypeButton(style: ITypeStyle) {
    this.buildTypography(fontLib.TextType.Button, style);
    return this;
  }

  addGlobalCssClass(className: string) {
    this.globalCssClass = className;
    return this;
  }

  addVariable(id: string, value: cd.IDesignVariable) {
    this.variables = { ...this.variables, [id]: value };
    return this;
  }

  setDarkTheme() {
    this.isDarkTheme = true;
    return this;
  }

  get theme(): cd.IDesignSystem {
    const { id: themeId, icons, globalCssClass, isDarkTheme } = this;
    const fonts = addIndexToDSObject(this.fonts);
    const colors = addIndexToDSObject(this.colors);
    const typography = addIndexToDSObject(this.typography);
    const variables = addIndexToDSObject(this.variables);
    return { themeId, fonts, icons, colors, typography, variables, globalCssClass, isDarkTheme };
  }

  get base() {
    const { id, name } = this;
    return { id, name };
  }

  build(): cd.ITheme {
    this.addIconsToTypography();
    return { ...this.base, theme: this.theme };
  }
}

type DesignSystemObject = cd.IStringMap<
  cd.IDesignVariable | cd.ITypographyStyle | cd.IDesignColor | cd.IFontFamily
>;
const addIndexToDSObject = (obj: DesignSystemObject): any => {
  return Object.keys(obj).reduce((acc, key, index) => {
    acc[key] = { ...acc[key], index };
    return acc;
  }, obj);
};
