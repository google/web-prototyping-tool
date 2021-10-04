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

import { compileOutletComponentDirectiveSet } from '../utils/compiler.utils';
import { unRegisterCodeComponent, registerCodeComponent } from 'cd-common/models';
import { CodeComponentOutletManager } from './code-component-manager';
import { messagingService } from '../utils/messaging.utils';
import { rendererState } from '../state.manager';
import * as msg from 'cd-common/services';
import * as cd from 'cd-interfaces';

const codeComponentOutletManagers: Map<string, CodeComponentOutletManager> = new Map();

export const registerCodeComponentOutlet: cd.RegisterCodeComponentOutletFunction = (
  id: string,
  outletDocument: HTMLDocument,
  previewMode?: boolean
) => {
  const codeComponentOutlet = new CodeComponentOutletManager(id, outletDocument, previewMode);
  codeComponentOutletManagers.set(id, codeComponentOutlet);
};

export const unRegisterCodeComponentOutlet: cd.UnRegisterOutletFunction = (
  outletDocument: HTMLDocument
) => {
  const allManagers = Array.from(codeComponentOutletManagers.values());
  const outletManager = allManagers.find((m) => m.outletDocument === outletDocument);
  if (!outletManager) return;
  outletManager.destroy();
  codeComponentOutletManagers.delete(outletManager.id);
};

export const handleAddCodeComponents = async (message: msg.PostMessageCodeComponentAdd) => {
  const { codeComponents, jsBundleBlobs } = message;

  // add blobs to renderer state
  await rendererState.addCodeComponentBlobs(jsBundleBlobs);

  // Add each component to registry so that it will be included in compiled template
  for (const cmp of codeComponents) {
    const { id } = cmp;
    rendererState.codeComponents.set(id, cmp);
    registerCodeComponent(cmp);

    // If outlet manager was created before code component definition was added
    // initialize that outlet now.
    const outletManager = codeComponentOutletManagers.get(id);
    if (!outletManager) continue;
    outletManager.init();
  }

  // Generate and compile new outlet template with newly registered code components
  compileOutletComponentDirectiveSet();
};

export const handleUpdateCodeComponent = async (message: msg.PostMessageCodeComponentUpdate) => {
  const { updatedCodeComponent, updatedJsBlob } = message;
  const { id } = updatedCodeComponent;
  const outletManager = codeComponentOutletManagers.get(id);

  // Update renderer state
  rendererState.codeComponents.set(id, updatedCodeComponent);

  // Update definition in registry
  registerCodeComponent(updatedCodeComponent);

  // if js bundle blob updated, reload outlet
  if (!updatedJsBlob) {
    // load fonts that may have been updated
    outletManager?.loadFonts();
    return;
  }

  await rendererState.addCodeComponentBlobs({ [id]: updatedJsBlob });

  if (!outletManager) return;
  outletManager.reload(); // new outletManager will be created when window re-registers
  codeComponentOutletManagers.delete(id);
};

export const handleUpdateCodeComponentPreview = (
  message: msg.PostMessageCodeComponentUpdatePreview
) => {
  const { codeComponentId, updatedPreview, updatedTagName } = message;
  const outletManager = codeComponentOutletManagers.get(codeComponentId);
  if (!outletManager) return;
  if (updatedTagName) outletManager.updateTagName(updatedTagName);
  if (updatedPreview) outletManager.updatePreview(updatedPreview);
};

export const handleDeleteCodeComponents = (message: msg.PostMessageCodeComponentDelete) => {
  const { codeComponentIds } = message;
  for (const id of codeComponentIds) {
    rendererState.removeCodeComponent(id);
    unRegisterCodeComponent(id);
  }
};

export const handleCodeComponentError = (codeComponentId: string, error: any) => {
  const codeCmp = rendererState.codeComponents.get(codeComponentId);
  if (!codeCmp) return;
  const message = new msg.PostMessageCodeComponentError(codeComponentId, codeCmp.title, error);
  messagingService.postMessageToParent(message);

  // In addition to sending post message to show toast, log error to console to help user debug
  console.error(error);
};
