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
import { deepCopy, isObject } from 'cd-utils/object';
import { isString } from 'cd-utils/string';
import { generateIDWithLength, createId } from 'cd-utils/guid';
import { ELEMENT_PROPS_DATASET_KEY } from 'cd-common/consts';
import { elementHasPortalSlot } from './registry';
import {
  createDataBoundValue,
  getDataBindingElementId,
  hasElementDataBoundInputs,
  isElementDataBoundValue,
} from 'cd-common/utils';
import {
  convertModelListToMap,
  getChildren,
  isBoardPortal,
  isPortalParent,
  lookupElementIds,
} from './properties.utils';

/**
 * When duplicating an elemnent update it's data bindings to point to an element within the
 * duplicated group if it has been duplicate also
 */
const migrateElementDataBindings = (model: cd.PropertyModel, idMapping: cd.IDReplacementMap) => {
  if (!model?.inputs || !hasElementDataBoundInputs(model)) return model;
  const inputEntries = Object.entries(model.inputs);
  const updatedInputs = inputEntries.reduce<cd.IStringMap<any>>((acc, [key, value]) => {
    if (!isElementDataBoundValue(value)) return acc;
    const dataBoundValue = value as cd.IDataBoundValue;
    const elementId = getDataBindingElementId(dataBoundValue);
    if (!idMapping.has(elementId)) return acc;
    const mappedElementId = idMapping.get(elementId) as string;
    const updatedValue = dataBoundValue.lookupPath.replace(elementId, mappedElementId);
    acc[key] = createDataBoundValue(ELEMENT_PROPS_DATASET_KEY, updatedValue);
    return acc;
  }, {});

  if (!Object.values(updatedInputs).length) return model;

  const inputs = { ...model.inputs, ...updatedInputs };
  return { ...model, inputs };
};

const isRecordedAction = (action: cd.ActionBehavior): action is cd.IActionBehaviorRecordState => {
  return action.type === cd.ActionType.RecordState;
};

/** Fix references to copy/pasted actions */
export const removeMismatchedRecordedInputs = (
  actions: cd.ActionBehavior[],
  refId: string,
  sameElementType: boolean
): cd.ActionBehavior[] => {
  if (sameElementType) return actions;
  return actions.map((action) => {
    if (!isRecordedAction(action) || !action.stateChanges) return action;
    action.stateChanges = action.stateChanges.filter((item) => {
      const isInputAndIdEqualsRef =
        item.type === cd.ActionStateType.Input && item.elementId === refId;
      return !isInputAndIdEqualsRef;
    });
    return action;
  });
};

/** Update the target of the action to the new target id in the IDMapping if it exists */
const migratedTargetedAction = (
  action: cd.ActionBehavior,
  idMapping: cd.IDReplacementMap
): cd.ActionBehavior => {
  action.id = generateIDWithLength(7); // generate new unique id
  const { target } = action;
  if (!target || !idMapping.has(target)) return action;
  action.target = idMapping.get(target);
  return action;
};

/** Migrate a single Recorded action */
const migrateSingleRecordedAction = (
  action: cd.IActionBehaviorRecordState,
  idMapping: cd.IDReplacementMap
): cd.IActionBehaviorRecordState => {
  action.id = generateIDWithLength(7); // generate new unique id
  if (!action.stateChanges) return action;
  action.stateChanges = action.stateChanges.map((item) => {
    const replacementId = item.elementId && idMapping.get(item.elementId);
    if (replacementId) {
      item.elementId = replacementId;
    }
    return item;
  });
  return action;
};

/** Migrate multiple recorded actions */
export const migrateRecordedActions = (
  actions: cd.ActionBehavior[],
  idMapping: cd.IDReplacementMap
): cd.ActionBehavior[] => {
  return actions.map((action) => {
    if (isRecordedAction(action)) return migrateSingleRecordedAction(action, idMapping);

    // generate a new id for all new actions
    action.id = generateIDWithLength(7); // generate new unique id
    return action;
  });
};

/**
 * When duplicating an action that has recorded state, any state change
 * applied to the previous model will be converted to point at this model.
 *
 * Also, RunJS targets will migrated to new element ID from idMapping if it exists
 */
export const migrateActions = (model: cd.PropertyModel, idMapping: cd.IDReplacementMap) => {
  if (model.actions && model.actions.length > 0) {
    model.actions = model.actions.map((action) => {
      if (isRecordedAction(action)) return migrateSingleRecordedAction(action, idMapping);
      if (action?.target) return migratedTargetedAction(action, idMapping);
      // otherwise just generate new id for action copy
      action.id = generateIDWithLength(7);
      return action;
    });
  }
  return model;
};

const duplicatePropertyModel = (
  properties: cd.PropertyModel,
  id: string,
  newRootId = ''
): cd.PropertyModel => {
  const duplicated = deepCopy(properties);
  duplicated.id = id;

  // A duplicated model has not been inserted into a board yet,
  // therefore, by default rootId is reset to empty string.
  // The logic in insert utils checks for empty string to determine
  // if an item being inserted is new or existing.
  // TODO: this is not very clear or maintainable
  duplicated.rootId = newRootId;

  return duplicated;
};

const duplicateModelWithNewId = (model: cd.PropertyModel, newRootId = ''): cd.PropertyModel => {
  const id = createId();
  return duplicatePropertyModel(model, id, newRootId);
};

export const duplicateModelsAndChildren = (
  models: cd.PropertyModel[],
  elementProperties: cd.ReadonlyElementPropertiesMap,
  parentId?: string,
  setNewRootIds = false,
  depth = 0,
  newRootId = '',
  idMap: cd.IDReplacementMap = new Map()
): cd.ICopiedComponentInstanceGroup => {
  const rootIds: string[] = [];
  const copiedModels = models
    .reduce<cd.PropertyModel[]>((acc, currModel) => {
      // copy model and record id
      const copy = duplicateModelWithNewId(currModel, newRootId);
      rootIds.push(copy.id);

      idMap.set(currModel.id, copy.id);
      // only setup newRootId to be passed down if at depth 0 and setNewRootIds is true
      if (setNewRootIds && depth === 0) {
        newRootId = copy.id;
        copy.rootId = newRootId;
      }

      // Don't set to undefined. Firestore will throw
      if (parentId) copy.parentId = parentId;

      // recusively copy all children
      const childModels = lookupElementIds(currModel.childIds, elementProperties);
      const childDuplication = duplicateModelsAndChildren(
        childModels,
        elementProperties,
        copy.id,
        setNewRootIds,
        depth + 1,
        newRootId,
        idMap
      );

      // point parent at new child ids
      copy.childIds = childDuplication.rootIds;

      // push all copied models
      acc.push(copy);
      acc.push(...childDuplication.models);
      return acc;
    }, [])
    .map((model) => migrateActions(model, idMap))
    .map((model) => migrateElementDataBindings(model, idMap));

  return { rootIds, models: copiedModels, idMap };
};

export const duplicateComponentInstanceGroup = (
  componentInstanceGroup: cd.IComponentInstanceGroup,
  setNewRootIds = false
): cd.ICopiedComponentInstanceGroup => {
  // create map for all properties in this group
  const modelMap = componentInstanceGroup.models.reduce<cd.ElementPropertiesMap>((acc, curr) => {
    acc[curr.id] = curr;
    return acc;
  }, {});
  const definedRootModels = lookupElementIds(componentInstanceGroup.rootIds, modelMap);
  return duplicateModelsAndChildren(definedRootModels, modelMap, undefined, setNewRootIds);
};

/**
 * Migrates a portals reference Id to the new id in map.
 * Optionally removes reference if mapped id is not found
 */
const migratePortalRef = (
  portal: cd.IBoardPortalProperties,
  idMap: cd.IDReplacementMap,
  removeMissing: boolean
): cd.IBoardPortalProperties => {
  const { referenceId: currRefId } = portal.inputs;
  if (!currRefId) return portal;

  const mappedId = idMap.get(currRefId);
  if (!mappedId && !removeMissing) return portal;

  const referenceId = mappedId || null;
  const inputs = { ...portal.inputs, referenceId };
  return { ...portal, inputs };
};

/**
 * Remove a portal reference from all child portals
 */
const migratePortalParentRefs = (
  portalParent: cd.PropertyModel,
  idMap: cd.IDReplacementMap,
  removeMissing: boolean
): cd.PropertyModel => {
  const currentInputs = portalParent.inputs as cd.IPortalParentInputs;
  const childPortals = currentInputs.childPortals.map((child) => {
    const { value: currValue } = child;
    if (!currValue) return child;

    const mappedValue = idMap.get(currValue);
    if (!mappedValue && !removeMissing) return child;

    const value = mappedValue || null;
    return { ...child, value };
  });
  const inputs = { ...currentInputs, childPortals };
  return { ...portalParent, inputs };
};

/**
 * Migrates all inputs that reference a board id in the idMap
 */
const migratePortalSlotInputs = (inputs: any, idMap: cd.IDReplacementMap): cd.IStringMap<any> => {
  // Since this function is called recursively, guard against an input value that is an
  // array of strings or numbers, etc
  if (!isObject(inputs)) return inputs;

  const inputEntries = Object.entries(inputs);
  return inputEntries.reduce<cd.IStringMap<any>>((acc, curr) => {
    const [key, value] = curr;

    if (isString(value) && idMap.has(value)) {
      const mappedValue = idMap.get(value) as string;
      acc[key] = mappedValue;
    } else if (Array.isArray(value)) {
      const mappedArrayValues = value.map((v) => migratePortalSlotInputs(v, idMap));
      acc[key] = mappedArrayValues;
    } else {
      acc[key] = value;
    }

    return acc;
  }, {});
};

const migratePortalSlotComponent = (
  portalSlotCmp: cd.PropertyModel,
  idMap: cd.IDReplacementMap
): cd.PropertyModel => {
  const { inputs: currInputs } = portalSlotCmp;
  if (!currInputs) return portalSlotCmp;

  const inputs = migratePortalSlotInputs(currInputs, idMap);
  return { ...portalSlotCmp, inputs };
};

/**
 * Find all portals within content (portals and portal panels: tabs, steppers, etc) and migrate
 * their referenced board ids to the new boards.
 *
 * Optionally, delete reference if mapped board ids is missing
 */
const migratePortalReferences = (
  content: cd.IComponentInstanceGroup,
  idMap: cd.IDReplacementMap,
  removeMissing = false
): cd.IComponentInstanceGroup => {
  const { models } = content;
  const currPortals = models.filter(isBoardPortal);
  const currParents = models.filter(isPortalParent); // tabs, steppers, etc
  const currPortalSlots = models.filter(elementHasPortalSlot); // code cmps with a portal slot input
  const portals = currPortals.map((p) => migratePortalRef(p, idMap, removeMissing));
  const portalParents = currParents.map((p) => migratePortalParentRefs(p, idMap, removeMissing));
  const portalSlots = currPortalSlots.map((p) => migratePortalSlotComponent(p, idMap));
  const updatedModels = [...models, ...portals, ...portalParents, ...portalSlots];
  return { ...content, models: updatedModels };
};

export const duplicateBoardGroup = (
  boardGroup: cd.IComponentInstanceGroup,
  removeMissingPortalRefs = false
): cd.ICreateBoardPayload => {
  const { rootIds, models, idMap } = duplicateComponentInstanceGroup(boardGroup);
  const elementProperties = convertModelListToMap(models);
  const boards = rootIds.map((id) => elementProperties[id]) as cd.IBoardProperties[];
  const newContents = boards.map((board) => {
    const { childIds } = board;
    const childModels = getChildren(board.id, elementProperties);
    const contents: cd.IComponentInstanceGroup = { rootIds: childIds, models: childModels };
    return contents;
  });

  // Update any portals references within the board group
  const boardContents = newContents.map((content) =>
    migratePortalReferences(content, idMap, removeMissingPortalRefs)
  );
  return { boards, boardContents };
};
