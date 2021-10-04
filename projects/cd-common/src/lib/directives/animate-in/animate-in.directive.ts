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

import { Directive, Input, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';

@Directive({
  selector: '[cdAnimateIn]',
})
export class AnimateInDirective implements AfterViewInit, OnDestroy {
  private _animation?: Animation;

  @Input() cdAnimateIn = false;

  constructor(private _elemRef: ElementRef) {}

  animateCardIntoView() {
    const { nativeElement } = this._elemRef;
    const { height } = nativeElement.getBoundingClientRect();
    const details = { ease: 'var(--cd-transition-timing)', duration: 175 };
    const animation = [
      { height: 0, opacity: 0, transform: 'scale(0.95)' },
      { height: `${height}px`, opacity: 1, transform: 'scale(1)' },
    ];
    this._animation = nativeElement.animate(animation, details);
  }

  ngAfterViewInit(): void {
    if (this.cdAnimateIn) return this.animateCardIntoView();
  }

  ngOnDestroy(): void {
    this._animation?.cancel();
  }
}
