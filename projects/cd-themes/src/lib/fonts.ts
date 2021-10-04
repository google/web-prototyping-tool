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

import { FontWeight, FontCategory, FontKind } from 'cd-metadata/fonts';
import type { ReadonlyRecord } from 'cd-interfaces';

export const TextType = {
  Body1: 'Body1',
  Body2: 'Body2',
  Button: 'Button',
  Caption: 'Caption',
  Display1: 'Display1',
  Display2: 'Display2',
  Display3: 'Display3',
  Headline1: 'Headline1',
  Headline2: 'Headline2',
  Headline3: 'Headline3',
  Headline4: 'Headline4',
  Headline5: 'Headline5',
  Headline6: 'Headline6',
  Overline: 'Overline',
  Subhead1: 'Subhead1',
  Subhead2: 'Subhead2',
  Subtitle1: 'Subtitle1',
  Subtitle2: 'Subtitle2',
  IconFontFamily: 'IconFontFamily',
} as const;

export type TTextType = typeof TextType[keyof typeof TextType];

export const TEXT_TYPE_NAMES: ReadonlyRecord<TTextType, string> = {
  [TextType.Body1]: 'Body 1',
  [TextType.Body2]: 'Body 2',
  [TextType.Button]: 'Button',
  [TextType.Caption]: 'Caption',
  [TextType.Display1]: 'Display 1',
  [TextType.Display2]: 'Display 2',
  [TextType.Display3]: 'Display 3',
  [TextType.Headline1]: 'Headline 1',
  [TextType.Headline2]: 'Headline 2',
  [TextType.Headline3]: 'Headline 3',
  [TextType.Headline4]: 'Headline 4',
  [TextType.Headline5]: 'Headline 5',
  [TextType.Headline6]: 'Headline 6',
  [TextType.Overline]: 'Overline',
  [TextType.Subhead1]: 'Subheading 1',
  [TextType.Subhead2]: 'Subheading 2',
  [TextType.Subtitle1]: 'Subtitle 1',
  [TextType.Subtitle2]: 'Subtitle 2',
  [TextType.IconFontFamily]: 'Icon Font Family',
};

export const ROBOTO_FONT = 'Roboto';
export const GOOGLE_SANS_FONT = 'GoogleSans';
export const MATERIAL_ICONS_FONT = 'Material Icons';
export const MATERIAL_ICONS_OUTLINED_FONT = 'Material Icons Outlined';
export const MATERIAL_ICONS_ROUND_FONT = 'Material Icons Round';
export const MATERIAL_ICONS_SHARP_FONT = 'Material Icons Sharp';

export const ROBOTO = {
  family: ROBOTO_FONT,
  category: FontCategory.SansSerif,
  locked: true,
  variants: [
    FontWeight.Thin,
    FontWeight.ThinItalic,
    FontWeight.Light,
    FontWeight.LightItalic,
    FontWeight.Regular,
    FontWeight.RegularItalic,
    FontWeight.Medium,
    FontWeight.MediumItalic,
    FontWeight.Bold,
    FontWeight.BoldItalic,
    FontWeight.Black,
    FontWeight.BlackItalic,
  ],
};

export const MATERIAL_ICONS = {
  family: MATERIAL_ICONS_FONT,
  kind: FontKind.Icon,
  variants: [],
};

export const MATERIAL_ICONS_ROUND = {
  family: MATERIAL_ICONS_ROUND_FONT,
  kind: FontKind.Icon,
  variants: [],
};

export const MATERIAL_ICONS_SHARP = {
  family: MATERIAL_ICONS_SHARP_FONT,
  kind: FontKind.Icon,
  variants: [],
};

export const MATERIAL_ICONS_OUTLINED = {
  family: MATERIAL_ICONS_OUTLINED_FONT,
  kind: FontKind.Icon,
  variants: [],
};

export const DEFAULT_ICON_FONTS = {
  [MATERIAL_ICONS_FONT]: MATERIAL_ICONS,
  [MATERIAL_ICONS_OUTLINED_FONT]: MATERIAL_ICONS_OUTLINED,
  [MATERIAL_ICONS_ROUND_FONT]: MATERIAL_ICONS_ROUND,
  [MATERIAL_ICONS_SHARP_FONT]: MATERIAL_ICONS_SHARP,
};
