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

import {
  distanceFrom,
  HSVColor,
  lab2Lch,
  lab2Rgb,
  LCH,
  lch2Lab,
  IClosestPaletteResult,
  MAX_CHROMA_MULTIPLIER,
  MIN_LIGHTNESS_DISTANCE,
} from 'cd-utils/color';
import * as consts from './tonal-variations.consts';
import { clamp } from 'cd-utils/numeric';

export function createTonalPalette(
  color: HSVColor,
  materialPalettes = consts.MATERIAL_PALETTES
): HSVColor[] {
  const { closestPalette, closestColorIndex } = findClosestPalette(color, materialPalettes);
  const closestColor = closestPalette[closestColorIndex];
  const closestLchColor = lab2Lch(closestColor);
  const [closestLchLightness, closestLchChroma, closestLchHue] = closestLchColor;
  const inputLch = color.lch;
  const [inputLchLightness, inputLchChroma, inputLchHue] = inputLch;
  const lightnessDifferential = closestLchLightness - inputLchLightness;
  const chromaDifferential = closestLchChroma - inputLchChroma;
  const hueDifferential = closestLchHue - inputLchHue;
  const swatchLightnessDeviation = consts.LIGHTNESS_DEVIATION[closestColorIndex];
  const swatchChromaDeviation = consts.CHROMA_DEVIATION[closestColorIndex];

  let maxLightness = 100;
  const palette = closestPalette.map((labColor, i) => {
    if (labColor === closestColor) {
      maxLightness = Math.max(inputLchLightness - MIN_LIGHTNESS_DISTANCE, 0);
      return color;
    }

    const lchColor = lab2Lch(labColor);
    const [lightness, chroma, hue] = lchColor;
    const lightnessMultiplier = consts.LIGHTNESS_DEVIATION[i] / swatchLightnessDeviation;
    let adjustedLightness = lightness - lightnessDifferential * lightnessMultiplier;
    adjustedLightness = Math.min(adjustedLightness, maxLightness);

    const chromaMultiplier = Math.min(
      consts.CHROMA_DEVIATION[i] / swatchChromaDeviation,
      MAX_CHROMA_MULTIPLIER
    );
    const adjustedChroma = chroma - chromaDifferential * chromaMultiplier;

    const newLchColor: LCH = [
      clamp(adjustedLightness, 0, 100),
      Math.max(0, adjustedChroma),
      (hue - hueDifferential + 360) % 360,
    ];

    const newLabColor = lch2Lab(newLchColor);
    const rgbColor = lab2Rgb(newLabColor);
    const postMultRgb = rgbColor.map((c) => c * 255);

    return new HSVColor(...postMultRgb);
  });

  return palette;
}

export function findClosestPalette(
  color: HSVColor,
  materialPalettes = consts.MATERIAL_PALETTES
): IClosestPaletteResult {
  if (!materialPalettes.length || !materialPalettes[0].length) {
    throw new Error('Invalid Material Palettes');
  }

  const lab = color.lab;
  let minDistance = Infinity;
  let minDistancePalette = materialPalettes[0];
  let minDistanceSwatch = -1;

  for (let i = 0; i < materialPalettes.length; i++) {
    for (let j = 0; j < materialPalettes[i].length && minDistance > 0; j++) {
      const curColor = materialPalettes[i][j];
      const distance = distanceFrom(curColor, lab);

      if (distance <= minDistance) {
        minDistance = distance;
        minDistancePalette = materialPalettes[i];
        minDistanceSwatch = j;
      }
    }
  }

  return {
    closestPalette: minDistancePalette,
    closestColorIndex: minDistanceSwatch,
  };
}

export const tonalPaletteToHex = (palette: Array<HSVColor>): Array<string> => {
  return palette.map((color) => color.hexString);
};
