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

/* eslint-disable max-lines */
import { BoardCreate } from '../store';
import { boundsToIRect, canvasHasBounds, generateBounds } from './canvas.utils';
import { incrementedName, removeNumbersAndTrim } from 'cd-utils/string';
import {
  buildInsertLocation,
  createElementChangePayload,
  generateFrame,
  rectsIntersect,
} from 'cd-common/utils';
import { ISelectionState } from '../store/reducers/selection.reducer';
import * as config from '../configs/outlet-frame.config';
import * as cd from 'cd-interfaces';
import * as models from 'cd-common/models';
import { createId } from 'cd-utils/guid';
import { DEFAULT_OUTLET_FRAME_NAME } from 'cd-common/consts';

const PLACEMENT_TEST_OFFSET = 9; // Used when testing if a board can fit next to another

const enum BoardIcon {
  Home = 'home',
  Generic = 'crop_3_2',
}

/**
 * Enum used to check the four cardinal directions around a board
 */
export enum BoardDirection {
  Right,
  Below,
}

export const createBoardSelectMenu = (
  boards: ReadonlyArray<cd.IBoardProperties>,
  homeBoardId: string | undefined
): cd.ISelectItem[] => {
  return boards.map((board: cd.IBoardProperties) => {
    const { id: value, name: title } = board;
    const icon = value === homeBoardId ? BoardIcon.Home : BoardIcon.Generic;
    return { value, title, icon };
  });
};

const incrementedBoardName = (name: string, boards: cd.IBoardProperties[], idx = 0): string => {
  const boardNames = boards.map((board) => board.name);
  return incrementedName(name, boardNames, idx);
};

/**
 * Sorts boards by their position on the canvas, resulting in a sorted list of boards
 * from left to right no the canvas
 */
const sortBoardsByCanvasPosition = (boards: cd.IBoardProperties[]): cd.IBoardProperties[] => {
  return [...boards].sort(({ frame: aFrame }, { frame: bFrame }) => {
    return aFrame.x === bFrame.x ? aFrame.y - bFrame.y : aFrame.x - bFrame.x;
  });
};

/**
 * Attempts to find the left-most board with space to the right of it for the new board.
 * If it cannot find a valid position, returns undefined.
 *
 * @param boards - Current list of boards on the canvas
 * @param frame - The frame of the new board being added to the canvas
 */
const findBoardWithSpaceToRight = (
  boards: cd.IBoardProperties[],
  frame: cd.IRect
): cd.IRootElementProperties | undefined => {
  const sortedBoards = sortBoardsByCanvasPosition(boards);

  for (const board of sortedBoards) {
    const testFrame = getFrameFromDirection(BoardDirection.Right, board.frame, frame);
    const rectCollides = checkForCollision(testFrame, sortedBoards);
    if (rectCollides) continue;
    return board;
  }

  return undefined;
};

const getBoundsFromBoards = (boards: cd.IBoardProperties[]): cd.IRect => {
  const selectedFrames = boards.map((board) => board.frame);
  const selectedBounds = generateBounds(selectedFrames);
  return boundsToIRect(selectedBounds);
};

/**
 * Produces an IRect based on direction supplied (one of four cardinal directions around a board)
 *
 * @param direction - Direction to create a new frame in
 * @param boards - List of existing boards
 * @param frame - Starting IRect to build the new frame from
 * @param includePlacementOffset - Boolean to determine whether the frame should include additional
 *                                 padding around it (used in testing whether a board can fit next
 *                                 other boards)
 */
export const getFrameFromDirection = (
  direction: BoardDirection,
  referenceRect: cd.IRect,
  frame: cd.IRect
): cd.IRect => {
  const { x: neighX, y: neighY, width: neighWidth, height: neighHeight } = referenceRect;
  const { width, height } = frame;

  if (direction === BoardDirection.Below) {
    const belowY = neighY + neighHeight + config.OUTLET_FRAME_INSERT_OFFSET;
    return generateFrame(neighX, belowY, width, height);
  }
  // default
  const rightX = neighX + neighWidth + config.OUTLET_FRAME_INSERT_OFFSET;
  return generateFrame(rightX, neighY, width, height);
};

/**
 * Check if an IRect will collide with any existing board on the canvas given a specific direction
 *
 * @param testFrame - Frame to test
 * @param boards - List of boards to test for collision against
 */
export const checkForCollision = (testFrame: cd.IRect, boards: cd.IBoardProperties[]): boolean => {
  const { width, height } = testFrame;
  const newWidth = width + PLACEMENT_TEST_OFFSET;
  const newHeight = height + PLACEMENT_TEST_OFFSET;
  const adjustedFrame = { ...testFrame, width: newWidth, height: newHeight };
  return boards.some((compare) => rectsIntersect(compare.frame, adjustedFrame));
};

/**
 * Creates an IRect if a board is found that has room to the right of it on the canvas. If no board
 * can be found with room to the right, returns undefined.
 *
 * NOTE: The only instance where it will not be able to find a board with room to the right is if
 * the the boards array is empty.
 */
export const findRoomForBoard = (
  frame: cd.IRect, // board frame
  boards: cd.IBoardProperties[]
): cd.IRect | undefined => {
  const boardWithRoom = findBoardWithSpaceToRight(boards, frame);
  if (!boardWithRoom) return;
  const { frame: boardFrame } = boardWithRoom;
  const { x: frameX, y, width } = boardFrame;
  const x = frameX + width + config.OUTLET_FRAME_INSERT_OFFSET;
  return { ...frame, x, y };
};

/**
 * Attempts to find a board with room to the right of it. If it can't, defaults to old method of
 * placing frame at the bottom right of the canvas bounds
 */
const getBackupBoardPlacement = (
  frame: cd.IRect,
  boards: cd.IBoardProperties[],
  canvasBounds: cd.Rect
): cd.IRect => {
  const [xpos, ypos, width, height] = canvasBounds;
  const leftMostWithRoom = findRoomForBoard(frame, boards);
  // NOTE: leftMostWithRoom should never return undefined since we are confirmed to have a canvas
  //       which implies we have a board to select.
  if (leftMostWithRoom) return leftMostWithRoom;
  const x = xpos + width + config.OUTLET_FRAME_INSERT_OFFSET;
  const y = ypos + height - frame.height;
  return { ...frame, x, y };
};

const getSelectedBoards = (
  selectedIds: string[],
  elemProps: cd.ElementPropertiesMap
): cd.IComponentInstance[] => {
  const rootIds = new Set<string>();
  const boards = [];

  for (const id of selectedIds) {
    const selectedElement = elemProps[id];
    if (!selectedElement) continue;

    const isBoardSelected = models.isBoard(selectedElement);
    const rootElement = isBoardSelected ? selectedElement : elemProps[selectedElement.rootId];

    if (!rootElement || rootIds.has(rootElement.id)) continue;
    rootIds.add(rootElement.id);
    boards.push(rootElement);
  }

  return boards;
};

interface ISplitBoards {
  rightBoards: cd.IBoardProperties[];
  belowBoards: cd.IBoardProperties[];
}

/**
 * Checks to see, given a specific direction, if a board is inline with the project area from
 *
 * @param direction - Which direction to check
 * @param frame - Board frame to test
 * @param selectionFrame - Frame of selection to project out from
 */
const isBoardInlineWithSelection = (
  direction: BoardDirection,
  frame: cd.IRect,
  selectionFrame: cd.IRect
): boolean => {
  const { x, y, width: w, height: h } = frame;
  const { x: selectedX, y: selectedY, width: selectedW, height: selectedH } = selectionFrame;
  const selectedXAndWidth = selectedX + selectedW;
  const selectedYAndHeight = selectedY + selectedH;
  if (direction === BoardDirection.Below) {
    const belowSelection = y >= selectedYAndHeight;
    if (!belowSelection) return false;
    const aboveAndBelowSelection = x < selectedX && x + w > selectedXAndWidth;
    const topInsideSelection = x >= selectedX && x <= selectedXAndWidth;
    const bottomInsideSelection = x + w >= selectedX && x + w <= selectedXAndWidth;
    return aboveAndBelowSelection || topInsideSelection || bottomInsideSelection;
  }

  // CheckDirection.Right
  const rightOfSelection = x >= selectedXAndWidth;
  if (!rightOfSelection) return false;
  const leftAndRightOfSelection = y < selectedY && y + h > selectedYAndHeight;
  const leftInsideSelection = y >= selectedY && y <= selectedYAndHeight;
  const rightInsideSelection = y + h >= selectedY && y + h <= selectedYAndHeight;
  return leftAndRightOfSelection || leftInsideSelection || rightInsideSelection;
};

/**
 * Find the sets of boards that intersect projecting out from the selected boards to the right and
 * below. This is easiest to grasp when looking at this diagram
 *
 * @param boards - Full list of boards in the project
 * @param selectedIds - Set of ids of selected boards
 * @param selectionRect - IRect built from selected elements
 */
const getBoardsRightAndBelow = (
  boards: cd.IBoardProperties[],
  selectedIds: Set<string>,
  selectionRect: cd.IRect
): ISplitBoards => {
  const { Below, Right } = BoardDirection;
  return boards.reduce<ISplitBoards>(
    (acc, board) => {
      const { frame, id } = board;
      if (selectedIds.has(id)) return acc;
      const { rightBoards, belowBoards } = acc;

      const isBoardBelow = isBoardInlineWithSelection(Below, frame, selectionRect);
      if (isBoardBelow) belowBoards.push(board);

      const isBoardRight = isBoardInlineWithSelection(Right, frame, selectionRect);
      if (isBoardRight) rightBoards.push(board);

      return { rightBoards, belowBoards };
    },
    { rightBoards: [], belowBoards: [] }
  );
};

/**
 * Finds a spot for the selection to be placed
 *
 * @param relevantBoards - List of boards that are relevant to test (relevancy is determined by being below and to the right of the selection)
 * @param allBoards - List of all boards in the project
 * @param selectedGroupRect - IRect around the selected elements
 * @param direction - Direction to try placing selection
 */
const findSpotForBoard = (
  relevantBoards: cd.IBoardProperties[],
  allBoards: cd.IBoardProperties[],
  selectedGroupRect: cd.IRect,
  direction: BoardDirection
): cd.IRect | undefined => {
  const boardFrames = relevantBoards.map((board) => board.frame);
  const candidateNeighborFrames = [selectedGroupRect, ...boardFrames];

  for (const frame of candidateNeighborFrames) {
    const testFrame = getFrameFromDirection(direction, frame, selectedGroupRect);
    const collides = checkForCollision(testFrame, allBoards);
    if (!collides) return testFrame;
  }

  return undefined;
};

/**
 * Update supplied IRect frame with appropriate canvas positioning
 *
 * @param frame - Initial starting frame
 * @param elementProperties - Element properties map
 * @param selectedIdsSet - Set of IDs of selected elements
 * @param xpos - The canvas's x position
 * @param ypos - The canvas's y position
 * @param width - The canvas's width
 * @param height - The canvas's height
 */
export const updateBoardFramePosition = (
  frame: cd.IRect,
  elementProperties: cd.ElementPropertiesMap,
  selectedIdsSet: Set<string>,
  canvasBounds: cd.Rect
): cd.IRect => {
  const propModels = models.getModels(elementProperties);
  const boards = models.filterBoardsList(propModels, true) as cd.IBoardProperties[];
  if (!selectedIdsSet.size) return getBackupBoardPlacement(frame, boards, canvasBounds);

  // Convert selected IDs to one IRect that surrounds the selected elements
  const selectedIds = [...selectedIdsSet];
  const selectedBoardsSet = getSelectedBoards(selectedIds, elementProperties);
  const selectedBoards = [...selectedBoardsSet] as cd.IBoardProperties[];
  const selectedGroupRect = getBoundsFromBoards(selectedBoards);

  // Filter down the boards to only those that are below and to the right of selected boards
  const availableBoards = getBoardsRightAndBelow(boards, selectedIdsSet, selectedGroupRect);
  const { rightBoards, belowBoards } = availableBoards;
  const { Right, Below } = BoardDirection;
  const rightCandidate = findSpotForBoard(rightBoards, boards, selectedGroupRect, Right);
  const belowCandidate = findSpotForBoard(belowBoards, boards, selectedGroupRect, Below);

  // This should never happen as there is always room next to the farthest right/below board
  if (!rightCandidate || !belowCandidate) {
    return getBackupBoardPlacement(frame, boards, canvasBounds);
  }

  // Check distances to either option and pick the one that is closest to the selected elements
  const distanceToBelow = belowCandidate.y - (selectedGroupRect.y + selectedGroupRect.height);
  const distanceToRight = rightCandidate.x - (selectedGroupRect.x + selectedGroupRect.width);
  return distanceToBelow < distanceToRight ? belowCandidate : rightCandidate;
};

const getSizeFromPadding = (props: cd.PropertyModel): [width: number, height: number] => {
  const baseStyles = models.getActiveStyleFromProperty(props);
  const padding = baseStyles?.padding;
  if (!padding) return [0, 0];
  const { bottom = 0, right = 0 } = padding;
  const width = right;
  const height = bottom;
  return [width, height];
};

export const calculateBoardFit = (scrollFrame: cd.IRect, props: cd.PropertyModel): cd.IRect => {
  const [paddWidth, paddHeight] = getSizeFromPadding(props);
  const width = scrollFrame.width + paddWidth;
  const height = scrollFrame.height + paddHeight;
  return { ...scrollFrame, width, height };
};

const generateDefaultBoardName = (name: string | undefined): string => {
  return name ? removeNumbersAndTrim(name) : DEFAULT_OUTLET_FRAME_NAME;
};

const isRectVisibleOnCanvas = (canvas: cd.ICanvas, rect: cd.Rect): boolean => {
  const { position, offset, viewPortHeight, viewPortWidth } = canvas;
  const { x: canX, y: canY, z: zoom } = position;
  const [vpLeft, vpTop] = offset;
  const [x, y, width, height] = rect; // No zoom applied, but x and y are adjusted to be raw values
  const adjustedX = canX + x * zoom; // X coord of element in canvas
  const adjustedY = canY + y * zoom; // Y coord of element in canvas
  const adjustedWidth = width * zoom;
  const adjustedHeight = height * zoom;
  const checkLeft = adjustedX > vpLeft;
  const checkRight = adjustedX + adjustedWidth < vpLeft + viewPortWidth;
  const checkTop = adjustedY > vpTop;
  const checkBottom = adjustedY + adjustedHeight < vpTop + viewPortHeight;
  return checkLeft && checkRight && checkTop && checkBottom;
};

export const shouldSnapToBoardsOnCreate = (
  boardsToAdd: ReadonlyArray<cd.IBoardProperties>,
  canvas: cd.ICanvas
): boolean => {
  if (!canvasHasBounds(canvas)) return true;
  const boardFrames = boardsToAdd.map((board) => board.frame);
  const groupBounds = generateBounds(boardFrames); // Generate frame from boards being created
  const roomForNewBoard = isRectVisibleOnCanvas(canvas, groupBounds);
  // If the board would not be visible, we should snap to it
  return !roomForNewBoard;
};

/**
 * Generate change payload to populate child content of a new board
 */
const populateModelContent = (
  content: cd.IComponentInstanceGroup,
  board: cd.IBoardProperties,
  elemProps: cd.ElementPropertiesMap
): cd.IElementChangePayload => {
  const elementId = board.rootId;
  const { rootIds, models: propertyModels } = content;
  const location = buildInsertLocation(elementId, cd.InsertRelation.Append);
  const newElements = [board, ...propertyModels];
  // Insert update will include updates to create board and content models
  return models.insertElements(rootIds, location, elemProps, newElements);
};

export const generateEmptyBoardFromFrame = (
  frame: cd.IRect,
  id: string,
  projectId: string,
  boardsArray: cd.IBoardProperties[] = []
): cd.IBoardProperties => {
  const name = incrementedBoardName(DEFAULT_OUTLET_FRAME_NAME, boardsArray);
  return models
    .createInstance(cd.ElementEntitySubType.Board, projectId, id)
    .assignName(name)
    .assignFrameFromFrame(frame)
    .assignRootId(id)
    .build();
};

const createNewBoard = (
  item: Partial<cd.IBoardProperties>,
  index: number,
  projectId: string,
  boardsArray: cd.IBoardProperties[] = [],
  keepOriginalId = false
): cd.IBoardProperties => {
  const rootId = keepOriginalId && item.id ? item.id : createId();
  const defaultName = generateDefaultBoardName(item.name);
  const name = incrementedBoardName(defaultName, boardsArray, index);
  const boardInstance = models
    .createInstance(cd.ElementEntitySubType.Board, projectId, rootId)
    .assignName(name)
    .assignRootId(rootId);

  const { styles, frame } = item;
  if (styles) boardInstance.assignStyles(styles);
  if (frame) boardInstance.assignFrameFromFrame(frame);

  return boardInstance.build();
};

type BoardAndContentModels = [boards: cd.IBoardProperties[], changes: cd.IElementChangePayload[]];

const generateDefaultSizeBoard = (
  canvas: cd.ICanvas,
  projectId: string,
  boardsArray: cd.IBoardProperties[],
  elemProps: cd.ElementPropertiesMap,
  selectIds: Set<string>,
  content: cd.IComponentInstanceGroup[] = [],
  keepOriginalId = false
): BoardAndContentModels => {
  const board = createNewBoard({}, 0, projectId, boardsArray, keepOriginalId);
  const canvasBounds = canvasHasBounds(canvas);

  if (canvasBounds) {
    board.frame = updateBoardFramePosition(board.frame, elemProps, selectIds, canvas.bounds);
  } else {
    board.frame.x = 0;
  }

  const [firstItem] = content;
  const change = firstItem
    ? populateModelContent(firstItem, board, elemProps)
    : createElementChangePayload([board]);

  return [[board], [change]];
};

// Copy/Paste or Duplicate
// - Keep the boards grouped together in the same positions
// - Place boards to right or below depending on shortest distance
const generateBoardsWithFrames = (
  frames: ReadonlyArray<cd.IRect>,
  params: Partial<cd.IBoardProperties>[],
  canvas: cd.ICanvas,
  projectId: string,
  boardsArray: cd.IBoardProperties[],
  elemProps: cd.ElementPropertiesMap,
  selectIds: Set<string>,
  content: cd.IComponentInstanceGroup[],
  keepOriginalId = false
): BoardAndContentModels => {
  const changes: cd.IElementChangePayload[] = [];
  const addedBounds = generateBounds(frames);
  const addedFrame = boundsToIRect(addedBounds);
  const { x: boundsX, y: boundsY } = addedFrame;

  // Find new spot for the group of boards
  const newFrame = updateBoardFramePosition(addedFrame, elemProps, selectIds, canvas.bounds);

  // Create board models and any PropertyModels for board content
  const boards = params.map((item, index) => {
    const boardContent = content[index];
    const boardProps = item as cd.IBoardProperties;
    const board = createNewBoard(boardProps, index, projectId, boardsArray, keepOriginalId);
    // Grab from item because the frame in 'board' gets wiped
    const { frame } = item;

    // TODO: add description of what this is for
    if (frame) {
      const dx = frame.x - boundsX;
      const dy = frame.y - boundsY;
      const x = newFrame.x + dx;
      const y = newFrame.y + dy;
      board.frame = { ...frame, x, y };
    }

    const change = boardContent
      ? populateModelContent(boardContent, board, elemProps)
      : createElementChangePayload([board]);

    changes.push(change);

    return board;
  });

  return [boards, changes];
};

const framesFromBoardProps = (boards: Partial<cd.IBoardProperties>[]): ReadonlyArray<cd.IRect> => {
  return boards.reduce<cd.IRect[]>((acc, curr) => {
    const { frame } = curr;
    if (!frame) return acc;
    return [...acc, frame];
  }, []);
};

/**
 * Generate new board models for added content. This includes any content inside of those boards that
 * may have been picked up in copy/paste/duplicate.
 *
 * @param action - BoardCreate action payload
 * @param boardsArray - List of boards in project
 * @param elemProps - Current element properties map
 * @param projectId - ID of current project
 * @param canvas - Current state of the canvas
 * @param idGenerator - Standard function for ID generation
 * @param selectionState - Current state of selection from the project
 */
export const generateBoards = (
  action: BoardCreate,
  boardsArray: cd.IBoardProperties[] = [],
  elemProps: cd.ElementPropertiesMap,
  projectId: string,
  canvas: cd.ICanvas,
  selectionState: ISelectionState
): BoardAndContentModels => {
  const { boardParameters: params = [], content = [], keepOriginalId } = action;
  const { ids: selectIds } = selectionState;

  // Destructure all frames out of added boards
  const addedFrames = framesFromBoardProps(params);
  // If using the Add Board action, no content will be present
  const noExistingFrames = addedFrames.length === 0;

  if (noExistingFrames) {
    return generateDefaultSizeBoard(
      canvas,
      projectId,
      boardsArray,
      elemProps,
      selectIds,
      content,
      keepOriginalId
    );
  }

  return generateBoardsWithFrames(
    addedFrames,
    params,
    canvas,
    projectId,
    boardsArray,
    elemProps,
    selectIds,
    content,
    keepOriginalId
  );
};
