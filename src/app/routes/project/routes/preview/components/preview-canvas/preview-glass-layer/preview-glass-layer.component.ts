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
  Component,
  ChangeDetectionStrategy,
  Input,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
  HostListener,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { Subscription } from 'rxjs';
import { BUBBLE_SIZE, RECT_STROKE } from '../preview-canvas.interface';
import { RendererService } from 'src/app/services/renderer/renderer.service';
import { PreviewInteractionService } from '../../../services/preview-interaction.service';
import { ICommentsState } from '../../../../../store/reducers/comment-threads.reducer';
import { buildGlassRenderRectsMap } from './preview-glass-layer.utils';
import { translate } from 'cd-utils/css';
import * as utils from '../preview-canvas.utils';
import * as cd from 'cd-interfaces';

export enum LayerMode {
  Comments = 'comments',
  A11y = 'a11y',
}

@Component({
  selector: 'app-preview-glass-layer',
  templateUrl: './preview-glass-layer.component.html',
  styleUrls: ['./preview-glass-layer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PreviewGlassLayerComponent implements OnInit, OnDestroy, OnChanges {
  private _subscription = new Subscription();
  public LayerMode = LayerMode;
  public bubbleSize = BUBBLE_SIZE;
  public rectStroke = RECT_STROKE;
  public boardFrame?: cd.IRect;
  public svgTransition = '';
  public paddedBoardFrame?: cd.IRect;
  public elementIds: string[] = [];
  public hoveredTopLevelElementId = '';
  public renderRects = new Map<string, cd.IRenderResult>();
  public currentRenderRects = new Map<string, cd.IRenderResult>();
  public commentedThreads: cd.ICommentThreadDocument[] = []; // List of Ids that are not the board
  public commentRectLabels = new Map<string, number>();
  public currentGreenlineResults: cd.IGreenlineRenderResults = {};
  public greenlineRects: ReadonlyArray<cd.IGreenlineRenderResult> = [];
  public overlayMaskRects?: ReadonlyArray<cd.IGreenlineRenderResult>;
  public focusedBoardElement?: cd.IGreenlineRenderResult | null;
  public currentHighlightedElementId?: string;
  public hoveredThreadId?: string;
  public selectionActive = false;

  @Input() width = 100;
  @Input() height = 100;
  @Input() scale = 1;
  @Input() boardId = '';
  @Input() paddingOffset = 20;
  @Input() commentState?: ICommentsState;
  @Input() currentSelectedId = '';
  @Input() isEmbedMode = false;
  @Input() layerMode: LayerMode = LayerMode.Comments;
  @Input() landmarksEnabled = false;
  @Input() headingsEnabled = false;
  @Input() flowEnabled = false;
  @Input() props: cd.ElementPropertiesMap = {};

  constructor(
    private _interactionService: PreviewInteractionService,
    private _renderService: RendererService,
    private _cdRef: ChangeDetectorRef
  ) {}

  get scaledWidth() {
    return this.width * this.scale;
  }

  get scaledHeight() {
    return this.height * this.scale;
  }

  get isA11yMode() {
    return this.layerMode === LayerMode.A11y;
  }

  get showGreenlines() {
    const { isA11yMode, isEmbedMode, flowEnabled, landmarksEnabled, headingsEnabled } = this;
    const greenlinesEnabled = flowEnabled || landmarksEnabled || headingsEnabled;
    return isA11yMode || (isEmbedMode && greenlinesEnabled);
  }

  get isCommentsMode() {
    return this.layerMode === LayerMode.Comments && !this.isEmbedMode;
  }

  get isSelectionMode() {
    return this.selectionActive && !this.isEmbedMode;
  }

  get allGreenlineResults() {
    const { landmarks, headings, flow } = this.currentGreenlineResults;
    return [...(landmarks || []), ...(headings || []), ...(flow || [])];
  }

  initSubscriptions(subs: Subscription) {
    const {
      previewRenderResultsByBoard$,
      rendererGreenlineResultsByBoard$,
      rendererFocusedElementByBoard$,
    } = this._renderService;

    const { currentHighlightedElementId$, hoveredCommentThreadId$, selectionActive$ } =
      this._interactionService;

    subs.add(previewRenderResultsByBoard$.subscribe(this.handleRenderRects));
    subs.add(rendererGreenlineResultsByBoard$.subscribe(this.handleGreenlineResults));
    subs.add(rendererFocusedElementByBoard$.subscribe(this.handleFocusedElement));
    subs.add(currentHighlightedElementId$.subscribe(this.onHighlightedElement));
    subs.add(hoveredCommentThreadId$.subscribe(this.onCommentThreadId));
    subs.add(selectionActive$.subscribe(this.onSelectionActive));
  }

  ngOnInit() {
    this.initSubscriptions(this._subscription);
    this.setSVGTransition();
  }

  onSelectionActive = (active: boolean) => {
    this.selectionActive = active;
    this._cdRef.markForCheck();
  };

  ngOnDestroy() {
    this._subscription.unsubscribe();
  }

  onCommentThreadId = (id?: string) => {
    this.hoveredThreadId = id;
    this.setHightlightIds();
    this._cdRef.markForCheck();
  };

  onHighlightedElement = (id?: string) => {
    this.currentHighlightedElementId = id;
    this._cdRef.markForCheck();
  };

  ngOnChanges(changes: SimpleChanges) {
    if (changes.boardId) this.setCurrentRects();
    if (changes.paddingOffset) this.setSVGTransition();
    if (changes.commentState) this.setHightlightIds();

    const greenlinesDidUpdate =
      changes.layerMode ||
      changes.flowEnabled ||
      changes.landmarksEnabled ||
      changes.headingsEnabled;

    if (greenlinesDidUpdate) this.setGreenlineRects();
  }

  private handleRenderRects = (renderRects: cd.IStringMap<cd.RenderResults>) => {
    this.renderRects = buildGlassRenderRectsMap(renderRects);
    this.setCurrentRects();
  };

  private handleGreenlineResults = (
    greenlineResults: cd.IStringMap<cd.IGreenlineRenderResults>
  ) => {
    this.currentGreenlineResults = greenlineResults[this.boardId] || {};
    this.setGreenlineRects();
  };

  private handleFocusedElement = (focusedElement: cd.IGreenlineRenderResult | null) => {
    if (!this.showGreenlines) return;
    this.focusedBoardElement = focusedElement;
    this._cdRef.markForCheck();
  };

  private resetFocusedElement() {
    this.focusedBoardElement = undefined;
  }

  private setGreenlineRects() {
    if (!this.showGreenlines) return;
    const { flow, landmarks, headings, masks } = this.currentGreenlineResults;
    const { flowEnabled, landmarksEnabled, headingsEnabled } = this;
    const flowRects = (flowEnabled && flow) || [];
    const landmarkRects = (landmarksEnabled && landmarks) || [];
    const headingRects = (headingsEnabled && headings) || [];
    this.greenlineRects = [...landmarkRects, ...headingRects, ...flowRects];
    this.overlayMaskRects = masks || [];
    this._cdRef.markForCheck();
  }

  private setCurrentRects() {
    const { boardId, renderRects } = this;
    const [relevantRects, elementIds] = utils.getCurrentRenderRects(boardId, renderRects);
    const boardRects = renderRects.get(boardId);
    if (!boardRects) return;

    this.boardFrame = boardRects.frame;
    this.paddedBoardFrame = utils.getPaddedFrame(boardRects.frame);
    this.currentRenderRects = relevantRects;
    this.elementIds = elementIds;
    this.setHightlightIds();
    this.resetFocusedElement();
    this._cdRef.markForCheck();
  }

  private setHightlightIds() {
    const { currentRenderRects, commentState, hoveredThreadId } = this;
    if (!commentState) return;
    const { commentThreads, commentsMap, comments } = commentState;
    const { entities } = commentThreads;
    if (!entities) return;
    const threads = Object.values(entities) as cd.ICommentThreadDocument[];
    const allHighlightedThreads = threads.filter(this.filterNonHighlightedThreads);

    this.commentedThreads = utils.getCommentedRects(
      allHighlightedThreads,
      currentRenderRects,
      hoveredThreadId
    );
    this.commentRectLabels = utils.getCommentRectLabels(
      allHighlightedThreads,
      commentsMap,
      comments
    );
  }

  private filterNonHighlightedThreads = (thread: cd.ICommentThreadDocument) => {
    const { elementIds, hoveredThreadId } = this;
    const { id, elementTargetId } = thread;
    return id === hoveredThreadId || (elementTargetId && elementIds.includes(elementTargetId));
  };

  private idFromTarget(e: MouseEvent): string | undefined {
    const target = e.target as SVGRectElement;
    return target.dataset.id;
  }

  private setSVGTransition() {
    const { paddingOffset } = this;
    this.svgTransition = translate(paddingOffset, paddingOffset);
  }

  trackByFn(_index: number, id: string) {
    return id;
  }

  updateHoverboardId(value = '') {
    this.hoveredTopLevelElementId = value;
    this._interactionService.setHoverBoardId(value);
  }

  @HostListener('mouseout')
  @HostListener('mouseover')
  onBackgroundMouseOver() {
    this.updateHoverboardId('');
    this._interactionService.setHoveredGreenLine(undefined);
  }

  onSVGMouseOver(e: MouseEvent) {
    e.stopImmediatePropagation();
    const id = this.idFromTarget(e);
    this.updateHoverboardId(id);
    const greenlineRect = this.getHoveredGreenlineRect(e);
    this._interactionService.setHoveredGreenLine(greenlineRect);
  }

  setSelectedElementId(id = '') {
    const value = this.currentSelectedId === id ? '' : id;
    this.currentSelectedId = value;
    this._interactionService.setSelectedElementId(value);
  }

  onSVGClick(e: MouseEvent) {
    e.stopImmediatePropagation();
    const enableElementClick = this.selectionActive || this.greenlineRects.length;
    if (!enableElementClick) return;
    const id = this.idFromTarget(e);
    if (!id) return;
    this.setSelectedElementId(id);
  }

  getHoveredGreenlineRect(e: MouseEvent) {
    const { allGreenlineResults, hoveredTopLevelElementId } = this;
    const element = e.target as SVGRectElement;
    const hoveredGreenlineRectId = element?.dataset.rect || hoveredTopLevelElementId;
    const hoveredGreenlineResults = allGreenlineResults.filter((greenline) => {
      return greenline.id === hoveredGreenlineRectId;
    });

    if (!hoveredGreenlineResults.length) return;
    // Since a top level element can have more than one greenline,
    // use last match (visually on top)
    const lastIndex = hoveredGreenlineResults.length - 1;
    return hoveredGreenlineResults[lastIndex];
  }
}
