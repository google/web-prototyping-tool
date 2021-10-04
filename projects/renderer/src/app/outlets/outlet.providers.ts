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

// prettier-ignore
import {  ErrorHandler, Injectable, NgModuleRef, NgZone, PLATFORM_ID, RendererFactory2, } from '@angular/core';
import { DOCUMENT, ɵPLATFORM_BROWSER_ID as PLATFORM_BROWSER_ID } from '@angular/common';
import { MAT_DATE_LOCALE, MATERIAL_SANITY_CHECKS } from '@angular/material/core';
import { ErrorHandlerService } from '../services/error-handler.service';
import { HighContrastModeDetector } from '@angular/cdk/a11y';
import type { IRenderOutletApp } from 'cd-interfaces';
import {
  _MAT_INK_BAR_POSITIONER,
  ɵangular_material_src_material_tabs_tabs_a as _MAT_INK_BAR_POSITIONER_FACTORY,
  MAT_TABS_CONFIG,
  MatTabsConfig,
} from '@angular/material/tabs';

@Injectable({ providedIn: 'root' })
class HighContrastModeStub extends HighContrastModeDetector {
  getHighContrastMode() {
    return 0;
  }
  _applyBodyHighContrastModeCssClasses() {
    return;
  }
}

export default function (
  outletDocument: HTMLDocument,
  outletAppModuleRef: NgModuleRef<IRenderOutletApp>
) {
  const { ngZone, rendererFactory2 } = outletAppModuleRef.instance;
  return [
    { provide: NgZone, useValue: ngZone },
    { provide: RendererFactory2, useValue: rendererFactory2 },
    { provide: PLATFORM_ID, useValue: PLATFORM_BROWSER_ID },
    { provide: DOCUMENT, useValue: outletDocument },
    { provide: MAT_DATE_LOCALE, useValue: navigator.language },
    { provide: _MAT_INK_BAR_POSITIONER, useFactory: _MAT_INK_BAR_POSITIONER_FACTORY },
    { provide: MATERIAL_SANITY_CHECKS, useValue: false }, // disable material sanity checks
    { provide: ErrorHandler, useClass: ErrorHandlerService },
    { provide: HighContrastModeDetector, useClass: HighContrastModeStub },
    {
      provide: MAT_TABS_CONFIG,
      useValue: { animationDuration: '0' } as MatTabsConfig,
    },
  ];
}
