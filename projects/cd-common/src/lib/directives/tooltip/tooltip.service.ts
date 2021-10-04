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

import { Injectable, Renderer2, RendererFactory2, NgZone } from '@angular/core';
import { map, distinctUntilChanged, switchMap, mapTo, first, auditTime } from 'rxjs/operators';
import { fromEvent, race, of, merge } from 'rxjs';
import { applyDefaultUnits, getDocumentVisibilityEvent$ } from 'cd-common/utils';
import { half, clamp } from 'cd-utils/numeric';
import { Position, Display } from 'cd-interfaces';
import { SPAN_TAG } from 'cd-common/consts';

// See src/styles/tooltip.scss
const TOOLTIP_CLASS = 'cd-tooltip';
const TOOLTIP_DELAY = 400;
const TOOLTIP_DURATION = 200;
const TOOLTIP_EASE = 'ease-out';
const TOOLTIP_HEIGHT = 26;
const TOOLTIP_BUFFER_SPACING = 10;
const TOOLTIP_ATTRIBUTE = '[data-tooltip]';

const DISPLAY_STYLE = 'display';

@Injectable({
  providedIn: 'root',
})
export class TooltipService {
  private _tooltip?: HTMLElement;
  private _renderer: Renderer2;
  private _animation?: Animation;
  private _timer = 0;

  constructor(protected rendererFactory: RendererFactory2, private _zone: NgZone) {
    this._renderer = rendererFactory.createRenderer(null, null);
    this._zone.runOutsideAngular(() => {
      const mouseOver$ = fromEvent(document.body, 'mouseover');
      const visibility$ = getDocumentVisibilityEvent$();

      mouseOver$
        .pipe(
          auditTime(24),
          map((e) => (e.target as HTMLElement).closest(TOOLTIP_ATTRIBUTE) as HTMLElement | null),
          map<HTMLElement | null, [string, string, HTMLElement] | undefined>((element) => {
            if (!element) return;
            const text = element?.dataset?.tooltip ?? '';
            const direction = element?.dataset?.ttdirection ?? Position.Top;
            return [text, direction, element];
          }),
          distinctUntilChanged((x, y) => (x && x[0]) === (y && y[0])),
          switchMap((data) => {
            if (!data) return of(undefined);
            const [, , element] = data;
            const leave$ = fromEvent<MouseEvent>(element, 'mouseleave');
            const down$ = fromEvent<MouseEvent>(element, 'mousedown');
            const scroll$ = fromEvent<Event>(document, 'scroll', { capture: true, passive: true });
            const events = race(down$, visibility$, scroll$, leave$).pipe(
              mapTo(undefined),
              first()
            );
            return merge(of(data), events);
          }),
          distinctUntilChanged()
        )
        .subscribe(this.onTooltip);
    });
  }

  get tooltip() {
    const { _renderer } = this;
    const tooltip = this._tooltip || _renderer.createElement(SPAN_TAG);
    if (!this._tooltip) {
      _renderer.addClass(tooltip, TOOLTIP_CLASS);
      this._tooltip = tooltip;
      _renderer.appendChild(document.body, tooltip);
    }
    return tooltip;
  }

  animateTooltipIn(tooltip: HTMLElement) {
    const transition = [{ opacity: 0 }, { opacity: 1 }];
    const config = { duration: TOOLTIP_DURATION, easing: TOOLTIP_EASE };
    this._animation = tooltip.animate(transition, config);
  }

  showTooltip(data: [string, string, HTMLElement]) {
    const { tooltip, _renderer } = this;
    const [text, direction, element] = data;
    _renderer.setProperty(tooltip, 'textContent', text);
    _renderer.setStyle(tooltip, DISPLAY_STYLE, Display.Grid);
    const tooltipBounds = (tooltip as HTMLElement).getBoundingClientRect() as DOMRect;
    const [left, top] = this.calculatePosition(element, tooltipBounds, direction);
    _renderer.setStyle(tooltip, Position.Top, applyDefaultUnits(Math.round(top)));
    _renderer.setStyle(tooltip, Position.Left, applyDefaultUnits(Math.round(left)));

    this.animateTooltipIn(tooltip);
  }

  resetTooltip() {
    clearTimeout(this._timer);
    if (this._animation) this._animation.cancel();
    this._renderer.setStyle(this.tooltip, DISPLAY_STYLE, 'none');
  }

  onTooltip = (data: [string, string, HTMLElement] | undefined) => {
    this.resetTooltip();
    if (!data) return;
    this._timer = window.setTimeout(() => this.showTooltip(data), TOOLTIP_DELAY);
  };

  private calculatePosition(element: HTMLElement, tooltipBounds: DOMRect, direction: string) {
    const bounds = element.getBoundingClientRect();
    let top, left;

    switch (direction) {
      case Position.Right:
        top = bounds.top + half(bounds.height) - half(tooltipBounds.height);
        left = bounds.right + TOOLTIP_BUFFER_SPACING;
        break;
      case Position.Bottom:
        top = bounds.bottom + TOOLTIP_BUFFER_SPACING;
        left = bounds.left + half(bounds.width) - half(tooltipBounds.width);
        break;
      case Position.Left:
        top = bounds.top + half(bounds.height) - half(tooltipBounds.height);
        left = bounds.left - TOOLTIP_BUFFER_SPACING - tooltipBounds.width;
        break;
      default:
        top = bounds.top - TOOLTIP_HEIGHT;
        left = bounds.left + half(bounds.width) - half(tooltipBounds.width);
    }

    return this.getTooltipPosition(tooltipBounds, top, left);
  }

  private getTooltipPosition(
    containerRect: DOMRect,
    currentY: number,
    currentX: number
  ): [number, number] {
    const { width, height } = containerRect;
    const { innerWidth, innerHeight, outerHeight, screenY, screenX } = window;
    const { availLeft = 0, availTop = 0, availHeight, availWidth } = <any>window.screen;

    // Checks to see if the overlay is cut off by the browser window position
    const h = availHeight - screenY - outerHeight + availTop;
    const w = availWidth - screenX - innerWidth + availLeft;
    const hy = h < 0 ? innerHeight + h : innerHeight;
    const hx = w < 0 ? innerWidth + w : innerWidth;

    const xp = clamp(currentX, TOOLTIP_BUFFER_SPACING, hx - width - TOOLTIP_BUFFER_SPACING);
    const yp = clamp(currentY, TOOLTIP_BUFFER_SPACING, hy - height - TOOLTIP_BUFFER_SPACING);

    return [xp, yp];
  }
}
