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

import { AfterViewInit, Directive, ElementRef, OnDestroy, HostBinding } from '@angular/core';
import { MatMenuTrigger } from '@angular/material/menu';
import { fromEvent, Subscription } from 'rxjs';
import { EventTrigger } from 'cd-interfaces';
import { PREVENT_CLICK_ACTIONS_ATTR } from 'cd-common/consts';

/** Manually control behavior of mat menu trigger */
@Directive({ selector: '[cdCaptureMatMenu]' })
export class CaptureMatMenuDirective implements AfterViewInit, OnDestroy {
  private _subscriptions = Subscription.EMPTY;

  @HostBinding(`attr.${PREVENT_CLICK_ACTIONS_ATTR}`)
  preventClickActions = true;

  constructor(private _elemRef: ElementRef, private menu: MatMenuTrigger) {}

  get element() {
    return this._elemRef.nativeElement;
  }

  ngAfterViewInit(): void {
    // mat menu specifically triggers on click event,
    // mousedown and keydown are only used for internal a11y tracking
    const click$ = fromEvent<MouseEvent>(this.element, EventTrigger.Click, { capture: true });
    this._subscriptions = click$.subscribe(this.handleClickEvent);
  }

  ngOnDestroy() {
    this._subscriptions.unsubscribe();
  }

  handleClickEvent = (e: MouseEvent) => {
    const menuHasItems = this.menu?.menuData?.$implicit?.length > 0;

    e.stopImmediatePropagation();

    // only open if has menu items (fixes mat menu empty overlay bug)
    if (menuHasItems) {
      this.menu.openMenu();
    }
  };
}
