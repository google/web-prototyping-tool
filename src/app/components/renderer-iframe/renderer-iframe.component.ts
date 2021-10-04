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
  ChangeDetectionStrategy,
  ElementRef,
  OnDestroy,
  AfterViewInit,
  ChangeDetectorRef,
  HostBinding,
} from '@angular/core';
import { SafeResourceUrl, DomSanitizer } from '@angular/platform-browser';
import { environment } from 'src/environments/environment';
import { RendererService } from 'src/app/services/renderer/renderer.service';
import { getIframeSandbox, SANDBOX_ATTR, SRC_ATTR } from 'cd-common/consts';

@Component({
  selector: 'iframe[app-renderer-iframe]',
  template: '',
  styleUrls: ['./renderer-iframe.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RendererIFrameComponent implements OnDestroy, AfterViewInit {
  @HostBinding(SRC_ATTR) iframeSrc: SafeResourceUrl;
  @HostBinding(SANDBOX_ATTR) sandbox = getIframeSandbox();

  constructor(
    private _sanitizer: DomSanitizer,
    private _rendererService: RendererService,
    private _elemRef: ElementRef,
    private _cdRef: ChangeDetectorRef
  ) {
    this.iframeSrc = this._sanitizer.bypassSecurityTrustResourceUrl(environment.rendererUrl);
  }

  ngOnDestroy() {
    this._rendererService.setRendererFrame(undefined);
  }

  ngAfterViewInit() {
    this._rendererService.setRendererFrame(this._elemRef.nativeElement);
    this._cdRef.detach();
  }
}
