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

export const UPLOADING_TOAST_ID = 'uploading';
export const UPLOADED_TOAST_ID = 'uploaded';
export const FILE_ERROR = 'Invalid file type';
export const IMAGE_ERROR = 'Allowed image types are PNG, SVG, JPG, or GIF';
export const SUCCESS_MSG_KEY = '@';
export const SUCCESS_MESSAGE = `"${SUCCESS_MSG_KEY}" has been uploaded to assets`;

export const IMPORT_ASSETS_TOAST: cd.IToast = {
  message: 'Importing assets...',
  showLoader: true,
  id: UPLOADING_TOAST_ID,
  duration: -1,
};

export const ALL_UPLOADED_TOAST: cd.IToast = {
  id: UPLOADED_TOAST_ID,
  iconName: 'checked',
  message: 'All files have been uploaded',
};

export const SINGLE_UPLOADED_TOAST: Partial<cd.IToast> = {
  id: UPLOADED_TOAST_ID,
  iconName: 'checked',
};

export const UPLOADING_TOAST: cd.IToast = {
  id: UPLOADING_TOAST_ID,
  showLoader: true,
  message: 'Uploading...',
  duration: -1,
};

export const generateUploadCompleteToast = (filename: string): cd.IToast => {
  const message = SUCCESS_MESSAGE.replace(SUCCESS_MSG_KEY, filename);
  return { ...SINGLE_UPLOADED_TOAST, message } as cd.IToast;
};
