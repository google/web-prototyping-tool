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

// https://github.com/DefinitelyTyped/DefinitelyTyped/issues/17818#issuecomment-441387029
// (i.e. Firebase tutorial doc is wrong)
import { Storage } from '@google-cloud/storage';
import { runWith } from 'firebase-functions';
import { runtimeOptions } from '../configs/firebase.config';
import { IUser } from 'cd-interfaces';
import { APP_URL } from '../environments/environment';
import { FirebaseCollection } from 'cd-common/consts';
import * as firebaseAdmin from 'firebase-admin';

export const gcs = new Storage();
export const firebaseApp = firebaseAdmin.initializeApp();
export const firebaseFunctions = runWith(runtimeOptions);

export const exceptionsCollection = firebaseApp
  .firestore()
  .collection(FirebaseCollection.Exceptions);

const PROD_URL_PORTION = 'prod-app';

export const isProd = () => APP_URL.indexOf(PROD_URL_PORTION) !== -1;

export const getUser = async (userId: string): Promise<IUser> => {
  const user = await firebaseAdmin.auth().getUser(userId);
  if (!user || !user.email) throw new Error('Cannot find user information');
  return { id: userId, email: user.email, name: user.displayName, photoUrl: user.photoURL };
};

export const createTimestamp = () => firebaseAdmin.firestore.Timestamp.now();
