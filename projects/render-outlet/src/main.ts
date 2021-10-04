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

import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { RenderOutletAppModule, RenderOutletAppModuleWithAnimations } from './app.module';
import { environment } from './environments/environment';
import { setupDomOverrides } from './dom-overrides';
import { getRendererFrame, pageHideEventWrapper } from './utils';
import { IRendererWindow } from 'cd-interfaces';

import {
  ANIMATIONS_ENABLED_QUERY_PARAM,
  CODE_COMPONENT_OUTLET_QUERY_PARAM,
} from 'cd-common/consts';

if (environment.production) {
  enableProdMode();
}

const { search } = window.location;
const codeComponentOutlet = search.includes(`${CODE_COMPONENT_OUTLET_QUERY_PARAM}=true`);
const animationsEnabled = search.includes(`${ANIMATIONS_ENABLED_QUERY_PARAM}=true`);
const rendererFrame = getRendererFrame(window);

/** Add DOM overrides to intercept and insert scoped custom element tag names */
setupDomOverrides(window, document, rendererFrame);

// If codeComponentOutlet query param is set to true, this outlet does not bootstrap an Angular
// app. It is instead used to inject a code component preview
const bootstrapCodeComponentOutlet = (frame: IRendererWindow, windowName: string) => {
  frame.registerCodeComponentOutlet(windowName, document, animationsEnabled);
  pageHideEventWrapper(() => frame.unRegisterCodeComponentOutlet(document));
};

// else we bootstrap the RenderOutletApp module for a normal rendering approach
const bootstrapDefaultOutlet = (frame: IRendererWindow, windowName: string) => {
  const appModule = animationsEnabled ? RenderOutletAppModuleWithAnimations : RenderOutletAppModule;
  const outletPlatform = platformBrowserDynamic();

  outletPlatform
    .bootstrapModule(appModule)
    .then((appModuleRef) => {
      frame.registerRenderOutlet(windowName, document, appModuleRef, outletPlatform);
      pageHideEventWrapper(() => frame.unRegisterRenderOutlet(document));
    })
    .catch((err) => console.error(err));
};

if (rendererFrame) {
  const windowName = window.name; // window.name is a reference to the board or symbol id to be rendered in this outlet
  if (codeComponentOutlet) bootstrapCodeComponentOutlet(rendererFrame, windowName);
  else bootstrapDefaultOutlet(rendererFrame, windowName);
}
