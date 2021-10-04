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

import { ComponentRef, OnDestroy, Directive } from '@angular/core';
import { AbstractOverlayContentDirective } from './abstract.overlay-content';
import { OverlayService } from '../overlay.service';
import { ClassType } from 'cd-interfaces';

@Directive()
export abstract class AbstractOverlayControllerDirective implements OnDestroy {
  private _componentRef?: ComponentRef<any>;

  constructor(protected _overlayService: OverlayService) {}

  public showModal<T extends AbstractOverlayContentDirective>(
    // Funky syntax to denote passing in a Class that extends AbstractOverlayContentDirective
    // (i.e. a function/constructor with any amount of params that returns T where T extends AbstractOverlayContentDirective)
    componentClass: ClassType<T>
  ): ComponentRef<T> {
    const config = { noPadding: true };
    const componentRef = this._overlayService.attachComponent(componentClass, config);
    const subscriptions = componentRef.instance.dismissOverlay.subscribe(this._cleanupComponentRef);
    componentRef.onDestroy(() => subscriptions.unsubscribe());
    this._componentRef = componentRef;
    return componentRef;
  }

  public closeModal = () => this._overlayService.close();

  private _cleanupComponentRef = () => {
    if (this._componentRef) {
      this._overlayService.close();
      this._componentRef.destroy();
      this._componentRef = undefined;
    }
  };

  ngOnDestroy() {
    this._cleanupComponentRef();
  }
}
