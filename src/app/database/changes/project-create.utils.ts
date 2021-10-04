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
import * as models from 'cd-common/models';
import * as utils from 'cd-common/utils';
import { Theme } from 'cd-themes';
import { createId } from 'cd-utils/guid';
import { DEFAULT_OUTLET_FRAME_NAME } from 'cd-common/consts';

// For a new blank project, we create a project, a board, and a design system document
export const createNewProjectPayload = (user: cd.IUser, themeId: Theme): cd.IBlankProjectCreate => {
  const project = utils.createProjectDocument(user);
  const designSystem = utils.createDesignSystemDocument(project.id, themeId);
  const boardId = createId();
  const board = models
    .createInstance(cd.ElementEntitySubType.Board, project.id, boardId)
    .assignName(DEFAULT_OUTLET_FRAME_NAME)
    .assignRootId(boardId);

  // set project homeboard to new board
  project.homeBoardId = boardId;

  const projectPayload = utils.createProjectChangePayload([project]);
  const dsPayload = utils.createDesignSystemChangePayload([designSystem]);
  const boardPayload = utils.createElementChangePayload([board]);
  const changes = [projectPayload, dsPayload, boardPayload];

  return { project, changes };
};
