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

import { Directive, ElementRef, EventEmitter, OnDestroy, Output } from '@angular/core';
import { Subscription } from 'rxjs';
import { OverlayService } from '../../overlay/overlay.service';
import { IHyperlink, LinkOverlayComponent } from './link-overlay.component';
import * as utils from 'cd-utils/selection';

const OVERLAY_OFFSET_X = 240;
const OVERLAY_OFFSET_Y = 50;

@Directive({ selector: '[cdLinkOverlay]' })
export class LinkOverlayDirective implements OnDestroy {
  private _subscriptions: Subscription = Subscription.EMPTY;

  @Output() linkCancel = new EventEmitter<void>();
  @Output() removeLink = new EventEmitter<Range>();
  @Output() updateLink = new EventEmitter<IHyperlink>();

  constructor(private _overlayService: OverlayService, private _elemRef: ElementRef) {}

  ngOnDestroy(): void {
    this._subscriptions.unsubscribe();
  }

  get bounds() {
    return this._elemRef.nativeElement.getBoundingClientRect();
  }

  create(linkData: IHyperlink) {
    const { range } = linkData;
    const { top, left } = this.bounds;
    const x = left - OVERLAY_OFFSET_X;
    const y = top - OVERLAY_OFFSET_Y;
    const componentRef = this._overlayService.attachComponent(LinkOverlayComponent, { x, y });
    componentRef.instance.link = linkData;
    const subscriptions = new Subscription();
    subscriptions.add(componentRef.instance.linkChange.subscribe(this.onLinkChange));
    subscriptions.add(componentRef.instance.removeLink.subscribe(this.onRemoveLink));
    componentRef.onDestroy(() => subscriptions.unsubscribe());
    this._subscriptions.unsubscribe();
    this._subscriptions = this._overlayService.closed.subscribe(() => {
      this.linkCancel.emit();
      if (!range) return;
      utils.removeAllRanges();
    });
  }

  onLinkChange = (link: IHyperlink) => {
    if (!link.range) return;
    this._overlayService.close();
    this.updateLink.emit(link);
  };

  onRemoveLink = (range: Range) => {
    this._overlayService.close();
    this.removeLink.emit(range);
  };

  cleanupComponentRef() {
    this._overlayService.close();
  }
}
