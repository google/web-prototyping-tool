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
import * as utils from 'cd-utils/files';
import { MimeExtensions } from 'cd-metadata/files';
import { ASSETS_PATH_PREFIX } from 'cd-common/consts';
import { getModelEntries } from 'cd-common/models';
import { UnitTypes } from 'cd-metadata/units';
import { kebabToSentenceStyle } from 'cd-utils/string';
import { createChangeMarker } from 'cd-common/utils';

const DEFAULT_ICON_VARIANT = 'flat';
const GENERIC_ID = 'id';
const DIR_SLASH = '/';

export const getDefaultVariant = (asset: cd.IAssetsImporterItem) => {
  return DEFAULT_ICON_VARIANT in asset.variants
    ? DEFAULT_ICON_VARIANT
    : Object.keys(asset.variants)[0];
};

export const generateAssetFromMetadata = (
  id: string,
  projectId: string,
  owner: string,
  metadata: utils.IImageFileMetadata
): cd.IProjectAsset => {
  const { name, density, width, height, imageType, blobUrl } = metadata;
  const type = cd.EntityType.Asset;
  const created = Date.now();
  const changeMarker = createChangeMarker();
  const urls = {
    [cd.AssetSizes.Original]: blobUrl,
    [cd.AssetSizes.BigThumbnail]: blobUrl,
    [cd.AssetSizes.SmallThumbnail]: blobUrl,
    [cd.AssetSizes.BigThumbnailXHDPI]: blobUrl,
    [cd.AssetSizes.SmallThumbnailXHDPI]: blobUrl,
  };

  return {
    id,
    changeMarker,
    projectId,
    owner,
    type,
    created,
    name,
    density,
    width,
    height,
    imageType,
    urls,
  };
};

export const doesImageMatchAspectRatio = (
  styles: cd.IStyleDeclaration,
  asset: cd.IProjectAsset,
  rect: cd.IRenderResult,
  img: cd.IImageProperties
) => {
  const { width: w, height: h } = styles;
  const { width: iw, height: ih } = asset;
  const width = w.units === UnitTypes.Pixels ? w.value : rect.frame.width;
  const height = h.units === UnitTypes.Pixels ? h.value : rect.frame.height;
  const aspectRatio = iw / ih;
  const currentRatio = width / height;
  const matchesAspectRatio = img.frame.locked || aspectRatio === currentRatio;
  return matchesAspectRatio;
};

export const isImageOriginalSize = (
  styles: cd.IStyleDeclaration,
  asset: Partial<cd.IProjectAsset>
) => {
  const { width: w, height: h } = styles;
  const { width: iw, height: ih } = asset;
  const width = w.value;
  const height = h.value;
  return width === iw && ih === height;
};

export const generateRemoteImageFilename = (
  projectId: string,
  id: string,
  type: cd.ImageMime
): string => {
  const ext = MimeExtensions[type as cd.ImageMime];
  return `${ASSETS_PATH_PREFIX}${projectId}/${id}/${cd.AssetSizes.Original}.${ext}`;
};

export const generateRemoteFilename = (
  id: string,
  type: cd.FileMime,
  storageFolderName: string,
  fileName: string
): string => {
  const ext = MimeExtensions[type as cd.FileMime];
  return `${storageFolderName}/${id}/${fileName}.${ext}`;
};

export const replaceAssets = (
  oldId: string,
  replacementId: string,
  elementProperties: cd.ElementPropertiesMap
): cd.IPropertiesUpdatePayload[] => {
  const propEntries = getModelEntries(elementProperties);
  return propEntries.reduce<cd.IPropertiesUpdatePayload[]>((acc, curr) => {
    const [elementId, element] = curr;
    let didReplace = false;
    const props = JSON.stringify(element, (key, value) => {
      if (key === GENERIC_ID && value === oldId) {
        didReplace = true;
        return replacementId;
      }
      return value;
    });
    if (didReplace) {
      const found = { elementId, properties: JSON.parse(props) };
      acc.push(found);
    }
    return acc;
  }, []);
};

export const downloadFilesAndReturnImageBlobs = (assets: string[]): Promise<File[]> => {
  return Promise.all(
    assets.map((url) =>
      utils.fetchBlob(url).then((blob) => {
        const items = url.split(DIR_SLASH);
        const name = items[items.length - 1] || url;
        const filename = kebabToSentenceStyle(name);
        return utils.fileFromBlob(blob, filename);
      })
    )
  );
};

export const assetsContainBlobUrls = (projectAssets: cd.AssetMap): boolean => {
  const assetsList = Object.values(projectAssets);
  return assetsList.some((asset) => {
    const urlValues = Object.values(asset.urls);
    return urlValues.some((url) => url.includes('blob'));
  });
};
