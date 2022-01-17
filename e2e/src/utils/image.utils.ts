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

import { Page } from 'puppeteer';
import fs from 'fs';
import firebase from 'firebase-admin';
import type { File } from '@google-cloud/storage';
import { formatStringWithArguments } from 'cd-utils/string';

const BASE64 = 'base64';
const IMAGE_EXTENSION = 'png';
const STORAGE_BUCKET = '';
const DATABASE_URL = '';
const LOCAL_KEY_PATH = process.cwd() + '/key.json';
const LOCAL_KEY_REQUIRE_PATH = '../../../key.json';
const IMAGE_CAPTURE_TESTS_FOLDER = 'image-capture-tests/';

/** Takes the screenshot for the current UI. */
export const takeNewScreenshot = async (page: Page, keys: string[], folderId: string) => {
  const path = getScreenshotPath(keys, folderId);
  await takeScreenshot(page, path);
};

const createFileNameFromKeys = (keys: string[]) => keys.join('-');

export const generateLocalFolderWithId = () => Math.random().toString(36).substr(2);

/** Returns the bucket path for this baseline image. */
const getScreenshotPath = (keys: string[], folderId: string) => {
  const date = new Date().toLocaleDateString().replace(/\//g, '-');
  const path = `${IMAGE_CAPTURE_TESTS_FOLDER}${date}-${folderId}/{0}.${IMAGE_EXTENSION}`;
  return formatStringWithArguments(path, createFileNameFromKeys(keys));
};

const takeScreenshot = async (page: Page, writeFilePath?: string): Promise<Buffer> => {
  const data = await page.screenshot();
  const imageBuffer = Buffer.from(data, BASE64);
  if (writeFilePath) writeImageToBucket(writeFilePath, imageBuffer);
  return imageBuffer;
};

let firebaseApp: firebase.app.App;

const initFirebase = () => {
  if (!firebaseApp) {
    let serviceAccount;
    if (fs.existsSync(LOCAL_KEY_PATH)) {
      serviceAccount = require(LOCAL_KEY_REQUIRE_PATH);
    }
    const credentials = serviceAccount
      ? firebase.credential.cert(serviceAccount)
      : firebase.credential.applicationDefault();
    firebaseApp = firebase.initializeApp({
      credential: credentials,
      storageBucket: STORAGE_BUCKET,
      databaseURL: DATABASE_URL,
    });
  }
};

/** Returns a `storage.File` object to allow access to the file location. */
const getFileStorageObject = (imageFilePath: string): File => {
  initFirebase();
  const bucket = firebase.storage().bucket();
  return bucket.file(imageFilePath);
};

const writeImageToBucket = async (imageFilePath: string, imageBuffer: Buffer) => {
  const file = getFileStorageObject(imageFilePath);
  try {
    await file.save(imageBuffer);
  } catch (ex) {
    console.error(`Could not save image "${imageFilePath}"`);
    console.error(ex);
  }
};
