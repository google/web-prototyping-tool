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

import {
  isImage,
  filterOutRootIdsAndChildren,
  duplicateComponentInstanceGroup,
  setProjectIdOnContents,
  isPortalParent,
  isBoardPortal,
} from 'cd-common/models';
import { getDatasetIdsUsedByElements } from 'cd-common/utils';
import * as cd from 'cd-interfaces';
import { replaceStringsInDocs } from 'src/app/services/duplicate/duplicate.utils';
import { combineMaps } from 'cd-utils/map';
import { createId } from 'cd-utils/guid';
import { makePluralFromLength } from 'cd-utils/string';

const XML_NAMESPACE = '<?xml version="1.0" encoding="UTF-8"?>';
const SVG_START_TAG = '<svg';
const SVG_CLOSE_TAG = '</svg>';
const VECTOR_SVG_TITLE = 'Vector';
const TITLE_TAG_REGEX = /(?<=<title>)(.*?)(?=<\/title>)/g;
const RESOURCE = 'resource';

const convertTextToSVGFile = (svg: string) => {
  const config = { type: cd.ImageMime.SVG };
  const img = new Blob([svg], config);
  const title = svg.match(TITLE_TAG_REGEX)?.[0] || VECTOR_SVG_TITLE;
  return new File([img], title, config);
};

export const isContentFromAnotherProject = (
  clipoardContent: cd.IClipboardContent,
  currentProjectId?: string
): boolean => {
  return currentProjectId !== clipoardContent.srcProjectId;
};

export const detectSVGinTextAndReturnFile = (text: string): File | undefined => {
  const startIdx = text.indexOf(SVG_START_TAG);
  const endIdx = text.indexOf(SVG_CLOSE_TAG);
  if (startIdx === -1 || endIdx === -1) return;
  const svg = XML_NAMESPACE + text.substr(startIdx, endIdx + SVG_CLOSE_TAG.length);
  return convertTextToSVGFile(svg);
};

/**
 * Update the content to reference the mapped ids. This is so that pasted elements reference
 * any new resources (symbols, assets, code componenet, etc) that have been added to the project
 * as a result of a copy/paste
 */
export const updateContentWithMappedIds = (
  clipboardContent: cd.IClipboardContent,
  idMap: cd.IDReplacementMap
): cd.IClipboardContent => {
  if (!idMap.size) return clipboardContent;
  const models = replaceStringsInDocs(clipboardContent.models, idMap) as cd.PropertyModel[];
  const rootIds = clipboardContent.rootIds.map((id) => idMap.get(id) || id);
  return { ...clipboardContent, rootIds, models };
};

/**
 *
 * Generate a generic message for the total of all types of resources copy/pasted into project:
 *
 * For example: 5 resources added to project.
 *
 * Return undefined if no new resources were added
 */
export const generateImportMessage = (
  assetsImported: cd.IProjectAsset[],
  symbolsImported: cd.ISymbolProperties[],
  codeCmpsImported: cd.ICodeComponentDocument[],
  datasetsImported: cd.ProjectDataset[]
): string | undefined => {
  const totalImports =
    assetsImported.length +
    symbolsImported.length +
    codeCmpsImported.length +
    datasetsImported.length;

  if (totalImports === 0) return undefined;
  const resourcesStr = makePluralFromLength(RESOURCE, totalImports);
  return `${totalImports} ${resourcesStr} added to project`;
};

/**
 * For any code component instances that are contained in the clipboard content,
 * Return their corresponding ICodeComponentDocuments
 */
export const getCodeComponentsInClipboardModels = (
  clipboardModels: cd.PropertyModel[],
  allCodeComponents: cd.ICodeComponentDocument[]
): cd.ICodeComponentDocument[] => {
  const codeCmpInstances = clipboardModels.filter((m) => m.isCodeComponentInstance);
  const codeCmpIds = new Set(codeCmpInstances.map((i) => i.elementType));
  const codeComponents = allCodeComponents.filter((c) => codeCmpIds.has(c.id));
  return codeComponents;
};

/**
 * For any image primitive instances in the clipboard, lookup and return any Asset documents that
 * they reference
 */
export const getAssetsInClipboardModels = (
  clipboardModels: cd.PropertyModel[],
  allProjectAssets: cd.IProjectAsset[]
): cd.IProjectAsset[] => {
  const images = clipboardModels.filter(isImage) as cd.IImageProperties[];
  const imageAssetIds = images.map((i) => i.inputs.src?.id).filter((id) => !!id) as string[];
  const assetIdSet = new Set(imageAssetIds);
  const assets = allProjectAssets.filter((a) => assetIdSet.has(a.id));
  return assets;
};

/**
 * Lookup any databound values used by elements in the clipboard, and return their corresponding
 * datasets
 */
export const getDatasetsInClipboardModels = (
  clipboardModels: cd.PropertyModel[],
  allDatasets: cd.ProjectDataset[]
): cd.ProjectDataset[] => {
  const allDatasetIds = new Set(allDatasets.map((d) => d.id));
  const datasetIds = getDatasetIdsUsedByElements(allDatasetIds, clipboardModels);
  const datasets = allDatasets.filter((d) => datasetIds.has(d.id));
  return datasets;
};

/**
 * Assign new ids and projectId to new copy/pasted documents.
 *
 * Skip any documents that have already been imported
 */
export const createDocumentCopies = <T extends cd.IProjectContentDocument>(
  docsToCopy: T[] = [],
  projectId: string,
  alreadyImportedIdMap: cd.IDReplacementMap
): [T[], cd.IDReplacementMap] => {
  const copiedDocs: T[] = [];
  const idMap: cd.IDReplacementMap = new Map();

  if (!docsToCopy?.length) return [copiedDocs, idMap];

  for (const doc of docsToCopy) {
    const { id: oldId } = doc;

    // skip this asset if we've already imported it in a previous copy/paste
    if (alreadyImportedIdMap.has(oldId)) continue;

    const newId = createId();
    idMap.set(oldId, newId);
    copiedDocs.push({ ...doc, id: newId, projectId });
  }

  return [copiedDocs, idMap];
};

/**
 * Create copies of all symbols (and their child elements) contained within clipboard.
 *
 * Returns an array of all new element models and an ID map from old element ids to new ids
 */
export const createSymbolCopies = (
  projectId: string,
  alreadyImportedIdMap: cd.IDReplacementMap,
  clipboardSymbols?: cd.IComponentInstanceGroup
): [cd.PropertyModel[], cd.IDReplacementMap] => {
  if (!clipboardSymbols) return [[], new Map()];

  // Filter out any symbols that have already been copy/pasted
  const alreadyImportedlIds = Array.from(alreadyImportedIdMap.keys());
  const filterdSymbols = filterOutRootIdsAndChildren(alreadyImportedlIds, clipboardSymbols);
  if (!filterdSymbols.rootIds.length) return [[], new Map()];

  // copy all elements
  const duplication = duplicateComponentInstanceGroup(filterdSymbols, true);
  const { models, idMap } = duplication;

  // set project id on all new elements
  const projectElements = setProjectIdOnContents(models, projectId);

  // Update all elements to use newly imported resources (assets, code components, datasets)
  const mergedMap = combineMaps(alreadyImportedIdMap, idMap);
  const newElements = replaceStringsInDocs(projectElements, mergedMap);

  return [newElements, mergedMap];
};

/* Removes a portals reference Id **/
const removePortalRefId = (portal: cd.IBoardPortalProperties): cd.IBoardPortalProperties => {
  const { referenceId } = portal.inputs;
  if (!referenceId) return portal;
  const inputs = { ...portal.inputs, referenceId: null };
  return { ...portal, inputs };
};

/** Remove a portal reference from all child portals */
const removePortalParentRefs = (portalParent: cd.PropertyModel): cd.PropertyModel => {
  const currentInputs = portalParent.inputs as cd.IPortalParentInputs;
  const childPortals = currentInputs.childPortals.map((child) => {
    const { value } = child;
    if (!value) return child;
    return { ...child, value: null };
  });
  const inputs = { ...currentInputs, childPortals };
  return { ...portalParent, inputs };
};

/**
 * If content is from another project: for all portals contained within the clipboard content,
 * delete their reference Ids.
 *
 * This is for when performing an element paste from another project. Updating portal references
 * is only supported when copy/pasting at the board level
 */
export const removePortalReferences = (
  clipboardContent: cd.IClipboardContent,
  projectId?: string
): cd.IClipboardContent => {
  if (!isContentFromAnotherProject(clipboardContent, projectId)) return clipboardContent;
  const { models } = clipboardContent;
  const portals = models.filter(isBoardPortal);
  const portalParents = models.filter(isPortalParent); // tabs, steppers, etc
  const updatedPortals = portals.map((p) => removePortalRefId(p));
  const updatedPortalParents = portalParents.map((p) => removePortalParentRefs(p));
  const updatedModels = [...models, ...updatedPortals, ...updatedPortalParents];
  return { ...clipboardContent, models: updatedModels };
};
