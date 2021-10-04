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

const PHOTO_SIZE_64 = 's40-c';
const URL_SPLIT = '/';
const MOMA_PHOTO_SUBDOMAIN = 'moma-teams-photos';
const GOOGLE_AVATAR_FILENAME = 'photo.jpg';
const IMAGE_SIZE_REGEX = /(=[a-z]+[0-9]*)(-[a-z])*/;

export const getAvatarUrl = (value: string) => {
  const fileName = extractFileName(value);

  return fileName === GOOGLE_AVATAR_FILENAME
    ? injectSizeForPhoto(value)
    : appendSizeForPhoto(value);
};

const extractFileName = (value: string): string => {
  return value.substr(value.lastIndexOf(URL_SPLIT) + 1);
};

const appendSizeForPhoto = (url: string | undefined): string => {
  if (!url) return '';

  if (url.includes(MOMA_PHOTO_SUBDOMAIN)) {
    return url;
  }

  const urlNoSize = url.replace(IMAGE_SIZE_REGEX, '');

  return `${urlNoSize}=${PHOTO_SIZE_64}`;
};

const injectSizeForPhoto = (url: string | undefined): string => {
  if (!url) return '';
  const suffix = url.substr(url.lastIndexOf(URL_SPLIT) + 1);
  const [prefix] = url.split(suffix);
  return `${prefix}${PHOTO_SIZE_64}${URL_SPLIT}${suffix}`;
};
