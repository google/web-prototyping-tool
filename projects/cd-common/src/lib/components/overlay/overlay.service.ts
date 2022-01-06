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
  ApplicationRef,
  ComponentFactoryResolver,
  ComponentRef,
  EmbeddedViewRef,
  EventEmitter,
  Injectable,
  Injector,
  ElementRef,
  OnDestroy,
  Type,
} from '@angular/core';
import { OverlayWrapperComponent } from './overlay.wrapper.component';
import { Subscription } from 'rxjs';

export interface IModalEdgeSize {
  viewport?: number; // vh or vw
  percentage?: number; // %
}

export interface IOverlayConfig {
  x?: number;
  y?: number;
  /**
   * This is used to cut out an area so users can interact with the parent like input and select
   * but clicking out side will close the overlay
   */
  clipParentRect?: boolean;
  /**
   * Provide parent dimensions to auto position the overlay
   */
  parentRect?: DOMRect;
  alignRight?: boolean;
  alignBottom?: boolean;

  // x, y spacing from the parent rect when auto positioning the overlay
  xOffset?: number;
  yOffset?: number;
  /**
   * Match the width of the parent Rect when creating the overlay
   */
  matchWidth?: boolean;
  disableAutoFocus?: boolean;
  noPadding?: boolean;
  blurOnClose?: boolean;
  /**
   * Prevent closing the overlay when the user clicks outside the container or hits ESC
   * When this value is assigned, prepareForClose event will be emitted
   */
  disableAutoClose?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class OverlayService implements OnDestroy {
  private _overlayRef?: ComponentRef<OverlayWrapperComponent>;
  private _componentRef?: ComponentRef<any>;
  private _subscription: Subscription = Subscription.EMPTY;

  public closed = new EventEmitter<void>();
  public prepareForClose = new EventEmitter<void>();

  constructor(
    private _resolver: ComponentFactoryResolver,
    private _appRef: ApplicationRef,
    private _injector: Injector
  ) {}

  ngOnDestroy(): void {
    this._subscription.unsubscribe();
  }

  attachComponent<T>(component: Type<T>, config: IOverlayConfig = {}): ComponentRef<T> {
    this.close();

    const factory = this._resolver.resolveComponentFactory(component);
    const overlayFactory = this._resolver.resolveComponentFactory(OverlayWrapperComponent);
    const componentRef: ComponentRef<T> = factory.create(this._injector);

    this._overlayRef = overlayFactory.create(this._injector, [
      [componentRef.location.nativeElement],
    ]);

    this._overlayRef.instance.config = config;

    this._subscription.unsubscribe();
    this._subscription = this._overlayRef.instance.close.subscribe(this.close);

    this._appRef.attachView(this._overlayRef.hostView);
    this._appRef.attachView(componentRef.hostView);

    const domElem = this.elementFromRef(this._overlayRef);
    const [first] = this._appRef.components;
    const rootElement: ElementRef | undefined = first.injector.get(ElementRef);
    if (rootElement) rootElement.nativeElement.appendChild(domElem);
    this._componentRef = componentRef;
    return componentRef;
  }

  /**
   * This ensures that if an inputs commit their changes on blur
   * This is useful for modal elements
   */
  blurAnyFocusedFields() {
    const el = document.querySelector(':focus') as HTMLElement;
    if (el) el.blur();
  }

  get isAutoCloseDisabled(): boolean {
    return this._overlayRef?.instance.config?.disableAutoClose === true;
  }

  get canBlurOnClose(): boolean {
    return this._overlayRef?.instance.config?.blurOnClose === true;
  }

  detachAndClose() {
    const { _overlayRef, _componentRef } = this;
    if (!_overlayRef || !_componentRef) return;
    if (this.canBlurOnClose) this.blurAnyFocusedFields();
    this._subscription.unsubscribe();
    this._appRef.detachView(_overlayRef.hostView);
    this._appRef.detachView(_componentRef.hostView);
    _overlayRef.destroy();
    _componentRef.destroy();
    this._overlayRef = undefined;
    this._componentRef = undefined;
    this.closed.emit();
  }

  close = () => {
    if (this.isAutoCloseDisabled) return this.prepareForClose.emit();
    this.detachAndClose();
  };

  updateConfig = (config: IOverlayConfig = {}) => {
    const { _overlayRef } = this;
    if (!_overlayRef) return;
    _overlayRef.instance.updateConfig(config);
  };

  get isVisible() {
    return this._componentRef !== undefined;
  }

  elementFromRef(componentRef: ComponentRef<any>) {
    return (componentRef.hostView as EmbeddedViewRef<any>).rootNodes[0] as HTMLElement;
  }

  // Used to update the clipping recangle for autocomplete inputs
  updateParentWidth(value: number) {
    if (this._overlayRef) {
      this._overlayRef.instance.overrideParentRectWidth = value;
    }
  }

  toggleFullscreen(fullscreen: boolean) {
    if (this._overlayRef) this._overlayRef.instance.fullscreen = fullscreen;
  }

  updateParentTop(value: number) {
    if (this._overlayRef) {
      this._overlayRef.instance.overrideTop = value;
    }
  }
}
