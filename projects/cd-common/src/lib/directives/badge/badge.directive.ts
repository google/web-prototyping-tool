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

import { Directive, Renderer2, RendererFactory2, ElementRef, Input } from '@angular/core';
import { DIV_TAG, LayoutAlignment } from 'cd-common/consts';
import { applyDefaultUnits } from 'cd-common/utils';
import { Position, ReadonlyRecord } from 'cd-interfaces';
import { half } from 'cd-utils/numeric';

type LayoutCorners = Exclude<
  LayoutAlignment,
  | LayoutAlignment.BottomCenter
  | LayoutAlignment.Center
  | LayoutAlignment.Left
  | LayoutAlignment.Right
  | LayoutAlignment.TopCenter
>;

const BADGE_SIZE = 18;

/** These classes are defined in src/styles/badge.scss */
const BADGE_CLASS = 'cd-badge';
const INDICATOR_BADGE_CLASS = 'cd-badge-indicator';
const NUMERIC_BADGE_CLASS = 'cd-badge-numeric';

interface IBadgePosition {
  top?: number;
  left?: number;
  bottom?: number;
  right?: number;
}

@Directive({
  selector: '[cdBadge], [cdIndicator]',
})
export class BadgeDirective {
  private _badge?: HTMLElement;
  private _badgeText = '';
  private _badgePosition: LayoutCorners = LayoutAlignment.TopLeft;
  private _showIndicator = false;
  private _renderer: Renderer2;

  @Input('cdIndicator')
  set indicator(showIndicator: boolean) {
    this._showIndicator = showIndicator;
    this.updateIndicator();
  }

  @Input('cdBadge')
  set badgeText(value: string) {
    this._badgeText = value;
    this.updateBadge();
  }
  get badgeText() {
    return this._badgeText;
  }

  @Input('cdBadgePosition')
  set position(value: LayoutCorners) {
    this._badgePosition = value;
    this.updateBadge();
  }
  get position() {
    return this._badgePosition;
  }

  constructor(private _rendererFactory: RendererFactory2, private _elementRef: ElementRef) {
    this._renderer = this._rendererFactory.createRenderer(null, null);
  }

  updateIndicator() {
    this.clearBadge();

    if (!this._showIndicator) return;

    const { _renderer, _elementRef } = this;
    const badge = _renderer.createElement(DIV_TAG);

    this._renderer.addClass(badge, BADGE_CLASS);
    this._renderer.addClass(badge, INDICATOR_BADGE_CLASS);
    this._badge = badge;

    _renderer.appendChild(_elementRef.nativeElement, badge);
  }

  setBadgePosition(badge: HTMLElement, position: Position, value: number) {
    this._renderer.setStyle(badge, position, applyDefaultUnits(value));
  }

  private updateBadge() {
    this.clearBadge();
    const { badgeText, _renderer, _elementRef } = this;
    if (!badgeText) return;

    const badge = _renderer.createElement(DIV_TAG);
    this._renderer.addClass(badge, BADGE_CLASS);
    this._renderer.addClass(badge, NUMERIC_BADGE_CLASS);
    const { top, left, bottom, right } = this.getPosition();
    if (top) this.setBadgePosition(badge, Position.Top, top);
    if (left) this.setBadgePosition(badge, Position.Left, left);
    if (bottom) this.setBadgePosition(badge, Position.Bottom, bottom);
    if (right) this.setBadgePosition(badge, Position.Right, right);
    const badgeTextElem = _renderer.createText(badgeText);
    this._badge = badge;
    _renderer.appendChild(badge, badgeTextElem);
    _renderer.appendChild(_elementRef.nativeElement, badge);
  }

  private getPosition(): IBadgePosition {
    const verticalOffset = Math.round(-1 * half(BADGE_SIZE));
    const horizontalOffset = Math.round(-1 * BADGE_SIZE * 0.25);
    const { _badgePosition } = this;
    const positions: ReadonlyRecord<LayoutCorners, IBadgePosition> = {
      [LayoutAlignment.BottomLeft]: { bottom: verticalOffset, left: horizontalOffset },
      [LayoutAlignment.BottomRight]: { bottom: verticalOffset, right: horizontalOffset },
      [LayoutAlignment.TopLeft]: { top: verticalOffset, left: horizontalOffset },
      [LayoutAlignment.TopRight]: { top: verticalOffset, right: horizontalOffset },
    };

    return positions[_badgePosition] || positions[LayoutAlignment.TopLeft];
  }

  private clearBadge() {
    const { _badge, _elementRef } = this;
    if (!_badge) return;
    this._renderer.removeChild(_elementRef.nativeElement, _badge);
    this._badge = undefined;
  }
}
