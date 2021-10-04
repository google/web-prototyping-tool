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
import { getDownloadUrl } from './utils/storage.utils';
import * as assetUtils from './utils/assets.utils';
import * as imageUtils from './utils/image.utils';
import * as cd from 'cd-interfaces';
import * as fs from 'fs';
import { updateProjectTimestamp, getProjectContentsDocRef } from './utils/firestore.utils';

// User uploaded an original file, we generate the thumbnails
export const processAsset = firebaseFunctions.storage.object().onFinalize(async (object) => {
  console.log('Processing asset with filename:', object.name);

  const processable = assetUtils.isProcessable(object);
  if (!processable) return console.log('processAsset: not processable: ', object.name);

  const bucket = gcs.bucket(object.bucket);
  const customMetadata = object.metadata as cd.IStringMap<any>;
  const { id } = customMetadata;
  const cacheControl = object.cacheControl;
  const { local: srcLocalPath, remote: srcRemotePath } = imageUtils.getSourcePaths(object);
  const dimension = await assetUtils.getAssetDimension(id);

  if (!dimension) return console.error(`Assets - Image dimension not found for ${id}`);

  const targets = assetUtils.generateConversionTargets(srcRemotePath, dimension);
  // Download file from bucket.
  await bucket.file(srcRemotePath).download({ destination: srcLocalPath });

  await imageUtils.convertTargets(object.contentType, srcLocalPath, targets);

  customMetadata.ignoreProcessAsset = true;

  await imageUtils.batchUpload(targets, bucket, customMetadata, cacheControl);

  imageUtils.deleteLocalConvertedFiles(targets);

  const urls = await imageUtils.getTargetDownloadUrls(bucket, targets);
  urls[cd.AssetSizes.Original] = await getDownloadUrl(bucket, srcRemotePath);

  // cleanup local file
  fs.unlinkSync(srcLocalPath);

  // update URLs in Asset doc
  await assetUtils.updateAssetDocUrls(id, urls);

  // Update timestamp in project document
  const assetDocRef = getProjectContentsDocRef(id);
  const assetDoc = await assetDocRef.get();
  const asset = assetDoc.data() as cd.IProjectAsset | undefined;
  const projectId = asset ? asset.projectId : undefined;
  if (projectId) await updateProjectTimestamp(projectId);
});
