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

import { Component, ChangeDetectionStrategy, Input, OnInit, OnDestroy } from '@angular/core';
import { getNewModelValues, ISvgLine, ivalueFromValue } from './position.utils';
import { constructKebabCase } from 'cd-utils/string';
import { AUTO_VALUE } from 'cd-common/consts';
import { displayValueWithoutInlinePrefix, isDisplayGrid } from 'cd-common/utils';
import { AbstractPropContainerDirective } from 'cd-common';
import { coerceBooleanProperty } from '@angular/cdk/coercion';
import { InteractionService } from '../../../../services/interaction/interaction.service';
import { Subscription } from 'rxjs';
import * as cd from 'cd-interfaces';

const BOX_SIZE = 54;
const PADDING = 8;
const MID = BOX_SIZE * 0.5;
const LINES = [
  { id: cd.Position.Top, x1: MID, y1: PADDING, x2: MID, y2: MID - PADDING },
  { id: cd.Position.Left, x1: PADDING, y1: MID, x2: MID - PADDING, y2: MID },
  { id: cd.Position.Right, x1: MID + PADDING, y1: MID, x2: BOX_SIZE - PADDING, y2: MID },
  { id: cd.Position.Bottom, x1: MID, y1: MID + PADDING, x2: MID, y2: BOX_SIZE - PADDING },
];

@Component({
  selector: 'app-position-props',
  templateUrl: './position-props.component.html',
  styleUrls: ['./position-props.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PositionPropsComponent
  extends AbstractPropContainerDirective
  implements OnInit, OnDestroy
{
  private _subscriptions = new Subscription();
  private _hideDisplay = false;
  private _frame?: cd.ILockingRect;
  private _parentFrame?: cd.ILockingRect;
  public PositionType = cd.PositionType;
  public DisplayMode = cd.DisplayMode;
  public positionMode: cd.PositionType = cd.PositionType.Relative;
  public isFixedPosition = false;
  public activeDisplayMode = cd.DisplayMode.Block;
  public position = cd.PositionType.Relative;
  public isParentAGrid = false;
  public lines: ISvgLine[] = LINES;

  @Input() id = '';
  @Input() parentId = '';

  @Input()
  set hideDisplay(value) {
    this._hideDisplay = coerceBooleanProperty(value);
  }
  get hideDisplay() {
    return this._hideDisplay;
  }

  constructor(private _interactionService: InteractionService) {
    super();
  }

  ngOnInit() {
    this._subscriptions.add(this._interactionService.renderRects$.subscribe(this._onRenderRects));
  }

  ngOnDestroy() {
    this._subscriptions.unsubscribe();
  }

  private _onRenderRects = (renderRectMap: cd.RenderRectMap) => {
    const { id, parentId } = this;
    this._frame = renderRectMap.get(id)?.frame;
    this._parentFrame = renderRectMap.get(parentId)?.frame;
  };

  parseModel(value: cd.IStyleDeclaration) {
    this.position = value.position || cd.PositionType.Relative;
    this.updatePosition(value);
    this.parseDisplayMode(value);
  }

  parseParentModel(value: cd.IStyleDeclaration) {
    this.isParentAGrid = isDisplayGrid(value.display);
  }

  onPositionModeChange(mode: cd.PositionType) {
    let props: cd.PositionProps = {};
    const { Relative, Fixed, Absolute } = cd.PositionType;
    if (mode === Relative) {
      props = { position: mode, top: null, left: null, right: null, bottom: null, margin: null };
    } else {
      const top = ivalueFromValue(0);
      const left = ivalueFromValue(0);
      const position = this.isFixedPosition ? Fixed : Absolute;
      props = { position, top, left, margin: AUTO_VALUE, float: null };
    }
    this.modelChange.emit(props);
  }

  onToggleFixed(fixed: boolean) {
    const position = fixed ? cd.PositionType.Fixed : cd.PositionType.Absolute;
    this.modelChange.emit({ position });
  }

  updatePosition(model: cd.IStyleDeclaration) {
    const { Relative, Absolute, Fixed } = cd.PositionType;
    const position = model.position || Relative;
    this.positionMode = position === Relative ? Relative : Absolute;
    this.isFixedPosition = position === Fixed;
  }

  onTopChange(value: string) {
    const top = ivalueFromValue(value);
    this.modelChange.emit({ top });
  }

  onLeftChange(value: string) {
    const left = ivalueFromValue(value);
    this.modelChange.emit({ left });
  }

  onRightChange(value: string) {
    const right = ivalueFromValue(value);
    this.modelChange.emit({ right });
  }

  toggleModelValues(aTop = false, aLeft = false, aRight = false, aBottom = false) {
    const { model, _parentFrame: pFrame, _frame } = this;
    const { top, left, bottom, right } = model;
    const topActive = !!top === aTop;
    const leftActive = !!left === aLeft;
    const rightActive = !!right === aRight;
    const bottomActive = !!bottom === aBottom;
    if (topActive && leftActive && rightActive && bottomActive) {
      this.modelChange.emit({ top: null, left: null, right: null, bottom: null });
    } else {
      const newModel = getNewModelValues(pFrame, _frame, model, aTop, aLeft, aRight, aBottom);
      this.modelChange.emit(newModel);
    }
  }

  centerClick() {
    this.toggleModelValues(true, true, true, true);
  }
  bottomRightClick() {
    this.toggleModelValues(false, false, true, true);
  }
  bottomLeftClick() {
    this.toggleModelValues(false, true, false, true);
  }
  topRightClick() {
    this.toggleModelValues(true, false, true, false);
  }
  topLeftClick() {
    this.toggleModelValues(true, true, false, false);
  }

  onBottomChange(value: string) {
    const bottom = ivalueFromValue(value);
    this.modelChange.emit({ bottom });
  }

  onLineClick(id: string) {
    const lookup = this._model[id];
    const value = lookup ? null : ivalueFromValue(0);
    const obj = { [id]: value };
    this.modelChange.emit(obj);
  }

  parseDisplayMode(model: cd.IStyleDeclaration) {
    const { float, display } = model;
    if (float) {
      const floatMode =
        float === cd.Float.Left ? cd.DisplayMode.FloatLeft : cd.DisplayMode.FloatRight;
      this.activeDisplayMode = floatMode;
    } else if (display) {
      const mode = display.includes(cd.Display.Inline)
        ? cd.DisplayMode.Inline
        : cd.DisplayMode.Block;
      this.activeDisplayMode = mode;
    } else {
      this.activeDisplayMode = cd.DisplayMode.Block;
    }
  }

  setDisplayModeBlock() {
    const display = displayValueWithoutInlinePrefix(this._model.display);
    this.modelChange.emit({ display, float: null, verticalAlign: null });
  }

  setDisplayModeInline() {
    const suffix = displayValueWithoutInlinePrefix(this._model.display);
    const display = constructKebabCase(cd.Display.Inline, suffix);
    this.modelChange.emit({ display, float: null, verticalAlign: cd.VerticalAlign.Top });
    this.activeDisplayMode = cd.DisplayMode.Inline;
  }

  setDisplayModeFloatLeft() {
    this.modelChange.emit({ float: cd.Float.Left });
  }

  setDisplayModeFloatRight() {
    this.modelChange.emit({ float: cd.Float.Right });
  }

  onModeChange(e: cd.DisplayMode) {
    if (e === cd.DisplayMode.Block) return this.setDisplayModeBlock();
    if (e === cd.DisplayMode.Inline) return this.setDisplayModeInline();
    if (e === cd.DisplayMode.FloatLeft) return this.setDisplayModeFloatLeft();
    if (e === cd.DisplayMode.FloatRight) return this.setDisplayModeFloatRight();
  }
}
