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

import {
  Injectable,
  ComponentRef,
  ApplicationRef,
  ComponentFactoryResolver,
  Injector,
} from '@angular/core';
import { LoadingOverlayComponent } from './loading-overlay.component';

@Injectable({
  providedIn: 'root',
})
export class LoadingOverlayService {
  private _overlayRef?: ComponentRef<LoadingOverlayComponent>;

  constructor(
    private _resolver: ComponentFactoryResolver,
    private _appRef: ApplicationRef,
    private _injector: Injector
  ) {}

  public showLoadingOverlay() {
    this.hideLoadingOverlay();

    const factory = this._resolver.resolveComponentFactory(LoadingOverlayComponent);
    this._overlayRef = factory.create(this._injector);
    this._appRef.attachView(this._overlayRef.hostView);
    document.body.appendChild(this._overlayRef.location.nativeElement);
  }

  public hideLoadingOverlay() {
    const { _overlayRef, _appRef } = this;
    if (_overlayRef) {
      _appRef.detachView(_overlayRef.hostView);
      _overlayRef.destroy();
      this._overlayRef = undefined;
    }
  }
}
