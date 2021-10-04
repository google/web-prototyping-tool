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
import * as utils from 'cd-common/utils';
import { rendererState } from '../state.manager';
import { loadScript } from 'cd-utils/dom';
import { addRootStylesToDocument } from '../utils/styles.utils';
import { messagingService } from '../utils/messaging.utils';
import { PostMessageCodeComponentPreviewReady } from 'cd-common/services';
import { isString } from 'cd-utils/string';
import { RendererAPI } from '../utils/state.api';

const CENTER_CODE_COMPONENT_CLASS = 'center-code-component';
const PREVIEW_MODE_ACTIVE_CLASS = 'cd-preview-mode-active';
/**
 * This class manages the state of a code component preview outlet
 */
export class CodeComponentOutletManager {
  private _api: RendererAPI;
  private customElement?: HTMLElement | null;
  private initialized = false;

  constructor(public id: string, public outletDocument: HTMLDocument, public previewMode = false) {
    this.init();
    this._api = new RendererAPI(outletDocument.defaultView, true);
  }

  destroy() {
    this.customElement = null;
    this._api.destroy(this.outletDocument.defaultView);
    (this.outletDocument as any) = null;
  }

  init() {
    const codeComponent = rendererState.codeComponents.get(this.id);
    const jsBlobUrl = rendererState.codeComponentJsBlobUrls.get(this.id);
    const { initialized } = this;

    if (!codeComponent || !jsBlobUrl || initialized) return;
    this.initialized = true;

    const { outletDocument } = this;
    const { id, tagName } = codeComponent;
    const scopedTagName = utils.getCodeComponentScopedTagName(id, tagName);

    outletDocument.body.classList.add(CENTER_CODE_COMPONENT_CLASS);

    if (this.previewMode) {
      outletDocument.body.classList.add(PREVIEW_MODE_ACTIVE_CLASS);
    }

    this.loadFonts();
    utils.createOrReplaceCSSVars(rendererState.cssVars, outletDocument);
    addRootStylesToDocument(outletDocument);

    loadScript(jsBlobUrl, outletDocument, true);

    this.addCustomElement(scopedTagName);
    this.setInputs(); // set all default values of inputs

    // Send message when element is finished loading
    this._window?.customElements.whenDefined(scopedTagName).then(this.sendPreviewReadyMessage);
  }

  loadFonts() {
    utils.loadFontFamilies(rendererState.allFonts, this.outletDocument);
  }

  updateTagName(tagName: string) {
    const { customElement } = this;
    if (customElement) customElement.remove();
    const scopedTagName = utils.getCodeComponentScopedTagName(this.id, tagName);
    this.addCustomElement(scopedTagName);
    this.setInputs();
  }

  updatePreview(updatedPreview: cd.ICodeComponentInstance) {
    this.setInputs(updatedPreview.inputs);
  }

  clearContents() {
    this.outletDocument.body.innerHTML = '';
  }

  get _window(): Window | null {
    return this.outletDocument.defaultView;
  }

  reload() {
    return this._window?.location.reload();
  }

  private addCustomElement(scopedTagName: string) {
    const { outletDocument } = this;
    this.customElement = outletDocument.createElement(scopedTagName);
    this.outletDocument.body.appendChild(this.customElement);
  }

  /**
   * Send post message to indicate that the code component preview is ready. This is used
   * by screenshot service in order to wait before before taking a screenshot.
   *
   * Using a unique message for code component preview so that screenshot service knows that
   * it does not also need to wait for a render results message.
   */
  private sendPreviewReadyMessage = () => {
    messagingService.postMessageToParent(new PostMessageCodeComponentPreviewReady());
  };

  private _processInputValue(
    name: string,
    defaultValue: cd.PropertyValue,
    inputType?: cd.PropertyInput,
    instanceInputs?: cd.ICodeComponentInstanceInputs
  ) {
    const value = instanceInputs?.[name] ?? defaultValue;
    const { mergedProperties, loadedData } = rendererState;

    // TODO: Should do a design system lookup or convert to var()
    if (inputType === cd.PropertyInput.Color) return utils.valueFromIValue(value);
    if (utils.isDataBoundValue(value)) {
      return utils.lookupDataBoundValue(value, mergedProperties, loadedData);
    }
    if (inputType === cd.PropertyInput.DatasetSelect && isString(value)) {
      return loadedData[value];
    }
    return value;
  }

  private _processInputBinding(
    customElement: HTMLElement,
    name: string,
    bindingType?: cd.BindingType,
    value?: any
  ) {
    // prettier-ignore
    switch (bindingType) {
      case cd.BindingType.Property: return ((customElement as any)[name] = value);
      case cd.BindingType.Attribute:
        // Don't add attribute for false/null/undefined/''
        if (!value && value !== 0) {
          customElement.removeAttribute(name);
        } else {
          // For `true`, set boolean attribute using ''
          const actualVal = value === true ? '' : String(value);
          customElement.setAttribute(name, actualVal);
        }
        break;
      case cd.BindingType.CssVar:
        const varValue = utils.cssVarStringFromValue(value) || null;
        return customElement.style.setProperty(name, varValue);
    }
  }

  /**
   * Set all inputs values on custom element. If instanceInputs is not provided, default values will
   * be used for each input
   */
  private setInputs(instanceInputs?: cd.ICodeComponentInstanceInputs) {
    const { customElement, id } = this;
    const codeComponent = rendererState.codeComponents.get(id);
    if (!customElement || !codeComponent) return;

    for (const prop of codeComponent.properties) {
      if (!prop.name) continue;
      const { name, inputType, defaultValue, bindingType } = prop;
      const value = this._processInputValue(name, defaultValue, inputType, instanceInputs);
      if (value !== undefined) this._processInputBinding(customElement, name, bindingType, value);
    }
  }
}
