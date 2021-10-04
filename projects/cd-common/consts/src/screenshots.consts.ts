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

import { ScreenshotSizes } from 'cd-interfaces';

export const SCREENSHOTS_PATH_PREFIX = 'screenshots';
export const SCREENSHOT_TASK_ID_PREFIX = 'task-';

export const ORIGINAL_SCREENSHOT_FILENAME = `${ScreenshotSizes.Original}.png`;
export const THUMBNAIL_SCREENSHOT_FILENAME = `${ScreenshotSizes.BigThumbnail}.png`;
export const THUMBNAIL_XHDPI_SCREENSHOT_FILENAME = `${ScreenshotSizes.BigThumbnailXHDPI}.png`;

export const ORIGINAL_SCREENSHOT_APP_ENGINE_LOCATION = `/tmp/${ORIGINAL_SCREENSHOT_FILENAME}`;

export const sizeToFileNameMap: Record<string, string> = {
  [ScreenshotSizes.Original]: ORIGINAL_SCREENSHOT_FILENAME,
  [ScreenshotSizes.BigThumbnail]: THUMBNAIL_SCREENSHOT_FILENAME,
  [ScreenshotSizes.BigThumbnailXHDPI]: THUMBNAIL_XHDPI_SCREENSHOT_FILENAME,
};
