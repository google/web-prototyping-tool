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

/* eslint-disable max-lines */
import * as cd from 'cd-interfaces';
import * as firestore from '@angular/fire/firestore';
import firebase from 'firebase/app';
import 'firebase/firestore';
import { DEFAULT_PROJECT_TYPE, FRACTIONAL_INDEX_PROP, PARENT_ID_PROP } from 'cd-common/consts';
import { Theme, themeFromId } from 'cd-themes';
import { createId } from 'cd-utils/guid';
import {
  expandObjectDotNotation,
  flattenObjectWithDotNotation,
  lookupDotNotationKeysInObject,
  mergeWithDotNotation,
} from './dot-notation.utils';

export const createChangeMarker = (): cd.IChangeMarker => {
  const id = createId();
  const timestamp = firebase.firestore.Timestamp.now();
  return { id, timestamp };
};

/** It is possible that timestamps have been serialized and need to recreated to be actual Timestamp instances */
export const isTimestampOlder = (
  timestamp: firebase.firestore.Timestamp,
  comparison: firebase.firestore.Timestamp
): boolean => {
  const t1 = new firebase.firestore.Timestamp(timestamp.seconds, timestamp.nanoseconds);
  const t2 = new firebase.firestore.Timestamp(comparison.seconds, comparison.nanoseconds);
  return t1 < t2;
};

/** Returns true is incoming change marker is older than current */
export const changeMarkerIsOlder = (
  incoming?: cd.IChangeMarker,
  current?: cd.IChangeMarker
): boolean => {
  if (!incoming) return true;
  if (!current) return false;
  return isTimestampOlder(incoming.timestamp, current.timestamp);
};

export const getChangeMarkerIdsFromContent = (content: cd.IProjectContent): string[] => {
  const {
    project,
    elementContent,
    assetContent,
    designSystemContent,
    codeCmpContent,
    datasetContent,
  } = content;

  const allDocs = [
    project,
    ...Object.values(elementContent.records),
    ...Object.values(assetContent.records),
    ...Object.values(designSystemContent.records),
    ...Object.values(codeCmpContent.records),
    ...Object.values(datasetContent.records),
  ];

  const allIds = allDocs.map((d) => d.changeMarker?.id).filter((id) => !!id) as string[];
  return Array.from(new Set(allIds));
};

export const payloadIsDefined = (
  payload: cd.ChangePayload | undefined
): payload is cd.ChangePayload => {
  return !!payload;
};

export const convertChangeType = (
  docChangeType: firestore.DocumentChangeType
): cd.FirestoreChangeType => {
  if (docChangeType === cd.FirestoreChangeType.Added) return cd.FirestoreChangeType.Added;
  if (docChangeType === cd.FirestoreChangeType.Modified) return cd.FirestoreChangeType.Modified;
  return cd.FirestoreChangeType.Removed;
};

export const convertPropsUpdateToUpdateChanges = (
  propsUpdates: cd.IPropertiesUpdatePayload[] | ReadonlyArray<cd.IPropertiesUpdatePayload>
): cd.IUpdateChange<cd.PropertyModel>[] => {
  return propsUpdates.map((propUpdate) => {
    const { elementId: id, properties: update } = propUpdate;
    return { id, update };
  });
};

const createChangePayload = <T extends cd.ChangePayload>(
  type: cd.EntityType,
  sets?: any[],
  updates?: cd.IUpdateChange<any>[],
  deletes?: string[]
): T => {
  const payload = { type } as T;

  // prevent any undefined keys from existing in payload object
  if (sets?.length) payload.sets = sets;
  if (updates?.length) payload.updates = updates;
  if (deletes?.length) payload.deletes = deletes;

  return payload;
};

export const createProjectChangePayload = (
  sets?: cd.IProject[],
  updates?: cd.IUpdateChange<cd.IProject>[],
  deletes?: string[]
): cd.IProjectChangePayload => {
  return createChangePayload(cd.EntityType.Project, sets, updates, deletes);
};

export const createElementChangePayload = (
  sets?: cd.PropertyModel[],
  updates?: cd.IUpdateChange<cd.PropertyModel>[],
  deletes?: string[]
): cd.IElementChangePayload => {
  return createChangePayload(cd.EntityType.Element, sets, updates, deletes);
};

export const createDesignSystemChangePayload = (
  sets?: cd.IDesignSystemDocument[],
  updates?: cd.IUpdateChange<cd.IDesignSystemDocument>[],
  deletes?: string[]
): cd.IDesignSystemChangePayload => {
  return createChangePayload(cd.EntityType.DesignSystem, sets, updates, deletes);
};

export const createAssetChangePayload = (
  sets?: cd.IProjectAsset[],
  updates?: cd.IUpdateChange<cd.IProjectAsset>[],
  deletes?: string[]
): cd.IAssetChangePayload => {
  return createChangePayload(cd.EntityType.Asset, sets, updates, deletes);
};

export const createDatasetChangePayload = (
  sets?: cd.ProjectDataset[],
  updates?: cd.IUpdateChange<cd.ProjectDataset>[],
  deletes?: string[]
): cd.IDatasetChangePayload => {
  return createChangePayload(cd.EntityType.Dataset, sets, updates, deletes);
};

export const createCodeCmpChangePayload = (
  sets?: cd.ICodeComponentDocument[],
  updates?: cd.IUpdateChange<cd.ICodeComponentDocument>[],
  deletes?: string[]
): cd.ICodeCmpChangePayload => {
  return createChangePayload(cd.EntityType.CodeComponent, sets, updates, deletes);
};

export const mergeElementChangePayloads = (
  payloads: cd.IElementChangePayload[]
): cd.IElementChangePayload => {
  let sets: cd.PropertyModel[] = [];
  let updates: cd.IUpdateChange<cd.PropertyModel>[] = [];
  let deletes: string[] = [];

  for (const p of payloads) {
    if (p.sets) sets = [...sets, ...p.sets];
    if (p.updates) updates = [...updates, ...p.updates];
    if (p.deletes) deletes = [...deletes, ...p.deletes];
  }

  return createElementChangePayload(sets, updates, deletes);
};

export const createElementUpdate = (
  id: string,
  update: cd.RecursivePartial<cd.PropertyModel>
): cd.IUpdateChange<cd.PropertyModel> => {
  return { id, update };
};

export const createContentSection = <T extends cd.IContentSection<any>>(
  records = {},
  loaded = false,
  markAllRecordsAsCreated = false
): T => {
  const idsCreatedInLastChange = markAllRecordsAsCreated
    ? new Set(Object.keys(records))
    : new Set();

  return {
    idsCreatedInLastChange,
    idsUpdatedInLastChange: new Set<string>(),
    idsDeletedInLastChange: new Set<string>(),
    records,
    loaded,
  } as T;
};

// TODO: temp workaround for now while migrating to new change payload interfaces
// Convert the sets and updates of an IElementChangePayload to the old IPropertiesUpdatePayload
// Note: ignores deletes
export const convertElementChangePayloadToUpdates = (
  payload: cd.IElementChangePayload[]
): cd.IPropertiesUpdatePayload[] => {
  return payload.reduce<cd.IPropertiesUpdatePayload[]>((acc, curr) => {
    const { sets, updates } = curr;
    const setUpdates = sets?.map((s) => ({ elementId: s.id, properties: s })) || [];
    const modUpdates = updates?.map((u) => ({ elementId: u.id, properties: u.update })) || [];
    acc = [...setUpdates, ...modUpdates];
    return acc;
  }, []);
};

export const createProjectDocument = (user: cd.IUser): cd.IProject => {
  const id = createId();
  const creator = { id: user.id, email: user.email };
  const changeMarker = createChangeMarker();

  return {
    id,
    changeMarker,
    desc: '',
    type: DEFAULT_PROJECT_TYPE,
    name: '',
    owner: creator,
    creator,
    createdAt: changeMarker.timestamp,
    updatedAt: changeMarker.timestamp,
    numComments: 0,
  };
};

export const createDesignSystemDocument = (
  projectId: string,
  themeId = Theme.AngularMaterial
): cd.IDesignSystemDocument => {
  const id = createId();
  const type = cd.EntityType.DesignSystem;
  const initialDesignSystem = themeFromId[themeId]().theme;
  const changeMarker = createChangeMarker();
  const dsDoc: cd.IDesignSystemDocument = {
    ...initialDesignSystem,
    id,
    projectId,
    type,
    changeMarker,
  };
  return dsDoc;
};

/**
 * Filter out changes from the database that have already been processed, and return structure
 * that already has document data retrieved along with the type of change
 */
export const filterProcessedDatabaseChanges = (
  changes: firestore.DocumentChangeAction<cd.IProjectContentDocument>[],
  processedChangeIds: Set<string>
): cd.DatabaseChangeTuple[] => {
  return changes.reduce<cd.DatabaseChangeTuple[]>((acc, currChange) => {
    const { type, payload } = currChange;
    const doc = payload.doc.data() as cd.ChangeableDocument;
    const { changeMarker } = doc;
    if (changeMarker && processedChangeIds.has(changeMarker.id)) return acc;
    const changeType = convertChangeType(type);
    acc.push([changeType, doc]);
    return acc;
  }, []);
};

/**
 * Convert database changes to standard IChangePayload format
 *
 * 'added' and 'modified' both become "sets" since the database does not
 * return a partial of what was modified.
 */
export const getDatabaseChangePayload = <T extends cd.ChangePayload>(
  type: cd.EntityType,
  changes: cd.DatabaseChangeTuple[]
): T | undefined => {
  const filteredChanges = changes.filter(([_changeType, doc]) => doc.type === type);
  if (!filteredChanges.length) return undefined; // If no changes to this type return undefined

  const payload = { type } as T;
  const sets = [];
  const deletes: string[] = [];

  for (const [changeType, doc] of filteredChanges) {
    if (changeType === cd.FirestoreChangeType.Removed) {
      deletes.push(doc.id);
      continue;
    }
    sets.push(doc as any);
  }

  if (sets.length) payload.sets = sets;
  if (deletes.length) payload.deletes = deletes;

  return payload;
};

/**
 * Apply changes to a project.
 * NOTE: this does not support deletes, only sets and updates
 * Deleting a project should use a different mechanism
 */
export const applyChangeToProject = (
  payload: cd.IProjectChangePayload,
  currentProject: cd.IProject
): cd.IProject => {
  const { sets, updates } = payload;
  let project = { ...currentProject };

  if (sets) {
    for (const set of sets) {
      if (set.id !== project.id) continue;
      project = set;
    }
  }

  if (updates) {
    for (const updateChange of updates) {
      const { id, update } = updateChange;
      if (id !== project.id) continue;
      project = mergeWithDotNotation<cd.IProject>(project, update);
    }
  }

  return project;
};

/** Determine whether an update should trigger computing new childIds */
export const updateChangesPosition = (update: cd.RecursivePartial<cd.PropertyModel>): boolean => {
  const positionProperties = new Set([PARENT_ID_PROP, FRACTIONAL_INDEX_PROP]);
  const keys = Object.keys(update);
  return keys.some((k) => positionProperties.has(k));
};

export const positionChanged = (prevEl: cd.PropertyModel, currEl: cd.PropertyModel): boolean => {
  if (prevEl[PARENT_ID_PROP] !== currEl[PARENT_ID_PROP]) return true;
  if (prevEl[FRACTIONAL_INDEX_PROP] !== currEl[FRACTIONAL_INDEX_PROP]) return true;
  return false;
};

export const compareChildNodes = (
  id1: string,
  id2: string,
  elementProps: cd.IStringMap<cd.PropertyModel>
): number => {
  const node1 = elementProps[id1];
  const node2 = elementProps[id2];
  const fidx1 = node1.fractionalIndex;
  const fidx2 = node2.fractionalIndex;
  if (!fidx1 && !fidx2) return 0;
  if (!fidx1) return 1;
  if (!fidx2) return -1;
  if (fidx1 < fidx2) return -1;
  return 1;
};

interface IParentChildIdOperation {
  parentId: string;
  addChildId?: string;
  removeChildId?: string;
}

/** Generate new child ids only for the parents that have been affected by the latest change */
const generateChildIds = (
  elementProps: cd.IStringMap<cd.PropertyModel>,
  operations: IParentChildIdOperation[]
): cd.IStringMap<cd.PropertyModel> => {
  const parentIds = new Set<string>();

  // Compute new childIds arrays for each id
  const parentIdToChildsIds = operations.reduce<Map<string, string[]>>((acc, curr) => {
    const { parentId, addChildId, removeChildId } = curr;
    const parent = elementProps[parentId];
    if (!parent) return acc;
    parentIds.add(parentId);
    let childIds = acc.get(parentId) || [...parent.childIds];
    if (addChildId) childIds.push(addChildId);
    if (removeChildId) {
      const index = childIds.findIndex((id) => id === removeChildId);
      if (index !== -1) childIds.splice(index, 1);
    }
    acc.set(parentId, childIds);
    return acc;
  }, new Map());

  // Then sort each childId array by each child's fractionalIndex and assign to parent
  const updatedProps = Array.from(parentIds).reduce<cd.IStringMap<cd.PropertyModel>>(
    (acc, currId) => {
      const ids = parentIdToChildsIds.get(currId);
      const parent = elementProps[currId];
      if (!ids || !parent) return acc;
      const childIds = Array.from(new Set(ids)); // ensure no duplicates
      childIds.sort((a, b) => compareChildNodes(a, b, elementProps));
      acc[currId] = { ...parent, childIds };
      return acc;
    },
    { ...elementProps }
  );

  return updatedProps;
};

export const applyChangeToElementContent = (
  payload: cd.IElementChangePayload,
  elementContent: cd.ElementContent
): cd.ElementContent => {
  const { sets, updates, deletes } = payload;
  let records = { ...elementContent.records };
  const idsCreatedInLastChange = new Set<string>();
  let idsUpdatedInLastChange = new Set<string>();
  const idsDeletedInLastChange = new Set<string>();
  const childIdOperations: IParentChildIdOperation[] = [];

  if (sets) {
    for (const set of sets) {
      const { id, parentId } = set;
      const current = records[id];

      // Add element to records
      records[id] = set;

      // A set can be considered an update or a create depending if the id already existed
      if (!current) idsCreatedInLastChange.add(id);
      else idsUpdatedInLastChange.add(id);

      if (current && !positionChanged(current, set)) continue;
      const prevParentId = current?.parentId;

      // TODO: how to handle childIds being overridden in a set?
      // This element may need child ids generated since the set could've blown away
      // its child ids (even if no childIdOperations added for it)
      // childIds should be a readonly property that does not get stored in database

      // Need to generate new child ids for both the old parent and the new parent
      if (parentId) childIdOperations.push({ parentId, addChildId: id });
      if (prevParentId && prevParentId !== parentId) {
        childIdOperations.push({ parentId: prevParentId, removeChildId: id });
      }
    }
  }

  if (updates) {
    for (const updateChange of updates) {
      const { id, update } = updateChange;
      const current = records[id];
      if (!current) {
        console.warn('Attempted to update an element that does not exist');
        continue;
      }
      records[id] = mergeWithDotNotation<cd.PropertyModel>(current, update);
      idsUpdatedInLastChange.add(id);

      if (!updateChangesPosition(update)) continue;
      const { parentId } = update;
      const prevParentId = current.parentId;

      // Need to generate new child ids for both the old parent and the new parent
      if (parentId) childIdOperations.push({ parentId, addChildId: id });
      if (prevParentId && prevParentId !== parentId) {
        childIdOperations.push({ parentId: prevParentId, removeChildId: id });
      }
    }
  }

  if (deletes) {
    // TODO: recursively delete children when deleting an element
    for (const id of deletes) {
      idsDeletedInLastChange.add(id);
      const parentId = records[id]?.parentId;
      if (parentId) childIdOperations.push({ parentId, removeChildId: id });
      delete records[id];
    }
  }

  // Generate new child ids, and add all parentIds with new childId arrays to idsUpdatedInLastChange
  if (childIdOperations.length) {
    records = generateChildIds(records, childIdOperations);
    const parentIds = childIdOperations.map((o) => o.parentId);
    idsUpdatedInLastChange = new Set([...idsUpdatedInLastChange, ...parentIds]);
  }

  // For any change to be applied to elements, it means they have been loaded
  const loaded = true;

  return {
    loaded,
    records,
    idsCreatedInLastChange,
    idsUpdatedInLastChange,
    idsDeletedInLastChange,
  };
};

export const applyChangeToContent = <T extends cd.ChangeableDocument>(
  payload: cd.IChangePayload<T>,
  content: cd.IContentSection<T>
): cd.IContentSection<T> => {
  const { sets, updates, deletes } = payload;
  const records = { ...content.records };
  const idsCreatedInLastChange = new Set<string>();
  const idsUpdatedInLastChange = new Set<string>();
  const idsDeletedInLastChange = new Set<string>();

  if (sets) {
    for (const set of sets) {
      // A set can be considered an update or a create depending if the id already existed
      const isCreate = !records[set.id];
      if (isCreate) idsCreatedInLastChange.add(set.id);
      else idsUpdatedInLastChange.add(set.id);
      records[set.id] = set;
    }
  }

  if (updates) {
    for (const updateChange of updates) {
      const { id, update } = updateChange;
      const current = records[id];
      if (!current) continue; // TODO: should we prevent updating a non-existent item
      records[id] = mergeWithDotNotation<T>(current, update);
      idsUpdatedInLastChange.add(id);
    }
  }

  if (deletes) {
    for (const id of deletes) {
      delete records[id];
    }
  }

  // For any change to be applied, loaded should be true
  const loaded = true;
  return {
    loaded,
    records,
    idsCreatedInLastChange,
    idsUpdatedInLastChange,
    idsDeletedInLastChange,
  };
};

export const addChangeMarkerToSets = (
  changeMarker: cd.IChangeMarker,
  sets: cd.ChangeableDocument[]
): cd.ChangeableDocument[] => {
  return sets.map((set) => {
    return { ...set, changeMarker };
  });
};

export const addChangeMarkerToUpdates = (
  changeMarker: cd.IChangeMarker,
  updates: cd.IUpdateChange<cd.ChangeableDocument>[]
): cd.IUpdateChange<cd.ChangeableDocument>[] => {
  return updates.map((updateChange) => {
    const { id, update } = updateChange;
    const markedUpdate = { ...update, changeMarker };
    return { id, update: markedUpdate };
  });
};

const createProjectUpdateAtPayload = (
  projectId: string,
  updatedAt: firebase.firestore.Timestamp
): cd.IProjectChangePayload => {
  const type = cd.EntityType.Project;
  const updates: cd.IUpdateChange<cd.IProject>[] = [{ id: projectId, update: { updatedAt } }];
  const payload: cd.IProjectChangePayload = { type, updates };
  return payload;
};

/**
 * Create a change request object.
 * This will create a changeMarker and ensure that it is included in all sets and updates
 *
 * Creating a change request will always add an additional payload item to modify the updatedAt
 * timestamp of the project document
 */
export const createChangeRequest = (
  user: cd.IUserIdentity,
  projectId: string,
  payload: cd.ChangePayload[]
): cd.IChangeRequest => {
  const changeMarker = createChangeMarker();
  const projectUpdateAtChange = createProjectUpdateAtPayload(projectId, changeMarker.timestamp);
  const fullPayload = [...payload, projectUpdateAtChange];

  // Mark all payload items with the same change marker
  const markedPayload = fullPayload.map((result) => {
    const { sets, updates } = result;
    const updatedResult = { ...result } as any;
    if (sets) updatedResult.sets = addChangeMarkerToSets(changeMarker, sets);
    if (updates) updatedResult.updates = addChangeMarkerToUpdates(changeMarker, updates);

    return updatedResult;
  });

  return { user, projectId, changeMarker, payload: markedPayload };
};

export const lookupDocument = (
  id: string,
  projectContent: cd.IProjectContent
): cd.ChangeableDocument | undefined => {
  const {
    project,
    elementContent,
    designSystemContent,
    assetContent,
    codeCmpContent,
    datasetContent,
  } = projectContent;
  if (id === project.id) return project;
  if (elementContent.records[id]) return elementContent.records[id];
  if (designSystemContent.records[id]) return designSystemContent.records[id];
  if (assetContent.records[id]) return assetContent.records[id];
  if (codeCmpContent.records[id]) return codeCmpContent.records[id];
  if (datasetContent.records[id]) return datasetContent.records[id];
  return undefined;
};

export const calcUpdateInverse = (
  updateChange: cd.IUpdateChange<cd.ChangeableDocument>,
  projectContent: cd.IProjectContent
): cd.IUpdateChange<cd.ChangeableDocument> | undefined => {
  const { id, update } = updateChange;
  const currentDoc = lookupDocument(id, projectContent);
  if (!currentDoc) return undefined;
  const dotNotationUpdate = flattenObjectWithDotNotation(update);
  const updateKeys = Object.keys(dotNotationUpdate);
  const currentValues = lookupDotNotationKeysInObject(updateKeys, currentDoc);
  const invertedUpdate = expandObjectDotNotation(currentValues);
  return { id, update: invertedUpdate };
};

/**
 * Compute the opposite of a change for undo/redo
 */
export const calcChangeRequestInverse = (
  changeRequest: cd.IChangeRequest,
  projectContent: cd.IProjectContent
): cd.IChangeRequest => {
  const payload = changeRequest.payload.reduce<cd.ChangePayload[]>((acc, curr) => {
    const { type, sets = [], updates = [], deletes = [] } = curr;
    const inverseSets: cd.ChangeableDocument[] = [];
    let inverseUpdates: cd.IUpdateChange<cd.ChangeableDocument>[] = [];
    const inverseDeletes: string[] = [];

    // Compute set inverses
    for (const set of sets) {
      const currentDoc = lookupDocument(set.id, projectContent);

      // else if current doc does not exist, the inverse of this set would be a delete
      if (!currentDoc) {
        inverseDeletes.push(set.id);
        continue;
      }

      // If current doc does exist, then inverse of this set is to update it back to current state
      const setAsUpdate: cd.IUpdateChange<cd.ChangeableDocument> = { id: set.id, update: set };
      const invertedUpdate = calcUpdateInverse(setAsUpdate, projectContent);
      if (invertedUpdate) inverseUpdates.push(invertedUpdate);
    }

    // Compute update inverses
    const updateInverts = updates.map((u: cd.IUpdateChange<cd.ChangeableDocument>) =>
      calcUpdateInverse(u, projectContent)
    );
    const filtered = updateInverts.filter((i) => !!i) as cd.IUpdateChange<cd.ChangeableDocument>[];
    inverseUpdates = [...inverseUpdates, ...filtered];

    // Compute delete inverses - which are always to set to current doc state
    for (const id of deletes) {
      const currentDoc = lookupDocument(id, projectContent);
      if (!currentDoc) continue; // if deleting a doc that already doesn't exist => no-op
      inverseSets.push(currentDoc);
    }

    const inversePayload: cd.IChangePayload<cd.ChangeableDocument> = { type };
    if (inverseSets.length) inversePayload.sets = inverseSets;
    if (inverseUpdates.length) inversePayload.updates = inverseUpdates;
    if (inverseDeletes.length) inversePayload.deletes = inverseDeletes;
    acc.push(inversePayload as cd.ChangePayload);
    return acc;
  }, []);

  return { ...changeRequest, payload };
};

export const mergeChangeIntoProperties = (
  elementProperties: cd.ElementPropertiesMap,
  change: cd.IElementChangePayload
): cd.ElementPropertiesMap => {
  const elemContent = createContentSection(elementProperties);
  const { records } = applyChangeToElementContent(change, elemContent);
  return records;
};

const getDeleteChange = (
  type: cd.EntityType,
  existingIds: Set<string>,
  content: cd.IContentSection<any>
): cd.ChangePayload | undefined => {
  const deletes = Object.keys(content.records).filter((id) => !existingIds.has(id));
  if (!deletes.length) return undefined;
  return createChangePayload(type, undefined, undefined, deletes);
};

/**
 * Compute deletion changes based on what Ids no longer exist in remote content vs local content.
 * Anything that is no longer in remote should be deleted
 */
export const calcDeletesFromRemote = (
  currentContent: cd.IProjectContent,
  remoteContent: firestore.DocumentChangeAction<cd.IProjectContentDocument>[]
): cd.ChangePayload[] => {
  const idsInRemote = new Set(remoteContent.map((a) => a.payload.doc.id));
  const { Element, DesignSystem, Asset, Dataset, CodeComponent } = cd.EntityType;
  const elementDeletes = getDeleteChange(Element, idsInRemote, currentContent.elementContent);
  const dsDeletes = getDeleteChange(DesignSystem, idsInRemote, currentContent.designSystemContent);
  const assetDeletes = getDeleteChange(Asset, idsInRemote, currentContent.assetContent);
  const codeCmpDeletes = getDeleteChange(CodeComponent, idsInRemote, currentContent.codeCmpContent);
  const datasetDeletes = getDeleteChange(Dataset, idsInRemote, currentContent.datasetContent);
  const changes = [elementDeletes, dsDeletes, assetDeletes, codeCmpDeletes, datasetDeletes];
  return changes.filter((change) => !!change) as cd.ChangePayload[];
};

/**
 * Test to make sure that the timestamp of this change request is newer than all of the project
 * content documents that it modifies
 */
export const shouldAcceptIncomingChange = (
  changeRequest: cd.IChangeRequest,
  projectContent: cd.IProjectContent
): boolean => {
  const { changeMarker } = changeRequest;
  const { elementContent, designSystemContent, assetContent, codeCmpContent, datasetContent } =
    projectContent;
  const allDocsMap = {
    ...elementContent.records,
    ...designSystemContent.records,
    ...assetContent.records,
    ...codeCmpContent.records,
    ...datasetContent.records,
  };

  return changeRequest.payload.every((change) => {
    const { type, sets = [], updates = [], deletes = [] } = change;

    // Skip check on project doc since it is updated on every change
    if (type === cd.EntityType.Project) return true;

    const setOrDeleteIds = [...sets.map((s) => s.id), ...deletes];

    // For sets and deletes, the document must either:
    //  - not exist (incoming change creates or deletes it)
    //  - or the timestamp should be older
    const setsAndDeletesNewer = setOrDeleteIds.every((id) => {
      const affectedDoc = allDocsMap[id];
      return !affectedDoc || changeMarkerIsOlder(affectedDoc?.changeMarker, changeMarker);
    });
    if (!setsAndDeletesNewer) return false;

    // For updates the document must exist and have an older timestamp
    // If it doesn't exist, a newer chanage than this one must have deleted it
    const updatesNewer = (updates as cd.IUpdateChange<any>[]).every((update) => {
      const affectedDoc = allDocsMap[update.id];
      return affectedDoc && changeMarkerIsOlder(affectedDoc?.changeMarker, changeMarker);
    });

    return updatesNewer;
  });
};
