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

import { areObjectsEqual } from 'cd-utils/object';
import { InteractionService } from '../interaction/interaction.service';
import { BoardCreateViaMarquee } from '../../store/actions/board.action';
import { Injectable } from '@angular/core';
import { generateFrame } from 'cd-common/utils';
import { assignGlobalCursor, CursorState } from 'cd-utils/css';
import { clampBoardSize, generateMarqueeRect } from './marquee.utils';
import { BehaviorSubject } from 'rxjs';
import * as cd from 'cd-interfaces';
import { selectionRectFromCanvas } from '../interaction/interaction.utils';

export enum MarqueeMode {
  /** Selection */
  Default,
  Zoom, // TODO
  CreateBoard,
}

@Injectable({ providedIn: 'root' })
export class MarqueeService {
  public marqueeRect$ = new BehaviorSubject<cd.IRect>(generateFrame());
  public mode$ = new BehaviorSubject<MarqueeMode>(MarqueeMode.Default);

  constructor(private _interactionService: InteractionService) {}

  get marqueeRect() {
    return this.marqueeRect$.getValue();
  }

  get mode(): MarqueeMode {
    return this.mode$.getValue();
  }

  set mode(mode: MarqueeMode) {
    this.mode$.next(mode);
  }

  get isSelectionMode(): boolean {
    return this.mode === MarqueeMode.Default;
  }

  get isCreateBoardMode() {
    return this.mode === MarqueeMode.CreateBoard;
  }

  resetMode() {
    this.mode = MarqueeMode.Default;
  }

  deactivateBoardCreateMode() {
    this.resetMode();
    assignGlobalCursor();
  }

  activateBoardCreateMode() {
    this.mode = MarqueeMode.CreateBoard;
    assignGlobalCursor(CursorState.Crosshair);
  }

  toggleBoardCreationMode() {
    if (this.mode === MarqueeMode.CreateBoard) return this.deactivateBoardCreateMode();
    this.activateBoardCreateMode();
  }

  handleSelect(rect: cd.IRect, canvasPosition: cd.ICanvasPosition | undefined) {
    this.marqueeRect$.next(rect);
    if (!canvasPosition) return;
    this._interactionService.checkOutletFrameSelection(rect, canvasPosition);
  }

  handleCreateBoardMode(rect: cd.IRect, _canvasPosition?: cd.ICanvasPosition) {
    this.marqueeRect$.next(rect);
  }

  updateMarqueeSelection(x = 0, y = 0, width = 0, height = 0, canvasPosition?: cd.ICanvasPosition) {
    this._interactionService.interacting = x + y + width + height !== 0;
    const rect = generateMarqueeRect(x, y, width, height);
    if (areObjectsEqual(this.marqueeRect, rect)) return;
    if (this.isCreateBoardMode) return this.handleCreateBoardMode(rect, canvasPosition);
    this.handleSelect(rect, canvasPosition);
  }

  createBoardFromSelection(lastRect: cd.IRect, canvasPosition?: cd.ICanvasPosition) {
    this.deactivateBoardCreateMode();
    if (!canvasPosition) return;
    if (lastRect.width === 0 && lastRect.height === 0) return;
    const frame = selectionRectFromCanvas(lastRect, canvasPosition);
    const width = clampBoardSize(frame.width);
    const height = clampBoardSize(frame.height);
    const boardFrame = generateFrame(frame.x, frame.y, width, height);
    this._interactionService.dispatch(new BoardCreateViaMarquee(boardFrame));
  }

  finishMarqueeSelection(canvasPosition?: cd.ICanvasPosition) {
    const lastRect = { ...this.marqueeRect };
    this.updateMarqueeSelection();
    if (this.isCreateBoardMode) this.createBoardFromSelection(lastRect, canvasPosition);
  }
}
