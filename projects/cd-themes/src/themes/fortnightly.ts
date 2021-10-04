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
import { ThemeFactory } from '../tools/factory';
import { ColorType } from '../lib/consts';
import { FontWeight, FontCategory } from 'cd-metadata/fonts';
import { Theme } from './consts';

const MERRIWEATHER_FONT = 'Merriweather';
const LIBRE_FRANKLIN_FONT = 'Libre Franklin';

export const buildFortnightly = (): ITheme =>
  new ThemeFactory(Theme.Fortnightly, 'Fortnightly')
    .addPrimaryColor('#8B8B8B', [
      '#FFFFFF', // 50 *
      '#F7F7F7', // 100
      '#DEDEDE', // 200
      '#C3C3C3', // 300
      '#AAAAAA', // 400
      '#8B8B8B', // 500
      '#717171', // 600
      '#575757', // 700
      '#3D3D3D', // 800
      '#303030', // 900
    ])
    .addSecondaryColor('#661FFF', [
      '#FFE7FF', // 50
      '#EBC4FF', // 100
      '#CA9BFF', // 200
      '#A96FFF', // 300
      '#8F4CFF', // 400
      '#661FFF', // 500 *
      '#5215F6', // 600
      '#3D0EEE', // 700
      '#0600DF', // 800
      '#0000AF', // 900
    ])
    .addWarningColor('#b00020')
    .addSuccessColor('#00C851')
    .addTextColor('rgba(0,0,0,0.6)')
    .addTextDarkColor('rgba(0,0,0,0.87)')
    .addTextLightColor('rgba(255,255,255,0.87)')
    .addBorderColor('#DADCE0')
    .addSurfaceColor('#FFFFFF')
    .addBackgroundBase('#f1f3f4')
    .addElevatedSurfaceColor('#FFFFFF')
    .addFont(LIBRE_FRANKLIN_FONT, FontCategory.SansSerif, Object.values(FontWeight))
    .addFont(MERRIWEATHER_FONT, FontCategory.SansSerif, [
      FontWeight.Light,
      FontWeight.LightItalic,
      FontWeight.Regular,
      FontWeight.RegularItalic,
      FontWeight.Bold,
      FontWeight.BoldItalic,
      FontWeight.Black,
      FontWeight.BlackItalic,
    ])
    .addTypeHeadline1({
      fontId: MERRIWEATHER_FONT,
      colorId: ColorType.TextDark,
      weight: FontWeight.BlackItalic,
      letterSpacing: -1.5,
      size: 91.39,
    })
    .addTypeHeadline2({
      fontId: MERRIWEATHER_FONT,
      colorId: ColorType.TextDark,
      weight: FontWeight.BlackItalic,
      letterSpacing: -0.5,
      size: 57.12,
    })
    .addTypeHeadline3({
      fontId: LIBRE_FRANKLIN_FONT,
      colorId: ColorType.TextDark,
      weight: FontWeight.Medium,
      size: 47.85,
    })
    .addTypeHeadline4({
      fontId: MERRIWEATHER_FONT,
      colorId: ColorType.TextDark,
      weight: FontWeight.Medium,
      letterSpacing: 0.25,
      size: 24.29,
    })
    .addTypeHeadline5({
      fontId: LIBRE_FRANKLIN_FONT,
      colorId: ColorType.TextDark,
      weight: FontWeight.Medium,
      size: 23.92,
    })
    .addTypeHeadline6({
      fontId: LIBRE_FRANKLIN_FONT,
      colorId: ColorType.TextDark,
      weight: FontWeight.Medium,
      letterSpacing: 0.25,
      size: 19.94,
    })
    .addTypeOverline({
      fontId: LIBRE_FRANKLIN_FONT,
      weight: FontWeight.Bold,
      letterSpacing: 2,
      size: 11.96,
    })
    .addTypeSubtitle1({
      fontId: LIBRE_FRANKLIN_FONT,
      size: 15.95,
      letterSpacing: 0.15,
      weight: FontWeight.SemiBold,
    })
    .addTypeSubtitle2({
      fontId: MERRIWEATHER_FONT,
      size: 13.96,
      letterSpacing: 0.25,
      weight: FontWeight.BoldItalic,
    })
    .addTypeBody1({
      fontId: MERRIWEATHER_FONT,
      size: 15.23,
      letterSpacing: 0.5,
      weight: FontWeight.Light,
    })
    .addTypeBody2({
      fontId: LIBRE_FRANKLIN_FONT,
      size: 13.96,
      letterSpacing: 0.25,
      weight: FontWeight.Regular,
    })
    .addTypeCaption({
      fontId: MERRIWEATHER_FONT,
      size: 11.42,
      letterSpacing: 0.4,
      weight: FontWeight.Light,
    })
    .addTypeButton({
      fontId: LIBRE_FRANKLIN_FONT,
      weight: FontWeight.Medium,
      size: 14,
    })
    .build();
