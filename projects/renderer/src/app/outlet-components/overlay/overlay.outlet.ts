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

import { ICompilationPayload } from '../../utils/interfaces';
import { compileModule, getOutletCompilationPayload } from '../../utils/compiler.utils';
import { OverlaysModule } from './overlay.module';
import { IOverlayItem, OverlayManagerComponent } from './overlay.component';
import { ComponentRef, NgModuleRef } from '@angular/core';
import { createComponent, createDetachedOutlet } from '../../outlets/outlet.utils';
import { OutletComponentDirective } from '../../outlets/outlet.component';
import { rendererState } from '../../state.manager';
import * as cd from 'cd-interfaces';
import { generateIDWithLength } from 'cd-utils/guid';
let _compiledPayload: ICompilationPayload<OverlayManagerComponent> | undefined;

const OVERLAYS_NAMESPACE = 'cdr-overlay';

/** Wrapper interface for controlling the Drawer outlet */
export default class OverlayOutlet {
  public compRef?: ComponentRef<OverlayManagerComponent> | null;

  static async compile() {
    _compiledPayload = await compileModule<OverlayManagerComponent>(OverlaysModule, 'overlays');
  }

  static getCompilationPayoad() {
    return _compiledPayload;
  }

  get instance() {
    return this.compRef?.instance;
  }

  get overlays() {
    return this.instance?.overlays ?? [];
  }

  addAndReturnOutletInstance(
    action: cd.IActionBehaviorPresentOverlay,
    triggerId: string,
    outletDocument: HTMLDocument,
    outletAppModuleRef: NgModuleRef<cd.IRenderOutletApp>,
    didHover: boolean
  ): ComponentRef<OutletComponentDirective> | undefined {
    const outletCompilation = getOutletCompilationPayload();
    if (!outletCompilation) return;
    const outletRef = createDetachedOutlet(outletCompilation, outletDocument, outletAppModuleRef);
    // Setting the elementClassPrefix will create a namespace for this board
    // this prevents style conflicts when multiple of the same board is presented
    outletRef.instance.elementClassPrefix = OVERLAYS_NAMESPACE + generateIDWithLength(7);
    const target = action.target && rendererState.getElementById(action.target);
    if (!outletRef || !target) return;
    const item: IOverlayItem = { action, triggerId, target, outletRef };
    this.compRef?.instance.add(item, didHover);
    return outletRef;
  }

  updateStyles() {
    const { overlays } = this;
    for (const overlay of overlays) {
      overlay.outletRef.instance.styleMap = rendererState.stylesMap;
    }
  }

  closeAll() {
    this.instance?.cleanup();
  }

  /** Creates a single component to hold all overlay instances */
  init(outletDocument: HTMLDocument, outletAppModuleRef: NgModuleRef<cd.IRenderOutletApp> | null) {
    const payload = OverlayOutlet.getCompilationPayoad();
    if (!payload || !outletAppModuleRef) return;
    const compRef = createComponent(
      payload,
      outletDocument,
      outletAppModuleRef,
      OVERLAYS_NAMESPACE
    );
    outletDocument.body.appendChild(compRef.location.nativeElement);
    this.compRef = compRef;
  }

  parseOverlayInstance(idx: string): number {
    return parseInt(idx, 10);
  }

  /**
   * When dismissed inside an overlay overlayInstanceIdx will be present
   * which the index (unique identifier) of the overlay which contains the close action
   * otherwise the overlays will be popped from the stack starting from the last item
   */
  dismiss(
    _action: cd.IActionBehaviorCloseOverlay,
    _elementId: string,
    overlayInstanceIdx?: string
  ) {
    if (overlayInstanceIdx) {
      const idx = this.parseOverlayInstance(overlayInstanceIdx);
      const active = this.overlays[idx];
      if (active) return this.instance?.onClosedEvent(active);
    }
    this.instance?.remove();
  }

  /** Navigation within an overlay is determined by its index (unique identifier) */
  navigate(overlayInstanceIdx: string): ComponentRef<OutletComponentDirective> {
    const idx = this.parseOverlayInstance(overlayInstanceIdx);
    const { overlays } = this;
    const active = overlays[idx];
    return active.outletRef;
  }

  destroy(outletDocument: HTMLDocument) {
    const { compRef } = this;
    if (!compRef) return;
    outletDocument.body.removeChild(compRef.location.nativeElement);
    compRef.instance.cleanup();
    compRef.destroy();
    this.compRef = null;
  }
}
