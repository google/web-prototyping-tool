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

import { Subject, Subscription, fromEvent, merge } from 'rxjs';
import { auditTime, debounceTime } from 'rxjs/operators';
import { rendererState } from '../state.manager';
import { captureLoadEvents, captureAllTransitionEvents } from '../utils/event.utils';
import { areObjectsEqual } from 'cd-utils/object';
import { getActiveFocusElementRect, getGreenlineRenderResults } from './greenlines.utils';
import { messagingService } from '../utils/messaging.utils';
import * as consts from 'cd-common/consts';
import * as cd from 'cd-interfaces';
import * as msg from 'cd-common/services';

const DEBOUNCE_QUICK = 16;
const DEBOUNCE_SLOW = 300;

export class AccessibilityManager {
  private _focusSubscriptions = Subscription.EMPTY;
  private _shadowFocusSubscriptions = Subscription.EMPTY;
  private _greenlineSubscriptions = Subscription.EMPTY;
  private _contentObserver?: MutationObserver;
  private _greenlineRectsQueue = new Subject<void>();
  private _previewMode = false;
  private _a11yMode: cd.IA11yModeState = consts.DEFAULT_A11Y_MODE_STATE;
  private _urlCache = new Set<string>();
  private _prevGreenlineResults = '';
  private _boardContext: HTMLDocument | HTMLElement | null = null;

  constructor(public rootId: string) {}

  get a11yPanelOpen() {
    return this._a11yMode.panel;
  }

  get anyGreenlinesEnabled() {
    const { _a11yMode } = this;
    return _a11yMode.flow || _a11yMode.landmarks || _a11yMode.headings;
  }

  toggleA11yMode(newA11yMode: cd.IA11yModeState, outletDocument: HTMLDocument) {
    const a11yModeDidChange = !areObjectsEqual(this._a11yMode, newA11yMode);
    if (!this._previewMode || !a11yModeDidChange) return;

    const flowModeDidChange = this._a11yMode.flow !== newA11yMode.flow;
    const panelModeDidChange = this._a11yMode.panel !== newA11yMode.panel;
    this._a11yMode = newA11yMode;

    if (flowModeDidChange) {
      if (newA11yMode.flow) this.attachFocusEvents(outletDocument);
      else this.clearFocusEvents();
    }

    if (panelModeDidChange) {
      if (newA11yMode.panel) this.attachGreenlineEvents(outletDocument);
      else this.clearGreenlineEvents();

      this.updateGreenlineRects(outletDocument);
    }
  }

  togglePreviewMode(previewMode: boolean) {
    this._previewMode = previewMode;
  }

  setBoardContext(context: HTMLDocument | HTMLElement) {
    this._boardContext = context;
  }

  resetBoardContext() {
    this._boardContext = null;
  }

  setRootId(id: string) {
    this.rootId = id;
  }

  destroy() {
    this.resetBoardContext();
    this.clearAllEvents();
  }

  clearAllEvents() {
    this.clearFocusEvents();
    this.clearGreenlineEvents();
  }

  requestGreenlineRects = () => this._greenlineRectsQueue.next();

  private setupContentObserver(outletDocument: HTMLDocument | undefined) {
    if (!outletDocument) return;
    const config = { subtree: true, childList: true, attributes: true, characterData: true };
    this._contentObserver = new MutationObserver(this.requestGreenlineRects);
    this._contentObserver.observe(outletDocument, config);
  }

  private disconnectContentObserver() {
    this._contentObserver?.disconnect();
  }

  private attachGreenlineEvents(outletDocument: HTMLDocument | undefined) {
    if (!outletDocument) return;
    const scroll$ = fromEvent(outletDocument, 'scroll', { capture: true });
    const resize$ = fromEvent(outletDocument.defaultView as Window, 'resize');

    const greenlineEvents$ = merge(
      merge(scroll$, resize$).pipe(auditTime(DEBOUNCE_QUICK)),
      this._greenlineRectsQueue.pipe(debounceTime(DEBOUNCE_QUICK)),
      captureLoadEvents(outletDocument, this._urlCache).pipe(debounceTime(DEBOUNCE_SLOW)),
      captureAllTransitionEvents(outletDocument, DEBOUNCE_SLOW)
    );
    this._greenlineSubscriptions = new Subscription();
    this._greenlineSubscriptions.add(
      greenlineEvents$.subscribe(() => this.updateGreenlineRects(outletDocument))
    );

    this.setupContentObserver(outletDocument);
  }

  private clearGreenlineEvents() {
    this._greenlineSubscriptions.unsubscribe();
    this.disconnectContentObserver();
  }

  private attachFocusEvents(outletDocument: HTMLDocument | undefined) {
    if (!outletDocument) return;
    this._focusSubscriptions = new Subscription();
    const focusin$ = fromEvent<FocusEvent>(outletDocument, 'focusin');
    const focusout$ = fromEvent<FocusEvent>(outletDocument, 'focusout');
    this._focusSubscriptions.add(
      merge(focusin$, focusout$).subscribe(() => {
        this.updateFocusElement(outletDocument);
      })
    );
  }

  private clearFocusEvents() {
    this._focusSubscriptions.unsubscribe();
    this._shadowFocusSubscriptions.unsubscribe();
  }

  private postMessage(message: msg.CdPostMessage) {
    messagingService.postMessageToParent(message);
  }

  /** Fast check to see if greenline results have changed to avoid sending unnecessary data */
  private haveGreenlineResultsChanged(results: cd.IGreenlineRenderResults): boolean {
    if (!results) return true;
    const resString = JSON.stringify(results);
    if (this._prevGreenlineResults === resString) return false;
    this._prevGreenlineResults = resString;
    return true;
  }

  /** Gathers rectangles for every DOM element with a greenline and sends that to the main app  */
  updateGreenlineRects = (outletDocument: HTMLDocument) => {
    const { _a11yMode, rootId, _boardContext } = this;
    if (rendererState.exportMode || !_a11yMode.panel) return;
    const queryContext = _boardContext || outletDocument;

    const greenlineResults = getGreenlineRenderResults(queryContext, rootId);
    if (!this.haveGreenlineResultsChanged(greenlineResults)) return;
    this.postMessage(new msg.PostMessageGreenlineRenderResults(rootId, greenlineResults));

    // Make sure active focus element rect also gets recalculated if needed
    this.updateFocusElement(outletDocument);
  };

  /** Show active element focus rect when in flow mode */
  updateFocusElement = (outletDocument: HTMLDocument) => {
    const { _a11yMode, rootId } = this;
    if (!_a11yMode.flow) return;

    const boardFocusElement = outletDocument.activeElement;
    // Focus defaults to body in between elements, so we exclude this case
    const focusElementIsBody = boardFocusElement && boardFocusElement === outletDocument.body;
    // Focus could be inside a component's shadowroot
    const elementShadowRootActiveElement = boardFocusElement?.shadowRoot?.activeElement;

    const focusElement = elementShadowRootActiveElement || boardFocusElement;
    const focusElementRect =
      focusElement && !focusElementIsBody
        ? getActiveFocusElementRect(focusElement as HTMLElement, rootId)
        : null;
    this.postMessage(new msg.PostMessageFocusedElementRenderResult(focusElementRect));

    // Check if focus is in shadow root to watch for any further updates
    if (elementShadowRootActiveElement) {
      this.addShadowFocusSubscriptions(boardFocusElement as Element, rootId);
    }
  };

  /**
   * Temporarily subscribe to an component's shadowroot to track focus in/out between child elements
   * (since shadow focus events cannot be tracked from board level)
   */
  addShadowFocusSubscriptions(focusedElement: Element, rootId: string) {
    const shadowRoot = focusedElement.shadowRoot;
    const shadowRootChildren = shadowRoot?.children;
    if (!shadowRoot || !shadowRootChildren) return;
    const shadowHostFocusOut$ = fromEvent<FocusEvent>(focusedElement, 'focusout');
    const shadowRootFocusIn$ = fromEvent<FocusEvent>(shadowRootChildren, 'focusin');
    const shadowRootFocusOut$ = fromEvent<FocusEvent>(shadowRootChildren, 'focusout');

    this._shadowFocusSubscriptions = new Subscription();
    this._shadowFocusSubscriptions.add(
      merge(shadowRootFocusIn$, shadowRootFocusOut$).subscribe(() => {
        this.updateShadowRootFocusIndicator(shadowRoot, rootId);
      })
    );
    // Unsubscribe when leaving the containing element
    this._shadowFocusSubscriptions.add(
      shadowHostFocusOut$.subscribe(() => {
        this._shadowFocusSubscriptions.unsubscribe();
      })
    );
  }

  updateShadowRootFocusIndicator = (shadowRoot: ShadowRoot, rootId: string) => {
    const activeShadowElement = shadowRoot.activeElement;
    const focusElement = activeShadowElement
      ? getActiveFocusElementRect(activeShadowElement as HTMLElement, rootId)
      : null;
    this.postMessage(new msg.PostMessageFocusedElementRenderResult(focusElement));
  };
}
