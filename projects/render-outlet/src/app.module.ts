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

/* eslint-disable @angular-eslint/no-empty-lifecycle-method */
/* eslint-disable @angular-eslint/use-lifecycle-interface */
import type { IRenderOutletApp } from 'cd-interfaces';
import { BrowserModule } from '@angular/platform-browser';
import { NgModule, ApplicationRef, NgZone, RendererFactory2 } from '@angular/core';
import {
  NoopAnimationsModule,
  BrowserAnimationsModule,
} from '@angular/platform-browser/animations';

@NgModule({
  imports: [BrowserModule, NoopAnimationsModule],
})
export class RenderOutletAppModule implements IRenderOutletApp {
  constructor(
    public appRef: ApplicationRef,
    public ngZone: NgZone,
    public rendererFactory2: RendererFactory2
  ) {}

  ngDoBootstrap() {}
}

@NgModule({
  imports: [BrowserModule, BrowserAnimationsModule],
})
export class RenderOutletAppModuleWithAnimations implements IRenderOutletApp {
  constructor(
    public appRef: ApplicationRef,
    public ngZone: NgZone,
    public rendererFactory2: RendererFactory2
  ) {}

  ngDoBootstrap() {}
}
