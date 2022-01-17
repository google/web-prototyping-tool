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
import type firebase from 'firebase/app';
import { DEFAULT_PROJECT_TYPE } from 'cd-common/consts';
import { Theme, themeFromId } from 'cd-themes';

export const createProjectDocument = (
  id: string,
  timestamp: firebase.firestore.Timestamp,
  user: cd.IUser
): cd.IProject => {
  const creator = { id: user.id, email: user.email };
  return {
    id,
    desc: '',
    type: DEFAULT_PROJECT_TYPE,
    name: '',
    owner: creator,
    creator,
    createdAt: timestamp,
    updatedAt: timestamp,
    boardIds: [],
    assetIds: [],
    symbolIds: [],
    numComments: 0,
  };
};

export const createDesignSystemDocument = (
  id: string,
  projectId: string,
  themeId = Theme.AngularMaterial
): cd.IDesignSystemDocument => {
  const type = cd.EntityType.DesignSystem;
  const initialDesignSystem = themeFromId[themeId]().theme;
  const dsDoc: cd.IDesignSystemDocument = { ...initialDesignSystem, id, projectId, type };
  return dsDoc;
};
