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
  Component,
  Input,
  ChangeDetectionStrategy,
  Renderer2,
  ElementRef,
  OnDestroy,
  OnInit,
  HostBinding,
} from '@angular/core';
import { environment } from 'src/environments/environment';
import { RendererService } from 'src/app/services/renderer/renderer.service';
import { coerceBooleanProperty } from '@angular/cdk/coercion';
import { filter, takeWhile } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import * as consts from 'cd-common/consts';
import { IRect } from 'cd-interfaces';

// This is used to prevent the service worker from caching the url to the iframe
const SERVICE_WORKER_BYPASS = 'ngsw-bypass';

@Component({
  selector: 'app-render-outlet-iframe',
  template: '',
  styleUrls: ['./render-outlet-iframe.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RenderOutletIFrameComponent implements OnInit, OnDestroy {
  private _id = '';
  private _transparent = false;
  private _isVisible = false;
  private _iframe?: HTMLIFrameElement | null;
  private _rendererInit = false;
  private _componentInit = false;
  private _iframeCreated = false;
  private _subscription = new Subscription();

  @Input() frame?: IRect;
  @Input() preview = false;
  @Input() codeComponentOutlet = false;
  /** When true, iframe waits until visible to load */
  @Input() lazyLoad = false;

  @Input()
  @HostBinding('class.visible')
  set isVisible(visible: boolean) {
    if (this._isVisible === visible) return;
    this._isVisible = visible;
    if (visible) this._createIframe();
  }

  get isVisible() {
    return this._isVisible || this.lazyLoad === false;
  }

  @Input()
  set transparent(value: boolean | string) {
    this._transparent = coerceBooleanProperty(value);
  }

  @Input()
  set id(id: string) {
    const { _id: currentId } = this;
    if (currentId === id) return;
    this._id = id;

    if (this._iframeCreated && currentId) {
      this._retargetIframe(currentId, id);
    } else {
      this._createIframe();
    }
  }
  get id() {
    return this._id;
  }

  constructor(
    private _rendererService: RendererService,
    private _elementRef: ElementRef,
    private _renderer: Renderer2
  ) {}

  ngOnInit() {
    this._componentInit = true;

    const { rendererInitialized$ } = this._rendererService;
    // Auto unsubscribe once renderer initalizes
    const firstInit$ = rendererInitialized$.pipe(
      takeWhile((value) => value === false, true),
      filter((value) => value === true)
    );
    this._subscription.add(firstInit$.subscribe(this._onRendererInitialized));
    if (!this.codeComponentOutlet) return;
    const { reloadRenderOutlets$ } = this._rendererService;
    this._subscription.add(reloadRenderOutlets$.subscribe(this._onReloadIframe));
  }

  ngOnDestroy(): void {
    this._subscription.unsubscribe();
    this._cleanupCurrentIframe();
  }

  reset() {
    this._onReloadIframe();
  }

  private _onReloadIframe = () => {
    this._iframeCreated = false;
    this._createIframe();
  };

  private _cleanupCurrentIframe() {
    if (!this._iframe) return;
    this._renderer.removeChild(this.element, this._iframe);
    if (this._renderer.destroyNode) this._renderer.destroyNode(this._iframe);
    this._iframe = null;
  }

  private _onRendererInitialized = (init: boolean) => {
    this._rendererInit = init;
    this._createIframe();
  };

  get element() {
    return this._elementRef.nativeElement;
  }

  get url() {
    const { renderOutletUrl } = environment;
    const { preview, codeComponentOutlet } = this;
    const params = [];
    if (preview) params.push(`${consts.ANIMATIONS_ENABLED_QUERY_PARAM}=true`);
    if (codeComponentOutlet) params.push(`${consts.CODE_COMPONENT_OUTLET_QUERY_PARAM}=true`);
    params.push(SERVICE_WORKER_BYPASS);
    return `${renderOutletUrl}?${params.join('&')}`;
  }

  // private _destroyIframe() {
  //   if (!this.lazyLoad) return;
  //   if (!this._iframeCreated) return;
  //   this._cleanupCurrentIframe();
  //   this._iframeCreated = false;
  // }

  private _createIframe() {
    if (this.lazyLoad && !this._isVisible) return;
    const { _id, _rendererInit, _componentInit, _iframeCreated } = this;
    if (!_rendererInit || !_id || !_componentInit || _iframeCreated) return;
    const { url, preview } = this;
    const iframe = this._renderer.createElement(consts.IFRAME_TAG);
    this._renderer.setAttribute(iframe, consts.NAME_ATTR, _id);
    this._renderer.setAttribute(iframe, consts.SANDBOX_ATTR, consts.getIframeSandbox(preview));
    this._renderer.setAttribute(iframe, consts.ALLOW_ATTR, consts.getIframeFeaturePolicy());
    this._renderer.setAttribute(iframe, consts.SRC_ATTR, url);

    if (this._transparent) {
      this._renderer.setAttribute(iframe, consts.ALLOW_TRANSPARENCY, 'true');
    }

    this._renderer.appendChild(this.element, iframe);
    this._cleanupCurrentIframe();
    this._iframe = iframe;
    this._iframeCreated = true;
  }

  private _retargetIframe(currentId: string, newId: string) {
    this._rendererService.retargetOutlet(currentId, newId);
  }
}
