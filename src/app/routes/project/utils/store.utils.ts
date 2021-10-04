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

import { PAN_SHIFT_KEY, PAN_DEFAULT } from '../configs/canvas.config';
import { convertModelListToMap, getModels } from 'cd-common/models';
import { IPoint } from 'cd-utils/geometry';
import { keyCheck, KEYS } from 'cd-utils/keycodes';
import { getSetChanges } from 'cd-utils/set';
import { negate } from 'cd-utils/numeric';
import { Action } from '@ngrx/store';
import * as action from '../store/actions';
import * as utils from './project.utils';
import * as cd from 'cd-interfaces';

export const movePoint = (key: string, shiftKey: boolean, x: number, y: number): IPoint => {
  const pan = shiftKey ? PAN_SHIFT_KEY : PAN_DEFAULT;
  if (keyCheck(key, KEYS.ArrowUp, KEYS.ArrowDown)) {
    y += negate(pan, key === KEYS.ArrowUp);
  } else {
    x += negate(pan, key === KEYS.ArrowLeft);
  }
  return { x, y };
};

export const generateLoadContentActions = (
  projectId: string,
  docs: cd.IProjectContentDocument[]
): Action[] => {
  const actions: Action[] = [];

  const { Element, Asset, CodeComponent, Dataset } = cd.EntityType;
  const designSystem = utils.findDesignSystemInProjectContents(docs);
  const assets = utils.filterProjectContents<cd.IProjectAsset>(docs, Asset);
  const codeCmps = utils.filterProjectContents<cd.ICodeComponentDocument>(docs, CodeComponent);
  const datasets = utils.filterProjectContents<cd.ProjectDataset>(docs, Dataset);

  // HOTFIX - prevent ever loading any elements that are not part of given projectId
  const elements = utils
    .filterProjectContents<cd.PropertyModel>(docs, Element)
    .filter((e) => e.projectId === projectId);

  if (elements.length) actions.push(new action.ElementPropertiesRemoteAdd(elements));
  if (designSystem) actions.push(new action.DesignSystemRemoteAdded(designSystem));
  if (assets.length) actions.push(new action.AssetsRemoteAdded(assets));
  if (codeCmps.length) actions.push(new action.CodeComponentRemoteAdd(codeCmps));
  if (datasets.length) actions.push(new action.DatasetRemoteAdd(datasets));

  return actions;
};

export const generateLoadLocalContentActions = (localData: cd.IOfflineProjectState) => {
  const { elementProperties, designSystem, assets, project, codeComponents, datasets } = localData;
  const elementModels = getModels(elementProperties);
  const assetDocs = Object.values(assets || {});
  const codeComponentDocs = codeComponents || [];
  const datasetDocs = datasets || [];
  const contentDocuments = [
    ...elementModels,
    designSystem,
    ...assetDocs,
    ...codeComponentDocs,
    ...datasetDocs,
  ];
  return generateLoadContentActions(project.id, contentDocuments);
};

export const generateSyncContentActions = (
  updatedProject: cd.IProject,
  updatedContents: cd.IProjectContentDocument[],
  currentElementProperties: cd.ElementPropertiesMap
): Action[] => {
  const actions: Action[] = [];

  const { Element, Asset } = cd.EntityType;
  const designSystem = utils.findDesignSystemInProjectContents(updatedContents);
  const assets = utils.filterProjectContents<cd.IProjectAsset>(updatedContents, Asset);
  const elements = utils.filterProjectContents<cd.PropertyModel>(updatedContents, Element);

  const elementProperties = convertModelListToMap(elements);
  const elementKeys = new Set(Object.keys(elementProperties));
  const currElementKeys = new Set(Object.keys(currentElementProperties));
  const deletedIds = getSetChanges(currElementKeys, elementKeys, true);

  if (designSystem) actions.push(new action.DesignSystemRemoteAdded(designSystem));
  if (assets.length > 0) actions.push(new action.AssetsRemoteAdded(assets));

  actions.push(new action.ProjectDataQuerySuccess(updatedProject.id, updatedProject));
  actions.push(new action.ElementPropertiesSetAll(elementProperties, deletedIds, false));

  return actions;
};

// Need to nullify keys in previous object that are no longer being used
// so that they get deleted out of the store
export const nullifyPrevKeys = <T extends any>(prevObject: any, newObject: any): T => {
  const prevKeys = Object.keys(prevObject);
  return prevKeys.reduce(
    (acc, currKey) => {
      if (!(currKey in acc)) (acc as any)[currKey] = null;
      return acc;
    },
    { ...newObject }
  );
};
