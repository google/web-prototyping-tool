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

export const copyToClipboard = (str: string): Promise<void> => {
  return window.navigator.clipboard.writeText(str);
};

export const readFromClipboard = (): Promise<string> => {
  return window.navigator.clipboard.readText();
};

const IMAGE_REGEX = /image/;
export const imageFileFromClipboardEvent = (clipboardData: DataTransfer | null) => {
  if (!clipboardData || !clipboardData.items) return;
  for (let i = 0; i < clipboardData.items.length; i++) {
    const item = clipboardData.items[i];
    const isImage = IMAGE_REGEX.test(item.type);
    if (isImage) {
      return item.getAsFile();
    }
  }
  return null;
};
