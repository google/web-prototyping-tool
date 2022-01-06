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

import {
  generateCSSVars,
  deepMerge,
  isJsonDataset,
  generateStyle,
  applyChangeToElementContent,
  mergeElementChangePayloads,
  createContentSection,
} from 'cd-common/utils';
import { compilationUpdate$, compileOutletComponentDirectiveSet } from './utils/compiler.utils';
import DrawerOutlet from './outlet-components/drawer/drawer.outlet';
import ModalOutlet from './outlet-components/modal/modal.outlet';
import { NgModuleRef, PlatformRef } from '@angular/core';
import { bufferTime, filter, auditTime } from 'rxjs/operators';
import { getDependentOutletsForIds } from './utils/dependency.utils';
import { messagingService, postError } from './utils/messaging.utils';
import { registerComponentDefinitions } from 'cd-definitions';
import { RENDERER_IFRAME_NAME } from 'cd-common/consts';
import { areObjectsEqual } from 'cd-utils/object';
import { rendererState } from './state.manager';
import { Subject, Subscription } from 'rxjs';
import OutletManager from './outlet.manager';
import { fetchBlob } from 'cd-utils/files';
import OverlayOutlet from './outlet-components/overlay/overlay.outlet';
import * as codeCmpHandler from './code-components/code-component.handlers';
import * as services from 'cd-common/services';
import * as utils from './utils/renderer.utils';
import * as cd from 'cd-interfaces';

const OUTLET_UPDATE_TIMEOUT = 2;
const ASSET_BUFFER_TIMEOUT = 650;
const subscriptions = new Subscription();
const outletManagers: Map<string, OutletManager> = new Map();
const assetBuffer$ = new Subject<services.PostMessageProjectAssetUpdate>();
const updateOutletsAsync$ = new Subject<void>();

const initializeCompiler = async () => {
  await ModalOutlet.compile();
  await DrawerOutlet.compile();
  await OverlayOutlet.compile();
  await compileOutletComponentDirectiveSet();
};

export default async function () {
  // Load all built-in component definitions
  registerComponentDefinitions();
  await initializeCompiler();
  setupOutletRegistration();
  subscribeToAppMessages();

  const assets$ = assetBuffer$.pipe(
    bufferTime(ASSET_BUFFER_TIMEOUT),
    filter((updates) => updates.length > 0)
  );

  subscriptions.add(assets$.subscribe(flushAssetBuffer));

  subscriptions.add(
    updateOutletsAsync$.pipe(auditTime(OUTLET_UPDATE_TIMEOUT)).subscribe(updateAllOutlets)
  );

  subscriptions.add(
    rendererState.dataLoaded$.pipe(auditTime(OUTLET_UPDATE_TIMEOUT)).subscribe(updateAllOutlets)
  );

  subscriptions.add(
    compilationUpdate$.pipe(auditTime(OUTLET_UPDATE_TIMEOUT)).subscribe(reinsertAllOutlets)
  );

  subscriptions.add(rendererState.retargetOutletInternal$.subscribe(handleRetargetOutlet));
}

const updateStylesMap = () => {
  if (!rendererState.propertiesLoaded) return;
  rendererState.stylesMap = generateAllStyles();
  updateAllOutlets();
};

const flushAssetBuffer = (msgList: services.PostMessageProjectAssetUpdate[]) => {
  for (const { asset, blobs } of msgList) {
    const { id } = asset;
    const oldAsset = rendererState.assets[id];
    const appBlobUrlToRendererBlobUrl = utils.createRendererBlobUrls(blobs);
    const newAsset = utils.processAssetUrls(oldAsset, asset, appBlobUrlToRendererBlobUrl);
    rendererState.assets[id] = newAsset;
  }
  updateStylesMap();
};

const setupOutletRegistration = () => {
  const rendererWindow = window as cd.IRendererWindow & typeof globalThis;

  // Set name on the window. Used by render outlets to find correct iframe for renderer
  rendererWindow.name = RENDERER_IFRAME_NAME;

  // this function is called by each render-outlet iframe
  // to register its document with the renderer
  rendererWindow.registerRenderOutlet = registerOutletManager;

  // this function is called by each render-outlet iframe on unload to destory the outlet manager
  rendererWindow.unRegisterRenderOutlet = unRegisterOutletManager;

  // set up regsitration and unregistration of code component preview iframes
  rendererWindow.registerCodeComponentOutlet = codeCmpHandler.registerCodeComponentOutlet;
  rendererWindow.unRegisterCodeComponentOutlet = codeCmpHandler.unRegisterCodeComponentOutlet;

  // setup handler that catches any code component errors
  rendererWindow.handleCodeComponentError = codeCmpHandler.handleCodeComponentError;
};

const subscribeToAppMessages = () => {
  // subscribe to messages from parent app
  messagingService.messages$.subscribe(onPostMessage);

  // send init message to parent once setup is complete
  messagingService.postMessageToParent(new services.PostMessageSandboxInit());
};

const onPostMessage = (message: services.CdPostMessage) => {
  try {
    if (message.name in messageReducer) messageReducer[message.name](message);
  } catch (err) {
    postError(err);
  }
};

const registerOutletManager: cd.RegisterRenderOutletFunction = (
  id: string,
  outletDocument: HTMLDocument,
  outletAppModuleRef: NgModuleRef<cd.IRenderOutletApp>,
  outletPlatform: PlatformRef
) => {
  const outletManager = new OutletManager(id, outletDocument, outletAppModuleRef, outletPlatform);
  outletManagers.set(id, outletManager);
};

const unRegisterOutletManager: cd.UnRegisterOutletFunction = (outletDoc: HTMLDocument) => {
  const name = outletDoc.defaultView?.name;
  const manager = name && outletManagers.get(name);
  if (!manager) return;
  manager.prepareForDelete();
  outletManagers.delete(manager.id);
  manager.destroy();
};

const outletManagersFromIds = (ids: string[]): OutletManager[] => {
  const managers: OutletManager[] = [];
  for (const id of ids) {
    const manager = outletManagers.get(id);
    if (manager) managers.push(manager);
  }
  return managers;
};

// This function should not be called directly. It does not handle updating dependents of a given
// OutletManger. Use updateOutletsById or updateAllOutlets functions below
const updateManagers = (managers: OutletManager[] | IterableIterator<OutletManager>) => {
  // Wait until all project data has loaded before refreshing outlet managers
  if (!rendererState.propertiesLoaded) return;
  for (const manager of managers) {
    manager.update();
    manager.reset();
  }
};

const publishRootIdUpdates = (ids: string[]) => {
  utils.rootIdsUpdated$.next(ids);
};

const updateOutletsById = (...ids: string[]) => {
  const allIds = getDependentOutletsForIds(ids, rendererState.mergedProperties);
  const managers = outletManagersFromIds(allIds);
  updateManagers(managers);
  // whenever we update any root ids emit event to trigger any symbols instances to check if
  // merging overrides is needed
  publishRootIdUpdates(allIds);
};

const updateAllOutlets = () => {
  const managers = outletManagers.values();
  const managerIds = Array.from(outletManagers.keys());
  updateManagers(managers);
  publishRootIdUpdates(managerIds);
};

const reinsertAllOutlets = () => {
  const managers = outletManagers.values();
  for (const manager of managers) {
    manager.reinsertComponent();
  }
};

const destroyAllOutletManagers = () => {
  for (const manager of outletManagers.values()) {
    manager.destroy();
  }
  outletManagers.clear();
};

const generateAllStyles = (): cd.IStringMap<cd.IStyleAttributes> => {
  const { designSystem, assets, boardsMap, mergedProperties } = rendererState;
  if (!designSystem || !assets) return {};
  const bindings: cd.IProjectBindings = { designSystem, assets };
  const boardStyles = utils.generateBoardsStyles(boardsMap, bindings);
  const elementStyles = utils.generateElementsStyles(mergedProperties, bindings);
  return { ...boardStyles, ...elementStyles };
};

const handleRefreshRects = () => {
  for (const manager of outletManagers.values()) {
    manager.requestRenderRects();
  }
};

const handleSetPreviewMode = ({ previewMode }: services.PostMessageSetPreviewMode) => {
  rendererState.setPreviewMode(previewMode);
  const allOutlets = outletManagers.values();
  for (const outlet of allOutlets) {
    outlet.setPreviewMode(previewMode);
  }
};

const handleSetA11yMode = ({ mode }: services.PostMessageSetA11yMode) => {
  rendererState.setA11yMode(mode);
  const allOutlets = outletManagers.values();
  for (const outlet of allOutlets) {
    outlet.toggleA11yMode(mode);
  }
};

const handleSetApplicationTheme = ({ updates }: services.PostMessageSetApplicationTheme) => {
  rendererState.applicationTheme = updates;
  for (const manager of outletManagers.values()) {
    manager.setApplicationTheme(updates);
  }
};

const handleReset = () => {
  destroyAllOutletManagers();
  rendererState.reset();
};

const handleRecompile = () => {
  compileOutletComponentDirectiveSet();
};

const handleApplyElementChanges = (message: services.PostMessageApplyElementChanges) => {
  const { createdElements, updatedElements, deletedElementIds } = message;
  const createdIdSet = new Set(Array.from(createdElements.map((e) => e.id)));
  const { baseProperties, stylesMap, projectBindings } = rendererState;
  const updatedOutletIds = new Set<string>();

  // creates and updates
  for (const model of [...createdElements, ...updatedElements]) {
    const { id, rootId } = model;
    const skipUpdateStyles = !createdIdSet.has(id) && areObjectsEqual(baseProperties[id], model);
    if (!skipUpdateStyles) {
      baseProperties[id] = model;
      if (projectBindings) {
        stylesMap[id] = generateStyle(model.styles, projectBindings);
      }
    }
    //  We still need to update references to any rootIds
    //  In the case of symbol instances and portals
    updatedOutletIds.add(rootId);
  }

  // deletes
  for (const id of deletedElementIds) {
    const model = baseProperties[id];
    if (!model) continue;

    updatedOutletIds.add(model.rootId);
    delete baseProperties[id];
    delete stylesMap[id];
  }

  if (updatedOutletIds.size === 0) return;
  rendererState.baseProperties = baseProperties;
  updateOutletsById(...updatedOutletIds);
};

const handleAddProperties = ({ propertyModels }: services.PostMessagePropertiesAdd) => {
  const { baseProperties, stylesMap, projectBindings } = rendererState;
  const updatedOutletIds = new Set<string>();

  for (const model of propertyModels) {
    const { id, rootId } = model;
    baseProperties[model.id] = model;
    if (projectBindings) {
      stylesMap[id] = generateStyle(model.styles, projectBindings);
    }

    updatedOutletIds.add(rootId);
  }

  if (updatedOutletIds.size === 0) return;
  rendererState.baseProperties = baseProperties;
  updateOutletsById(...updatedOutletIds);
};

const handleUpdateProperties = ({ updates, recompile }: services.PostMessagePropertiesUpdate) => {
  const { baseProperties, stylesMap, projectBindings } = rendererState;
  const updatedOutletIds = new Set<string>();
  const updateEntries = Object.entries(updates);

  for (const [id, model] of updateEntries) {
    if (!model) continue;
    const skipUpdateStyles = !recompile && areObjectsEqual(baseProperties[id], model);
    if (!skipUpdateStyles) {
      baseProperties[id] = model;
      if (projectBindings) {
        stylesMap[id] = generateStyle(model.styles, projectBindings);
      }
    }
    //  We still need to update references to any rootIds
    //  In the case of symbol instances and portals
    updatedOutletIds.add(model.rootId);
  }

  if (updatedOutletIds.size === 0) return;
  rendererState.baseProperties = baseProperties;
  updateOutletsById(...updatedOutletIds);
};

/** Callback from the ResetAction to replace properties with the original state */
const handleReplaceProperties = ({ updates }: services.PostMessagePropertiesReplace) => {
  const { baseProperties, stylesMap, projectBindings } = rendererState;
  for (const propUpdate of updates) {
    const { elementId, properties } = propUpdate;
    const replacement = properties as cd.PropertyModel;
    const currentProperties = baseProperties[elementId];
    if (!currentProperties) continue;
    baseProperties[elementId] = replacement;
    if (projectBindings) {
      stylesMap[elementId] = generateStyle(replacement.styles, projectBindings);
    }
  }

  rendererState.baseProperties = baseProperties;
  // This is only called in preview so we only need to update visible managers, not reset
  const managers = Array.from(outletManagers.values());
  for (const manager of managers) {
    manager.update();
  }
};

const handleUpdatePropsPartial = ({ updates }: services.PostMessagePropertiesUpdatePartial) => {
  const { baseProperties, stylesMap, previewProperties, mergedProperties, projectBindings } =
    rendererState;
  const updatedOutletIds = new Set<string>();

  for (const update of updates) {
    const { elementId, properties } = update;
    const currentProperties = mergedProperties?.[elementId];
    if (!currentProperties) continue;

    const currentRoot = currentProperties.rootId;
    // Only should occur when dragging between boards w/ absolute position
    const rootMismatch = properties.rootId && properties.rootId !== currentRoot;

    const merged = deepMerge(currentProperties, properties);

    if (elementId in baseProperties) {
      baseProperties[elementId] = merged;
    }
    if (previewProperties && elementId in previewProperties) {
      previewProperties[elementId] = merged;
    }

    // Prevent flashing when dragging absolute position elements between boards
    // The flash occurs because multiple boards have childIds pointing to the same element
    if (rootMismatch) {
      if (previewProperties) {
        previewProperties[currentRoot] = utils.filterChildIdsForProps(
          previewProperties,
          currentRoot,
          elementId
        );
      }
      baseProperties[currentRoot] = utils.filterChildIdsForProps(
        baseProperties,
        currentRoot,
        elementId
      );
    }

    // TODO: we don't need to generateStyles for symbol and portal instances
    // Their styles get merged into the board or symbol styles that they are an instance of
    if (projectBindings) {
      stylesMap[elementId] = generateStyle(merged.styles, projectBindings);
    }
    updatedOutletIds.add(currentProperties.rootId);
  }

  rendererState.baseProperties = baseProperties;
  updateOutletsById(...updatedOutletIds);
};

const handleDeleteProperties = ({ ids }: services.PostMessagePropertiesDelete) => {
  const { baseProperties, stylesMap } = rendererState;
  const updatedOutletIds = new Set<string>();

  for (const id of ids) {
    const model = baseProperties[id];
    if (!model) continue;

    updatedOutletIds.add(model.rootId);
    delete baseProperties[id];
    delete stylesMap[id];
  }

  rendererState.baseProperties = baseProperties;
  updateOutletsById(...updatedOutletIds);
};

const handlePropertiesLoaded = ({ loaded }: services.PostMessagePropertiesLoaded) => {
  rendererState.propertiesLoaded = loaded;
  if (loaded) {
    updateStylesMap();
  }
};

const handleSetDesignSystem = ({ designSystem }: services.PostMessageDesignSystemSet) => {
  rendererState.designSystem = designSystem;
  loadFonts();
  processDesignSystemChanges(designSystem);
  updateStylesMap();
};

const processDesignSystemChanges = (designSystem: cd.IDesignSystem) => {
  const cssVars = generateCSSVars(designSystem);
  rendererState.cssVars = cssVars;
  for (const manager of outletManagers.values()) {
    manager.updateDesignSystem();
  }
};

const loadFonts = () => {
  for (const manager of outletManagers.values()) {
    manager.loadFonts();
  }
};

const handleUpdateDesignSystem = ({ update }: services.PostMessageDesignSystemUpdate) => {
  const { designSystem } = rendererState;
  if (designSystem && designSystem.icons.family) {
    rendererState.designSystem = { ...designSystem, ...update };
    if (update.fonts) loadFonts();
    processDesignSystemChanges(rendererState.designSystem);
    updateOutletsAsync$.next();
  }
};

const handleUpdateProjectAsset = (msg: services.PostMessageProjectAssetUpdate) => {
  assetBuffer$.next(msg);
};

const handleDeleteProjectAsset = ({ ids }: services.PostMessageProjectAssetDelete) => {
  for (const id of ids) {
    delete rendererState.assets[id];
  }
  updateStylesMap();
};

const handleShowPreview = ({ preview: newPreview }: services.PostMessagePreviewShow) => {
  const { baseProperties, idsInPreview } = rendererState;

  // merge newPreview updates into base properties map
  const change = mergeElementChangePayloads(newPreview);
  const elementContent = createContentSection(baseProperties, true);
  const updatedContent = applyChangeToElementContent(change, elementContent);
  const idsInNewPreview = utils.getIdsInUpdatedElementContent(updatedContent);
  rendererState.updatePreview(newPreview, updatedContent.records, idsInNewPreview);

  // get all ids associated with currentPreview and newPreview
  const idsInAllPreviews = idsInPreview
    ? utils.mergeIdSummaries(idsInPreview, idsInNewPreview)
    : idsInNewPreview;

  // generate styles for all affected ids
  rendererState.generateStylesForIds(idsInAllPreviews.allIds);

  // then update all affected boards
  updateOutletsById(...idsInAllPreviews.rootIds);
};

const handleClearPreview = () => {
  const { idsInPreview } = rendererState;

  // reset any boards in current preview (if any)
  if (!idsInPreview) return;
  rendererState.resetPreview();
  updateOutletsById(...idsInPreview.rootIds);
};

const handleRetargetOutlet = (message: services.PostMessageRetargetOutlet) => {
  const { currentId, newId } = message;
  const outletManager = outletManagers.get(currentId);
  if (!outletManager) return;

  // set new id on outlet manager
  outletManager.setId(newId);

  // update map to use newId as lookup key for this outlet
  outletManagers.delete(currentId);
  outletManagers.set(newId, outletManager);
};

/**
 * Load code components into exported project
 *
 * In exported bundle, js bundles have been downloaded as files in assets directory,
 * so we can fetch blob from use the path directly instead of going through firebase storage
 */
const loadCodeComponentsForExportedProject = async (
  codeComponents: cd.ICodeComponentDocument[]
) => {
  const jsBundleBlobs: Record<string, Blob> = {};
  for (const cmp of codeComponents) {
    const { id, jsBundleStoragePath } = cmp;
    const blob = await fetchBlob(jsBundleStoragePath);
    jsBundleBlobs[id] = blob;
  }
  const addCodeCmpMsg = new services.PostMessageCodeComponentAdd(codeComponents, jsBundleBlobs);
  codeCmpHandler.handleAddCodeComponents(addCodeCmpMsg);
};

/**
 * Load datasets into exported project
 *
 * Like with code componetns, json files for datasets have been downloaded into assets directory,
 * so we can fetch blob from use the path directly instead of going through firebase storage
 */
const loadDatasetsForExportedProject = async (datasets: cd.ProjectDataset[]) => {
  try {
    const jsonDatasets = datasets.filter(isJsonDataset);
    const datasetPromises = jsonDatasets.map((d) => fetchBlob(d.storagePath));
    const loadedData = await Promise.all(datasetPromises);
    const loadedDataMap = loadedData.reduce<Record<string, any>>((acc, curr, idx) => {
      const dataset = jsonDatasets[idx];
      acc[dataset.id] = curr;
      return acc;
    }, {});
    const message = new services.PostMessageDatasetAdd(loadedDataMap);
    handleAddDatasets(message);
  } catch (e) {
    console.error('Failed to load project datasets', e);
  }
};

const handleLoadExportedProject = (message: services.PostMessageLoadExportedProject) => {
  const { exportedProject } = message;
  const { elementProperties, designSystem, assets, codeComponents, datasets } = exportedProject;
  rendererState.exportMode = true;
  rendererState.propertiesLoaded = true;
  rendererState.baseProperties = elementProperties;
  rendererState.designSystem = designSystem;

  // mimic current method for loading image assets and code components
  const assetMessages = assets.map((asset) => new services.PostMessageProjectAssetUpdate(asset));

  loadFonts();
  processDesignSystemChanges(designSystem);
  flushAssetBuffer(assetMessages);

  if (codeComponents.length) loadCodeComponentsForExportedProject(codeComponents);
  if (datasets.length) loadDatasetsForExportedProject(datasets);
  if (!datasets.length && !codeComponents.length) updateAllOutlets();
};

const handleLoadExportedProjectData = ({
  datasets,
}: services.PostMessageLoadExportedProjectData) => {
  if (datasets.length) loadDatasetsForExportedProject(datasets);
};

/**
 * We don't load data for built-in datasets until a component actually utilizes it. Therefore,
 * what is added here are just he dataset models.
 */
const handleAddBuiltInDatasets = ({ builtInDatasets }: services.PostMessageAddBuiltInDatasets) => {
  const updatedDatasets = { ...rendererState.datasets };
  rendererState.datasets = builtInDatasets.reduce((acc, curr) => {
    acc[curr.id] = curr;
    return acc;
  }, updatedDatasets);
  rendererState.refreshDataBindings();
  updateAllOutlets();
};

/**
 * Add dataset data into renderer. Data is loaded by main app and sent to renderer
 * as a Blob.
 */
const handleAddDatasets = async ({ loadedData }: services.PostMessageDatasetAdd) => {
  const parsedData: Record<string, any> = {};
  const newEntries = Object.entries(loadedData);

  for (const [id, jsonBlob] of newEntries) {
    try {
      const blobContents = await jsonBlob.text();
      const jsonContent = JSON.parse(blobContents);
      parsedData[id] = jsonContent;
    } catch (e) {
      // TODO: send error to main app to show toast
      console.error('Failed to parse dataset contents', e);
    }
  }

  rendererState.loadedData = { ...rendererState.loadedData, ...parsedData };
  rendererState.refreshDataBindings();
  updateAllOutlets();
};

const handleRemoveDatasets = ({ datasetIds }: services.PostMessageDatasetRemove) => {
  const loadedData = { ...rendererState.loadedData };

  for (const id of datasetIds) {
    delete loadedData[id];
  }

  rendererState.loadedData = loadedData;
  rendererState.refreshDataBindings();
  updateAllOutlets();
};

const handleBoardDidAppearAfterReset = () => {
  if (!rendererState.previewMode) return;
  const outlet = [...outletManagers.values()][0];
  outlet?.checkForBoardAppearance();
};

const handleHotspots = ({ disable }: services.PostMessageToggleHotspots) => {
  rendererState.showHotspots = !disable;
};

const messageReducer: cd.IStringMap<Function> = {
  [services.MESSAGE_APPLY_ELEMENT_CHANGES]: handleApplyElementChanges,
  [services.MESSAGE_PROPERTIES_ADD]: handleAddProperties,
  [services.MESSAGE_TOGGLE_HOTSPOTS]: handleHotspots,
  [services.MESSAGE_BOARD_DID_APPEAR_AFTER_RESET]: handleBoardDidAppearAfterReset,
  [services.MESSAGE_PROPERTIES_UPDATE]: handleUpdateProperties,
  [services.MESSAGE_PROPERTIES_REPLACE]: handleReplaceProperties,
  [services.MESSAGE_PROPERTIES_UPDATE_PARTIAL]: handleUpdatePropsPartial,
  [services.MESSAGE_PROPERTIES_DELETE]: handleDeleteProperties,
  [services.MESSAGE_PROPERTIES_LOADED]: handlePropertiesLoaded,
  [services.MESSAGE_DESIGN_SYSTEM_SET]: handleSetDesignSystem,
  [services.MESSAGE_DESIGN_SYSTEM_UPDATE]: handleUpdateDesignSystem,
  [services.MESSAGE_PROJECT_ASSET_UPDATE]: handleUpdateProjectAsset,
  [services.MESSAGE_PROJECT_ASSET_DELETE]: handleDeleteProjectAsset,
  [services.MESSAGE_PREVIEW_SHOW]: handleShowPreview,
  [services.MESSAGE_PREVIEW_CLEAR]: handleClearPreview,
  [services.MESSAGE_RESET]: handleReset,
  [services.MESSAGE_SET_APP_THEME]: handleSetApplicationTheme,
  [services.MESSAGE_REFRESH_RENDER_RECTS]: handleRefreshRects,
  [services.MESSAGE_SET_PREVIEW_MODE]: handleSetPreviewMode,
  [services.MESSAGE_SET_A11Y_MODE]: handleSetA11yMode,
  [services.MESSAGE_RETARGET_OUTLET]: handleRetargetOutlet,
  [services.MESSAGE_LOAD_EXPORTED_PROJECT]: handleLoadExportedProject,
  [services.MESSAGE_LOAD_EXPORTED_PROJECT_DATA]: handleLoadExportedProjectData,
  [services.MESSAGE_ADD_DATASETS]: handleAddDatasets,
  [services.MESSAGE_REMOVE_DATASETS]: handleRemoveDatasets,
  [services.MESSAGE_ADD_BUILT_IN_DATASETS]: handleAddBuiltInDatasets,
  [services.MESSAGE_RECOMPILE]: handleRecompile,
  [services.MESSAGE_CODE_COMPONENT_ADD]: codeCmpHandler.handleAddCodeComponents,
  [services.MESSAGE_CODE_COMPONENT_UPDATE]: codeCmpHandler.handleUpdateCodeComponent,
  [services.MESSAGE_CODE_COMPONENT_UPDATE_PREVIEW]: codeCmpHandler.handleUpdateCodeComponentPreview,
  [services.MESSAGE_CODE_COMPONENT_DELETE]: codeCmpHandler.handleDeleteCodeComponents,
};
