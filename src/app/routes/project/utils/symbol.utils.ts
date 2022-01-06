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
import { incrementedName } from 'cd-utils/string';
import { createPoint, IPoint } from 'cd-utils/geometry';
import { OUTLET_FRAME_INSERT_OFFSET } from '../configs/outlet-frame.config';
import { SymbolFactory, SymbolInstanceFactory } from 'cd-definitions';
import { generateSymbolInstanceDefaults, hasDefaultSymbolInputOverrides } from './symbol-overrides';
import { convertToLayout, detectLayoutMode } from '../components/layout-engine/layout-engine.utils';
import { filterSymbolInstances } from './import.utils';
import { deepCopy } from 'cd-utils/object';
import { createId } from 'cd-utils/guid';
import * as utils from 'cd-common/utils';
import * as gUtils from './group.absolute.utils';
import * as mUtils from 'cd-common/models';
import * as consts from 'cd-common/consts';
import * as cd from 'cd-interfaces';
import {
  convertPropsUpdateToUpdateChanges,
  createElementChangePayload,
  mergeElementChangePayloads,
} from 'cd-common/utils';

const SYMBOL_INSTANCE_NAME = 'Instance';
const SYMBOL_UNPACKED_NAME = '(Detached)';

export interface ICustomComponenSwapPayload {
  publishEntry: cd.IPublishEntry;
  componentId: string;
  updatedVersion: cd.IPublishVersion;
  isCodeComp: boolean;
}

interface ISymbolCreationParts {
  symbol: cd.ISymbolProperties;
  childIds: string[];
}

/** Add or remove exposed symbol inputs */
export const updateExposedSymbolInputs = (
  symbol: cd.ISymbolProperties,
  children: cd.PropertyModel[]
): Record<string, boolean> => {
  const childIds = new Set(children.map((item) => item.id));
  const entries = Object.entries(symbol.exposedInputs || {});
  // Cleanup element ids that have been removed
  const exposedIds = new Set<string>();
  const exposed = entries.reduce<Record<string, boolean>>((acc, curr) => {
    const [id, value] = curr;
    if (!childIds.has(id)) {
      (acc as any)[id] = null; // mark for delete
      return acc;
    }
    exposedIds.add(id);
    acc[id] = value;
    return acc;
  }, {});
  // For newly added items, see if we expose by default
  for (const child of children) {
    const { id } = child;
    if (exposedIds.has(id)) continue;
    if (hasDefaultSymbolInputOverrides(child)) {
      exposed[id] = true;
    }
  }
  return exposed;
};

export const generateExposedSymbolInputDefaults = (elements: cd.PropertyModel[]) => {
  return elements.filter(hasDefaultSymbolInputOverrides).map((item) => item.id);
};

export const incrementedSymbolName = (
  currentSymbols: cd.ISymbolMap,
  symbolName = consts.NEW_SYMBOL_LABEL
): string => {
  const currentLabels = Object.values(currentSymbols).map(({ name }) => name);
  return incrementedName(symbolName, currentLabels);
};

export const generateSymbolPosition = (currentSymbols: cd.ISymbolMap): IPoint => {
  const symbols = Object.values(currentSymbols);
  const maxX = symbols.reduce<number>((acc, curr) => {
    const frameMaxX = curr.frame.x + curr.frame.width;
    return acc > frameMaxX ? acc : frameMaxX;
  }, 0);
  const x = maxX + OUTLET_FRAME_INSERT_OFFSET;
  return createPoint(x); // y = 0 auto
};

const getInstanceInputsFromSym = (
  symbol: cd.ISymbolProperties,
  elementProperties: cd.ElementPropertiesMap
) => {
  if (symbol.defaultInputs) return symbol.defaultInputs;
  const elementsToConvert = mUtils.getModelsAndChildren(symbol.childIds, elementProperties);
  return generateSymbolInstanceDefaults(elementsToConvert);
};

export const createInstanceOfSymbol = (
  elementProperties: cd.ElementPropertiesMap,
  symbol: cd.ISymbolProperties,
  id: string
): cd.ISymbolInstanceProperties => {
  const instanceInputs = getInstanceInputsFromSym(symbol, elementProperties);
  const name = symbol.name || `${consts.SYMBOL_USER_FACING_NAME} ${SYMBOL_INSTANCE_NAME}`;
  const a11yInputs = symbol.a11yInputs || {};
  const symbolInstance = new SymbolInstanceFactory(symbol.projectId, id)
    .assignName(name)
    .assignReferenceId(symbol.id)
    .assignWidth(symbol.frame.width)
    .assignHeight(symbol.frame.height)
    .assignInstanceInputs(instanceInputs)
    .assignPositionFromSymbol(symbol)
    .assignA11yInputs(a11yInputs)
    .build();

  return symbolInstance;
};

const getSymbolFromSingleRoot = (
  name: string,
  projectId: string,
  symbolId: string,
  elementProperties: cd.ElementPropertiesMap,
  frame: cd.IRect,
  [first]: cd.PropertyModel[]
): ISymbolCreationParts => {
  const { childIds, styles } = first;
  const { base } = styles;
  const { ...baseStyles } = base.style || {};
  const elementsToConvert = mUtils.getModelsAndChildren(childIds, elementProperties);
  const a11yInputs = first.a11yInputs || {};
  const exposed = generateExposedSymbolInputDefaults(elementsToConvert);
  const defaultInputs = generateSymbolInstanceDefaults(elementsToConvert);
  const symbol = new SymbolFactory(projectId, symbolId)
    .assignName(name)
    .assignRootId(symbolId)
    .assignFrameFromFrame(frame)
    .assignA11yInputs(a11yInputs)
    .addDefaultInstanceInputs(defaultInputs)
    .addExposedInputsForIds(exposed)
    .addBaseStyle(baseStyles)
    .addOverridesFromExistingStyles(styles)
    .build();

  const symbolWithMigratedActions = migrateActionsOnSymbolRoot(first, symbol);
  return { symbol: symbolWithMigratedActions, childIds };
};

const migrateActionsOnSymbolRoot = (rootElem: cd.PropertyModel, symbol: cd.ISymbolProperties) => {
  const actions = deepCopy(rootElem.actions);
  const replacementMap = new Map([[rootElem.id, symbol.id]]);
  symbol.actions = actions;
  return mUtils.migrateActions(symbol, replacementMap) as cd.ISymbolProperties;
};

const getSymbolFromMultiRoot = (
  name: string,
  projectId: string,
  symbolId: string,
  elementProperties: cd.ElementPropertiesMap,
  frame: cd.IRect,
  rootElems: cd.PropertyModel[]
): ISymbolCreationParts => {
  const childIds = rootElems.map(({ id }) => id);
  const elementsToConvert = mUtils.getModelsAndChildren(childIds, elementProperties);
  const exposed = generateExposedSymbolInputDefaults(elementsToConvert);
  const defaultInputs = generateSymbolInstanceDefaults(elementsToConvert);
  const symbol = new SymbolFactory(projectId, symbolId)
    .assignName(name)
    .assignRootId(symbolId)
    .assignFrameFromFrame(frame)
    .addDefaultInstanceInputs(defaultInputs)
    .addExposedInputsForIds(exposed)
    .build();

  return { symbol, childIds };
};

/**
 * We remove the positions like top, left from a symbol root and keep those values on
 * a Symbol instance
 */
const removePositionFromAbsoluteSymbol = (symbol: cd.ISymbolProperties) => {
  utils.assignBaseStyles(symbol, { top: null, right: null, bottom: null, left: null });
};

const applyAbsolutePositionToSymbolAndInstance = (
  hasAbsolutePosition: boolean,
  symbol: cd.ISymbolProperties,
  isSingleRoot: boolean,
  childIds: ReadonlyArray<string>,
  elemProps: cd.ElementPropertiesMap,
  symbolInstance: cd.ISymbolInstanceProperties,
  renderRects: cd.RenderRectMap,
  initalId: string
): cd.IElementChangePayload => {
  if (!hasAbsolutePosition) return createElementChangePayload();
  removePositionFromAbsoluteSymbol(symbol);

  const childElements = childIds
    .map((id) => elemProps[id])
    .filter((elem): elem is cd.PropertyModel => !!elem);

  const hasFixed = gUtils.someElementsHaveFixedPosition(childElements);
  const bounds = isSingleRoot
    ? gUtils.lookupRectWithFallback(initalId, renderRects)
    : gUtils.generateBoundingBox(symbol.parentId, childElements, renderRects);

  const { width, height } = bounds;
  symbol.frame = { ...symbol.frame, width, height };
  gUtils.applyAbsolutePositionToGroup(symbolInstance, bounds, hasFixed);
  const updates = gUtils.adjustAbsolutePositionForChildren(bounds, childElements, renderRects);

  // convert updates to changes interface
  const absStyleUpdateChanges = convertPropsUpdateToUpdateChanges(updates);
  const absStyleChanges = createElementChangePayload(undefined, absStyleUpdateChanges);
  return absStyleChanges;
};
/**
 * 1. Create a symbol based on a set of elements
 * 2. Replace the elements was with an instance the new symbol
 * 3. Return an array of updates to peform all changes
 *
 * See design proposal doc:
 * https://docs.google.com/document/d/1rMEiCg44fUmkHdL-mH1HhhAepIaP9T6nX44tSsWDVh0/edit#bookmark=id.1h9pdq13ccu6
 */
export const createSymbolFromElements = (
  name: string,
  projectId: string,
  rootElems: cd.PropertyModel[],
  elemProps: cd.ElementPropertiesMap,
  renderRects: cd.RenderRectMap,
  dimension: cd.Dimensions,
  currentSymbols: cd.ISymbolMap
): cd.ICreateSymbolResult => {
  // Generate ids for the symbol and an instance
  const symbolId = createId();
  const instanceId = createId();
  const { x, y } = generateSymbolPosition(currentSymbols);
  const { width, height } = dimension;
  const frame = utils.generateFrame(x, y, width, height);
  const [first] = rootElems;
  const isSingleRoot = rootElems.length === 1;
  const isSingleRootGeneric = isSingleRoot && first.elementType === cd.ElementEntitySubType.Generic;
  const symbolFn = isSingleRootGeneric ? getSymbolFromSingleRoot : getSymbolFromMultiRoot;
  const { symbol, childIds } = symbolFn(name, projectId, symbolId, elemProps, frame, rootElems);
  const symbolInstance = createInstanceOfSymbol(elemProps, symbol, instanceId);
  const insertInstanceLocation = utils.buildInsertLocation(first.id, cd.InsertRelation.Before);
  const hasAbsolutePosition = gUtils.elementsHaveAbsolutePosition(rootElems);
  const absStyleChanges = applyAbsolutePositionToSymbolAndInstance(
    hasAbsolutePosition,
    symbol,
    isSingleRoot,
    childIds,
    elemProps,
    symbolInstance,
    renderRects,
    first.id
  );

  // If every parent is a grid, apply row or column layout
  const sameParent = rootElems.every((item) => item.parentId === first.parentId);

  if (sameParent) {
    const parentElement = first.parentId && elemProps[first.parentId];
    const parentStyles = parentElement && utils.getElementBaseStyles(parentElement);

    if (parentStyles) {
      const layoutMode = detectLayoutMode(parentStyles);
      if (layoutMode === cd.LayoutMode.Cols || layoutMode === cd.LayoutMode.Rows) {
        const { justifyItems, alignItems } = parentStyles;
        const baseStyles = utils.getElementBaseStyles(symbol) || {};
        const gridLayout = convertToLayout(layoutMode, baseStyles);
        const styles = { ...baseStyles, ...gridLayout, justifyItems, alignItems };
        utils.assignBaseStyles(symbol, styles);
      }
    }
  }

  const insertChange = mUtils.insertElements(
    [symbolInstance.id],
    insertInstanceLocation,
    elemProps,
    [symbolInstance]
  );

  // incorporate insert change into move calculations
  const propsWithInserts = utils.mergeChangeIntoProperties(elemProps, insertChange);

  // Original root relements now become children of the symbol
  const moveLocation = utils.buildInsertLocation(symbol.id, cd.InsertRelation.Append);
  const moveChange = mUtils.insertElements(childIds, moveLocation, propsWithInserts, [symbol]);

  const childActionChanges = migrateChildActionsForSymbolRoot(
    symbol.id,
    first.id,
    moveChange,
    elemProps
  );

  // Compute deletion changes
  const isFirstGenericElement = first.elementType === cd.ElementEntitySubType.Generic;
  const deletions = isSingleRoot && isFirstGenericElement ? rootElems : [];
  const deleteIds = deletions.map((d) => d.id);
  const deleteChanges = createElementChangePayload(undefined, undefined, deleteIds);

  const allChanges = [insertChange, moveChange, absStyleChanges, childActionChanges, deleteChanges];
  const change = mergeElementChangePayloads(allChanges);
  return { symbol, symbolInstance, change };
};

/** Ensure that any actions on children are remapped to point to the symbol Id */
const migrateChildActionsForSymbolRoot = (
  symId: string,
  rootId: string,
  currentChange: cd.IElementChangePayload,
  elemProps: cd.ElementPropertiesMap
): cd.IElementChangePayload => {
  const replacementMap = new Map([[rootId, symId]]);
  const { sets = [], updates = [] } = currentChange;
  const changeIds = [...sets, ...updates].map((c) => c.id);

  const childActionUpdates = changeIds.reduce<cd.IUpdateChange<cd.PropertyModel>[]>((acc, id) => {
    const elem = elemProps[id];
    if (!elem?.actions.length) return acc;
    const clone = deepCopy(elem);
    const migration = mUtils.migrateActions(clone, replacementMap);
    const newUpdate = utils.createElementUpdate(elem.id, { actions: migration.actions });
    acc.push(newUpdate);
    return acc;
  }, []);

  return createElementChangePayload(undefined, childActionUpdates);
};

const _duplicateMergedInstanceProps = (
  rootIds: string[],
  props: cd.ElementPropertiesMap
): cd.IComponentInstanceGroup => {
  const models = mUtils.getModels(props);
  const propertyGroup = { rootIds, models } as cd.IComponentInstanceGroup;
  return mUtils.duplicateComponentInstanceGroup(propertyGroup);
};

const getUnpackParent = (
  symbolElements: cd.IComponentInstanceGroup,
  symbolDef: cd.ISymbolProperties,
  symbolInstance: cd.ISymbolInstanceProperties
): [string, cd.PropertyModel[]] => {
  const parentId = createId();
  const { rootIds } = symbolElements;
  const { rootId, projectId } = symbolInstance;
  const rootName = `${symbolInstance.name} ${SYMBOL_UNPACKED_NAME}`;

  const styleKeys = new Set([
    ...Object.keys(symbolDef.styles),
    ...Object.keys(symbolInstance.styles),
  ]);

  const styles = [...styleKeys].reduce<cd.IStyleAttributes>((acc, styleKey) => {
    const defStyleForKey = symbolDef.styles[styleKey];
    const instStyleForKey = symbolInstance.styles[styleKey];
    const defOverrides = defStyleForKey?.overrides || [];
    const instanceOverrides = instStyleForKey?.overrides || [];
    const style = utils.deepMerge(defStyleForKey?.style || {}, instStyleForKey?.style || {});
    const overrides = [...defOverrides, ...instanceOverrides];
    acc[styleKey] = { style, overrides };
    return acc;
  }, {} as cd.IStyleAttributes);

  // To mirror exactly how a symbol instance is rendered and thus have unpacked results
  // look identical, we create a parent that represents the host element of the instance
  const parent = mUtils
    .createInstance(cd.ElementEntitySubType.Generic, projectId, parentId)
    .assignName(rootName)
    .assignStyles(styles)
    .assignRootId(rootId)
    .assignChildIds(rootIds)
    .build();

  const newElements = [parent];
  return [parentId, newElements];
};

const assignParentIdToRootModels = (
  parentId: string,
  group: cd.IComponentInstanceGroup
): cd.IComponentInstanceGroup => {
  const { rootIds } = group;
  const rootIdSet = new Set(rootIds);
  const models = group.models.map((m) => {
    if (!rootIdSet.has(m.id)) return m;
    return { ...m, parentId };
  });
  return { models, rootIds };
};

export const unpackComponentInstance = (
  instance: cd.ISymbolInstanceProperties,
  symbol: cd.ISymbolProperties,
  allElementProps: cd.ElementPropertiesMap
): cd.IUnpackSymbolInstanceResult => {
  const mergedInstanceProps = utils.mergeInstanceOverrides(instance, allElementProps);
  const propsCopy = _duplicateMergedInstanceProps(symbol.childIds, mergedInstanceProps);
  const [parentId, parentElements] = getUnpackParent(propsCopy, symbol, instance);
  const updatedPropsGroup = assignParentIdToRootModels(parentId, propsCopy);
  const location = utils.buildInsertLocation(instance.id, cd.InsertRelation.Before);
  const newElements = [...updatedPropsGroup.models, ...parentElements];
  const change = mUtils.insertElements([parentId], location, allElementProps, newElements);
  return { change, rootId: parentId };
};

export const unpackInstances = (
  instances: cd.ISymbolInstanceProperties[],
  definitions: cd.ISymbolMap,
  elementProperties: cd.ElementPropertiesMap
): {
  rootIds: string[];
  change: cd.IElementChangePayload;
} => {
  const allChanges: cd.IElementChangePayload[] = [];
  const rootIds: string[] = [];

  for (const instance of instances) {
    const { referenceId } = instance.inputs;
    if (!referenceId) continue;

    const definition = definitions[referenceId];
    const unpackResult = unpackComponentInstance(instance, definition, elementProperties);
    const { rootId: rootIdForInstance, change: changeForInstance } = unpackResult;

    allChanges.push(changeForInstance);
    rootIds.push(rootIdForInstance);
  }

  const change = mergeElementChangePayloads(allChanges);
  return { change, rootIds };
};

export const findAllInstancesOfSymbol = (
  id: string,
  elementProperties: cd.ElementPropertiesMap
): cd.ISymbolInstanceProperties[] => {
  const { SymbolInstance } = cd.ElementEntitySubType;
  const allElements = mUtils.getModels(elementProperties);
  return allElements
    .filter((e): e is cd.ISymbolInstanceProperties => e.elementType === SymbolInstance)
    .filter((e) => e.inputs.referenceId === id);
};

export const getImportedEntryIds = (
  symbolMap: cd.IStringMap<cd.ISymbolProperties>
): Set<string> => {
  const symbols = Object.values(symbolMap);
  return symbols.reduce<Set<string>>((acc, currSymbol) => {
    const { publishId } = currSymbol;
    if (!publishId) return acc;
    acc.add(publishId.entryId);
    return acc;
  }, new Set());
};

export const buildPropertiesUpdateForWidthAndHeight = (
  elementId: string,
  width: cd.IValue | null,
  height: cd.IValue | null
): cd.IPropertiesUpdatePayload => {
  return utils.buildBaseStylePropsUpdate(elementId, { width, height });
};

const instancesForSymbol = (symbolId: string, props: cd.ElementPropertiesMap) => {
  return (Object.values(props) as cd.PropertyModel[]).filter((item) => {
    return (
      mUtils.isSymbolInstance(item) &&
      (item as cd.ISymbolInstanceProperties).inputs?.referenceId === symbolId
    );
  }) as cd.ISymbolInstanceProperties[];
};

export const symbolInstanceUpdatesForMissingSize = (
  symbolId: string,
  props: cd.ElementPropertiesMap,
  fallbackWidth: cd.IValue,
  fallbackHeight: cd.IValue
): cd.IPropertiesUpdatePayload[] => {
  const symbolInstances = instancesForSymbol(symbolId, props);
  return symbolInstances.reduce<cd.IPropertiesUpdatePayload[]>((acc, instance) => {
    const baseStyles = utils.getElementBaseStyles(instance);
    const w = baseStyles?.width;
    const h = baseStyles?.height;
    // Only update instances who have undefined width and height
    if (w !== undefined && h !== undefined) return acc;
    const { id } = instance;
    const width = w || fallbackWidth;
    const height = h || fallbackHeight;
    const instanceUpdate = buildPropertiesUpdateForWidthAndHeight(id, width, height);
    acc.push(instanceUpdate);
    return acc;
  }, []);
};

/**
 * Given an array of elements, return an array of all symbol ids used within them.
 *
 * This function recursively calls itself to retrieve all symbols uses within symbols, etc.
 */
export const getContainedSymbolIdsRecursive = (
  elementModels: cd.PropertyModel[],
  elementProperties: cd.ElementPropertiesMap,
  currentSymbolIds = new Set<string>()
): string[] => {
  const elementIds = elementModels.map((e) => e.id);
  const modelsWithChildren = mUtils.getModelsAndChildren(elementIds, elementProperties);
  const symbolInstances = filterSymbolInstances(modelsWithChildren);
  const referenceIds = symbolInstances.map((i) => i.inputs?.referenceId);

  // ensure referenceId is defined, and prevent infinite recursion by making sure we don't
  // lookup a symbol id more than once.
  const depDupedRefIds = referenceIds.filter((id) => !!id && !currentSymbolIds.has(id)) as string[];
  const symbols = mUtils.lookupElementIds(depDupedRefIds, elementProperties);
  const updatedSymbolsIds = new Set([...currentSymbolIds, ...depDupedRefIds]);
  const childSymbolIds =
    symbols.length > 0
      ? getContainedSymbolIdsRecursive(symbols, elementProperties, updatedSymbolsIds)
      : [];

  const allSymbolIds = Array.from(new Set([...updatedSymbolsIds, ...childSymbolIds]));
  return allSymbolIds;
};

export const getSymInstUpdate = (
  elementId: string,
  defaultInputs: cd.SymbolInstanceInputs,
  exposedInputs: Record<string, boolean>
): cd.IPropertiesUpdatePayload => {
  const properties = { symbolInputs: null, defaultInputs, exposedInputs };
  return { elementId, properties } as cd.IPropertiesUpdatePayload;
};
