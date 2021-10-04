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

import { OUTLET_FRAME_INSERT_OFFSET } from 'src/app/routes/project/configs/outlet-frame.config';
import { generateFrame } from 'cd-common/utils';
import { filterBoardsList, getModels } from 'cd-common/models';
import * as cd from 'cd-interfaces';
import * as utils from 'src/app/routes/project/utils/board.utils';

export interface IDragDistance {
  x: number;
  y: number;
}

const MIN_BOARD_SIZE = 100;
const MAX_BOARD_SIZE = 200;

export const STARTING_BOARDS: cd.IRect[] = [
  { x: 20, y: 20, width: 100, height: 100 },
  { x: 140, y: 20, width: 100, height: 200 },
];

export enum MethodOption {
  LeftMost = 'left-most',
  AroundLast = 'around-last',
  LastSelected = 'last-selected',
  Hybrid = 'hybrid',
  Default = 'old',
}

export const METHOD_OPTIONS: cd.ISelectItem[] = [
  { value: MethodOption.Hybrid, title: 'Hybrid', selected: true },
  { value: MethodOption.Default, title: 'Default (Old method)' },
  { value: MethodOption.LeftMost, title: 'Left most w/ room' },
  { value: MethodOption.AroundLast, title: 'Around last board' },
  { value: MethodOption.LastSelected, title: 'Around last selected' },
];

const getOldFrame = (frame: cd.IRect, canvas: cd.IRect | undefined) => {
  if (!canvas) return;
  const { x: xpos, y: ypos, width, height } = canvas;
  const x = xpos + width + OUTLET_FRAME_INSERT_OFFSET;
  const y = ypos + height - frame.height;
  return { ...frame, x, y };
};

const getLeftMostFrame = (frame: cd.IRect, elemMap: cd.ElementPropertiesMap) => {
  const propModels = getModels(elemMap);
  const boards = filterBoardsList(propModels, true) as cd.IBoardProperties[];
  return utils.findRoomForBoard(frame, boards);
};

const getAroundLastFrame = (
  frame: cd.IRect,
  elemMap: cd.ElementPropertiesMap,
  canvas: cd.IRect | undefined,
  lastSelectedBoardId?: number
) => {
  if (!canvas) return;
  const propModels = getModels(elemMap);
  const boards = filterBoardsList(propModels, true) as cd.IBoardProperties[];
  const boardIdx = lastSelectedBoardId ?? boards.length - 1;
  const lastestBoard = boards[boardIdx];

  const { x: boardX, y: boardY, height: boardH, width: boardW } = lastestBoard.frame;

  // check to the right the board
  const rightTestFrame = utils.getFrameFromDirection(
    utils.BoardDirection.Right,
    lastestBoard.frame,
    frame
  );

  const willCollideOnRight = utils.checkForCollision(rightTestFrame, boards);
  if (!willCollideOnRight) {
    // Safe to put it to the right, make a new frame for it and return
    const x = boardX + boardW + OUTLET_FRAME_INSERT_OFFSET;
    return { ...frame, x, y: boardY };
  }

  // check underneath the board
  const belowTestFrame = utils.getFrameFromDirection(
    utils.BoardDirection.Below,
    lastestBoard.frame,
    frame
  );
  const willCollideBelow = utils.checkForCollision(belowTestFrame, boards);
  if (!willCollideBelow) {
    // Safe to put it below, make a new frame for it and return
    const y = boardY + boardH + OUTLET_FRAME_INSERT_OFFSET;
    return { ...frame, x: boardX, y };
  }

  const { x: xpos, y: ypos, width, height } = canvas;
  if (canvas.width > canvas.height) {
    // canvas is wider than it is tall, place below canvas
    const belowCanvasY = ypos + height + OUTLET_FRAME_INSERT_OFFSET;
    return { ...frame, x: xpos, y: belowCanvasY };
  }

  // canvas is taller than it is wide, place to the right of canvas
  const rightOfCanvasX = xpos + width + OUTLET_FRAME_INSERT_OFFSET;
  return { ...frame, x: rightOfCanvasX, y: ypos };
};

const getLastSelectedFrame = (
  frame: cd.IRect,
  elemPropsMap: cd.ElementPropertiesMap,
  canvas: cd.IRect | undefined,
  lastSelectedBoardId?: number
) => {
  return getAroundLastFrame(frame, elemPropsMap, canvas, lastSelectedBoardId);
};

const getHybridApproachFrame = (
  frame: cd.IRect,
  elemPropsMap: cd.ElementPropertiesMap,
  canvas: cd.IRect | undefined,
  lastSelectedBoardId?: string
): cd.IRect | undefined => {
  if (!canvas) return getOldFrame(frame, canvas);
  const selectedIdsSet = new Set(lastSelectedBoardId ? [lastSelectedBoardId] : []);
  const { x, y, width, height } = canvas;
  const bounds: cd.Rect = [x, y, width, height];
  return utils.updateBoardFramePosition(frame, elemPropsMap, selectedIdsSet, bounds);
};

export const getNewBoardPlacholderFrame = (
  method: MethodOption,
  frame: cd.IRect,
  elemPropsMap: cd.ElementPropertiesMap,
  canvas: cd.IRect | undefined,
  lastSelectedBoardId?: number
) => {
  // prettier-ignore
  switch (method) {
    case MethodOption.Hybrid: return getHybridApproachFrame(frame, elemPropsMap, canvas, lastSelectedBoardId?.toString());
    case MethodOption.LeftMost: return getLeftMostFrame(frame, elemPropsMap);
    case MethodOption.AroundLast: return getAroundLastFrame(frame, elemPropsMap, canvas);
    case MethodOption.LastSelected: return getLastSelectedFrame(frame, elemPropsMap, canvas, lastSelectedBoardId);
    default: return getOldFrame(frame, canvas);
  }
};

export const generateNewBoard = (x: number, y: number) => {
  const width = Math.random() * (MAX_BOARD_SIZE - MIN_BOARD_SIZE) + MIN_BOARD_SIZE;
  const height = Math.random() * (MAX_BOARD_SIZE - MIN_BOARD_SIZE) + MIN_BOARD_SIZE;
  return generateFrame(x, y, width, height);
};

export const generateFakeBoard = () => generateFrame(0, 0, MIN_BOARD_SIZE, MIN_BOARD_SIZE);

export const boardRectsToFakeElemPropsMap = (boards: cd.IRect[]) =>
  boards.reduce<cd.IStringMap<Partial<cd.IRootElementProperties>>>((acc, frame, idx) => {
    acc[idx] = { id: `${idx}`, elementType: cd.ElementEntitySubType.Board, frame };
    return acc;
  }, {}) as cd.ElementPropertiesMap;
