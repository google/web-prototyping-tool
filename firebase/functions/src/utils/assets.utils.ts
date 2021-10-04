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

import * as path from 'path';
import * as cd from 'cd-interfaces';
import { ObjectMetadata } from 'firebase-functions/lib/providers/storage';
import { ASSETS_PATH_PREFIX } from 'cd-common/consts';
import { assetsConversionArgsConfig } from '../configs/assets.config';
import { generateDestPaths } from './image.utils';
import { getProjectContentsDocRef } from './firestore.utils';

export const isProcessable = (object: ObjectMetadata): boolean => {
  const { name, contentType, metadata } = object;

  if (!contentType) {
    console.log('Cannot process asset, contentType not available for image:', name);
    return false;
  }
  if (!contentType.startsWith(cd.IMAGE_MIME_PREFIX)) {
    console.log(
      'Cannot process asset, mime type is not valid:',
      `${contentType} does not start with ${cd.IMAGE_MIME_PREFIX}`
    );
    return false;
  }

  if (!name) {
    console.log('Cannot process asset, filename not available for image');
    return false;
  }
  if (!name.startsWith(ASSETS_PATH_PREFIX)) {
    console.log(
      'Skipping this image, only process images that are user assets:',
      `${name} does not start with ${ASSETS_PATH_PREFIX}`
    );
    return false;
  }

  const basename = path.basename(name);
  if (!basename.startsWith(`${cd.AssetSizes.Original}.`)) {
    console.log(
      'Skipping this image, no need to process images that are thumbnails:',
      `${basename} does not start with ${cd.AssetSizes.Original}`
    );
    return false;
  }

  if (!metadata) {
    console.log('Cannot process asset, no metadata is present for image:', name);
    return false;
  }
  if (metadata.ignoreProcessAsset) {
    console.log(
      'Cannot process asset, metadata specifies "ignoreProcessAsset: true". Metadata === ',
      JSON.stringify(metadata)
    );
    return false;
  }

  return true;
};

export const generateConversionTargets = (
  srcRemotePath: string,
  originalDimension: cd.IImageDimension
): cd.IImageConversionTarget[] =>
  Object.entries(assetsConversionArgsConfig).map<cd.IImageConversionTarget>(([name, argGetter]) => {
    const destPaths = generateDestPaths(srcRemotePath, name);
    const convertArgs = argGetter(originalDimension);
    return { name, destPaths, convertArgs };
  });

export const updateAssetDocUrls = async (id: string, urls: cd.IStringMap<string>) => {
  const docRef = getProjectContentsDocRef(id);
  await docRef.update({ urls });
};

export const getAssetDimension = async (id: string): Promise<cd.IImageDimension | undefined> => {
  const docRef = getProjectContentsDocRef(id);
  const doc = await docRef.get();
  const data = doc.data();

  if (!data || !data.width || !data.height) return;

  const { width, height } = data;
  return { width, height };
};
