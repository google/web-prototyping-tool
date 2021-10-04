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

import { gcs, firebaseFunctions } from './utils/firebase.utils';
import { PROJECT_CONTENTS_FUNCTION_STRING } from './consts/firebase.consts';
import { isRoot } from 'cd-common/models';
import * as imgUtils from './utils/image.utils';
import * as utils from './utils/screenshots.utils';
import * as cd from 'cd-interfaces';
import * as fs from 'fs';
import * as path from 'path';

/**
 * FIRESTORE FUNCTIONS
 */

// The contents of a project (Board, Element, Etc.) are updated, we create
// a screenshot task for the queue
export const onProjectContentsUpdated = firebaseFunctions.firestore
  .document(PROJECT_CONTENTS_FUNCTION_STRING)
  .onUpdate(async (change) => {
    const prev = change.before.data() as cd.IScreenshotable;
    const curr = change.after.data() as cd.IProjectContentDocument;
    const currAsScreenshotable = curr as cd.IScreenshotable;
    // if the change is an update to lastScreenshotTime on a board or symbol, we ignore it
    if (
      prev.lastScreenshotTime &&
      currAsScreenshotable.lastScreenshotTime &&
      prev.lastScreenshotTime !== currAsScreenshotable.lastScreenshotTime
    ) {
      return console.log('ignore update to lastScreenshotTime on board or symbol');
    }

    const timestamp = Date.now();

    if (utils.isTypeElement(curr)) {
      const updatedElement = curr as cd.PropertyModel;
      const { projectId, rootId, elementType } = updatedElement;

      console.log(`onUpdate triggered by element [${rootId}] with type: ${elementType}`);

      if (isRoot(updatedElement) && utils.shouldSkipScreenshot(updatedElement)) {
        return console.log(`Skipping creating a screenshot for root element [${rootId}]`);
      }

      await utils.addPayloadToQueue(projectId, rootId, timestamp);
    } else if (curr.type === cd.EntityType.DesignSystem) {
      const { projectId } = curr as cd.IDesignSystemDocument;
      await utils.addPayloadsForProject(projectId, timestamp);
    } else if (curr.type === cd.EntityType.CodeComponent) {
      const { projectId, id } = curr as cd.ICodeComponentDocument;
      console.log(`Updating screenshot for Code Component with id: ${id}`);
      await utils.addPayloadToQueue(projectId, id, timestamp);
    } else {
      console.log(`Currently can't handle UPDATE of type: ${curr.type}`);
    }

    return console.log('onProjectContentsUpdated');
  });

// The contents of a project (Board, Element, Etc.) are deleted, we create
// a screenshot task for the queue
export const onProjectContentsDeleted = firebaseFunctions.firestore
  .document(PROJECT_CONTENTS_FUNCTION_STRING)
  .onDelete(async (change) => {
    const deletedObject: cd.IProjectContentDocument = change.data() as cd.IProjectContentDocument;

    if (utils.isTypeElement(deletedObject)) {
      const deletedElement = deletedObject as cd.PropertyModel;
      const { id, rootId, projectId, elementType } = deletedElement;

      console.log(`onDelete triggered by element [${id}] with type: ${elementType}`);

      if (isRoot(deletedElement)) {
        await utils.removePayload(rootId);
      } else {
        const timestamp = Date.now();
        const elementDocument = await utils.getProjectContentDocById(rootId);

        if (!elementDocument.exists) {
          return Promise.reject(`Failed to find root at ID: '${rootId}'`);
        }

        const elementDocumentData = elementDocument.data() as cd.PropertyModel;

        if (isRoot(elementDocumentData) && utils.shouldSkipScreenshot(elementDocumentData)) {
          return utils.deleteScreenshotsForId(rootId);
        }

        await utils.addPayloadToQueue(projectId, rootId, timestamp);
      }
    } else if (utils.isTypeCodeComponent(deletedObject)) {
      const { id } = deletedObject;
      console.log(`Deleting screenshot task for Code Component with id: ${id}`);
      await utils.removePayload(id);
    } else {
      return console.log(`Currently can't DELETE type: ${deletedObject.type}`);
    }

    return console.log('project contents deleted');
  });

// The contents of a project (Board, Element, Etc.) are created, we create
// a screenshot task for the queue
export const onProjectContentsCreated = firebaseFunctions.firestore
  .document(PROJECT_CONTENTS_FUNCTION_STRING)
  .onCreate(async (change) => {
    const createdObject: cd.IProjectContentDocument = change.data() as cd.IProjectContentDocument;
    const timestamp = Date.now();

    if (utils.isTypeElement(createdObject)) {
      const newElement = createdObject as cd.PropertyModel;
      const { projectId, rootId, elementType } = newElement;

      console.log(`onCreate triggered by element [${rootId}] with type: ${elementType}`);

      if (isRoot(newElement) && utils.shouldSkipScreenshot(newElement)) {
        return console.log(`Skipping creating a screenshot for root element [${rootId}]`);
      }

      const success = await utils.addPayloadToQueue(projectId, rootId, timestamp);

      if (success) console.log(`Successfully created screenshot task for ${rootId}`);
      else console.log(`Failed to create screenshot task for ${rootId}`);
    } else if (utils.isTypeCodeComponent(createdObject)) {
      const { projectId, id } = createdObject as cd.ICodeComponentDocument;
      console.log(`Creating screenshot task for Code Component with id: ${id}`);
      await utils.addPayloadToQueue(projectId, id, timestamp);
    } else {
      return console.log(`Currently can't handle CREATE of type: ${createdObject.type}`);
    }

    return console.log('onProjectContentsCreated');
  });

/**
 * CLOUD STORAGE FUNCTIONS
 */

export const onScreenshotCreated = firebaseFunctions.storage.object().onFinalize(async (object) => {
  const processable = utils.isProcessable(object);
  if (!processable) return console.log(`Not processing thumbnail for image: ${object.name}`);

  const bucket = gcs.bucket(object.bucket);

  const { local: srcLocalPath, remote: srcRemotePath } = imgUtils.getSourcePaths(object);

  const id = path
    .dirname(object.name as string)
    .split(path.sep)
    .pop() as string;
  console.log('Creating thumbnails for board/symbol with ID:', id);

  const dimension = await utils.getScreenshotDimension(id);
  if (!dimension)
    return console.error(`Image dimension not found for ${id} from path: ${object.name}`);

  console.log(`[${id}]: Generating conversion targets for eventual thumbnails`);
  const targets = utils.generateConversionTargets(srcRemotePath, dimension);

  console.log(
    `[${id}]: Downloading original screenshot file from storage to local fs (on firebase)`
  );
  await bucket.file(srcRemotePath).download({ destination: srcLocalPath });

  console.log(`[${id}]: Creating thumbnails for local original file (on firebase)`);
  await imgUtils.convert(srcLocalPath, targets);

  console.log(`[${id}]: Uploading all new thumbnail files to storage`);
  await imgUtils.batchUpload(targets, bucket, {});

  console.log(`[${id}]: Deleting local files from firebase instance to clean up`);
  imgUtils.deleteLocalConvertedFiles(targets);

  console.log(`[${id}]: Updating lastScreenshottedTime`);
  await utils.updateScreenshotTimestamp(id);

  return fs.unlinkSync(srcLocalPath);
});

/**
 * Code component screenshot handlers
 */
