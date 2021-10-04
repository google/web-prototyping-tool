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

import type * as cd from 'cd-interfaces';
import { Subject } from 'rxjs';
import { isBlobUrl } from 'cd-utils/files';
import { getModelEntries } from 'cd-common/models';
import { frameForElement, generateStyle } from 'cd-common/utils';
import { STYLES_PROP } from 'cd-common/consts';

export const rootIdsUpdated$ = new Subject<string[]>();

export interface IIdsSummary {
  rootIds: string[];
  allIds: string[];
}

/** Don't send renderRect updates if the document dimensions are width:0, height:0 */
export const doesDocumentBodyHaveInvalidSize = (outletDocument: Document): boolean => {
  const { width, height } = outletDocument.body.getBoundingClientRect();
  return width === 0 && height === 0;
};

export const getRenderResults = (
  elements: HTMLElement[],
  rootId: string,
  previewMode = false
): cd.RenderResults => {
  const results = {} as cd.RenderResults;
  for (let i = 0; i < elements.length; i++) {
    const el = elements[i];
    const id = previewMode ? el.dataset?.fullIdPath : el.dataset?.id;

    if (id === undefined) continue;
    if (!previewMode && id in results) {
      throw new Error(`Multiple elements have the same id: ${id}`);
    }

    const frame = frameForElement(el);
    results[id] = { id, rootId, frame };
  }
  return results;
};

// Returns an array of board ids in the updates
export const getIdsInUpdatedElementContent = (updatedContent: cd.ElementContent): IIdsSummary => {
  const { idsCreatedInLastChange, idsUpdatedInLastChange, idsDeletedInLastChange, records } =
    updatedContent;
  const allIdsSet = new Set<string>([
    ...idsCreatedInLastChange,
    ...idsUpdatedInLastChange,
    ...idsDeletedInLastChange,
  ]);
  const rootIdsSet = new Set<string>();

  for (const elementId of allIdsSet) {
    const elementProps = records[elementId];
    if (!elementProps) continue;
    const { rootId } = elementProps;
    rootIdsSet.add(rootId);
  }

  const rootIds = [...rootIdsSet];
  const allIds = [...allIdsSet];
  return { rootIds, allIds };
};

export const mergeIdSummaries = (...summaries: IIdsSummary[]): IIdsSummary => {
  const rootIdsSet = new Set<string>();
  const allIdsSet = new Set<string>();

  for (const summary of summaries) {
    for (const rootId of summary.rootIds) {
      rootIdsSet.add(rootId);
    }
    for (const id of summary.allIds) {
      allIdsSet.add(id);
    }
  }

  const rootIds = [...rootIdsSet];
  const allIds = [...allIdsSet];

  return { rootIds, allIds };
};

/**
 * Map app-domain blob url to renderer-domain blob url by regenerating blob url in renderer
 * @param blobs
 */
export const createRendererBlobUrls = (blobs: Record<string, Blob>): Record<string, string> =>
  Object.entries(blobs).reduce(
    (prev, [appBlobUrl, blob]) => ({
      ...prev,
      [appBlobUrl]: URL.createObjectURL(blob),
    }),
    {}
  );

/**
 * 1. If app sends us a blob url, then it's an app-domain blob url, we'll
 *    convert it to renderer-domain blob url.
 * 2. If app sends us an internet url, then we use it directly (but not before
 *    we revoke the blob url generated in 1.)
 * @param oldAsset,
 * @param newAsset,
 * @param appBlobUrlToRendererBlobUrl,
 */
export const processAssetUrls = (
  oldAsset: cd.IProjectAsset,
  newAsset: cd.IProjectAsset,
  appBlobUrlToRendererBlobUrl: Record<string, string>
) => {
  const { urls: newUrls } = newAsset;
  for (const [size, newUrl] of Object.entries(newUrls)) {
    if (isBlobUrl(newUrl)) {
      // newUrl is an app-domain blob url, so we want to use its corresponding
      // renderer-domain blob url
      newAsset.urls[size as cd.AssetSizes] = appBlobUrlToRendererBlobUrl[newUrl];
    } else {
      // newUrl is an internet url, so revoke old blob url (if it exists and is an blob url)
      if (oldAsset) {
        const oldUrl = oldAsset.urls[size as cd.AssetSizes];
        if (isBlobUrl(oldUrl)) {
          URL.revokeObjectURL(oldUrl);
        }
      }
    }
  }

  return newAsset;
};

export const generateBoardsStyles = (
  boardsMap: cd.IStringMap<cd.IBoardProperties>,
  bindings: cd.IProjectBindings
): cd.IStringMap<cd.IStyleAttributes> => {
  const stylesMap: cd.IStringMap<cd.IStyleAttributes> = {};
  for (const board of Object.values(boardsMap)) {
    stylesMap[board.id] = generateStyle(board.styles, bindings);
  }
  return stylesMap;
};

export const generateElementsStyles = (
  elementProperties: cd.ElementPropertiesMap,
  bindings: cd.IProjectBindings
): cd.IStringMap<cd.IStyleAttributes> => {
  if (!elementProperties) return {};
  const entries = getModelEntries(elementProperties);
  const stylesMap: cd.IStringMap<cd.IStyleAttributes> = {};
  for (const entry of entries) {
    const [id, model] = entry;
    if (model && STYLES_PROP in model) {
      stylesMap[id] = generateStyle(model.styles, bindings);
    }
  }
  return stylesMap;
};

export const filterChildIdsForProps = (
  elementProperties: cd.ElementPropertiesMap,
  rootId: string,
  elementId: string
): cd.PropertyModel => {
  const root = elementProperties[rootId];
  const childIds = (root?.childIds || []).filter((item) => item !== elementId);
  return { ...root, childIds } as cd.PropertyModel;
};
