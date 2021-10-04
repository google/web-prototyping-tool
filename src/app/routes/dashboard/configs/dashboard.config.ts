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

import * as store from '../../../store';
import { IMenuConfig } from 'cd-interfaces';
import { ProjectAction } from 'cd-common/consts';

const projectMenu: IMenuConfig[][] = [
  [
    {
      title: 'Rename...',
      icon: 'edit',
      id: ProjectAction.Rename,
    },
  ],
  [
    {
      title: 'Open in new tab',
      icon: 'open_in_new',
      id: ProjectAction.Open,
    },
    {
      title: 'Make a copy',
      icon: 'file_copy',
      id: ProjectAction.Duplicate,
    },
  ],
  [
    {
      title: 'Share',
      icon: 'share',
      id: ProjectAction.Share,
    },
  ],
  [
    {
      title: 'Delete',
      icon: 'delete',
      id: ProjectAction.Delete,
    },
  ],
];

const nonOwnerProjectMenu: IMenuConfig[][] = [
  [
    {
      title: 'Open',
      icon: 'open_in_new',
      id: ProjectAction.Open,
    },
    {
      title: 'Make a copy',
      icon: 'file_copy',
      id: ProjectAction.Duplicate,
    },
  ],
  [
    {
      title: 'Share',
      icon: 'share',
      id: ProjectAction.Share,
    },
  ],
];

const adminProjectMenuItems: IMenuConfig[][] = [
  [
    {
      title: 'Regenerate screenshots',
      icon: 'refresh',
      id: ProjectAction.RegenerateScreenshots,
    },
  ],
];

const projectMenuAdmin: IMenuConfig[][] = [...projectMenu, ...adminProjectMenuItems];

const nonOwnerProjectMenuAdmin: IMenuConfig[][] = [
  ...nonOwnerProjectMenu,
  ...adminProjectMenuItems,
];

const avatarMenu: IMenuConfig[] = [
  {
    title: 'Sign out',
    icon: 'exit_to_app',
    action: store.APP_SIGN_OUT_USER,
  },
];

export default {
  avatarMenu,
  projectMenu,
  nonOwnerProjectMenu,
  projectMenuAdmin,
  nonOwnerProjectMenuAdmin,
};
