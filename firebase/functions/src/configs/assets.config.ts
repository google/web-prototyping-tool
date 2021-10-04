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

import * as cd from 'cd-interfaces';
import { generateThumbnailArgs, generateCropArgs } from '../utils/image.utils';

const BIG_THUMBNAIL_CONTAINER_MAX_WIDTH = 480;
const BIG_THUMBNAIL_ASPECT_RATIO = 2.5;
const SMALL_THUMBNAIL_WIDTH = 20;
const SMALL_THUMBNAIL_ASPECT_RATIO = 1;
const HIDPI_SCALE = 2;

export const assetsConversionArgsConfig: cd.AssetConversionArgsConfig = {
  [cd.AssetSizes.BigThumbnail]: (originalDimension) =>
    generateThumbnailArgs(
      originalDimension,
      BIG_THUMBNAIL_CONTAINER_MAX_WIDTH,
      BIG_THUMBNAIL_ASPECT_RATIO
    ),

  [cd.AssetSizes.BigThumbnailXHDPI]: (originalDimension) =>
    generateThumbnailArgs(
      originalDimension,
      BIG_THUMBNAIL_CONTAINER_MAX_WIDTH,
      BIG_THUMBNAIL_ASPECT_RATIO,
      HIDPI_SCALE
    ),

  [cd.AssetSizes.SmallThumbnail]: () =>
    generateCropArgs(SMALL_THUMBNAIL_WIDTH, SMALL_THUMBNAIL_ASPECT_RATIO),

  [cd.AssetSizes.SmallThumbnailXHDPI]: () =>
    generateCropArgs(SMALL_THUMBNAIL_WIDTH, SMALL_THUMBNAIL_ASPECT_RATIO, HIDPI_SCALE),
};
