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

import { ConfigAction } from '../../interfaces/action.interface';

export const IMAGES = '[Images]';

export const IMAGES_FIT_TO_ASPECT_RATIO = `${IMAGES} fit to aspect ratio`;
export const IMAGES_RESET_SIZE = `${IMAGES} reset size`;

/**
 * NOTE: This is extending ConfigAction in order to piggy-back off of IConfig
 * actions that are already supported from the right click menu
 */
export class ImagesFitToAspectRatio extends ConfigAction {
  readonly type = IMAGES_FIT_TO_ASPECT_RATIO;
}

/**
 * NOTE: This is extending ConfigAction in order to piggy-back off of IConfig
 * actions that are already supported from the right click menu
 */
export class ImagesResetSize extends ConfigAction {
  readonly type = IMAGES_RESET_SIZE;
}

export type ImagesActions = ImagesFitToAspectRatio | ImagesResetSize;
