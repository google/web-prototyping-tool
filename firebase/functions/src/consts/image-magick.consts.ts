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

export const IMAGEMAGICK_COMMAND = 'convert';
export const IMAGEMAGICK_NULL_OUTPUT = 'null:';
export const IMAGEMAGICK_STACK_BEGIN = ['(', '+clone'];
export const IMAGEMAGICK_STACK_END = ['+delete', ')'];

export const IMAGEMAGICK_WRITE = '-write';

export const IMAGEMAGICK_THUMBNAIL = '-thumbnail';
export const IMAGEMAGICK_GEOMETRY = '-geometry';
export const IMAGEMAGICK_CENTER_CROP = ['-gravity', 'center', '+repage', '-crop'];
export const IMAGEMAGICK_DO_NOT_ENLARGE = '>';
export const IMAGEMAGICK_ENSURE_MIN = '^';
