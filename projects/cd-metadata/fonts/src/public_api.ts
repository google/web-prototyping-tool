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

import type { ReadonlyRecord } from 'cd-interfaces';

export enum FontCategory {
  Serif = 'serif',
  SansSerif = 'sans-serif',
}

export enum FontStyle {
  Regular = 'regular',
  Italic = 'italic',
}

export enum FontWeight {
  Thin = '100',
  ExtraLight = '200',
  Light = '300',
  Regular = '400',
  Medium = '500',
  SemiBold = '600',
  Bold = '700',
  ExtraBold = '800',
  Black = '900',
  // Italics
  ThinItalic = '100italic',
  ExtraLightItalic = '200italic',
  LightItalic = '300italic',
  RegularItalic = '400italic',
  MediumItalic = '500italic',
  SemiBoldItalic = '600italic',
  BoldItalic = '700italic',
  ExtraBoldItalic = '800italic',
  BlackItalic = '900italic',
}

/**
 *  e.g 200 = 'Extra Light' and 'Extra Light' = 200
 */
export const FontWeightMap: ReadonlyRecord<string, string> = {
  [FontWeight.Thin]: 'Thin',
  [FontWeight.ExtraLight]: 'Extra Light',
  [FontWeight.Light]: 'Light',
  [FontWeight.Regular]: 'Regular',
  [FontWeight.Medium]: 'Medium',
  [FontWeight.SemiBold]: 'Semi Bold',
  [FontWeight.Bold]: 'Bold',
  [FontWeight.ExtraBold]: 'Extra Bold',
  [FontWeight.Black]: 'Black',
  // Italics
  [FontWeight.ThinItalic]: 'Thin Italic',
  [FontWeight.ExtraLightItalic]: 'Extra Light Italic',
  [FontWeight.LightItalic]: 'Light Italic',
  [FontWeight.RegularItalic]: 'Italic',
  [FontWeight.MediumItalic]: 'Medium Italic',
  [FontWeight.SemiBoldItalic]: 'Semi Bold Italic',
  [FontWeight.BoldItalic]: 'Bold Italic',
  [FontWeight.ExtraBoldItalic]: 'Extra Bold Italic',
  [FontWeight.BlackItalic]: 'Black Italic',
};

/** Iterate back through assigning forwards and backwards */
export const reverseFontWeightMap = () =>
  Object.entries(FontWeightMap).reduce((acc: Record<string, string>, [key, value]) => {
    acc[key] = value;
    acc[value] = key;
    return acc;
  }, {});

const DEFAULT_VARIANTS = [
  FontWeight.Regular,
  FontWeight.RegularItalic,
  FontWeight.Bold,
  FontWeight.BoldItalic,
];

export enum FontKind {
  Default = '',
  System = 'System',
  Icon = 'Icon',
}

/**
 * kind: FontKind.System will hide these fonts from appearing
 * in the design system tab
 */

// Only cover fonts with > 90% coverage on ChromeOS, macOS & Windows

const enum BaseFonts {
  Arial = 'Arial',
  CourierNew = 'Courier New',
  TimesNewRoman = 'Times New Roman',
  Tahoma = 'Tahoma',
  Georgia = 'Georgia',
  Verdana = 'Verdana',
  TrebuchetMS = 'Trebuchet MS',
}

export const crossPlatformFonts = {
  [BaseFonts.Arial]: {
    family: BaseFonts.Arial,
    kind: FontKind.System,
    variants: DEFAULT_VARIANTS,
  },
  [BaseFonts.CourierNew]: {
    family: BaseFonts.CourierNew,
    kind: FontKind.System,
    variants: DEFAULT_VARIANTS,
  },
  [BaseFonts.TimesNewRoman]: {
    family: BaseFonts.TimesNewRoman,
    kind: FontKind.System,
    variants: DEFAULT_VARIANTS,
  },
  [BaseFonts.Tahoma]: {
    family: BaseFonts.Tahoma,
    kind: FontKind.System,
    variants: DEFAULT_VARIANTS,
  },
  [BaseFonts.Georgia]: {
    family: BaseFonts.Georgia,
    kind: FontKind.System,
    variants: DEFAULT_VARIANTS,
  },
  [BaseFonts.Verdana]: {
    family: BaseFonts.Verdana,
    kind: FontKind.System,
    variants: DEFAULT_VARIANTS,
  },
  [BaseFonts.TrebuchetMS]: {
    family: BaseFonts.TrebuchetMS,
    kind: FontKind.System,
    variants: DEFAULT_VARIANTS,
  },
} as const;

export const systemFont = {
  System: {
    family: '-apple-system, system-ui, BlinkMacSystemFont, "Segoe UI", Roboto, Ubuntu',
    variants: [
      FontWeight.Light,
      FontWeight.Regular,
      FontWeight.Medium,
      FontWeight.SemiBold,
      FontWeight.Bold,
      FontWeight.ExtraBold,
    ],
    kind: FontKind.System,
  },
} as const;
