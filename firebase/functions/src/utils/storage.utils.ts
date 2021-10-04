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

import { Bucket, UploadResponse } from '@google-cloud/storage';
import { Metadata } from '@google-cloud/common';
import { GOOGLE_APIS_PATH, FIREBASE_STORAGE_APIS_PATH } from '../consts/storage.consts';

// Only GCS API is available in cloud functions, and it doesn't expose
// getDownloadUrl(), so mimic it.
export const getDownloadUrl = async (bucket: Bucket, path: string): Promise<string> => {
  const [metadata] = await bucket.file(path).getMetadata();
  return gcsLinkToFirebaseLink(metadata.selfLink, metadata.metadata.firebaseStorageDownloadTokens);
};

export const gcsLinkToFirebaseLink = (gcsLink: string, token: string) => {
  const withReplacedPath = gcsLink.replace(GOOGLE_APIS_PATH, FIREBASE_STORAGE_APIS_PATH);
  return `${withReplacedPath}?alt=media&token=${token}`;
};

export const uploadFile = (
  bucket: Bucket,
  localPath: string,
  destination: string,
  metadata: Metadata,
  resumable = false
): Promise<UploadResponse> => bucket.upload(localPath, { destination, resumable, metadata });
