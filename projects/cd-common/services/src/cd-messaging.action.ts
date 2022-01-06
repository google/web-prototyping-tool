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

import { isBlobUrl, getBlobFromBlobUrl } from 'cd-utils/files';
import type * as cd from 'cd-interfaces';

export declare interface IPostMessage {
  name: string;
}

// Mark event message with Boolean so that we can't filter out
// post messages from other sources (monaco, webpack dev server)
class BaseMessage {
  readonly appMessage = true;
}

// Messages from App to Sandbox
export const MESSAGE_PROPERTIES_ADD = 'Properties Add';
export const MESSAGE_BOARD_DID_APPEAR_AFTER_RESET = 'Board did appear';
export const MESSAGE_PROPERTIES_UPDATE = 'Properties Update';
export const MESSAGE_PROPERTIES_UPDATE_PARTIAL = 'Properties Update Partial';
export const MESSAGE_PROPERTIES_REPLACE = 'Properties Replace';
export const MESSAGE_PROPERTIES_DELETE = 'Properties Delete';
export const MESSAGE_PROPERTIES_LOADED = 'Properties Loaded';
export const MESSAGE_DESIGN_SYSTEM_SET = 'Design System Set';
export const MESSAGE_DESIGN_SYSTEM_UPDATE = 'Design System Update';
export const MESSAGE_PROJECT_ASSET_UPDATE = 'Project Asset Update';
export const MESSAGE_PROJECT_ASSET_DELETE = 'Project Asset Delete';
export const MESSAGE_PREVIEW_SHOW = 'Preview Show';
export const MESSAGE_PREVIEW_CLEAR = 'Preview Clear';
export const MESSAGE_RESET = 'Reset Renderer';
export const MESSAGE_APPLY_ELEMENT_CHANGES = 'Apply Element Changes';
export const MESSAGE_TOGGLE_HOTSPOTS = 'Hotspots';

export const MESSAGE_SET_APP_THEME = 'Set Application Theme';
export const MESSAGE_RECOMPILE = 'Recompile';
export const MESSAGE_REFRESH_RENDER_RECTS = 'Refresh Rects';
export const MESSAGE_SET_PREVIEW_MODE = 'Set preview mode';
export const MESSAGE_SET_A11Y_MODE = 'Set A11y Mode';
export const MESSAGE_COMPILE_COMPONENT_SET = 'Compile Component Set';
export const MESSAGE_RETARGET_OUTLET = 'Retarget outlet';
export const MESSAGE_EXTERNAL_POST_ACTION = 'External postmessage';
export const MESSAGE_ADD_BUILT_IN_DATASETS = 'Add Built-in Datasets';
export const MESSAGE_ADD_DATASETS = 'Add Project Datasets';
export const MESSAGE_REMOVE_DATASETS = 'Remove Project Datasets';

// Code Component Messages
export const MESSAGE_CODE_COMPONENT_ADD = 'Add Code Component';
export const MESSAGE_CODE_COMPONENT_UPDATE = 'Update Code Component';
export const MESSAGE_CODE_COMPONENT_UPDATE_PREVIEW = 'Update Code Component Preview';
export const MESSAGE_CODE_COMPONENT_DELETE = 'Delete Code Component';

// Messages from Sandbox to App
export const MESSAGE_SANDBOX_INIT = 'Sandbox Init';
export const MESSAGE_SANDBOX_RENDER_RESULTS = 'Render Results';
export const MESSAGE_SANDBOX_PREVIEW_RENDER_RESULTS = 'Preview Render Results';
export const MESSAGE_SANDBOX_GREENLINE_RENDER_RESULTS = 'Greenline Render Results';
export const MESSAGE_SANDBOX_FOCUSED_ELEMENT_RENDER_RESULT = 'Focused Element Render Result';
export const MESSAGE_SANDBOX_NAVIGATE_TO_ROOT = 'Render Navigation to root';
export const MESSAGE_SANDBOX_NAVIGATE_TO_URL = 'Render Navigation to url';
export const MESSAGE_SANDBOX_COMPILE_ERROR = 'Compile Error';
export const MESSAGE_SANDBOX_COMPILE_LIBRARY_ERROR = 'Compile Library Error';
export const MESSAGE_SANDBOX_GENERAL_ERROR = 'General Error';
export const MESSAGE_SANDBOX_CODE_COMPONENT_ERROR = 'Code Component Error';
export const MESSAGE_SANDBOX_CODE_COMPONENTS_LOADED = 'Code components loaded';
export const MESSAGE_SANDBOX_CODE_COMPONENT_PREVIEW_READY = 'Code component preview ready';
export const MESSAGE_SANDBOX_RESET_ELEMENT_STATE = 'Reset Element';
export const MESSAGE_SANDBOX_RESET_STATE = 'Reset All';
export const MESSAGE_SANDBOX_SHOW_TOAST = 'Show toast';
// Message from exported app to renderer
export const MESSAGE_LOAD_EXPORTED_PROJECT = 'Load exported project';
export const MESSAGE_LOAD_EXPORTED_PROJECT_DATA = 'Load exported project data';

export class PostMessageToast extends BaseMessage implements IPostMessage {
  readonly name = MESSAGE_SANDBOX_SHOW_TOAST;
  constructor(public toast: cd.IToast) {
    super();
  }
}

export class PostMessageBoardDidAppearAfterReset extends BaseMessage implements IPostMessage {
  readonly name = MESSAGE_BOARD_DID_APPEAR_AFTER_RESET;
  constructor() {
    super();
  }
}

/** Reset everything via ResetAction (Interaction) */
export class PostMessageResetAll extends BaseMessage implements IPostMessage {
  readonly name = MESSAGE_SANDBOX_RESET_STATE;
  constructor() {
    super();
  }
}

/** Sent from the Renderer when a user emits a ResetAction (Interaction) */
export class PostMessageResetElementState extends BaseMessage implements IPostMessage {
  readonly name = MESSAGE_SANDBOX_RESET_ELEMENT_STATE;
  constructor(public elementId: string, public children?: boolean) {
    super();
  }
}

/**
 * Sent by the app to replace state of specific elements in the Renderer as a response to
 * ResetAction (Interaction)
 */
export class PostMessagePropertiesReplace extends BaseMessage implements IPostMessage {
  readonly name = MESSAGE_PROPERTIES_REPLACE;
  constructor(public updates: cd.IPropertiesUpdatePayload[]) {
    super();
  }
}

export class PostMessageExternalPostAction extends BaseMessage implements IPostMessage {
  readonly name = MESSAGE_EXTERNAL_POST_ACTION;
  constructor(public text: string) {
    super();
  }
}

export class PostMessageSetApplicationTheme extends BaseMessage implements IPostMessage {
  readonly name = MESSAGE_SET_APP_THEME;
  constructor(public updates: cd.IStringMap<string>) {
    super();
  }
}

export class PostMessagePropertiesAdd extends BaseMessage implements IPostMessage {
  readonly name = MESSAGE_PROPERTIES_ADD;
  constructor(public propertyModels: cd.PropertyModel[]) {
    super();
  }
}

export class PostMessagePropertiesUpdate extends BaseMessage implements IPostMessage {
  readonly name = MESSAGE_PROPERTIES_UPDATE;
  constructor(public updates: cd.ElementPropertiesMap, public recompile = false) {
    super();
  }
}

export class PostMessagePropertiesUpdatePartial extends BaseMessage implements IPostMessage {
  readonly name = MESSAGE_PROPERTIES_UPDATE_PARTIAL;
  constructor(public updates: cd.IPropertiesUpdatePayload[]) {
    super();
  }
}

export class PostMessageApplyElementChanges extends BaseMessage implements IPostMessage {
  readonly name = MESSAGE_APPLY_ELEMENT_CHANGES;
  constructor(
    public createdElements: cd.PropertyModel[] = [],
    public updatedElements: cd.PropertyModel[] = [],
    public deletedElementIds: string[] = []
  ) {
    super();
  }
}

export class PostMessagePropertiesDelete extends BaseMessage implements IPostMessage {
  readonly name = MESSAGE_PROPERTIES_DELETE;
  constructor(public ids: string[]) {
    super();
  }
}

export class PostMessagePropertiesLoaded extends BaseMessage implements IPostMessage {
  readonly name = MESSAGE_PROPERTIES_LOADED;
  constructor(public loaded: boolean) {
    super();
  }
}

export class PostMessageDesignSystemSet extends BaseMessage implements IPostMessage {
  readonly name = MESSAGE_DESIGN_SYSTEM_SET;
  constructor(public designSystem: cd.IDesignSystemDocument) {
    super();
  }
}

export class PostMessageDesignSystemUpdate extends BaseMessage implements IPostMessage {
  readonly name = MESSAGE_DESIGN_SYSTEM_UPDATE;
  constructor(public update: Partial<cd.IDesignSystemDocument>) {
    super();
  }
}

// You can't just send blob urls from app to renderer -- it crosses domain.
// So we have to transfer the actual blob.
export class PostMessageProjectAssetUpdate extends BaseMessage implements IPostMessage {
  readonly name = MESSAGE_PROJECT_ASSET_UPDATE;
  blobs: Record<string, Blob> = {};
  asset: cd.IProjectAsset;
  constructor(_asset: cd.IProjectAsset) {
    super();
    this.asset = { ..._asset };
  }
  async generateBlobsForBlobUrls() {
    const { blobs, asset } = this;
    for (const url of Object.values(asset.urls)) {
      if (isBlobUrl(url) && !blobs.hasOwnProperty(url)) {
        blobs[url] = await getBlobFromBlobUrl(url);
      }
    }
  }
}

export class PostMessageProjectAssetDelete extends BaseMessage implements IPostMessage {
  readonly name = MESSAGE_PROJECT_ASSET_DELETE;
  constructor(public ids: string[]) {
    super();
  }
}

export class PostMessagePreviewShow extends BaseMessage implements IPostMessage {
  readonly name = MESSAGE_PREVIEW_SHOW;
  constructor(public preview: cd.IElementChangePayload[]) {
    super();
  }
}

export class PostMessageRefreshRenderRects extends BaseMessage implements IPostMessage {
  readonly name = MESSAGE_REFRESH_RENDER_RECTS;
}

export class PostMessageSetPreviewMode extends BaseMessage implements IPostMessage {
  readonly name = MESSAGE_SET_PREVIEW_MODE;
  constructor(public previewMode: boolean) {
    super();
  }
}

export class PostMessageSetA11yMode extends BaseMessage implements IPostMessage {
  readonly name = MESSAGE_SET_A11Y_MODE;
  constructor(public mode: cd.IA11yModeState) {
    super();
  }
}

export class PostMessageCompileComponentSet extends BaseMessage implements IPostMessage {
  readonly name = MESSAGE_COMPILE_COMPONENT_SET;
  constructor(public components: cd.ICatalogItem[]) {
    super();
  }
}

export class PostMessageRetargetOutlet extends BaseMessage implements IPostMessage {
  readonly name = MESSAGE_RETARGET_OUTLET;
  constructor(public currentId: string, public newId: string) {
    super();
  }
}

export class PostMessagePreviewClear extends BaseMessage implements IPostMessage {
  readonly name = MESSAGE_PREVIEW_CLEAR;
}

export class PostMessageReset extends BaseMessage implements IPostMessage {
  readonly name = MESSAGE_RESET;
}

export class PostMessageToggleHotspots extends BaseMessage implements IPostMessage {
  readonly name = MESSAGE_TOGGLE_HOTSPOTS;
  constructor(public disable: boolean) {
    super();
  }
}

export class PostMessageRecompile extends BaseMessage implements IPostMessage {
  readonly name = MESSAGE_RECOMPILE;
}

export class PostMessageAddBuiltInDatasets extends BaseMessage implements IPostMessage {
  readonly name = MESSAGE_ADD_BUILT_IN_DATASETS;
  constructor(public builtInDatasets: cd.IBuiltInDataset[]) {
    super();
  }
}

export class PostMessageDatasetAdd extends BaseMessage implements IPostMessage {
  readonly name = MESSAGE_ADD_DATASETS;
  constructor(public loadedData: Record<string, Blob>) {
    super();
  }
}

export class PostMessageDatasetRemove extends BaseMessage implements IPostMessage {
  readonly name = MESSAGE_REMOVE_DATASETS;
  constructor(public datasetIds: string[]) {
    super();
  }
}

export class PostMessageCodeComponentAdd extends BaseMessage implements IPostMessage {
  readonly name = MESSAGE_CODE_COMPONENT_ADD;
  constructor(
    public codeComponents: cd.ICodeComponentDocument[],
    public jsBundleBlobs: Record<string, Blob>
  ) {
    super();
  }
}

export class PostMessageCodeComponentUpdate extends BaseMessage implements IPostMessage {
  readonly name = MESSAGE_CODE_COMPONENT_UPDATE;
  constructor(public updatedCodeComponent: cd.ICodeComponentDocument, public updatedJsBlob?: Blob) {
    super();
  }
}

export class PostMessageCodeComponentUpdatePreview extends BaseMessage implements IPostMessage {
  readonly name = MESSAGE_CODE_COMPONENT_UPDATE_PREVIEW;
  constructor(
    public codeComponentId: string,
    public updatedPreview?: cd.ICodeComponentInstance,
    public updatedTagName?: string
  ) {
    super();
  }
}

export class PostMessageCodeComponentDelete extends BaseMessage implements IPostMessage {
  readonly name = MESSAGE_CODE_COMPONENT_DELETE;
  constructor(public codeComponentIds: string[]) {
    super();
  }
}

//#region Messages from Renderer to main app

export declare interface IRendererPostMessage extends IPostMessage {
  rootId?: string;
  renderResults?: cd.RenderResults;
  url?: string;
  err?: any;
  libraryId?: string;
  stack?: any;
}

export class PostMessageSandboxInit extends BaseMessage implements IRendererPostMessage {
  readonly name = MESSAGE_SANDBOX_INIT;
}

export class PostMessageRenderResults extends BaseMessage implements IRendererPostMessage {
  readonly name = MESSAGE_SANDBOX_RENDER_RESULTS;
  constructor(public rootId: string, public renderResults: cd.RenderResults) {
    super();
  }
}
export class PostMessagePreviewRenderResults extends BaseMessage implements IPostMessage {
  readonly name = MESSAGE_SANDBOX_PREVIEW_RENDER_RESULTS;
  constructor(public rootId: string, public renderResults: cd.RenderResults) {
    super();
  }
}

export class PostMessageGreenlineRenderResults extends BaseMessage implements IPostMessage {
  readonly name = MESSAGE_SANDBOX_GREENLINE_RENDER_RESULTS;
  constructor(public rootId: string, public greenlines: cd.IGreenlineRenderResults) {
    super();
  }
}

export class PostMessageFocusedElementRenderResult extends BaseMessage implements IPostMessage {
  readonly name = MESSAGE_SANDBOX_FOCUSED_ELEMENT_RENDER_RESULT;
  constructor(public focusElement: cd.IGreenlineRenderResult | null) {
    super();
  }
}

export class PostMessageRootNavigation extends BaseMessage implements IRendererPostMessage {
  readonly name = MESSAGE_SANDBOX_NAVIGATE_TO_ROOT;
  constructor(public rootId: string) {
    super();
  }
}

export class PostMessageURLNavigation extends BaseMessage implements IRendererPostMessage {
  readonly name = MESSAGE_SANDBOX_NAVIGATE_TO_URL;
  constructor(public url: string, public openInTab?: boolean) {
    super();
  }
}

export class PostMessageCompileError extends BaseMessage implements IRendererPostMessage {
  readonly name = MESSAGE_SANDBOX_COMPILE_ERROR;
  constructor(public rootId: string, public err: any) {
    super();
  }
}

export class PostMessageCompileLibraryError extends BaseMessage implements IRendererPostMessage {
  readonly name = MESSAGE_SANDBOX_COMPILE_LIBRARY_ERROR;
  constructor(public libraryId: string, public err: any) {
    super();
  }
}

export class PostMessageGeneralError extends BaseMessage implements IRendererPostMessage {
  readonly name = MESSAGE_SANDBOX_GENERAL_ERROR;
  constructor(public err: any, public stack: any) {
    super();
  }
}

export class PostMessageCodeComponentError extends BaseMessage implements IRendererPostMessage {
  readonly name = MESSAGE_SANDBOX_CODE_COMPONENT_ERROR;
  constructor(public codeComponentId: string, public codeComponentName: string, public err: any) {
    super();
  }
}

export class PostMessageCodeComponentsLoaded extends BaseMessage implements IRendererPostMessage {
  readonly name = MESSAGE_SANDBOX_CODE_COMPONENTS_LOADED;
}

export class PostMessageCodeComponentPreviewReady
  extends BaseMessage
  implements IRendererPostMessage
{
  readonly name = MESSAGE_SANDBOX_CODE_COMPONENT_PREVIEW_READY;
}

//#endregion

export class PostMessageLoadExportedProject extends BaseMessage implements IPostMessage {
  readonly name = MESSAGE_LOAD_EXPORTED_PROJECT;
  constructor(public exportedProject: cd.IExportedProject) {
    super();
  }
}

export class PostMessageLoadExportedProjectData extends BaseMessage implements IPostMessage {
  readonly name = MESSAGE_LOAD_EXPORTED_PROJECT_DATA;
  constructor(public datasets: cd.ProjectDataset[]) {
    super();
  }
}

export type CdPostMessage =
  | PostMessageAddBuiltInDatasets
  | PostMessageBoardDidAppearAfterReset
  | PostMessageCodeComponentAdd
  | PostMessageCodeComponentDelete
  | PostMessageCodeComponentError
  | PostMessageCodeComponentPreviewReady
  | PostMessageCodeComponentsLoaded
  | PostMessageCodeComponentUpdate
  | PostMessageCodeComponentUpdatePreview
  | PostMessageCompileComponentSet
  | PostMessageCompileError
  | PostMessageCompileLibraryError
  | PostMessageDatasetAdd
  | PostMessageDatasetRemove
  | PostMessageDesignSystemSet
  | PostMessageDesignSystemUpdate
  | PostMessageExternalPostAction
  | PostMessageFocusedElementRenderResult
  | PostMessageGeneralError
  | PostMessageGreenlineRenderResults
  | PostMessageLoadExportedProject
  | PostMessageLoadExportedProjectData
  | PostMessagePreviewClear
  | PostMessagePreviewRenderResults
  | PostMessagePreviewShow
  | PostMessageProjectAssetDelete
  | PostMessageProjectAssetUpdate
  | PostMessagePropertiesAdd
  | PostMessagePropertiesDelete
  | PostMessagePropertiesLoaded
  | PostMessagePropertiesReplace
  | PostMessagePropertiesUpdate
  | PostMessagePropertiesUpdatePartial
  | PostMessageRecompile
  | PostMessageRefreshRenderRects
  | PostMessageRenderResults
  | PostMessageReset
  | PostMessageResetAll
  | PostMessageResetElementState
  | PostMessageRetargetOutlet
  | PostMessageRootNavigation
  | PostMessageSandboxInit
  | PostMessageSetA11yMode
  | PostMessageSetApplicationTheme
  | PostMessageSetPreviewMode
  | PostMessageToast
  | PostMessageURLNavigation
  | PostMessageApplyElementChanges
  | PostMessageToggleHotspots
  | PostMessageURLNavigation;
