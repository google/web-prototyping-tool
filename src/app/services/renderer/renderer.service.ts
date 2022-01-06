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

import { Injectable, OnDestroy } from '@angular/core';
import { Subscription, BehaviorSubject, Subject } from 'rxjs';
import { DebugService } from '../debug/debug.service';
import { ErrorType } from 'src/app/routes/project/interfaces/error.interface';
import { ErrorService } from '../error/error.service';
import { getGlassColorFromCSSVars } from './renderer.utils';
// import { convertElementChangePayloadToUpdates } from 'cd-common/utils';
import { DEFAULT_DATASETS } from 'cd-common/datasets';
import { DataPickerService } from 'cd-common';
import { ToastsService } from '../toasts/toasts.service';
import { ProjectContentService } from 'src/app/database/changes/project-content.service';
import * as services from 'cd-common/services';
import * as utils from 'cd-common/utils';
import type * as cd from 'cd-interfaces';

type GreenLineResults = cd.IStringMap<cd.IGreenlineRenderResults>;
type FocusedResults = cd.IGreenlineRenderResult | null;

@Injectable({ providedIn: 'root' })
export class RendererService implements OnDestroy {
  private _iframe?: HTMLIFrameElement;
  private _subscriptions: Subscription = Subscription.EMPTY;
  // Messages may arrive before iframe has been set
  // queue these messages until we have iframe and then drain message queue
  private _messageQueue: services.CdPostMessage[] = [];
  private _renderResultsByBoard: cd.IStringMap<cd.RenderResults> = {};
  public previewRenderResultsByBoard$ = new BehaviorSubject<cd.IStringMap<cd.RenderResults>>({});
  public renderResultsByBoard$ = new BehaviorSubject<cd.IStringMap<cd.RenderResults>>({});
  public rendererGreenlineResultsByBoard$ = new BehaviorSubject<GreenLineResults>({});
  public rendererFocusedElementByBoard$ = new BehaviorSubject<FocusedResults>(null);
  public navigationEvent$ = new Subject<string>();
  public rendererInitialized$ = new BehaviorSubject<boolean>(false);
  public activatedEditorRects$ = new BehaviorSubject<boolean>(false);
  public reloadRenderOutlets$ = new Subject<void>();

  constructor(
    private _debugService: DebugService,
    private _toast: ToastsService,
    private _messagingService: services.CdMessagingService,
    private _errorService: ErrorService,
    private _dataPickerService: DataPickerService,
    private _projectContentService: ProjectContentService
  ) {
    this._subscriptions = this._messagingService.messages$.subscribe(this._handleMessage);
  }

  ngOnDestroy() {
    this._subscriptions.unsubscribe();
  }

  setRendererFrame(iframe?: HTMLIFrameElement) {
    this._iframe = iframe;
  }

  reloadAllRenderOutlets() {
    this.reloadRenderOutlets$.next();
  }

  addElementProperties(propertyModels: cd.PropertyModel[]) {
    this._sendMessage(new services.PostMessagePropertiesAdd(propertyModels));
  }

  applyElementChanges(
    createdElements: cd.PropertyModel[] = [],
    updatedElements: cd.PropertyModel[] = [],
    deletedElementIds: string[] = []
  ) {
    this._sendMessage(
      new services.PostMessageApplyElementChanges(
        createdElements,
        updatedElements,
        deletedElementIds
      )
    );
  }

  resetState = () => {
    // Send element properties
    const props = this._projectContentService.elementProperties;
    this._sendMessage(new services.PostMessagePropertiesUpdate(props, true));

    // Send dataset data
    const loadedData = this._dataPickerService.getLoadedDataBlobs();
    this.addDatasetData(loadedData);
    this._sendMessage(new services.PostMessageBoardDidAppearAfterReset());
  };

  updateElementProperties(updates: cd.ElementPropertiesMap, recompile = false) {
    const msg = new services.PostMessagePropertiesUpdate(updates, recompile);
    this._sendMessage(msg);
  }

  updateElementPropertiesPartial(updates: cd.IPropertiesUpdatePayload[]) {
    const msg = new services.PostMessagePropertiesUpdatePartial(updates);
    this._sendMessage(msg);
  }

  // Fixes Memory leak where renderResults by board where not getting removed
  removeRenderResultsWhoseBoardIdsMatchesId(ids: string[]) {
    const { _renderResultsByBoard } = this;
    for (const id of ids) {
      if (_renderResultsByBoard[id]) {
        delete _renderResultsByBoard[id];
      }
    }

    this.renderResultsByBoard$.next(this._renderResultsByBoard);
  }

  deleteElementProperties(ids: string[]) {
    this._sendMessage(new services.PostMessagePropertiesDelete(ids));
    this.removeRenderResultsWhoseBoardIdsMatchesId(ids);
  }

  setPropertiesLoaded(loaded: boolean) {
    this._sendMessage(new services.PostMessagePropertiesLoaded(loaded));
  }

  setDesignSystem(designSystem: cd.IDesignSystemDocument) {
    this._sendMessage(new services.PostMessageDesignSystemSet(designSystem));
  }

  updateDesignSystem(update: Partial<cd.IDesignSystem>) {
    this._sendMessage(new services.PostMessageDesignSystemUpdate(update));
  }

  showPreview(preview: cd.IElementChangePayload[]) {
    this._sendMessage(new services.PostMessagePreviewShow(preview));
  }

  clearPreview() {
    this._sendMessage(new services.PostMessagePreviewClear());
  }

  recompile() {
    this._sendMessage(new services.PostMessageRecompile());
  }

  requestRenderRects() {
    this._sendMessage(new services.PostMessageRefreshRenderRects());
  }

  async updateProjectAsset(asset: cd.IProjectAsset) {
    const msg = new services.PostMessageProjectAssetUpdate(asset);
    await msg.generateBlobsForBlobUrls();
    this._sendMessage(msg);
  }

  deleteProjectAsset(ids: string[]) {
    this._sendMessage(new services.PostMessageProjectAssetDelete(ids));
  }

  addBuiltInDatasets(datasets: cd.IBuiltInDataset[]) {
    this._sendMessage(new services.PostMessageAddBuiltInDatasets(datasets));
  }

  addDatasetData(loadedData: Record<string, Blob>) {
    this._sendMessage(new services.PostMessageDatasetAdd(loadedData));
  }

  removeDatasets(datasetIds: string[]) {
    this._sendMessage(new services.PostMessageDatasetRemove(datasetIds));
  }

  set activatedEditorRects(value: boolean) {
    if (this.activatedEditorRects === value) return;
    this.activatedEditorRects$.next(value);
  }

  get activatedEditorRects() {
    return this.activatedEditorRects$.getValue();
  }

  private _resetRectsPerBoard() {
    this._renderResultsByBoard = {};
    this.renderResultsByBoard$.next({});
  }

  reset() {
    const msg = new services.PostMessageReset();
    this._sendMessage(msg);
    this.activatedEditorRects = false;
    this._resetRectsPerBoard();
  }

  updateApplicationTheme() {
    const previewColors = getGlassColorFromCSSVars();
    this._sendMessage(new services.PostMessageSetApplicationTheme(previewColors));
  }

  setPreviewMode(previewMode: boolean) {
    const msg = new services.PostMessageSetPreviewMode(previewMode);
    this._sendMessage(msg);
    if (previewMode === false) this.previewRenderResultsByBoard$.next({});
  }

  setA11yMode(mode: cd.IA11yModeState) {
    this._sendMessage(new services.PostMessageSetA11yMode(mode));
    if (mode.panel === false) {
      this.clearAllA11yRects();
    }
  }

  toggleHotspots(disable?: boolean) {
    const disabled = Boolean(disable) === true;
    this._sendMessage(new services.PostMessageToggleHotspots(disabled));
  }

  clearAllA11yRects() {
    this.rendererGreenlineResultsByBoard$.next({});
    this.rendererFocusedElementByBoard$.next(null);
  }

  addCodeComponents(
    codeComponents: cd.ICodeComponentDocument[],
    jsBundleBlobs: Record<string, Blob>
  ) {
    this._sendMessage(new services.PostMessageCodeComponentAdd(codeComponents, jsBundleBlobs));
  }

  updateCodeComponent(update: cd.ICodeComponentDocument, updatedJSBlob?: Blob | undefined) {
    this._sendMessage(new services.PostMessageCodeComponentUpdate(update, updatedJSBlob));
  }

  updateCodeComponentPreview(id: string, preview?: cd.ICodeComponentInstance, tagName?: string) {
    this._sendMessage(new services.PostMessageCodeComponentUpdatePreview(id, preview, tagName));
  }

  deleteCodeComponents(codeComponentIds: string[]) {
    this._sendMessage(new services.PostMessageCodeComponentDelete(codeComponentIds));
    this.reloadAllRenderOutlets();
  }

  retargetOutlet(currentId: string, newId: string) {
    this._sendMessage(new services.PostMessageRetargetOutlet(currentId, newId));
  }

  ////////////////////////////////////////////////////////////
  // POST MESSAGE HANDLERS
  private _handleSandboxInit = () => {
    this.rendererInitialized$.next(true);
    this._drainMessageQueue();
    // Send message to add all default datasets
    this.addBuiltInDatasets(DEFAULT_DATASETS);
  };

  private _handlePreviewRenderResults = (message: services.PostMessagePreviewRenderResults) => {
    const { rootId, renderResults } = message;
    const results = this.previewRenderResultsByBoard$.getValue();
    results[rootId] = renderResults;
    this.previewRenderResultsByBoard$.next(results);
  };

  /**
   * Ignore properties that don't exist coming from the renderer
   *  This can occur when switching between projects while still loading
   */
  hasRootId(rootId: string): boolean {
    return rootId in this._projectContentService.elementProperties;
  }

  private _handleRenderResults = (msg: services.PostMessageRenderResults) => {
    const { rootId, renderResults } = msg;
    if (!this.hasRootId(rootId)) return;
    this._renderResultsByBoard[rootId] = renderResults;
    this.renderResultsByBoard$.next(this._renderResultsByBoard);
    if (renderResults) this.activatedEditorRects = true;
  };

  private _handleRendererGreenlineResults = (msg: services.PostMessageGreenlineRenderResults) => {
    const { rootId, greenlines } = msg;
    if (!this.hasRootId(rootId)) return;
    const results = this.rendererGreenlineResultsByBoard$.getValue();
    results[rootId] = greenlines;
    this.rendererGreenlineResultsByBoard$.next(results);
  };

  private _handleRendererFocusedElement = ({
    focusElement,
  }: services.PostMessageFocusedElementRenderResult) => {
    this.rendererFocusedElementByBoard$.next(focusElement);
  };

  private _handleRenderRootNavigation = ({ rootId }: services.PostMessageRootNavigation) => {
    this.navigationEvent$.next(rootId);
  };

  private _handleCompileError = (errorMessage: services.PostMessageCompileError) => {
    const { rootId: id, err: message } = errorMessage;
    this._errorService.addRendererError({ id, type: ErrorType.CompileBoard, message });
  };

  private _handleCompileLibraryError = (errorMessage: services.PostMessageCompileLibraryError) => {
    const { err: message } = errorMessage;
    this._errorService.addRendererError({ type: ErrorType.CompileLibrary, message });
  };

  // TODO: Should we log the stack?
  private _handleGeneralError = (errorMessage: services.PostMessageGeneralError) => {
    const { err: message } = errorMessage;
    this._errorService.addRendererError({ type: ErrorType.GeneralError, message });
  };

  private _handleCodeComponentError = (errorMessage: services.PostMessageCodeComponentError) => {
    const { codeComponentName, err } = errorMessage;
    const errString = err.message ? err.message : err.toString();
    const message = `${codeComponentName} - "${errString}"`;
    this._errorService.addCodeComponentError({ type: ErrorType.GeneralError, message });
  };

  private _handleToastMessage = ({ toast }: services.PostMessageToast) => {
    this._toast.addToast(toast);
  };

  private _handleMessage = (message: services.CdPostMessage) => {
    const messageMap: cd.IStringMap<Function> = {
      [services.MESSAGE_EXTERNAL_POST_ACTION]: this._dispatchExternalPostAction,
      [services.MESSAGE_SANDBOX_CODE_COMPONENT_ERROR]: this._handleCodeComponentError,
      [services.MESSAGE_SANDBOX_COMPILE_ERROR]: this._handleCompileError,
      [services.MESSAGE_SANDBOX_COMPILE_LIBRARY_ERROR]: this._handleCompileLibraryError,
      [services.MESSAGE_SANDBOX_FOCUSED_ELEMENT_RENDER_RESULT]: this._handleRendererFocusedElement,
      [services.MESSAGE_SANDBOX_GENERAL_ERROR]: this._handleGeneralError,
      [services.MESSAGE_SANDBOX_GREENLINE_RENDER_RESULTS]: this._handleRendererGreenlineResults,
      [services.MESSAGE_SANDBOX_INIT]: this._handleSandboxInit,
      [services.MESSAGE_SANDBOX_NAVIGATE_TO_ROOT]: this._handleRenderRootNavigation,
      [services.MESSAGE_SANDBOX_NAVIGATE_TO_URL]: utils.handleURLNavigationMessage,
      [services.MESSAGE_SANDBOX_PREVIEW_RENDER_RESULTS]: this._handlePreviewRenderResults,
      [services.MESSAGE_SANDBOX_RENDER_RESULTS]: this._handleRenderResults,
      [services.MESSAGE_SANDBOX_RESET_ELEMENT_STATE]: this._handleResetElementState,
      [services.MESSAGE_SANDBOX_RESET_STATE]: this.resetState,
      [services.MESSAGE_SANDBOX_SHOW_TOAST]: this._handleToastMessage,
    };
    const handler = messageMap[message.name];
    if (handler) handler(message);
    this._debugService.sendOutboundMessage(message);
  };

  // END POST MESSAGE HANDLERS
  ////////////////////////////////////////////////////////////

  get rendererInitialized() {
    return this.rendererInitialized$.getValue();
  }

  private _sendMessage(message: services.CdPostMessage) {
    const { _iframe, rendererInitialized } = this;
    if (_iframe && rendererInitialized) {
      this._drainMessageQueue();
      this._messagingService.postMessageToSandbox(_iframe, message);
      this._debugService.sendInboundMessage(message);
    } else {
      this._messageQueue.push(message);
    }
  }

  private _drainMessageQueue() {
    const { _iframe } = this;
    if (!_iframe) return;
    while (this._messageQueue.length > 0) {
      const msg = this._messageQueue.shift() as services.CdPostMessage;
      this._messagingService.postMessageToSandbox(_iframe, msg);
      this._debugService.sendInboundMessage(msg);
    }
  }

  /**
   * Forwards messages from the renderer to the parent
   * This is used when a project is embeded in another site.
   */
  private _dispatchExternalPostAction(message: services.PostMessageExternalPostAction) {
    window.parent.postMessage(message.text, '*');
  }

  private _handleResetElementState = ({
    elementId,
    children,
  }: services.PostMessageResetElementState) => {
    const { elementProperties } = this._projectContentService;
    const payload = children
      ? utils.getElementAndChildrenUpdatePayloadForId(elementId, elementProperties)
      : utils.getElementUpdatePayloadForId(elementId, elementProperties);

    if (!payload.length) return;
    const msg = new services.PostMessagePropertiesReplace(payload);
    this._sendMessage(msg);
  };
}
