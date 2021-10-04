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
import * as admin from 'firebase-admin';
import program from 'commander';
import { transformEntity, verifyEntity } from './reducer';
import { BatchChunker, sleep } from '../shared/utils';
import { DATABASE_URL, SERVICE_ACCOUNT_KEY } from '../environments/environment';
import {
  DATABASE_URL as DATABASE_URL_PROD,
  SERVICE_ACCOUNT_KEY as SERVICE_ACCOUNT_KEY_PROD,
} from '../environments/environment.prod';

enum Collection {
  Projects = 'projects',
  ProjectContents = 'project_contents',
}

const PROJECT_ID = 'projectId';
const PROJECT_QUERY_LIMIT = 1000;
let database: FirebaseFirestore.Firestore;

program
  .option('-p, --projectId <type>', 'project Id')
  .option('-v, --verify <type>', 'verify specific project')
  .option('-x, --verifyAll', 'verify all projects')
  .option('-a, --all', 'all projects')
  .option('--prod', 'use prod environment');

program.parse(process.argv);

///////////////////////////////////////////////////////////////
// PROCESS ITEMS //////////////////////////////////////////////
///////////////////////////////////////////////////////////////
const authenticateDatabase = (prod = false) => {
  const databaseURL = prod ? DATABASE_URL_PROD : DATABASE_URL;
  const key = prod ? SERVICE_ACCOUNT_KEY_PROD : SERVICE_ACCOUNT_KEY;
  const credential = admin.credential.cert(key as any);

  admin.initializeApp({ credential, databaseURL });

  database = admin.firestore();
};

const processDocuments = async (snapshot: any) =>
  snapshot.docs.map((projectDoc: any) => projectDoc.data());

const processProjectContents = async (
  data: cd.PropertyModel[]
): Promise<FirebaseFirestore.WriteResult[][]> => {
  const batches = new BatchChunker(database);

  for (const item of data) {
    const entity = transformEntity(item);
    if (!entity) continue;

    const batch = batches.getCurrentBatch();
    const doc = database.collection(Collection.ProjectContents).doc(entity.id);
    batch.set(doc, entity);
    console.log(`writing update ${item.id}`);
  }

  return batches.commit();
};

const verifyProjectContents = (data: cd.PropertyModel[]) => {
  let valid = true;
  for (const entity of data) {
    const isValid = verifyEntity(entity);
    if (!isValid) {
      console.log(`Found invalid entity ${entity.id}`);
      valid = false;
    }
  }
  return valid;
};

const readSingleProject = (projectId: string) =>
  database
    .collection(Collection.ProjectContents)
    .where(PROJECT_ID, '==', projectId)
    .get()
    .then((snapshot) => processDocuments(snapshot))
    .catch((err) => console.log('unknown project', err));

// ALL PROJECTS

let project_query_count = 0;

const readProjectSnapshot = async (snapshot: any) => {
  if (!snapshot) return;
  const verify = !!program.verifyAll;
  const data = await processDocuments(snapshot);
  try {
    for (const item of data) {
      const projectSnapshot = await readSingleProject(item.id);
      const validProject = verifyProjectContents(projectSnapshot);
      // Migrate projects
      if (!verify) {
        // Check project before migration
        if (validProject === false) {
          await processProjectContents(projectSnapshot);
          await sleep(500);
        }
      }

      console.log(`${project_query_count} - ${item.id}`);
      project_query_count++;
    }
  } catch (e) {
    console.log('Batch Error', e);
  }
  console.log('LIMIT', project_query_count);
  const last = snapshot.docs[snapshot.docs.length - 1];
  if (!last) return;
  return readAllProjects(last);
};

// All Projects

const readAllProjects = (last?: any) => {
  database
    .collection(Collection.Projects)
    .limit(PROJECT_QUERY_LIMIT)
    .orderBy('id')
    .startAfter(last ? last.data().id : 0)
    .get()
    .then((snapshot) => readProjectSnapshot(snapshot));
};

///////////////////////////////////////////////////////////////
// Initialize /////////////////////////////////////////////////
///////////////////////////////////////////////////////////////

(async () => {
  const { verify, projectId, all, verifyAll, prod } = program;
  const lookupId = verify || projectId;
  authenticateDatabase(Boolean(prod));

  if (lookupId) {
    const snapshot = await readSingleProject(lookupId);

    if (verify) {
      verifyProjectContents(snapshot);
    } else {
      processProjectContents(snapshot);
    }
  } else if (all || verifyAll) {
    readAllProjects();
  }
})();

process.on('unhandledRejection', (reason, _promise) => {
  console.log('Unhandled Rejection at:', reason);
});

process.on('uncaughtException', (error) => {
  console.log('Uncaught exception at:', error.message);
});
