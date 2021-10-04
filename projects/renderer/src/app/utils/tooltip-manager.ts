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

import { fromEvent, race, of, Subscription, merge } from 'rxjs';
import { half, clamp } from 'cd-utils/numeric';
import { Position, Display } from 'cd-interfaces';
import * as rx from 'rxjs/operators';
import { DIV_TAG } from 'cd-common/consts';
import { UnitTypes } from 'cd-metadata/units';

const TOOLTIP_CLASS = 'co-tooltip';
const TOOLTIP_DELAY = 400;
const TOOLTIP_DURATION = 200;
const TOOLTIP_EASE = 'ease-out';
const TOOLTIP_HEIGHT = 26;
const TOOLTIP_BUFFER_SPACING = 10;
const TOOLTIP_ATTRIBUTE = '[data-tooltip]';

type Tooltip = [label: string, position: Position, element: HTMLElement];

export class TooltipManager {
  private _tooltip?: HTMLElement | null;
  private _subscription = Subscription.EMPTY;
  private _animation?: Animation;
  private _timer = 0;

  attachEvents(doc: HTMLDocument) {
    this.createTooltipElement(doc);
    const mouseOver$ = fromEvent(doc.body, 'mouseover');

    this._subscription = mouseOver$
      .pipe(
        rx.auditTime(24),
        rx.map((e) => (e.target as HTMLElement).closest(TOOLTIP_ATTRIBUTE) as HTMLElement | null),
        rx.map<HTMLElement | null, Tooltip | undefined>((elem) => {
          if (!elem) return;
          const text = elem?.dataset?.tooltip ?? '';
          if (!text) return;
          const direction = (elem?.dataset?.ttdirection as Position) ?? Position.Top;
          const tt: Tooltip = [text, direction, elem];
          return tt;
        }),
        rx.distinctUntilChanged((x, y) => (x && x[0]) === (y && y[0])),
        rx.switchMap((data) => {
          if (!data) return of(undefined);
          const [, , element] = data;
          const leave$ = fromEvent<MouseEvent>(element, 'mouseleave');
          const scroll$ = fromEvent<Event>(doc, 'scroll', { capture: true, passive: true });
          const down$ = fromEvent<MouseEvent>(element, 'mousedown');
          const events = race(down$, leave$, scroll$).pipe(rx.mapTo(undefined), rx.first());
          return merge(of(data), events);
        }),
        rx.distinctUntilChanged()
      )
      .subscribe(this.onTooltip);
  }

  createTooltipElement(outletDocument: HTMLDocument) {
    const tooltip = outletDocument.createElement(DIV_TAG);
    tooltip.className = TOOLTIP_CLASS;
    outletDocument.body.append(tooltip);
    this._tooltip = tooltip;
  }

  resetTooltip() {
    clearTimeout(this._timer);
    if (this._animation) this._animation.cancel();
    if (!this._tooltip) return;
    this._tooltip.style.display = 'none';
  }

  showTooltip(data: Tooltip) {
    const { _tooltip } = this;
    const win = _tooltip?.ownerDocument?.defaultView;
    if (!_tooltip || !win) return;

    const [text, direction, element] = data;
    _tooltip.textContent = text;
    _tooltip.style.display = Display.Grid;
    const tooltipBounds = _tooltip.getBoundingClientRect() as DOMRect;
    const [left, top] = this.calculatePosition(element, tooltipBounds, direction, win);
    _tooltip.style.top = `${Math.round(top)}${UnitTypes.Pixels}`;
    _tooltip.style.left = `${Math.round(left)}${UnitTypes.Pixels}`;
    this.animateTooltipIn(_tooltip);
  }

  animateTooltipIn(tooltip: HTMLElement) {
    const transition = [{ opacity: 0 }, { opacity: 1 }];
    const config = { duration: TOOLTIP_DURATION, easing: TOOLTIP_EASE };
    this._animation = tooltip.animate(transition, config);
  }

  onTooltip = (data: Tooltip | undefined) => {
    this.resetTooltip();
    if (!data) return;
    this._timer = window.setTimeout(() => this.showTooltip(data), TOOLTIP_DELAY);
  };

  private calculatePosition(
    element: HTMLElement,
    tooltipBounds: DOMRect,
    direction: string,
    win: Window
  ) {
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

    return this.getTooltipPosition(tooltipBounds, top, left, win);
  }

  private getTooltipPosition(
    containerRect: DOMRect,
    currentY: number,
    currentX: number,
    win: Window
  ): [number, number] {
    const { width, height } = containerRect;
    const { innerWidth, innerHeight, outerHeight, screenY, screenX } = win;
    const { availLeft = 0, availTop = 0, availHeight, availWidth } = <any>win.screen;

    // Checks to see if the overlay is cut off by the browser window position
    const h = availHeight - screenY - outerHeight + availTop;
    const w = availWidth - screenX - innerWidth + availLeft;
    const hy = h < 0 ? innerHeight + h : innerHeight;
    const hx = w < 0 ? innerWidth + w : innerWidth;

    const xp = clamp(currentX, TOOLTIP_BUFFER_SPACING, hx - width - TOOLTIP_BUFFER_SPACING);
    const yp = clamp(currentY, TOOLTIP_BUFFER_SPACING, hy - height - TOOLTIP_BUFFER_SPACING);

    return [xp, yp];
  }

  clearEvents() {
    this._subscription.unsubscribe();
    this.resetTooltip();
    this._tooltip?.remove();
    this._tooltip = null;
  }
}
