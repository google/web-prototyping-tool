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
import { Injectable } from '@angular/core';
import { projectPathForId } from '../path.utils';
import { deleteIdbData, getIdbData, setIdbData } from '../workers/indexed-db.utils';

/**
 * This class coordinates all writing and retrieving data for a project from the local indexeddb
 */
@Injectable({
  providedIn: 'root',
})
export class LocalDatabaseService {
  getProject(projectId: string): Promise<cd.IProject | undefined> {
    const key = projectPathForId(projectId);
    return getIdbData(key);
  }

  setProjectDocument(project: cd.IProject) {
    const key = projectPathForId(project.id);
    return setIdbData(key, project);
  }

  deleteProjectDocument(projectId: string) {
    const key = projectPathForId(projectId);
    return deleteIdbData(key);
  }

  getProjectContents(_projectId: string): cd.ProjectContentMap {
    return {};
  }

  setProjectContentDocuments(_projectId: string, _contentDocs: cd.IProjectContentDocument[]) {}

  deleteProjectContentDocuments(_projectId: string, _contentDocIds: string[]) {}
}
