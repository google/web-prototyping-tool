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
// prettier-ignore
import { createDocumentCopies, createSymbolCopies, detectSVGinTextAndReturnFile, generateImportMessage, getAssetsInClipboardModels, getCodeComponentsInClipboardModels, getDatasetsInClipboardModels, isContentFromAnotherProject, removePortalReferences, updateContentWithMappedIds } from './clipboard.utils';
import { getSelectedIds, getPanelsState } from '../../store/selectors';
import { getContainedSymbolIdsRecursive } from '../../utils/symbol.utils';
import { SelectionToggleElements } from '../../store/actions/selection.action';
import { ToastsService } from 'src/app/services/toasts/toasts.service';
import { PropertiesService } from '../properties/properties.service';
import { IPanelsState } from '../../interfaces/panel.interface';
import { PanelConfig } from '../../configs/project.config';
import { readFromClipboard, copyToClipboard } from 'cd-utils/clipboard';
import { AssetsUploadService } from '../assets/assets-upload.service';
import { getInvalidSymbolIds } from '../../utils/dependency.utils';
import { filterSymbols } from '../../utils/import.utils';
import { Injectable, OnDestroy } from '@angular/core';
import { IProjectState } from '../../store/reducers';
import { IImageFileMetadata } from 'cd-utils/files';
import { incrementedName } from 'cd-utils/string';
import { Subscription, fromEvent } from 'rxjs';
import { Store, select } from '@ngrx/store';
import { deepCopy } from 'cd-utils/object';
import * as actions from '../../store/actions';
import * as mUtils from 'cd-common/models';
import * as cd from 'cd-interfaces';
import { AssetsService } from '../assets/assets.service';
import { DatasetService } from '../dataset/dataset.service';
import { combineMaps } from 'cd-utils/map';
import { createId } from 'cd-utils/guid';
import { ProjectContentService } from 'src/app/database/changes/project-content.service';
import { buildInsertLocation, mergeChangeIntoProperties } from 'cd-common/utils';

// prettier-ignore
const CIRCULAR_PASTE_ERROR = 'Cannot paste content - a circular reference would be created';
const CLIPBOARD_CHANNEL = 'clipboard';
const CLIPBOARD_SYNC = 'clipboard-sync';

@Injectable({
  providedIn: 'root',
})
export class ClipboardService implements OnDestroy {
  private _subscriptions = new Subscription();
  private _selectedIds = new Set<string>();
  private _projectId?: string;
  private _symbolMode = false;
  private _isolateSymbolId?: string;
  private _clipboardChannel = new BroadcastChannel(CLIPBOARD_CHANNEL);
  private _clipboardText = '';
  private _pasteInProgress = false;

  /**
   * Ids of resources copy/pasted from other project (symbols, code components, assets, datasets).
   * This is used to ensure that we don't import a resource from another project more than once.
   * */
  private _importedResourceIdMap = new Map<string, string>();

  constructor(
    private readonly _projectStore: Store<IProjectState>,
    private _propsService: PropertiesService,
    private _toastService: ToastsService,
    private _assetUploadService: AssetsUploadService,
    private _assetsService: AssetsService,
    private _datasetsService: DatasetService,
    private _projectContentService: ProjectContentService
  ) {
    const selectedIds$ = this._projectStore.pipe(select(getSelectedIds));
    const project$ = this._projectContentService.project$;
    const panelsState$ = this._projectStore.pipe(select(getPanelsState));
    const clipboardEvent$ = fromEvent<MessageEvent>(this._clipboardChannel, 'message');

    this._subscriptions.add(selectedIds$.subscribe(this.onSelectedIds));
    this._subscriptions.add(project$.subscribe(this.onProject));
    this._subscriptions.add(panelsState$.subscribe(this.onPanelsState));
    this._subscriptions.add(clipboardEvent$.subscribe(this.onClipboardChannelEvent));
    this._clipboardChannel.postMessage(CLIPBOARD_SYNC);
  }

  clearNativeClipboard = async () => {
    try {
      await copyToClipboard('');
    } catch (e) {}
  };

  disconnectProject = () => {
    this._importedResourceIdMap = new Map();
  };

  clearClipboard() {
    this._clipboardText = '';
  }

  sendClipboardData(serializedContent: string) {
    this._clipboardChannel.postMessage(serializedContent);
  }

  sendClipboardSyncEvent() {
    if (this._clipboardText) this.sendClipboardData(this._clipboardText);
  }

  onClipboardChannelEvent = ({ data }: MessageEvent) => {
    if (data === CLIPBOARD_SYNC) return this.sendClipboardSyncEvent();
    if (this._clipboardText === data) return;
    this._clipboardText = data;
    this.clearNativeClipboard();
  };

  ngOnDestroy() {
    this._subscriptions.unsubscribe();
  }

  onSelectedIds = (ids: Set<string>) => (this._selectedIds = ids);
  onProject = (project?: cd.IProject) => (this._projectId = project && project.id);

  onPanelsState = (panelsState: IPanelsState) => {
    this._symbolMode = panelsState.symbolMode;
    this._isolateSymbolId = panelsState.isolatedSymbolId;
  };

  copyModelsToClipboard(propertyModels: cd.PropertyModel[]) {
    const clipboardContent = this._createClipboardContent(propertyModels);
    this.setClipboardContent(clipboardContent);
  }

  setClipboardContent(content: cd.IClipboardContent) {
    const serializedContent = JSON.stringify(content);
    this.sendClipboardData(serializedContent);
    this._clipboardText = serializedContent;
    this.clearNativeClipboard();
  }

  /** Ensures unique names when duplicating entities */
  incrementNameForModels(elements: cd.PropertyModel[], props: cd.ElementPropertiesMap) {
    const models = mUtils.getModels(props);
    const entityCount = new Map<string, number>();

    for (const element of elements) {
      const elementEntity = element.elementType;
      const names = models
        .filter((item) => item.elementType === elementEntity)
        .map((item) => item.name);
      const count = entityCount.get(elementEntity) ?? 0;
      element.name = incrementedName(element.name, names, count);
      entityCount.set(element.elementType, count + 1);
    }
  }

  private _duplicateModel(
    model: cd.PropertyModel,
    props: cd.ElementPropertiesMap
  ): cd.IComponentInstanceGroup {
    return mUtils.duplicateModelsAndChildren([model], props);
  }

  duplicateModels(propertyModels: cd.PropertyModel[]) {
    let _elementProperties = deepCopy(this._propsService.getElementProperties());

    const duplicateBoards = mUtils.hasBoards(propertyModels);

    if (duplicateBoards) {
      this._pasteBoards(this._createClipboardContent(propertyModels));
    } else {
      // Duplicate element behavior is differnt than copy/paste behavior
      // we don't place all of copied content at each selected id.
      // Rather we insert a duplicate of each item next to itself
      const allUpdates: cd.IElementChangePayload[] = [];
      const allRootIds: string[] = [];
      const filteredModels = mUtils.sortAndFilterElements(propertyModels, _elementProperties);

      for (const model of filteredModels) {
        const { id: elementId } = model;
        const { rootIds, models } = this._duplicateModel(model, _elementProperties);

        this.incrementNameForModels(models, _elementProperties);

        const insertLocation = buildInsertLocation(elementId, cd.InsertRelation.After);
        const change = mUtils.insertElements(rootIds, insertLocation, _elementProperties, models);
        allUpdates.push(change);
        allRootIds.push(...rootIds);

        // In case, a single parent is getting multiple elements duplicated into it, (e.g. a board)
        // we need to merge the childId updates from each loop back into _elementProperties
        // so that the next insertElements calculation includes previous inserts
        _elementProperties = mergeChangeIntoProperties(_elementProperties, change);
      }

      this._projectStore.dispatch(new actions.ElementPropertiesChangeRequest(allUpdates));
      this._projectStore.dispatch(new SelectionToggleElements(allRootIds, false, false));
    }
  }

  async uploadSVGImage(img: File) {
    const upload = await this._assetUploadService.uploadImageFile(img);
    if (!upload) return;
    this.pasteImage(upload.assetId, upload.metadata);
  }

  async paste() {
    if (this._pasteInProgress) return;

    this._pasteInProgress = true;

    // try/catch occurs inside of _performPaste so _pasteInProgress
    // will always get set back to false when complete
    await this._performPaste();

    this._pasteInProgress = false;
  }

  private _performPaste = async () => {
    try {
      const clipboardText = await readFromClipboard();
      if (!clipboardText && !this._clipboardText) return;

      const svgElement = detectSVGinTextAndReturnFile(clipboardText);
      if (svgElement) return this.uploadSVGImage(svgElement);

      // Attempt to get json from clipboard
      const clipboardJson = this.getClipboardJson(this._clipboardText);
      if (!clipboardJson) return;

      // Import any resources contained in the clipboard (symbols, code components, image assets)
      const updatedClipboardContent = this._importClipboardResourcesAndUpdateContent(clipboardJson);

      // If clipboard contains boards, paste new boards
      if (updatedClipboardContent.isBoards) return this._pasteBoards(updatedClipboardContent);

      // if not pasting at the board level and content is
      // from another project remove portal references
      const updatedPortalContent = removePortalReferences(updatedClipboardContent, this._projectId);
      return this.pasteElements(updatedPortalContent);
    } catch (e) {
      return this._showError('Failed to paste content: Check Permissions');
    }
  };

  private _showError = (message: string) => {
    this._toastService.addToast({ message, iconName: 'error' });
  };

  /**
   * Import any symbol, code components, image assets, or datasets that are included in the
   * clipboard content if they are from another project.
   *
   * Also update any symbol instances, code component instances, or image elements in the clipboard
   * to utilize the new ids of the various imported resources
   */
  private _importClipboardResourcesAndUpdateContent(
    content: cd.IClipboardContent
  ): cd.IClipboardContent {
    const { _projectId } = this;
    let { _importedResourceIdMap } = this;
    const { symbols, codeComponents, assets, datasets } = content;

    // If clipboard content is from this project, no importing is necessary
    if (!_projectId || !isContentFromAnotherProject(content, _projectId)) return content;

    // Import any copied code components
    const copy = createDocumentCopies(codeComponents, _projectId, _importedResourceIdMap);
    const [newCodeCmps, codeCmpIdMap] = copy;
    if (newCodeCmps.length) {
      _importedResourceIdMap = combineMaps(_importedResourceIdMap, codeCmpIdMap);
      this._projectStore.dispatch(new actions.CodeComponentCreate(newCodeCmps));
    }

    // Import any copied assets
    const assetsCopy = createDocumentCopies(assets, _projectId, _importedResourceIdMap);
    const [newAssets, assetIdMap] = assetsCopy;
    if (newAssets.length) {
      _importedResourceIdMap = combineMaps(_importedResourceIdMap, assetIdMap);
      this._projectStore.dispatch(new actions.AssetsCreateDocuments(newAssets));
      this._assetsService.addMultipleUploadingAssets(newAssets);
    }

    // Datasets - import any copied datasets
    const dataCopy = createDocumentCopies(datasets, _projectId, _importedResourceIdMap);
    const [newDatasets, datasetIdMap] = dataCopy;
    if (newDatasets.length) {
      _importedResourceIdMap = combineMaps(_importedResourceIdMap, datasetIdMap);
      this._projectStore.dispatch(new actions.DatasetCreate(newDatasets));
    }

    // Import any symbols (and their child elements)
    const symbolsCopy = createSymbolCopies(_projectId, _importedResourceIdMap, symbols);
    const [newElements, symbolElementsIdMap] = symbolsCopy;
    const newSymbols = filterSymbols(newElements);
    if (newSymbols.length) {
      _importedResourceIdMap = combineMaps(_importedResourceIdMap, symbolElementsIdMap);
      this._projectStore.dispatch(new actions.ElementPropertiesCreate(newElements, false));
    }

    const message = generateImportMessage(newAssets, newSymbols, newCodeCmps, newDatasets);
    if (message) this._toastService.addToast({ message });

    // Update map to include ID mappings for the newly imported resources
    this._importedResourceIdMap = _importedResourceIdMap;

    // Update clipboard models to use the new IDs of imported resources
    return updateContentWithMappedIds(content, _importedResourceIdMap);
  }

  private _createClipboardContent(propertyModels: cd.PropertyModel[]): cd.IClipboardContent {
    const _elementProperties = this._propsService.getElementProperties();
    // Filter out any decendants
    const filteredModels = mUtils.sortAndFilterElements(propertyModels, _elementProperties);
    // This assumes that if there are any boards in list, then all are boards
    // since we don't allow selecting boards and elements at the same time
    const isBoards = mUtils.hasBoards(filteredModels);
    const ids = filteredModels.map((model) => model.id);
    const modelsWithChildren = mUtils.getModelsAndChildren(ids, _elementProperties);
    const srcProjectId = this._projectId || '';
    const clipboardContent: cd.IClipboardContent = {
      cdContent: true,
      rootIds: ids,
      isBoards,
      srcProjectId,
      models: modelsWithChildren,
    };

    // If there are any symbols references contained in the clipboard content
    // add the symbol defintion models to the clipboard content
    const symbolIds = getContainedSymbolIdsRecursive(propertyModels, _elementProperties);
    if (symbolIds.length > 0) {
      const models = mUtils.getModelsAndChildren(symbolIds, _elementProperties);
      clipboardContent.symbols = { rootIds: symbolIds, models };
    }

    /** Create array of models contained in clipboard including inside copied symbols */
    const allClipboardModels = clipboardContent.symbols
      ? [...modelsWithChildren, ...clipboardContent.symbols.models]
      : modelsWithChildren;

    // Lookup any referenced code components and add them to clipboard
    const allCodeCmps = this._propsService.getCodeComponents();
    const codeComponents = getCodeComponentsInClipboardModels(allClipboardModels, allCodeCmps);
    if (codeComponents.length) clipboardContent.codeComponents = codeComponents;

    // Lookup any referenced Assets and add them to clipboard
    const allProjectAssets = Object.values(this._assetsService.assetsStream$.value);
    const assets = getAssetsInClipboardModels(allClipboardModels, allProjectAssets);
    if (assets.length) clipboardContent.assets = assets;

    // Lookup any referenced datasets and add them to clipboard
    const projectDatasets = this._datasetsService.getDatasets();
    const datasets = getDatasetsInClipboardModels(allClipboardModels, projectDatasets);
    if (datasets.length) clipboardContent.datasets = datasets;

    return clipboardContent;
  }

  private getClipboardJson = (clipboardText: string): cd.IClipboardContent | undefined => {
    try {
      const clipboardJson = JSON.parse(clipboardText) as cd.IClipboardContent;
      if (clipboardJson.cdContent) return clipboardJson;
    } catch (e) {}
    return undefined;
  };

  // b/130188817 -- Only one paste location per board (= last selected item in that board)
  private filterSinglePasteTargetPerBoard = (targets: cd.PropertyModel[]): cd.PropertyModel[] => {
    const perBoardTargets = mUtils.categorizeElementsByBoard(targets).values();
    const propertiesMap = this._propsService.getElementProperties();
    const lastTargetOfBoard = Array.from(perBoardTargets)
      .map((elements) => {
        const positionMap = mUtils.buildPositionMapForElements(elements, propertiesMap);
        const sorted = mUtils.sortElementsByPosition(elements, positionMap);
        return sorted;
      })
      .map((elements) => elements[elements.length - 1]);

    return lastTargetOfBoard;
  };

  private _pasteBoards(boardGroup: cd.IClipboardContent) {
    const removePortalRefsNotInGroup = isContentFromAnotherProject(boardGroup, this._projectId);
    const duplicate = mUtils.duplicateBoardGroup(boardGroup, removePortalRefsNotInGroup);
    const { boards, boardContents } = duplicate;
    // set keepOriginalId on BoardCreate action to true since
    // we've already generated new ids in duplicateBoardGroup
    const addBoards = new actions.BoardCreate(boards, boardContents, true, undefined, true, true);
    this._projectStore.dispatch(addBoards);
  }

  private assignModelProjectId(
    elementGroup: cd.IComponentInstanceGroup,
    projectId: string
  ): cd.IComponentInstanceGroup {
    for (const model of elementGroup.models) {
      if (model.projectId === projectId) continue;
      model.projectId = projectId;
    }
    return elementGroup;
  }

  private generateElementContent(group: cd.IComponentInstanceGroup, duplicate: boolean) {
    if (!duplicate) return group;
    return mUtils.duplicateComponentInstanceGroup(group);
  }

  pasteContentOnNewBoard(assignedElementGroup: cd.IComponentInstanceGroup, duplicate = true) {
    const { _isolateSymbolId, _symbolMode } = this;
    const elementProperties = this._propsService.getElementProperties();
    // const invalidSymbolIds = getInvalidSymbolIds(elementProperties, _isolateSymbolId);

    // if not in symbolMode, create board and add content to it
    if (!_symbolMode) {
      const content = this.generateElementContent(assignedElementGroup, duplicate);
      const addBoard = new actions.BoardCreate([{}], [content], true, undefined, false);
      const { _projectStore } = this;
      _projectStore.dispatch(addBoard);
      _projectStore.dispatch(new SelectionToggleElements(content.rootIds, false, false));
    }
    // if in symbol mode and single symbol is isolated, select it and append content to it
    else if (_isolateSymbolId) {
      // if (invalidSymbolIds.has(_isolateSymbolId)) {
      //   return this._showError(CIRCULAR_PASTE_ERROR);
      // }

      /// HOTFIX /////////////////////////////////////////////////////////////////////////////////
      if (this.hotfixSymbolInstanceCheck(assignedElementGroup, _isolateSymbolId)) {
        return this._showError(CIRCULAR_PASTE_ERROR);
      }
      //// END HOTFIX ///////////////////////////////////////////////////////////////////////////
      const symbolProps = elementProperties[_isolateSymbolId];
      if (!symbolProps) return;
      const { changes, rootIds } = this._addElementsToTargets(
        assignedElementGroup,
        [symbolProps],
        duplicate
      );
      this._updateElementsAndToggleSelection(changes, rootIds);
    }
  }

  /**
   * Are we in symbol isolation mode and are any of the pasted elements symbol instances that point to this
   */
  hotfixSymbolInstanceCheck(elementGroup: cd.IComponentInstanceGroup, isolateSymbolId?: string) {
    for (const model of elementGroup.models) {
      if (mUtils.isSymbolInstance(model)) {
        const refId = (model as cd.ISymbolInstanceProperties).inputs.referenceId;
        if (refId === isolateSymbolId) return true;
      }
    }
    return false;
  }
  /**
   * Paste a duplicate of the element group at each location
   * where each location is an element id
   */
  pasteElements(elementGroup: cd.IComponentInstanceGroup, duplicate = true) {
    const { _projectId, _selectedIds } = this;
    if (!_projectId) return;

    // Make sure pasted content is assigned to this project (in case copying from other project)
    const assignedElementGroup = this.assignModelProjectId(elementGroup, _projectId);

    // if nothing is selected
    if (_selectedIds.size === 0) {
      return this.pasteContentOnNewBoard(assignedElementGroup, duplicate);
    }

    // else paste a copy of content at each selected item
    const { _isolateSymbolId } = this;
    const elementProperties = this._propsService.getElementProperties();
    const invalidSymbolIds = getInvalidSymbolIds(elementProperties);
    const selectedTargets = Array.from(_selectedIds).map((id) => elementProperties[id]);
    const definedTargets = selectedTargets.filter((t) => !!t) as cd.PropertyModel[];
    const targetsCreateError = definedTargets.some((t) => invalidSymbolIds.has(t.rootId));
    /// HOTFIX /////////////////////////////////////////////////////////////////////////////////
    if (this.hotfixSymbolInstanceCheck(elementGroup, _isolateSymbolId)) {
      return this._showError(CIRCULAR_PASTE_ERROR);
    }
    //// END HOTFIX ///////////////////////////////////////////////////////////////////////////
    if (targetsCreateError) return this._showError(CIRCULAR_PASTE_ERROR);
    const filteredTargets = this.filterSinglePasteTargetPerBoard(definedTargets);
    if (filteredTargets.length === 0) return;
    const added = this._addElementsToTargets(assignedElementGroup, filteredTargets, duplicate);
    this._updateElementsAndToggleSelection(added.changes, added.rootIds);
  }

  private _updateElementsAndToggleSelection(
    changes: cd.IElementChangePayload[],
    rootIds: string[]
  ) {
    const { _projectStore } = this;
    _projectStore.dispatch(new actions.ElementPropertiesChangeRequest(changes));
    _projectStore.dispatch(new SelectionToggleElements(rootIds, false, false));
  }

  private _addElementsToTargets = (
    elementGroup: cd.IComponentInstanceGroup,
    targets: cd.PropertyModel[],
    duplicate = true
  ): { changes: cd.IElementChangePayload[]; rootIds: string[] } => {
    let elementProperties = deepCopy(this._propsService.getElementProperties());
    const changes: cd.IElementChangePayload[] = [];
    const allRootIds: string[] = [];

    for (const propModel of targets) {
      const { rootIds, models } = duplicate
        ? mUtils.duplicateComponentInstanceGroup(elementGroup)
        : elementGroup;

      // if board or symbol definition, append content. Else insert after
      const relation = mUtils.isRoot(propModel)
        ? cd.InsertRelation.Append
        : cd.InsertRelation.After;

      const insertLocation = buildInsertLocation(propModel.id, relation);
      const change = mUtils.insertElements(rootIds, insertLocation, elementProperties, models);
      changes.push(change);
      allRootIds.push(...rootIds);

      // In case, a single parent is getting multiple elements pasted into it, (e.g. a board)
      // we need to merge the childId updates from each loop back into _elementProperties
      // so that the next insertElements calculation includes previous inserts
      elementProperties = mergeChangeIntoProperties(elementProperties, change);
    }

    return { rootIds: allRootIds, changes };
  };

  get dimensionOfFirstSelectedProp(): [number, number] {
    const { _selectedIds } = this;
    if (_selectedIds.size !== 0) {
      const [first] = Array.from(_selectedIds);
      const element = this._propsService.getPropertiesForId(first);
      if (element) return [element.frame.width, element.frame.height];
    }
    return [0, 0];
  }

  pasteImage = (assetId: string, metadata: IImageFileMetadata) => {
    const { _selectedIds } = this;
    this._projectStore.dispatch(new actions.PanelSetActivityForced(PanelConfig.Assets, {}));
    if (!this._projectId) return;
    const projectId = this._projectId as string;
    if (_selectedIds.size === 0) return;
    const id = createId();
    const { width, height, name } = metadata;
    const image = mUtils.createAssetInstance(id, projectId, name, assetId, width, height);
    const rootIds = [id];
    const models = [image as cd.IImageProperties];
    const modelGroup: cd.IComponentInstanceGroup = { rootIds, models };
    this.clearNativeClipboard();
    this.pasteElements(modelGroup, true);
  };
}
