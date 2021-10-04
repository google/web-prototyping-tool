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

import { ComponentRef, NgModuleRef } from '@angular/core';
import { isSymbolDefinition } from 'cd-common/models';
import { OutletComponentDirective } from './outlets/outlet.component';
import { RendererStateManager, rendererState } from './state.manager';
import { insertComponentIntoOutlet } from './outlets/outlet.utils';
import { messagingService } from './utils/messaging.utils';
import { CdPostMessage } from 'cd-common/services';
import { Subject } from 'rxjs';
import * as cd from 'cd-interfaces';

export default class OutletService {
  public changeDetectionQueue$ = new Subject<void>();
  public renderRectsQueue$ = new Subject<void>();

  constructor(
    public id: string,
    public componentRef?: ComponentRef<OutletComponentDirective> | null
  ) {}

  requestChangeDetection = () => this.changeDetectionQueue$.next();

  requestRenderRects = () => this.renderRectsQueue$.next();

  setRootId(id: string) {
    this.id = id;
  }

  update() {
    const { componentRef, id } = this;
    this.bindDataToComponent(componentRef, rendererState, id);
    this.requestChangeDetection();
  }

  /** Updates the data binding of the root component or a modal*/
  bindDataToComponent = (
    outletComponent: ComponentRef<OutletComponentDirective> | null | undefined,
    state: RendererStateManager,
    id: string,
    renderId?: string
  ) => {
    const instance = outletComponent?.instance;
    if (!instance) return;
    const outletRenderId = renderId || id;
    const { mergedProperties, stylesMap, assets, designSystem, datasets, loadedData } = state;
    // detemine if this outlet is rendering a board or symbol
    const props = mergedProperties[outletRenderId];
    if (!props) return;

    const outletType = isSymbolDefinition(props) ? cd.OutletType.Symbol : cd.OutletType.Board;
    instance.renderId = outletRenderId;
    instance.outletRoot = true;
    instance.outletType = outletType;
    instance.styleMap = stylesMap;
    instance.propertiesMap = mergedProperties;
    instance.assets = assets;
    instance.designSystem = designSystem;
    instance.datasets = datasets;
    instance.loadedData = loadedData;
  };

  destroy() {
    this.componentRef?.destroy();
    delete (this.componentRef as any)?.location;
    this.componentRef = null;
  }

  reinsertComponent(doc: Document, appRef: NgModuleRef<cd.IRenderOutletApp>) {
    this.componentRef?.destroy();
    this.componentRef = insertComponentIntoOutlet(doc, appRef);
    this.update();
  }

  postMessage(message: CdPostMessage) {
    messagingService.postMessageToParent(message);
  }
}
