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

import { ImageMime } from 'cd-interfaces';

export const ASSETS_PATH_PREFIX = 'user_assets/';

type ImageExensionLookup = {
  [key in ImageMime]: string;
};
export const ASSET_EXTENSIONS_LOOKUP: ImageExensionLookup = {
  [ImageMime.BMP]: '.bmp',
  [ImageMime.GIF]: '.gif',
  [ImageMime.JPEG]: '.jpeg',
  [ImageMime.PNG]: '.png',
  [ImageMime.SVG]: '.svg',
  [ImageMime.TIFF]: '.tiff',
  [ImageMime.WEBP]: '.webp',
};
