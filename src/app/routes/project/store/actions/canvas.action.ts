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

import { Action } from '@ngrx/store';
import { ConfigAction } from '../../interfaces/action.interface';

export const CANVAS = '[Canvas]';

export const CANVAS_FIT_TO_BOUNDS = `${CANVAS} Fit to board bounds`;
export const CANVAS_SAVE_STATE = `${CANVAS} Save state`;
export const CANVAS_RESTORE_STATE = `${CANVAS} Restore state`;
export const CANVAS_SNAP_TO_BOARD = `${CANVAS} Snap to board`;
export const CANVAS_SNAP_TO_HOME_BOARD = `${CANVAS} Snap to home board`;
export const CANVAS_ZOOM_IN = `${CANVAS} Zoom in`;
export const CANVAS_ZOOM_OUT = `${CANVAS} Zoom out`;
export const CANVAS_ZOOM_RESET = `${CANVAS} Zoom reset`;
export const CANVAS_PAN = `${CANVAS} Pan to`;

export class CanvasFitToBounds implements Action {
  readonly type = CANVAS_FIT_TO_BOUNDS;
}

export class CanvasSaveState implements Action {
  readonly type = CANVAS_SAVE_STATE;
}

export class CanvasRestoreState implements Action {
  readonly type = CANVAS_RESTORE_STATE;
}

export class CanvasSnapToBoard extends ConfigAction {
  readonly type = CANVAS_SNAP_TO_BOARD;
}

export class CanvasSnapToHomeBoard {
  readonly type = CANVAS_SNAP_TO_HOME_BOARD;
}

export class CanvasZoomIn implements Action {
  readonly type = CANVAS_ZOOM_IN;
}

export class CanvasZoomOut implements Action {
  readonly type = CANVAS_ZOOM_OUT;
}

export class CanvasZoomReset implements Action {
  readonly type = CANVAS_ZOOM_RESET;
}

export class CanvasPan extends ConfigAction {
  readonly type = CANVAS_PAN;
}

export type CanvasAction =
  | CanvasRestoreState
  | CanvasSaveState
  | CanvasSnapToHomeBoard
  | CanvasFitToBounds
  | CanvasSnapToBoard
  | CanvasZoomIn
  | CanvasZoomOut
  | CanvasZoomReset
  | CanvasPan;
