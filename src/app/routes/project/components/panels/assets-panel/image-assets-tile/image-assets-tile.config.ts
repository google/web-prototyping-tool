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

export enum AssetTileMenuActions {
  Rename = 'rename',
  Delete = 'delete',
  Download = 'download',
  Replace = 'replace',
}

export const assetTileMenuConfig: cd.IMenuConfig[][] = [
  [
    {
      id: AssetTileMenuActions.Rename,
      title: 'Rename',
      icon: 'edit',
    },
    {
      id: AssetTileMenuActions.Replace,
      title: 'Replace',
      icon: 'swap_calls',
    },
    {
      id: AssetTileMenuActions.Download,
      title: 'Download',
      icon: 'cloud_download',
      divider: true,
    },
    {
      id: AssetTileMenuActions.Delete,
      title: 'Delete',
      icon: 'delete',
    },
  ],
];
