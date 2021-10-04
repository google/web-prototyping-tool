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
import { generateIDWithLength } from 'cd-utils/guid';
import firebase from 'firebase/app';

export interface ITestDoc {
  id: string;
  count?: number;
  owner?: cd.IUserIdentity;
  type?: typeof cd.DefaultProjectType;
}

export const TEST_COLLECTION = 'test-collection';
export const TEST_ID = 'test-id';

export const TEST_DOC = { id: 'foo', count: 1 } as any;
export const TEST_DOC2 = { id: 'foo2', count: 2 } as any;
export const TEST_DOC3 = { id: 'foo3', count: 3 } as any;
export const TEST_DOCS_ARRAY = [TEST_DOC, TEST_DOC2, TEST_DOC3];

export const generateTestDocs = (count: number, startIndex = 0): ITestDoc[] => {
  const docs = [];
  for (let i = startIndex; i < count; i++) {
    docs.push({ id: i.toString() });
  }
  return sortById(docs);
};

export const TEST_PROJECT_ID = 'test-project';

export const TEST_USER_NAME = 'bob';
export const TEST_USER_ID = 'u123';
export const TEST_USER_EMAIL = `${TEST_USER_NAME}@google.com`;
export const TEST_USER_IDENTITY: cd.IUserIdentity = { id: TEST_USER_ID, email: TEST_USER_EMAIL };

export const TEST_USER_NAME2 = 'jane';
export const TEST_USER_ID2 = 'u456';
export const TEST_USER_EMAIL2 = `${TEST_USER_NAME2}@google.com`;
export const TEST_USER_IDENTITY2: cd.IUserIdentity = { id: TEST_USER_ID2, email: TEST_USER_EMAIL2 };

export const TEST_PROJECT: cd.IProject = {
  id: TEST_PROJECT_ID,
  type: cd.DefaultProjectType,
  homeBoardId: 'board1',
  numComments: 3,
  name: 'My Project',
  owner: { id: TEST_USER_ID, email: TEST_USER_EMAIL },
  creator: { id: TEST_USER_ID, email: TEST_USER_EMAIL },
  createdAt: firebase.firestore.Timestamp.now(),
  updatedAt: firebase.firestore.Timestamp.now(),
};

export const TEST_ELEMENT: cd.IProjectContentDocument = {
  id: 'test-element',
  projectId: 'test-project',
  type: cd.EntityType.Element,
};

export const generateTestContent = (count: number): cd.IProjectContentDocument[] => {
  const docs = [];
  for (let i = 0; i < count; i++) {
    docs.push({
      id: generateIDWithLength(),
      projectId: TEST_PROJECT_ID,
      type: cd.EntityType.Element,
    });
  }
  return sortById(docs);
};

const sortById = (docs: any[]) => {
  return docs.sort((a, b) => {
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });
};
