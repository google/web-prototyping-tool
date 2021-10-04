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

import { downloadBlobAsFile } from 'cd-utils/files';

export const downloadResource = (url: string, filename: string) => {
  const config: RequestInit = {
    mode: 'cors',
    headers: new Headers({
      Origin: location.origin,
    }),
  };

  fetch(url, config)
    .then((response) => response.blob())
    .then((blob) => {
      downloadBlobAsFile(blob, filename);
    })
    .catch((e) => console.error(e));
};
