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

import { ApplicationRef, NgZone, RendererFactory2, NgModuleRef, PlatformRef } from '@angular/core';

export interface IRenderOutletApp {
  appRef: ApplicationRef;
  ngZone: NgZone;
  rendererFactory2: RendererFactory2;
}

export type RegisterRenderOutletFunction = (
  id: string,
  outletDocument: HTMLDocument,
  outletAppModuleRef: NgModuleRef<IRenderOutletApp>,
  outletPlaftorm: PlatformRef
) => void;

export type RegisterCodeComponentOutletFunction = (
  id: string,
  outletDocument: HTMLDocument,
  previeMode?: boolean
) => void;

export type UnRegisterOutletFunction = (outletDocument: HTMLDocument) => void;

export interface IRendererWindow extends Window {
  registerRenderOutlet: RegisterRenderOutletFunction;
  unRegisterRenderOutlet: UnRegisterOutletFunction;
  registerCodeComponentOutlet: RegisterCodeComponentOutletFunction;
  unRegisterCodeComponentOutlet: UnRegisterOutletFunction;
  handleCodeComponentError: (codeComponentId: string, error: any) => void;
}
