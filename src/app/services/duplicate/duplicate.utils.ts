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
import * as consts from 'cd-common/consts';
import { isDefined } from 'cd-utils/object';
import { isString } from 'cd-utils/string';
import firebase from 'firebase/app';
import { isElement, isImage } from 'cd-common/models';
import { getDatasetIdsUsedByElements, isDatasetDoc } from 'cd-common/utils';
import { getContainedSymbolIdsRecursive } from 'src/app/routes/project/utils/symbol.utils';

const REGEX_ESCAPE_SPECIAL_CHARS = /[.*+?^${}()|[\]\\]/g;
const SPECIAL_CHARS_REPLACEMENT = '\\$&'; // $& means the whole matched string

const getDupedProjectName = (name: string) => `Copy of ${name}`;

// Escape any Regex special characters (i.e. ? * . etc) with \\
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#Escaping
const escapeRegexSpecialCharacters = (regexString: string): string => {
  return regexString.replace(REGEX_ESCAPE_SPECIAL_CHARS, SPECIAL_CHARS_REPLACEMENT);
};

export const replaceStringsInDocs = <T>(srcDocs: T[], replacementMap: Map<string, string>): T[] => {
  const newDocs: T[] = [];

  //  Construct regexes once before looping over docs
  const regexMap = Array.from(replacementMap.entries()).reduce<Map<RegExp, string>>((acc, curr) => {
    const [oldString, newString] = curr;
    const regexString = escapeRegexSpecialCharacters(oldString);

    // When we replace an id, only replace instances where it used by itself
    // example "1234151234"
    // or when prefixed "cdc-12341251234".
    // or when referenced inside of innerHTML innerHTML="<data-chip source=\"1234\"></data-chip>"
    // In both cases, use of id starts with a quotation mark.
    // This check is to prevent replacing an id inside a download url /12341234/original.png
    // since an asset (and its download url) can be used in multiple projects
    // TODO: assets should have totally unique ids that are not contained in this
    // replacement map.
    const regexWithQuote = `"${regexString}`;
    const newStringWithQuote = `"${newString}`;
    const reg = new RegExp(regexWithQuote, 'g');
    acc.set(reg, newStringWithQuote);
    return acc;
  }, new Map());

  for (const doc of srcDocs) {
    let docString = JSON.stringify(doc);

    for (const [regex, newString] of regexMap) {
      regex.lastIndex = 0; // since we are reusing the same regexes, reset each time.
      docString = docString.replace(regex, newString);
    }
    newDocs.push(JSON.parse(docString) as T);
  }

  return newDocs;
};

export const duplicateProjectDoc = (
  project: cd.IProject,
  replacementMap: Map<string, string>,
  owner: cd.IUserIdentity
): cd.IProject => {
  const newDoc = replaceStringsInDocs([project], replacementMap)[0] as cd.IProject;
  const now = firebase.firestore.Timestamp.now();
  newDoc.updatedAt = now;
  newDoc.createdAt = now;
  newDoc.owner = owner;

  const oldName = project.name || consts.UNTITLED_PROJECT_NAME;
  newDoc.name = getDupedProjectName(oldName);

  // reset numComments to 0 since comments don't get duplicated with project
  newDoc.numComments = 0;

  return newDoc;
};

const getChildrenOfIds = (
  ids: string[],
  contentMap: Map<string, cd.IProjectContentDocument>
): cd.PropertyModel[] => {
  return ids.reduce<cd.PropertyModel[]>((acc, currId) => {
    const currModel = contentMap.get(currId) as cd.PropertyModel;
    if (!currModel) return acc;

    acc.push(currModel);
    acc.push(...getChildrenOfIds(currModel.childIds, contentMap));
    return acc;
  }, []);
};

// create a map of all content documents
const mapContents = (
  contents: cd.IProjectContentDocument[]
): Map<string, cd.IProjectContentDocument> =>
  contents.reduce<Map<string, cd.IProjectContentDocument>>((acc, curr) => {
    acc.set(curr.id, curr);
    return acc;
  }, new Map());

// get a list of all assets used by a list of elements
const getElementAssetDependencies = (
  elements: cd.PropertyModel[],
  contentMap: Map<string, cd.IProjectContentDocument>
): cd.IProjectContentDocument[] => {
  const assetIds = elements.reduce<Set<string>>((acc, curr) => {
    const img = curr as cd.IImageProperties;
    if (isImage(img) && img.inputs.src.id) {
      acc.add(img.inputs.src.id);
    }
    return acc;
  }, new Set());

  const assetDocs = Array.from(assetIds).map((id) => contentMap.get(id));
  return assetDocs.filter(isDefined) as cd.IProjectContentDocument[];
};

// get a list of all datasets used by a list of elements
const getElementDatasetDependencies = (
  elements: cd.PropertyModel[],
  contentMap: Map<string, cd.IProjectContentDocument>
): cd.IProjectContentDocument[] => {
  const allProjectDocs = Array.from(contentMap.values());
  const allDatasetDocs = allProjectDocs.filter(isDatasetDoc);
  const allDatasetIds = new Set(allDatasetDocs.map((d) => d.id));
  const datasetDepIds = getDatasetIdsUsedByElements(allDatasetIds, elements);
  const datsetDeps = Array.from(datasetDepIds).map((id) => contentMap.get(id));
  return datsetDeps.filter(isDefined) as cd.IProjectContentDocument[];
};

// get a list of all datasets used as default values for a code component
const getCodeComponentDatasetDependencies = (
  codeComponent: cd.ICodeComponentDocument,
  contentMap: Map<string, cd.IProjectContentDocument>
): cd.IProjectContentDocument[] => {
  const { properties } = codeComponent;
  const datasetInputs = properties.filter((p) => p.inputType === cd.PropertyInput.DatasetSelect);
  const datasetInputValues = new Set(datasetInputs.map((i) => i.defaultValue).filter(isString));
  const datsetDeps = Array.from(datasetInputValues).map((id) => contentMap.get(id));
  return datsetDeps.filter(isDefined) as cd.IProjectContentDocument[];
};

const getSymbolCodeComponentDependencies = (
  symbolElements: cd.PropertyModel[],
  contentMap: Map<string, cd.IProjectContentDocument>
): cd.IProjectContentDocument[] => {
  const models = Array.from(contentMap.values());
  const allCodeComponents = models.filter((m) => m.type === cd.EntityType.CodeComponent);
  const allComponentIds = new Set(allCodeComponents.map((c) => c.id));
  const codeComponentIdsInSymbol = symbolElements.reduce<Set<string>>((acc, curr) => {
    if (allComponentIds.has(curr.elementType)) acc.add(curr.elementType);
    return acc;
  }, new Set());

  const codeComponentsInSymbol = allCodeComponents.filter((c) =>
    codeComponentIdsInSymbol.has(c.id)
  );
  return codeComponentsInSymbol;
};

const getChildSymbolIdsOfSymbol = (
  symbol: cd.ISymbolProperties,
  contents: cd.IProjectContentDocument[]
): string[] => {
  const elements = contents.filter(isElement) as cd.PropertyModel[];
  const elementPropertiesMap = elements.reduce<cd.ElementPropertiesMap>((acc, curr) => {
    acc[curr.id] = curr;
    return acc;
  }, {});
  return getContainedSymbolIdsRecursive([symbol], elementPropertiesMap);
};

export const filterProjectToSymbol = (
  symbolId: string,
  project: cd.IProject,
  contents: cd.IProjectContentDocument[]
): [cd.IProject, cd.IProjectContentDocument[]] => {
  const symbol = contents.find((doc) => doc.id === symbolId) as cd.ISymbolProperties;
  if (!symbol) throw new Error('Symbol not contained in project contents');

  const contentMap = mapContents(contents);
  const childSymbolIds = getChildSymbolIdsOfSymbol(symbol, contents);
  const allSymbolIds = [symbolId, ...childSymbolIds];
  const symbolElements = getChildrenOfIds(allSymbolIds, contentMap);
  const assetDocs = getElementAssetDependencies(symbolElements, contentMap);
  const datasetDocs = getElementDatasetDependencies(symbolElements, contentMap);
  const designSystemDoc = contents.find((doc) => doc.type === cd.EntityType.DesignSystem);
  const codeComponentDocs = getSymbolCodeComponentDependencies(symbolElements, contentMap);
  if (!designSystemDoc) throw new Error('Project does not contain a design system');

  const filteredProject: cd.IProject = { ...project };
  const filteredContents = [
    designSystemDoc,
    ...symbolElements,
    ...assetDocs,
    ...codeComponentDocs,
    ...datasetDocs,
  ];
  return [filteredProject, filteredContents];
};

export const filterProjectToCodeComponent = (
  codeComponentId: string,
  project: cd.IProject,
  contents: cd.IProjectContentDocument[]
): [cd.IProject, cd.IProjectContentDocument[]] => {
  const contentMap = mapContents(contents);
  const codeComponent = contentMap.get(codeComponentId) as cd.ICodeComponentDocument;
  if (!codeComponent) throw new Error('Code component not contained in project');

  const designSystemDoc = contents.find((doc) => doc.type === cd.EntityType.DesignSystem);
  if (!designSystemDoc) throw new Error('Project does not contain a design system');

  const datasetDocs = getCodeComponentDatasetDependencies(codeComponent, contentMap);
  const filteredProject = { ...project, symbolIds: [], boardIds: [] };
  const filteredContents = [designSystemDoc, codeComponent, ...datasetDocs];
  return [filteredProject, filteredContents];
};
