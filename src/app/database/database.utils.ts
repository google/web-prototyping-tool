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

import { projectPathForId, projectContentsPathForId } from './path.utils';
import * as cd from 'cd-interfaces';
import * as models from 'cd-common/models';
import { BehaviorSubject } from 'rxjs';
import { isString } from 'cd-utils/string';

export const RETRY_ATTEMPTS = 3;

/**
 * Given an array of created or deleted models and an array of model updates,
 * this function returns tuple of DB writes and deletes to pass to the datbase service
 */
export const calcDatabaseUpdates = (
  elementProperties: cd.ElementPropertiesMap,
  project?: cd.IProject,
  createdOrDeletedModels: cd.ReadOnlyPropertyModelList = [],
  modelUpdates: cd.IPropertiesUpdatePayload[] = []
): [cd.WriteBatchPayload, Set<string>] => {
  const writePayload: cd.WriteBatchPayload = new Map();
  const deletePayload = new Set<string>();
  const modelIds = createdOrDeletedModels.map((m) => m.id);
  const modelParentIds = createdOrDeletedModels.map((m) => m.parentId).filter(isString);
  const rootElementCreatedOrDeleted = models.hasRoots(createdOrDeletedModels);
  const updateIds = modelUpdates.map((update) => update.elementId);
  const allModifiedIds = new Set([...modelIds, ...modelParentIds, ...updateIds]);

  for (const id of allModifiedIds.values()) {
    const storeValue = elementProperties[id];
    const docPath = projectContentsPathForId(id);

    if (storeValue) {
      writePayload.set(docPath, storeValue);
    } else {
      deletePayload.add(docPath);
    }
  }

  // If boards were create or deleted as part of this change. Write project document
  // to database so that boardIds gets updated
  if (rootElementCreatedOrDeleted && project) {
    const docPath = projectPathForId(project.id);
    writePayload.set(docPath, project);
  }

  return [writePayload, deletePayload];
};

export const detectUndefinedObjects = (data: {}): boolean => {
  let hasUndefined = false;
  JSON.stringify(data, (key, value) => {
    if (value !== undefined) return value;
    console.log('Undefined key', key);
    hasUndefined = true;
  });
  return hasUndefined;
};

/** Keep track of active batches */
export class BatchQueue {
  private _queue = new Set<Symbol>();
  public active$ = new BehaviorSubject<boolean>(false);

  get active() {
    return this.active$.getValue();
  }

  set active(value: boolean) {
    if (this.active === value) return;
    this.active$.next(value);
  }

  add = (sym: Symbol) => {
    this._queue.add(sym);
    this.active = true;
  };

  remove = (sym: Symbol) => {
    this._queue.delete(sym);
    if (this._queue.size === 0) {
      this.active = false;
    }
  };
}
