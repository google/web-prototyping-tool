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

import { ProjectAssetUrls, AssetSizes } from 'cd-interfaces';

const HIDPI_SUFFIX = '-xhdpi'; // Note that tsc disallows us from using consts to interpolate AssetSizes enum values

export const usingHiDPIAsset = (): boolean => window.devicePixelRatio > 1;

/**
 * Get actual asset url depending on current devicePixelRatio
 *
 * @param urls
 * @param size
 */
export const getAssetUrl = (urls: ProjectAssetUrls, size: AssetSizes): string => {
  if (size === AssetSizes.Original || size.endsWith(HIDPI_SUFFIX)) return urls[size];
  const suffix = usingHiDPIAsset() ? HIDPI_SUFFIX : '';
  const key = (size + suffix) as AssetSizes;
  return urls[key];
};
