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
  IOverflow,
  IOverflowModel,
  OverflowState,
  ScrollDirection,
  SCROLL_DIRECTION_MENU,
} from './overflow-props.consts';
import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter } from '@angular/core';
import * as cd from 'cd-interfaces';

@Component({
  selector: 'app-overflow-props',
  templateUrl: './overflow-props.component.html',
  styleUrls: ['./overflow-props.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OverflowPropsComponent {
  private _state = OverflowState.Visible;
  private _scrollDirection = ScrollDirection.Vertical;
  public scrollDirectionMenu = SCROLL_DIRECTION_MENU;
  public OverflowState = OverflowState;

  @Input() isBoard = false;

  @Input()
  set value(value: IOverflow | undefined) {
    this.updateState(value);
  }

  @Output() styleChange = new EventEmitter<cd.IStyleDeclaration>();

  getScrollDirection(x: cd.Overflow, y: cd.Overflow): ScrollDirection {
    // Technically we dont use Overflow.Scroll but this will handle that scenario
    const sx = x === cd.Overflow.Scroll || x === cd.Overflow.Auto;
    const sy = y === cd.Overflow.Scroll || y === cd.Overflow.Auto;

    if (sx && sy) return ScrollDirection.Both;
    if (sx) return ScrollDirection.Horizontal;
    return ScrollDirection.Vertical;
  }

  updateStateAndDirection(
    state: OverflowState,
    direction: ScrollDirection = ScrollDirection.Vertical
  ) {
    this._state = state;
    this._scrollDirection = direction;
  }

  checkForScroll(x: cd.Overflow, y: cd.Overflow): boolean {
    const sx = x === cd.Overflow.Scroll || x === cd.Overflow.Auto;
    const sy = y === cd.Overflow.Scroll || y === cd.Overflow.Auto;
    return sx || sy;
  }

  updateState(value?: IOverflow) {
    const x = value?.x ?? cd.Overflow.Visible;
    const y = value?.y ?? cd.Overflow.Visible;

    if (this.checkForScroll(x, y)) {
      const direction = this.getScrollDirection(x, y);
      return this.updateStateAndDirection(OverflowState.Scroll, direction);
    }

    const state = this.isBoard
      ? OverflowState.Hidden
      : x === cd.Overflow.Hidden || y === cd.Overflow.Hidden
      ? OverflowState.Hidden
      : OverflowState.Visible;

    this.updateStateAndDirection(state);
  }

  get scrollDirection(): ScrollDirection {
    return this._scrollDirection;
  }

  get state(): OverflowState {
    return this._state;
  }

  get isScrollState() {
    return this._state === OverflowState.Scroll;
  }

  onScrollDirectionChange(item: cd.SelectItemOutput) {
    const direction = (item as cd.ISelectItem).value as ScrollDirection;
    const payload = this.payloadForScrollDirection(direction);
    this.styleChange.emit(payload);
  }

  buildOverflowPayload(x: cd.Overflow, y: cd.Overflow): IOverflowModel {
    return { overflow: { x, y } };
  }

  payloadForScrollDirection(direction: ScrollDirection = ScrollDirection.Vertical): IOverflowModel {
    if (direction === ScrollDirection.Both) {
      return this.buildOverflowPayload(cd.Overflow.Auto, cd.Overflow.Auto);
    }

    if (direction === ScrollDirection.Horizontal) {
      return this.buildOverflowPayload(cd.Overflow.Auto, cd.Overflow.Hidden);
    }

    return this.buildOverflowPayload(cd.Overflow.Hidden, cd.Overflow.Auto);
  }

  updateStateAsScroll() {
    if (this.state === OverflowState.Scroll) return;
    const payload = this.payloadForScrollDirection();
    this.styleChange.emit(payload);
  }

  updateStateAsHidden() {
    if (this.state === OverflowState.Hidden) return;
    const payload = this.buildOverflowPayload(cd.Overflow.Hidden, cd.Overflow.Hidden);
    this.styleChange.emit(payload);
  }

  updateStateAsVisible() {
    if (this.state === OverflowState.Visible) return;
    const payload = this.buildOverflowPayload(cd.Overflow.Visible, cd.Overflow.Visible);
    this.styleChange.emit(payload);
  }

  onOverflowStateChange(value: string) {
    const state = value as unknown as OverflowState;
    if (state === OverflowState.Visible) return this.updateStateAsVisible();
    if (state === OverflowState.Hidden) return this.updateStateAsHidden();
    if (state === OverflowState.Scroll) return this.updateStateAsScroll();
  }
}
