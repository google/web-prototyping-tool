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

import { getRenderResults, doesDocumentBodyHaveInvalidSize } from './utils/renderer.utils';
import { filter, tap, throttleTime } from 'rxjs/operators';
import type { ComponentRef, NgModuleRef, PlatformRef } from '@angular/core';
import { insertComponentIntoOutlet } from './outlets/outlet.utils';
import { PerfEvent } from './utils/performance.utils';
import OutletService from './outlet.service';
import { rendererState } from './state.manager';
import DocumentManager from './document.manager';
import PreviewManager from './preview.manager';
import { Subscription } from 'rxjs';
import * as msg from 'cd-common/services';
import * as cd from 'cd-interfaces';

const DEFAULT_RECT_BUFFER = 3;
const PREVIEW_RECT_BUFFER = 16;
const CHANGE_DETECTION_BUFFER = 6;

export default class OutletManager {
  private _subscription = new Subscription();
  private _previewManager: PreviewManager;
  private _outletAppModuleRef: NgModuleRef<cd.IRenderOutletApp> | null;
  private _outletPlatform: PlatformRef | null;
  private _outletService: OutletService;
  private _docManager: DocumentManager;

  constructor(
    public id: string,
    doc: HTMLDocument,
    appModule: NgModuleRef<cd.IRenderOutletApp>,
    platform: PlatformRef
  ) {
    const componentRef = insertComponentIntoOutlet(doc, appModule);
    const outletService = new OutletService(id, componentRef);
    this._outletPlatform = platform;
    this._outletAppModuleRef = appModule;
    this._outletService = outletService;
    this._docManager = new DocumentManager(outletService, doc);
    this._previewManager = new PreviewManager(id, doc, appModule, outletService);
    this.init();
  }

  init() {
    this._docManager.init();
    this._previewManager.init();
    this._attachEvents();
    this._outletService.update();
  }

  prepareForDelete() {
    this._docManager.markWindowForDelete();
    this._outletService.componentRef?.changeDetectorRef.detach();
    this._previewManager.clearEvents();
    this._subscription.unsubscribe();
  }

  get outletDocument(): HTMLDocument {
    return this._docManager.outletDocument;
  }

  get outletWindow(): Window | null {
    return this._docManager.outletWindow;
  }

  get previewMode(): boolean {
    return this._previewManager.previewMode;
  }

  get hasPreviewRenderResults(): boolean {
    return !!!this._previewManager.prevRenderResults;
  }

  setId(id: string) {
    if (this.id === id) return;
    this._outletService.setRootId(id);
    this._previewManager.setRootId(id);
    // if outlet targets a new id, dismiss any potential modal that is showing
    this.id = id;
    this._outletService.update();
    // In preview we change boards with setId so we
    // must mark this component as dirty to ensure material components are updated
    this._outletService.componentRef?.instance.markForChangeDetection();
  }

  reset() {
    this._previewManager.reset();
  }

  update() {
    this._outletService.update();
  }

  // Add any additional custom element bundles and insert new component with latest template
  reinsertComponent() {
    const { outletDocument, _outletAppModuleRef } = this;
    if (!_outletAppModuleRef) return;
    this._docManager.loadCustomElements();
    this._outletService.reinsertComponent(outletDocument, _outletAppModuleRef);
  }

  destroy() {
    this._outletService.destroy();
    this._previewManager.destroy(this.outletWindow);
    this._subscription.unsubscribe();
    this._docManager.destroy();
    this._outletAppModuleRef?.destroy();
    this._outletPlatform?.destroy();
    this._outletAppModuleRef = null;
    this._outletPlatform = null;
  }

  setPreviewMode(previewMode: boolean) {
    this._previewManager.setPreviewMode(previewMode);
  }

  toggleA11yMode(a11yMode: cd.IA11yModeState) {
    this._previewManager.setA11yMode(a11yMode);
  }

  setApplicationTheme(theme: cd.IStringMap<string>) {
    this._docManager.setApplicationTheme(theme);
  }

  updateDesignSystem() {
    this._docManager.updateDesignSystem();
  }

  loadFonts() {
    this._docManager.loadFonts();
  }

  requestRenderRects = () => {
    this._outletService.requestRenderRects();
  };

  private _onChangeDetection = () => {
    this._detectChanges(this._outletService.componentRef);
  };

  private _attachEvents() {
    const config = { leading: true, trailing: true };
    const cd$ = this._outletService.changeDetectionQueue$.pipe(
      tap(() => performance.mark(PerfEvent.RequestChangeDetection)),
      throttleTime(CHANGE_DETECTION_BUFFER, undefined, config)
    );

    const rect$ = this._outletService.renderRectsQueue$.pipe(
      tap(() => performance.mark(PerfEvent.RequestRenderRects)),
      throttleTime(this.previewMode ? PREVIEW_RECT_BUFFER : DEFAULT_RECT_BUFFER, undefined, config)
    );

    const initalSize$ = this._docManager.onInitialSizeChange$.pipe(
      filter(() => this.hasPreviewRenderResults)
    );

    this._subscription.add(cd$.subscribe(this._onChangeDetection));
    this._subscription.add(rect$.subscribe(this._updateRects));
    this._subscription.add(initalSize$.subscribe(this.requestRenderRects));
  }

  checkForBoardAppearance() {
    const { componentRef } = this._outletService;
    if (!componentRef) return;
    this._previewManager.runChangeDetectionGuarded(componentRef);
    this._previewManager.checkForBoardAppearance(true);
  }

  /** We call detect changes to ensure components update before checking render rects */
  private _detectChanges = (componentRef: ComponentRef<any> | null | undefined) => {
    if (this._docManager.markForDelete || !componentRef) return;
    if (!rendererState.hasElement(this.id)) return;
    if (this.previewMode || rendererState.exportMode) {
      this._previewManager.runChangeDetectionGuarded(componentRef);
      this._previewManager.checkForBoardAppearance();
    } else {
      componentRef.changeDetectorRef.detectChanges();
    }
    performance.mark(PerfEvent.ChangeDetection);
    this.requestRenderRects();
  };

  /** Fast check to see if render results have changed to avoid sending unnecessary data */
  private _haveRenderResultsChanged(results: cd.RenderResults): boolean {
    if (!results) return true;
    if (doesDocumentBodyHaveInvalidSize(this.outletDocument)) return false;
    return this._previewManager.setPreviewRects(results);
  }

  /** Gathers rectangles for every DOM with a template selector and sends that to the main app  */
  private _updateRects = () => {
    if (this._docManager.markForDelete) return;
    if (rendererState.exportMode) return;
    const { id, previewMode } = this;
    const elements = this._docManager.getElements(id, previewMode);
    const results = getRenderResults(elements, id, previewMode);
    this._emitRects(previewMode, id, results);
    performance.mark(PerfEvent.RenderRects);
  };

  private _emitRects(previewMode: boolean, id: string, results: Record<string, cd.IRenderResult>) {
    if (this._haveRenderResultsChanged(results) === false) return;
    const evt = previewMode ? msg.PostMessagePreviewRenderResults : msg.PostMessageRenderResults;
    const message = new evt(id, results);
    this._outletService.postMessage(message);
  }
}
