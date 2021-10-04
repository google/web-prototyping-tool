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

import type { ITheme } from 'cd-interfaces';
import * as fonts from '../lib/fonts';
import { ThemeFactory } from '../tools/factory';
import { ColorType } from '../lib/consts';
import { FontWeight, FontCategory } from 'cd-metadata/fonts';
import { Theme } from './consts';
const RALEWAY_FONT = 'Raleway';

export const buildCrane = (): ITheme =>
  new ThemeFactory(Theme.Crane, 'Crane')
    .addPrimaryColor('#5D1049', [
      '#F6E6F0', // 50
      '#EFBEDB', // 100
      '#E994C3', // 200
      '#E568AB', // 300
      '#E34897', // 400
      '#D1257E', // 500
      '#BA2476', // 600
      '#A4226F', // 700
      '#7D1E62', // 800
      '#5D1049', // 900 *
    ])
    .addSecondaryColor('#FA3336', [
      '#FFE6E2', // 50
      '#FFCABF', // 100
      '#FF9D8D', // 200
      '#FF7569', // 300
      '#FF544B', // 400
      '#FA3336', // 500
      '#E50F10', // 600
      '#BF0D0C', // 700
      '#980C17', // 800
      '#710910', // 900 *
    ])
    .addWarningColor('#b00020')
    .addSuccessColor('#00C851')
    .addTextColor('rgba(0,0,0,0.6)')
    .addTextDarkColor('rgba(0,0,0,0.87)')
    .addTextLightColor('rgba(255,255,255,0.87)')
    .addSurfaceColor('#FFFFFF')
    .addBorderColor('#DADCE0')
    .addBackgroundBase('#FAFAFA')
    .addElevatedSurfaceColor('#FFFFFF')
    .addFont(RALEWAY_FONT, FontCategory.SansSerif, Object.values(FontWeight))
    .addTypeHeadline1({
      fontId: RALEWAY_FONT,
      colorId: ColorType.TextDark,
      weight: FontWeight.Medium,
      letterSpacing: -1.5,
      size: 97.16,
    })
    .addTypeHeadline2({
      fontId: RALEWAY_FONT,
      colorId: ColorType.TextDark,
      weight: FontWeight.SemiBold,
      letterSpacing: -0.5,
      size: 60.61,
    })
    .addTypeHeadline3({
      fontId: RALEWAY_FONT,
      colorId: ColorType.TextDark,
      weight: FontWeight.SemiBold,
      size: 48.49,
    })
    .addTypeHeadline4({
      fontId: RALEWAY_FONT,
      colorId: ColorType.TextDark,
      weight: FontWeight.Medium,
      letterSpacing: 0.25,
      size: 24.29,
    })
    .addTypeHeadline5({
      fontId: RALEWAY_FONT,
      weight: FontWeight.Medium,
      colorId: ColorType.TextDark,
      size: 24.29,
    })
    .addTypeHeadline6({
      fontId: RALEWAY_FONT,
      weight: FontWeight.SemiBold,
      colorId: ColorType.TextDark,
      letterSpacing: 0.25,
      size: 20.2,
    })
    .addTypeOverline({
      fontId: RALEWAY_FONT,
      letterSpacing: 2,
      size: 12.2,
    })
    .addTypeSubtitle1({
      fontId: RALEWAY_FONT,
      size: 16.16,
      weight: FontWeight.SemiBold,
      letterSpacing: 0.15,
    })
    .addTypeSubtitle2({
      fontId: RALEWAY_FONT,
      size: 14.17,
      weight: FontWeight.Medium,
      letterSpacing: 0.1,
    })
    .addTypeBody1({
      fontId: RALEWAY_FONT,
      size: 16.19,
      weight: FontWeight.Medium,
      letterSpacing: 0.5,
    })
    .addTypeBody2({
      fontId: RALEWAY_FONT,
      size: 14.2,
      weight: FontWeight.Regular,
      letterSpacing: 0.25,
    })
    .addTypeCaption({
      fontId: RALEWAY_FONT,
      size: 12.2,
      weight: FontWeight.SemiBold,
      letterSpacing: 0.4,
    })
    .addTypeButton({
      fontId: fonts.ROBOTO_FONT,
      colorId: ColorType.TextLight,
      weight: FontWeight.Medium,
      size: 14,
    })
    .build();
