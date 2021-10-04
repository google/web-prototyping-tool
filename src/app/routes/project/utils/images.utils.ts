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

import { UnitTypes } from 'cd-metadata/units';
import * as utils from 'cd-common/utils';
import * as cd from 'cd-interfaces';

const buildSizeUpdate = (id: string, w: number, h: number): cd.IPropertiesUpdatePayload[] => {
  const width = utils.generateIValue(w, UnitTypes.Pixels);
  const height = utils.generateIValue(h, UnitTypes.Pixels);
  const update = utils.buildBaseStylePropsUpdate(id, { width, height });
  return [update];
};

export const calculateFitAspectRatioForAsset = (
  asset: cd.IProjectAsset,
  element: cd.IImageProperties,
  renderResult: cd.IRenderResult | undefined
): cd.IPropertiesUpdatePayload[] | undefined => {
  // TODO: Determine based on width > height vs height > width
  // TODO: Aspect ratio calc should be a cd-common/util
  if (!utils.getElementBaseStyles(element)) return;
  const w = utils.getElementBaseStyles(element)?.width;
  const { width: iw, height: ih } = asset;
  const aspectRatio = ih / iw;
  const finalWidth = w.units === UnitTypes.Pixels ? w.value : renderResult?.frame.width;
  const finalHeight = w.value * aspectRatio;
  return buildSizeUpdate(element.id, finalWidth, finalHeight);
};

export const calculateResetSizeForAsset = (
  asset: cd.IProjectAsset,
  element: cd.IImageProperties
): cd.IPropertiesUpdatePayload[] | undefined => {
  if (!utils.getElementBaseStyles(element)) return;
  const { width, height } = asset;
  return buildSizeUpdate(element.id, width, height);
};
