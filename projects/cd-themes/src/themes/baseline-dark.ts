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
import { FontWeight } from 'cd-metadata/fonts';
import { Theme } from './consts';

export const buildBaselineDark = (): ITheme =>
  new ThemeFactory(Theme.BaselineDark, 'Baseline Dark')
    .addPrimaryColor('#BB86FC')
    .addSecondaryColor('#03DAC6')
    .addWarningColor('#CF6679')
    .addSuccessColor('#45C461')
    .addTextColor('rgba(255,255,255,0.6)')
    .addTextDarkColor('rgba(255,255,255,0.87)')
    .addTextLightColor('rgba(0,0,0,0.87)')
    .addBorderColor('rgba(255,255,255,0.12)')
    .addSurfaceColor('#121212')
    .addBackgroundBase('#121212')
    .addElevatedSurfaceColor('#424242')
    .addTypeHeadline1({
      fontId: fonts.ROBOTO_FONT,
      colorId: ColorType.TextDark,
      weight: FontWeight.Light,
      letterSpacing: -1.5,
      size: 96,
    })
    .addTypeHeadline2({
      fontId: fonts.ROBOTO_FONT,
      colorId: ColorType.TextDark,
      weight: FontWeight.Regular,
      letterSpacing: -0.5,
      size: 60,
    })
    .addTypeHeadline3({
      fontId: fonts.ROBOTO_FONT,
      colorId: ColorType.TextDark,
      weight: FontWeight.Regular,
      size: 48,
    })
    .addTypeHeadline4({
      fontId: fonts.ROBOTO_FONT,
      colorId: ColorType.TextDark,
      letterSpacing: 0.25,
      size: 34,
    })
    .addTypeHeadline5({
      fontId: fonts.ROBOTO_FONT,
      colorId: ColorType.TextDark,
      size: 24,
    })
    .addTypeHeadline6({
      fontId: fonts.ROBOTO_FONT,
      colorId: ColorType.TextDark,
      letterSpacing: 0.25,
      size: 20,
    })
    .addTypeOverline({
      fontId: fonts.ROBOTO_FONT,
      letterSpacing: 0.25,
      size: 12,
    })
    .addTypeSubtitle1({
      fontId: fonts.ROBOTO_FONT,
      weight: FontWeight.Medium,
      letterSpacing: 0.15,
      size: 16,
    })
    .addTypeSubtitle2({
      fontId: fonts.ROBOTO_FONT,
      weight: FontWeight.Medium,
      letterSpacing: 0.1,
      size: 14,
    })
    .addTypeBody1({
      fontId: fonts.ROBOTO_FONT,
      letterSpacing: 0.5,
      size: 16,
    })
    .addTypeBody2({
      fontId: fonts.ROBOTO_FONT,
      letterSpacing: 0.25,
      size: 14,
    })
    .addTypeCaption({
      fontId: fonts.ROBOTO_FONT,
      letterSpacing: 0.4,
      size: 12,
    })
    .addTypeButton({
      fontId: fonts.ROBOTO_FONT,
      colorId: ColorType.TextLight,
      weight: FontWeight.Medium,
      size: 14,
    })
    .setDarkTheme()
    .build();
