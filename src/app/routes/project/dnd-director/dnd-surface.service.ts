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
import { DragMode, IRenderResultsEx, ReadonlyRenderResultsExArray } from './dnd-interfaces';
import { InteractionService } from '../services/interaction/interaction.service';
import { PropertiesService } from '../services/properties/properties.service';
import { RendererService } from 'src/app/services/renderer/renderer.service';
import { CanvasService } from '../services/canvas/canvas.service';
import { getAllChildIdsRecursive, getComponent, isRoot } from 'cd-common/models';
import { createPoint, IPoint } from 'cd-utils/geometry';
import { generateBounds } from '../utils/canvas.utils';
import { areArraysEqual } from 'cd-utils/array';
import { Injectable } from '@angular/core';
import * as aUtils from './dnd-surface.abs.utils';
import * as utils from './dnd-surface.utils';
import * as cd from 'cd-interfaces';
import { Subject } from 'rxjs';
import { DndMouseCursor } from './dnd-utils';
import { KeyboardService } from '../services/keyboard/keyboard.service';
import { buildInsertLocation } from 'cd-common/utils';

const MAX_VELOCITY = 1.2;
const BOARD_DIST_THRESHOLD = 46;

@Injectable({ providedIn: 'root' })
export class DndSurfaceService {
  /** Save details about absolute position to save to the db on drop */
  private _absoluteUpdate: ReadonlyArray<cd.IPropertiesUpdatePayload> = [];
  private _dragAdditions: cd.ReadOnlyPropertyModelList = [];
  private _mode: DragMode = DragMode.Relative;
  private _shiftKeyDown = false;
  ////////////////////////////////////////////////////////////////////
  private _dragIds: ReadonlyArray<string> = [];
  private _activeDragId = '';
  private _boardRects: ReadonlyArray<cd.IRenderResult> = [];
  private _dragChildPattern: ReadonlyMap<string, string> = new Map();
  private _closestBoardId?: string;
  protected _prevLocation?: cd.IInsertLocation;

  public dropLocation$ = new Subject<cd.IInsertLocation | undefined>();

  constructor(
    private _interactionService: InteractionService,
    private _propertiesService: PropertiesService,
    private _keyboardService: KeyboardService,
    private _rendererService: RendererService,
    private _canvasService: CanvasService
  ) {
    this._keyboardService.shiftKeyDown$.subscribe(this.onShiftKeyDown);
  }

  get renderRects(): cd.RenderRectMap {
    return this._interactionService.mergedRenderRects;
  }

  get isAbsoluteDrag() {
    return this._mode === DragMode.Absolute;
  }

  onShiftKeyDown = (keyDown: boolean) => {
    this._shiftKeyDown = keyDown;
  };

  reset() {
    this._mode = DragMode.Relative;
    this._dragChildPattern = new Map();
    this._activeDragId = '';
    this._closestBoardId = undefined;
    this._prevLocation = undefined;
    this._absoluteUpdate = [];
    this._dragAdditions = [];
    this._dragIds = [];
  }

  /**
   * Merge element properties map with any dragAdditions
   * drag Additions are elements that have not yet been added to the ngrx store
   * such as added directly from the components panel or duplicated
   */
  getElemProperties(): cd.ReadonlyElementPropertiesMap {
    const props = this._propertiesService.getElementProperties();
    const additions = aUtils.convertPropsArrayToMap(this._dragAdditions);
    return { ...props, ...additions };
  }

  getPropsForElement(id?: string): cd.PropertyModel | undefined {
    return id ? this.getElemProperties()?.[id] : undefined;
  }

  rectForBoard(boardId?: string) {
    return boardId ? this.outletRects.get(boardId) : undefined;
  }

  /** This is the actively dragged element in the list of dragIds */
  setActiveDragId(id: string) {
    this._activeDragId = id;
  }

  /**
   * When the user is dragging absolute...
   * we need to return the current drag state to save to the store
   */
  getAbsoluteStoreUpdate() {
    return this.isAbsoluteDrag ? this._absoluteUpdate : [];
  }

  setAbsoluteClosestBoard(boardId: string) {
    if (this._closestBoardId === boardId) return;
    this._closestBoardId = boardId;
    const relation = cd.InsertRelation.Append;
    const location = buildInsertLocation(boardId, relation);
    this.setDropLocation(location);
  }

  setInitalBoardForAbsolute([first]: ReadonlyArray<string>, props: cd.ElementPropertiesMap) {
    this._closestBoardId = props[first]?.rootId;
  }

  /** Container is the parent element of the dragged item, could be a board */
  getAbsoluteContainerFrame(parentId: string | undefined, board: cd.IRenderResult): cd.IRect {
    const { id: boardId, frame } = board;
    const parent = this.getPropsForElement(parentId);
    const parentInCurrentBoard = parent?.rootId === boardId;
    if (!parentId || parentId === boardId) return frame;
    const parentFrame = parentInCurrentBoard && this.renderRects.get(parentId)?.frame;
    return parentFrame ? utils.adjustFrameByRoot(parentFrame, frame) : frame;
  }

  /** If unset use the first drag item when happens when dragging from the components panel */
  get activeDragId() {
    return this._activeDragId || this._dragIds[0];
  }

  updateAbsolute(pt: IPoint, closestBoard: cd.IRenderResult) {
    const props = this.getElemProperties();
    const { activeDragId, _dragIds, renderRects } = this;
    const activeFrame = renderRects.get(activeDragId)?.frame;
    if (!activeFrame) return;
    const updates = _dragIds
      .map((id) => props[id])
      .filter((elem): elem is cd.PropertyModel => !!elem)
      .flatMap((element) => {
        const { id, parentId } = element;
        const container = this.getAbsoluteContainerFrame(parentId, closestBoard);
        const dragFrame = renderRects.get(id)?.frame;
        const isActiveElem = id === activeDragId;
        const pos = isActiveElem ? pt : aUtils.offsetCursorFromDragRect(pt, activeFrame, dragFrame);
        const styles = aUtils.calculateAbsoluteEdges(pos, container, element, dragFrame);
        return aUtils.buildAbsPropertiesPartial(id, closestBoard.id, styles);
      });

    this._rendererService.updateElementPropertiesPartial(updates);
    this._absoluteUpdate = updates;
  }

  /**
   * When dragging absolute, we need to reset element position to
   * the top left edge of a board so the user doesnt think the element dissapeared
   */
  setDragOverTreeCell(dropTargetId: string) {
    if (!this.isAbsoluteDrag) return;
    // Ignore if no absolute values have been set
    if (!this._absoluteUpdate.length) return;
    const boardId = this.getPropsForElement(dropTargetId)?.rootId;
    const closestBoard = boardId && this.renderRects.get(boardId);
    if (!closestBoard) return;
    this._closestBoardId = boardId;
    const { x, y } = closestBoard.frame;
    const boardEdgeTL = createPoint(x, y);
    this.updateAbsolute(boardEdgeTL, closestBoard);
  }

  handleAbsoluteDrag(mousePos: IPoint, closestBoard: cd.IRenderResult) {
    this.setAbsoluteClosestBoard(closestBoard.id);
    this.updateAbsolute(mousePos, closestBoard);
  }

  /** 1) Core method for finding the drop target */
  updateCursor(cursor: DndMouseCursor, overCanvas: boolean) {
    if (!overCanvas) return;
    const { isAbsoluteDrag } = this;
    const { velocity, offsetPosition, position } = cursor;
    // Ignore when the user is dragging quickly
    if (cursor.velocity > MAX_VELOCITY && !isAbsoluteDrag) return;

    const { canvas } = this._canvasService;
    const pos = utils.convertCursorForCanvas(position, canvas);
    const closestBoard = this.getClosestBoard(pos);

    if (!closestBoard) return;
    if (isAbsoluteDrag) {
      // We use the offset to position absolute items
      const offset = utils.convertCursorForCanvas(offsetPosition, canvas);
      return this.handleAbsoluteDrag(offset, closestBoard);
    }

    const insideBoard = utils.insideRect(pos, closestBoard.frame);
    if (insideBoard) return this.handleInsideBoard(pos, velocity, closestBoard);
    return this.handleOutsideBoard(pos, velocity, closestBoard);
  }

  get outletRects() {
    return this._interactionService.outletFrameRects;
  }
  /**
   * Active elements being dragged, could be new or existing
   * Also used to inialize dragging, so preprocess as much as possible here
   */
  setDragIds(ids: ReadonlyArray<string>, additions: cd.PropertyModel[] = []) {
    if (areArraysEqual(ids, this._dragIds)) return;
    this._dragIds = ids;
    this._dragAdditions = additions;

    // Assumes Boards cannot be added while user dragging
    this._boardRects = Array.from(this.outletRects.values());
    // Create a pattern matching shape for drag elements
    const props = this.getElemProperties();
    this._mode = aUtils.dragModeFromIds(ids, props);
    if (this.isAbsoluteDrag) return this.setInitalBoardForAbsolute(ids, props);
    /// Relative position Drag Element pattern
    this._dragChildPattern = utils.buildChildPattern(ids, props);
  }

  /** 2) Given the list of available boards, find the closest one to the cursor */
  getClosestBoard(pt: IPoint): cd.IRenderResult | undefined {
    const closest = utils.closestRectToPoint(pt, this._boardRects);
    return this.rectForBoard(closest?.id);
  }

  /** Look at the drag ids and all of thier nested children */
  getIgnoredElementIds(props: cd.ReadonlyElementPropertiesMap): ReadonlyArray<string> {
    return this._dragIds.flatMap((id) => getAllChildIdsRecursive(id, props));
  }

  /** Returns all of the element properties for a given board, ignoring the dragged element */
  elementIdsPerBoard(boardId: string): ReadonlyArray<string> {
    return this._interactionService.elementsByOutletFrame$.getValue().get(boardId) || [];
  }

  /** Given a list of element Props, get current render rects */
  rectsForElements(props: cd.ReadOnlyPropertyModelList): ReadonlyRenderResultsExArray {
    const { renderRects } = this;
    const rects: IRenderResultsEx[] = [];
    for (const { id, parentId } of props) {
      const rect = renderRects.get(id);
      if (rect) rects.push({ ...rect, parentId });
    }
    return rects;
  }

  parentRectForElement(
    element: cd.IRenderResult | undefined,
    adjustedRects: ReadonlyRenderResultsExArray
  ): cd.IRenderResult | undefined {
    const props = this.getPropsForElement(element?.id);
    return props && adjustedRects.find((rect) => rect.id === props.parentId);
  }

  findClosestElement(
    mousePos: IPoint,
    sortedRects: ReadonlyRenderResultsExArray
  ): IRenderResultsEx | undefined {
    // Find the first element the cursor is under
    const element = sortedRects.find((elem) => utils.insideRect(mousePos, elem.frame));
    const parent = this.parentRectForElement(element, sortedRects);
    if (parent) {
      const trimmedNearestRect = element && utils.trimRectEdge(element.frame);
      if (trimmedNearestRect && !utils.insideRect(mousePos, trimmedNearestRect)) return element;
      const trimmedParentRect = utils.trimRectEdge(parent.frame);
      if (!utils.insideRect(mousePos, trimmedParentRect)) return parent;
    }
    return this.closestChildren(element, mousePos, sortedRects);
  }

  closestChildren(
    element: cd.IRenderResult | undefined,
    mousePos: IPoint,
    list: ReadonlyRenderResultsExArray
  ): IRenderResultsEx | undefined {
    if (!element) return;
    const childNodes = list.filter((item) => item.parentId === element.id);
    return utils.closestRectToPoint(mousePos, childNodes, element);
  }

  /**
   * Siblings at the point in which the user STARTS to drag only
   */
  startDragSiblings(
    dragProps: cd.ReadOnlyPropertyModelList,
    props: cd.ElementPropertiesMap
  ): ReadonlyArray<string> {
    return dragProps.reduce<string[]>((acc, elem) => {
      if (!elem.parentId) return acc;
      const childIds = props[elem.parentId]?.childIds;
      if (childIds?.length) {
        const filteredIds = childIds.filter((id) => id !== elem.id);
        acc = [...acc, ...filteredIds];
      }
      return acc;
    }, []);
  }

  /**
   * We detect similar shaped elements to
   * avoid unecissary nesting scenarios
   */
  detectSimilarities(
    dragElements: cd.ReadOnlyPropertyModelList,
    childPatterns: ReadonlyMap<string, string>,
    excludeIds: ReadonlySet<string>,
    props: cd.ReadonlyElementPropertiesMap,
    rects: ReadonlyRenderResultsExArray,
    minWeight = 1 // Matches 2 or more
  ): utils.SimilarDragElements {
    const { renderRects } = this;
    // Filter out ids which have been already processed
    const filtered = rects.filter((rect) => excludeIds.has(rect.id));
    // Find similar elements to the drag elements
    const similar = dragElements.flatMap((elem) => {
      const dragRect = renderRects.get(elem.id);
      const dragChildCount = elem.childIds.length || 0;
      const dragChildPattern = childPatterns.get(elem.id) || '';
      return utils.filterRectsByWeight(
        filtered,
        props,
        dragRect,
        dragChildCount,
        dragChildPattern,
        minWeight
      );
    });

    // Ignore all childIds of similar elements
    const similarChildren = similar.flatMap((item) => {
      return getAllChildIdsRecursive(item.id, props, false);
    });

    return [similar, similarChildren];
  }
  /**
   * If we see simlar elements... especially siblings inside a list or grid
   * we probably dont want to place them inside each other
   * i.e prevents dragging a card inside a similar card, or other like elements
   */
  detectElementsWithSimilarShape(
    props: cd.ReadonlyElementPropertiesMap,
    rects: ReadonlyRenderResultsExArray
  ): utils.SimilarDragElements {
    const dragElements = utils.getPropsArrayFromIds(this._dragIds, props);
    // Do the currently dragging elements have children?

    const dragElemWithChildren = dragElements.filter((item) => item.childIds.length);
    if (!dragElemWithChildren.length) return [[], []]; // if not skip
    const { _dragChildPattern } = this;
    // Next lets look at the siblings of the currently dragged element
    const startDragSiblings = new Set(this.startDragSiblings(dragElements, props));
    // Are any of these siblings with children simlar to the current drag elements?
    const [similarSiblings, siblingChildren] = this.detectSimilarities(
      dragElemWithChildren,
      _dragChildPattern,
      startDragSiblings,
      props,
      rects
    );

    // Ignoring siblings, lets look at all other elements for matches
    const siblingIds = new Set(similarSiblings.map((item) => item.id));
    const otherElements = new Set(
      rects.filter((item) => !siblingIds.has(item.id)).map((item) => item.id)
    );

    const [otherSimilar, otherChildren] = this.detectSimilarities(
      dragElemWithChildren,
      _dragChildPattern,
      otherElements,
      props,
      rects,
      2
    );
    const similarRects = [...similarSiblings, ...otherSimilar];
    const children = [...siblingChildren, ...otherChildren];
    return [similarRects, children];
  }

  /** is the cursor over the drag element (maybe clip) */
  isOverSelf(mousePos: IPoint, closestBoard: cd.IRenderResult): boolean {
    const { dragRects } = this;
    const adjustedRects = utils.adjustedRectsForElementByRoot(dragRects, closestBoard);
    return adjustedRects.some((rect) => utils.insideRect(mousePos, rect.frame));
  }

  get dragRects(): ReadonlyArray<cd.IRenderResult> {
    const { _dragIds, renderRects } = this;
    return _dragIds
      .map((id) => renderRects.get(id))
      .filter((rect): rect is cd.IRenderResult => !!rect);
  }

  getDragBounds(): cd.IRect | undefined {
    const { dragRects } = this;
    if (!dragRects.length) return;
    const rects = dragRects.map((item) => item.frame);
    const [, , w, h] = generateBounds(rects);
    const zoom = this._canvasService.canvas.position.z;
    const width = w * zoom;
    const height = h * zoom;
    return { x: 0, y: 0, width, height };
  }

  /** While dragging elements around, their rects update including their reference to a specific board */
  getAdjustedDragRects(closestBoard: cd.IRenderResult): ReadonlyRenderResultsExArray {
    const { _dragIds, renderRects } = this;
    return _dragIds.reduce<IRenderResultsEx[]>((acc, id) => {
      const dragRect = renderRects.get(id);
      if (!dragRect) return acc;
      const root = renderRects.get(dragRect.rootId);
      if (dragRect.rootId === id) return acc;
      const boardFrame = root?.frame || closestBoard.frame;
      const frame = utils.adjustFrameByRoot(dragRect.frame, boardFrame);
      acc.push({ ...dragRect, frame });
      return acc;
    }, []);
  }

  isElementCloserThanDragRect(
    mousePos: IPoint,
    rect: IRenderResultsEx | undefined,
    closestBoard: cd.IRenderResult
  ): boolean {
    if (!rect) return false;
    const adjustedRects = this.getAdjustedDragRects(closestBoard);
    const dist = utils.distanceToRect(mousePos, rect.frame);
    return adjustedRects.some(({ frame }) => dist > utils.distanceToRect(mousePos, frame));
  }

  /** When holding SHIFT we limit relative drag and drop to the current group */
  handleDragWithinGroup(mousePos: IPoint, closestBoard: cd.IRenderResult) {
    if (!this._shiftKeyDown) return false;
    const props = this.getElemProperties();
    const { _dragIds } = this;
    const [first] = _dragIds;
    const parentId = props[first]?.parentId;
    if (!parentId) return false;
    const childIds = props[parentId]?.childIds ?? [];
    if (!childIds.length) return false;
    const dragSet = new Set(_dragIds);
    const filtered = childIds.filter((id) => !dragSet.has(id));
    const elemProps = utils.getPropsArrayFromIds(filtered, props);
    const childRects = this.rectsForElements(elemProps);
    const adjustedRects = utils.adjustedRectsForElementByRoot(childRects, closestBoard);
    const closest = this.findClosestElement(mousePos, adjustedRects);
    if (!closest) return true;
    const before = utils.isCursorBeforeOrAfterDiagInRect(mousePos, closest.frame);
    const rel = before ? cd.InsertRelation.Before : cd.InsertRelation.After;
    const location = buildInsertLocation(closest.id, rel);
    if (this.isElementCloserThanDragRect(mousePos, closest, closestBoard)) return true;
    this.setDropLocation(location);
    return true;
  }

  /** 3) Core method for filtering down which element is the closest and what is the relatinon to drop location */
  handleInsideBoard(mousePos: IPoint, velocity: number, closestBoard: cd.IRenderResult) {
    if (this.handleDragWithinGroup(mousePos, closestBoard)) return;
    // Get All elementIds for the closest board
    const props = this.getElemProperties();
    // All elements per board, bug ignore drag items
    const dragChildren = new Set(this.getIgnoredElementIds(props));

    const elementIds = this.elementIdsPerBoard(closestBoard.id);
    const excludeDragIds = elementIds.filter((id) => !dragChildren.has(id));

    // Get their element properties
    const elemProps = utils.getPropsArrayFromIds(excludeDragIds, props);
    // Convert to an array of props sorted by parent / child relationship (stacking order)
    const sortedProps = utils.sortElementsByDepth(elemProps, closestBoard.id, props);
    // Convert to an array of sorted render rects
    const sortedRects = this.rectsForElements(sortedProps);

    // Detect large layout shifts
    // const rectSum = sortedRects.reduce((acc, { frame }) => (acc += frame.x + frame.y), 0);
    // const rectDelta = Math.abs(this._sumOfAllPositions - rectSum);

    const [similar, similarChildren] = this.detectElementsWithSimilarShape(props, sortedRects);
    const similarChildrenIds = new Set(similarChildren);
    const filteredRects = sortedRects.filter((rect) => !similarChildrenIds.has(rect.id));
    const adjustedRects = utils.adjustedRectsForElementByRoot(filteredRects, closestBoard);

    // Starting drag position could also be used to determine siblings of a similar shape
    const closest = this.findClosestElement(mousePos, adjustedRects);
    const location = this.dropLocationForElement(mousePos, velocity, closest, similar);

    // Are we actually closer to the current drag rect?
    // if so, ignore - this helps prevent flickering when dragging
    if (this.isElementCloserThanDragRect(mousePos, closest, closestBoard)) {
      return;
    }

    this.setDropLocation(location);
  }

  handleDropLocationIsBoard(mousePos: IPoint, elem: IRenderResultsEx): cd.IInsertLocation {
    const { id, frame } = elem;
    const before = utils.isCursorBeforeOrAfterDiagInRect(mousePos, frame);
    const relation = before ? cd.InsertRelation.Prepend : cd.InsertRelation.Append;
    return buildInsertLocation(id, relation);
  }

  /** Determine if we drop into this element */
  canDropInside(
    mousePos: IPoint,
    { elementType, id }: cd.PropertyModel,
    frame: cd.IRect,
    similar: ReadonlyRenderResultsExArray,
    _velocity: number
  ): boolean | undefined {
    const definition = getComponent(elementType);
    if (!definition?.childrenAllowed) return false;
    const insideElement = utils.insideRect(mousePos, frame);
    const [first] = this._dragIds;
    const dragItemRect = this.renderRects.get(first);
    const sameSize = dragItemRect && utils.areRectsTheSameSize(dragItemRect?.frame, frame);
    const isElementSmaller = dragItemRect && utils.isSecondRectSmaller(dragItemRect?.frame, frame);
    const includesSimilar = new Set(similar.map((item) => item.id)).has(id);
    return insideElement && !sameSize && !isElementSmaller && !includesSimilar;
  }

  dropLocationForElement(
    mousePos: IPoint,
    _velocity: number,
    element: IRenderResultsEx | undefined,
    similar: ReadonlyRenderResultsExArray
  ): cd.IInsertLocation | undefined {
    const props = this.getPropsForElement(element?.id);
    if (!props || !element) return;

    const root = isRoot(props);
    if (root) return this.handleDropLocationIsBoard(mousePos, element);
    const dropInside = this.canDropInside(mousePos, props, element.frame, similar, _velocity);
    if (dropInside) {
      // Once inside we check against proximity to the edge
      const innerRect = utils.trimRectEdge(element.frame);
      if (utils.insideRect(mousePos, innerRect)) {
        const innerBefore = utils.isCursorBeforeOrAfterDiagInRect(mousePos, innerRect);
        const relation = innerBefore ? cd.InsertRelation.Prepend : cd.InsertRelation.Append;
        return buildInsertLocation(element.id, relation);
      }
    }

    const before = utils.isCursorBeforeOrAfterDiagInRect(mousePos, element.frame);
    const rel = before ? cd.InsertRelation.Before : cd.InsertRelation.After;
    return buildInsertLocation(element.id, rel);
  }

  /** Send drop location to dnd director service */
  setDropLocation(location?: cd.IInsertLocation) {
    this._prevLocation = location;
    this.dropLocation$.next(location);
  }

  handleOutsideBoard(mousePos: IPoint, _velocity: number, board: cd.IRenderResult) {
    const inRange = utils.distanceToRect(mousePos, board.frame) < BOARD_DIST_THRESHOLD;
    if (!inRange) return this.setDropLocation();
    const before = utils.isCursorBeforeOrAfterDiagInRect(mousePos, board.frame);
    if (before) return;
    const location = buildInsertLocation(board.id, cd.InsertRelation.Append);
    this.setDropLocation(location);
  }
}
