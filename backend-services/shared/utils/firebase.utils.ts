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

import * as admin from 'firebase-admin';
import { BUCKET_URL, DATABASE_URL as databaseURL } from '../environments/environment';

// expects enviroment variable "GOOGLE_APPLICATION_CREDENTIALS" to be set
const credential = admin.credential.applicationDefault();
export const firebaseAdmin = admin.initializeApp({ credential, databaseURL });
export const firestoreDb = firebaseAdmin.firestore();
export const bucket = firebaseAdmin.storage().bucket(BUCKET_URL);

export const getTimestamp = (millseconds?: number): admin.firestore.Timestamp => {
  if (!millseconds) return admin.firestore.Timestamp.now();
  return admin.firestore.Timestamp.fromMillis(millseconds);
};
