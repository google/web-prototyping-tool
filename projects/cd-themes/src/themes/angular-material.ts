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

export const buildAngularMaterial = (): ITheme =>
  new ThemeFactory(Theme.AngularMaterial, 'Angular Material')
    .addPrimaryColor('#3f51b5', [
      '#e8eaf6', // 50
      '#c5cae9', // 100
      '#9fa8da', // 200
      '#7986cb', // 300
      '#5c6bc0', // 400
      '#3f51b5', // 500 *
      '#3949ab', // 600
      '#303f9f', // 700
      '#283593', // 800
      '#1a237e', // 900
    ])
    .addSecondaryColor('#ff4081', [
      '#ffe5ed', // 50
      '#ffbdd3', // 100
      '#ff92b6', // 200
      '#ff6498', // 300
      '#ff4081', // 400 *
      '#ff1868', // 500
      '#ed1366', // 600
      '#d60e61', // 700
      '#c2075e', // 800
      '#9c0258', // 900
    ])
    .addWarningColor('#f44336', [
      '#ffebee', // 50
      '#ffcdd2', // 100
      '#ef9a9a', // 200
      '#e57373', // 300
      '#ef5350', // 400
      '#f44336', // 500 *
      '#e53935', // 600
      '#d32f2f', // 700
      '#c62828', // 800
      '#b71b1c', // 900
    ])
    .addSuccessColor('#00C851')
    .addTextColor('rgba(0,0,0,0.6)')
    .addTextDarkColor('rgba(0,0,0,0.87)')
    .addTextLightColor('rgba(255,255,255,0.87)')
    .addBorderColor('#DADCE0')
    .addSurfaceColor('#FFFFFF')
    .addElevatedSurfaceColor('#FFFFFF')
    .addBackgroundBase('#FFFFFF')
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
    .build();
