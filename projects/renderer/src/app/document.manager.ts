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

import { loadScript } from 'cd-utils/dom';
import { rendererState } from './state.manager';
import { addRootStylesToDocument, removeRootStylesFromDocument } from './utils/styles.utils';
import { updateDocumentThemeMeta } from './utils/theme.utils';
import { registerDataChipCustomElement } from './custom-elements/data-chip.element';
import { captureLoadEvents, captureTransitionEvents } from './utils/event.utils';
import { PostMessageCodeComponentsLoaded } from 'cd-common/services';
import { fromEvent, merge, Subject, Subscription } from 'rxjs';
import { messagingService } from './utils/messaging.utils';
import { FontManager } from 'cd-utils/stylesheet';
import { debounceTime, take } from 'rxjs/operators';
import { wrapInBrackets } from 'cd-common/models';
import OutletService from './outlet.service';
import type * as cd from 'cd-interfaces';
import * as utils from 'cd-common/utils';
import {
  MARK_FOR_DELETE_GLOBAL,
  TEMPLATE_ID_ATTR,
  TEMPLATE_ELEMENT_SELECTOR,
  PREVIEW_MODE_ELEMENT_SELECTOR,
} from 'cd-common/consts';

const DEBOUNCE_TIME = 300;

/**
 * This file manages everything related to the document
 * such as applying CSS styles, and loading web components
 */
export default class DocumentManager {
  private _markForDelete = false;
  private _loadedCustomElementBundles = new Set<string>();
  private _currentDesignSystemCssClass?: string | null;
  private _subscription = new Subscription();
  private _urlCache = new Set<string>();
  /////////////////////////////////////////////////////
  public onInitialSizeChange$ = new Subject<void>();

  constructor(private _outletService: OutletService | null, public outletDocument: HTMLDocument) {}

  init() {
    const { outletDocument } = this;
    addRootStylesToDocument(outletDocument);
    registerDataChipCustomElement(outletDocument);
    this.loadCustomElements();
    this.loadFonts();
    this.updateDesignSystem();
    this.setApplicationTheme(rendererState.applicationTheme);
    this._attachEvents(outletDocument);
  }

  /** Listen for document events such as load, and transition end to request updated renderRects */
  private _attachEvents(doc: HTMLDocument) {
    const load$ = captureLoadEvents(doc, this._urlCache);
    const transition$ = captureTransitionEvents(doc);
    const evt$ = merge(load$, transition$).pipe(debounceTime(DEBOUNCE_TIME));
    this._subscription.add(evt$.subscribe(this._outletService?.requestRenderRects));
    this._attachInitalSizeListener(doc.defaultView);
  }

  /**
   * When an embedded iframe like the renderer loads in a background tab or offscreen
   * we listen for the board to resize once to determine when it becomes visible and request render rectangles
   */
  private _attachInitalSizeListener(win: Window | null) {
    if (!win) return;
    this._subscription.add(
      fromEvent(win, 'resize')
        .pipe(take(1))
        .subscribe(() => {
          this.onInitialSizeChange$.next();
        })
    );
  }

  get markForDelete(): boolean {
    return this._markForDelete;
  }

  get body() {
    return this.outletDocument.body;
  }

  get outletWindow(): Window | null {
    return this.outletDocument?.defaultView;
  }

  /** Prevent unecissary cdStyle processing when board is marked for delete*/
  markWindowForDelete() {
    (this.outletWindow as any)[MARK_FOR_DELETE_GLOBAL] = true;
    this._markForDelete = true;
    this.clearEvents();
  }

  loadFonts() {
    utils.loadFontFamilies(rendererState.allFonts, this.outletDocument);
  }

  updateCssVars() {
    utils.createOrReplaceCSSVars(rendererState.cssVars, this.outletDocument);
  }

  /**
   * Inject the scripts needed to render our custom elements.
   * These are injected after outlet initializes to ensure that zone.js has already loaded.
   */
  async loadCustomElements() {
    const { codeComponents, codeComponentJsBlobUrls, codeCompFonts } = rendererState;
    const { _loadedCustomElementBundles, outletDocument, outletWindow } = this;
    if (!outletWindow) return;
    const blobUrls = Array.from(codeComponentJsBlobUrls.values());
    for (const src of blobUrls) {
      if (_loadedCustomElementBundles.has(src)) continue;
      _loadedCustomElementBundles.add(src);
      loadScript(src, outletDocument, true);
    }
    // Wait for 'whenDefined' on each code component and then request render rects
    const codeCmpList = Array.from(codeComponents.values());
    const tagNames = codeCmpList.map((c) => utils.getCodeComponentScopedTagName(c.id, c.tagName));
    const whenDefinedPromises = tagNames.map((t) => outletWindow.customElements.whenDefined(t));
    utils.loadFontFamilies(codeCompFonts, outletDocument);
    await Promise.all(whenDefinedPromises);
    messagingService.postMessageToParent(new PostMessageCodeComponentsLoaded());
    this._outletService?.requestRenderRects(); // Also, request render rects once custom elements have loaded.
  }

  setDesignSystemCssClass() {
    const { designSystem } = rendererState;
    if (!designSystem) return;
    const { _currentDesignSystemCssClass } = this;
    const { globalCssClass } = designSystem;
    if (_currentDesignSystemCssClass === globalCssClass) return;
    const { classList } = this.body;
    if (_currentDesignSystemCssClass) classList.remove(_currentDesignSystemCssClass);
    if (globalCssClass) classList.add(globalCssClass);
    this._currentDesignSystemCssClass = globalCssClass;
  }

  /**
   * The theme color of the editor used to outline an element
   * during drag & drop. Not to be confused with a project's theme.
   */
  setApplicationTheme(theme: cd.IStringMap<string>) {
    this.setDesignSystemCssClass();
    const bodyStyle = this.body.style;
    for (const [key, value] of Object.entries(theme)) {
      bodyStyle.setProperty(key, value);
    }
  }

  clearEvents() {
    this._subscription.unsubscribe();
  }

  destroy() {
    this.clearEvents();
    this._outletService = null;
    utils.StyleManager.deleteInstanceForWindow(this.outletWindow);
    FontManager.deleteInstance(this.outletDocument);
    removeRootStylesFromDocument(this.outletDocument);
    (this.outletDocument as any) = null;
  }

  getPreviewElements(): HTMLElement[] {
    const previewElements = this.outletDocument.querySelectorAll(PREVIEW_MODE_ELEMENT_SELECTOR);
    return Array.from(previewElements) as HTMLElement[];
  }

  /** Gathers every element on this board with a template selector  */
  getElements(rootId: string, previewMode: boolean): HTMLElement[] {
    if (previewMode) return this.getPreviewElements();
    // Add the current root element to this list
    const boardSelector = wrapInBrackets(`${TEMPLATE_ID_ATTR}="${rootId}"`);
    const selector = `${TEMPLATE_ELEMENT_SELECTOR}, ${boardSelector}`;
    const elements = this.outletDocument.querySelectorAll(selector);
    return Array.from(elements) as HTMLElement[];
  }

  /** When the theme initalizes or updates */
  updateDesignSystem() {
    this.setDesignSystemCssClass();
    this.updateCssVars();
    updateDocumentThemeMeta(this.outletDocument, rendererState.designSystem);
  }
}
