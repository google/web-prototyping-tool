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

// prettier-ignore
import { Component, Input, ChangeDetectionStrategy, ChangeDetectorRef, Output, EventEmitter, ElementRef, OnDestroy, AfterViewInit, ComponentRef, HostListener, ViewChild, ViewChildren, QueryList, } from '@angular/core';
import { scrollElementIntoViewIfNeeded } from 'cd-utils/dom';
import { SelectTargetService } from '../../services/select-target/select-target.service';
import { InteractionService } from '../../services/interaction/interaction.service';
import { SelectionContextService } from '../../services/selection-context/selection.context.service';
import { ISelectionState } from '../../store/reducers/selection.reducer';
import { LayersTreeService } from '../../services/layers-tree/layers-tree.service';
import { ViewportService, IWindowSize } from '../../services/viewport/viewport.service';
import { TreeDragItemDirective } from '../../dnd-director/drag-item.directive';
import { DndDirectorService } from '../../dnd-director/dnd-director.service';
import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import { isControlKeyPressed, MouseButton } from 'cd-utils/keycodes';
import { getShowingBoardIds, IAppState } from 'src/app/store';
import { TreeController } from './tree.control';
import { MenuComponent, TreeCellComponent } from 'cd-common';
import { Subscription } from 'rxjs';
import { Store, select } from '@ngrx/store';
import { DropManager } from './drop-manager';
import { auditTime } from 'rxjs/operators';
import * as layer from '../../interfaces/layers.interface';
import * as treeUtils from './layers-tree.utils';
import * as models from 'cd-common/models';
import * as config from './layers.config';
import * as projStore from '../../store';
import * as cd from 'cd-interfaces';
import { ProjectContentService } from 'src/app/database/changes/project-content.service';

const HEADER_HEIGHT = 78;
const DRAG_OVER_TIMER = 800;
const CELL_SIZE = 24;
const BUFFER_COUNT = 5;

@Component({
  selector: 'app-layers-tree',
  templateUrl: './layers-tree.component.html',
  styleUrls: ['./layers-tree.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayersTreeComponent implements OnDestroy, AfterViewInit {
  private _componentRef?: ComponentRef<MenuComponent>;
  private _dropManager = new DropManager();
  private _dragOverTimer = 0;
  private _subscriptions = new Subscription();
  private _searchString = '';
  ///
  public controller = new TreeController();
  public isDragging = false;
  public minScrollBuffer = 0;
  public maxScrollBuffer = 0;
  public CELL_SIZE = CELL_SIZE;
  public indentValue = 1;
  public debugIds = false;
  public hoverBoardId = '';
  public readonly INDENT_PER_LEVEL = config.INDENT_PER_LEVEL;
  public readonly CHILD_INDENT_AMOUNT = config.CHILD_INDENT_AMOUNT;

  @Input() showIndentLines = false;
  @Input()
  set homeBoardId(value: string) {
    this.controller.homeBoardId = value;
  }

  @Input()
  set selectionState({ ids }: ISelectionState) {
    this.controller.selection = ids;
    if (ids.size > 0) {
      this.controller.updateSelectionState();
      this._expandSelection();
    }
  }

  @Input() set searchString(searchStr: string) {
    if (this._searchString === searchStr) return;
    this._searchString = searchStr;
    this.controller.updateSearchString(searchStr);
  }

  @Output() toggleHidden = new EventEmitter<layer.IToggleElementsHidden>();
  @Output() labelChange = new EventEmitter<layer.ILabelUpdate>();

  @ViewChildren('cell') treeCell?: QueryList<TreeCellComponent>;
  @ViewChildren(TreeDragItemDirective) _dragItems?: QueryList<TreeDragItemDirective>;

  @ViewChild('wrapperRef', { read: ElementRef, static: true }) _wrapper!: ElementRef;
  @ViewChild(CdkVirtualScrollViewport, { read: CdkVirtualScrollViewport, static: true })
  virtualScroll!: CdkVirtualScrollViewport;

  constructor(
    private _cdRef: ChangeDetectorRef,
    private _dndService: DndDirectorService,
    private _appStore: Store<IAppState>,
    private _selectTargetService: SelectTargetService,
    private _projectStore: Store<projStore.IProjectState>,
    private _projectContentService: ProjectContentService,
    private _selectionContext: SelectionContextService,
    private _interactionService: InteractionService,
    private _layersTreeService: LayersTreeService,
    private _viewportService: ViewportService
  ) {}

  get isSearching(): boolean {
    return !!this._searchString;
  }

  get dragItems() {
    return this._dragItems?.toArray() || [];
  }

  trackByFn(_idx: number, item: layer.FlatLayersNode) {
    return item.id + item.level + item.children.length + item.elementType + item.icon;
  }

  @HostListener('mouseover', ['$event'])
  onMouseOver(e: MouseEvent) {
    const node = treeUtils.nodeDetailsFromTarget(e);
    if (!node) return;
    this._interactionService.highlight(node.rootId, node.id);
  }

  @HostListener('mouseout', ['$event'])
  onMouseOut(e: MouseEvent) {
    const node = treeUtils.nodeDetailsFromTarget(e);
    if (!node) return;
    this._interactionService.removeHighlight(node.rootId, node.id);
  }

  @HostListener('mousedown', ['$event'])
  onMouseDown(e: MouseEvent) {
    const node = treeUtils.nodeDetailsFromTarget(e);
    if (!node) return;
    const directive = this.dragItems.find((item) => item.id === node.id);
    directive?.onMouseDown(e);
  }

  onDoubleClick(e: MouseEvent) {
    const node = treeUtils.nodeDetailsFromTarget(e);
    if (!node) return;
    const isLabel = treeUtils.nodeIsInputLabel(e);
    const activeCell = isLabel && this.treeCell?.toArray().find((item) => item.id === node.id);
    if (activeCell) activeCell.onEditLabel();
  }

  // setup subscriptions after view init, so that view can be manipulated on first subscription call
  ngAfterViewInit() {
    const elemProps$ = this._projectContentService.elementProperties$;
    this._subscriptions.add(elemProps$.subscribe(this.onElementProps));
    this._subscriptions.add(this._interactionService.highlight$.subscribe(this.onHighlight));
    const showingIds$ = this._appStore.pipe(select(getShowingBoardIds));
    this._subscriptions.add(showingIds$.subscribe(this.onShowingIds));
    this._subscriptions.add(this._layersTreeService.treeNodes$.subscribe(this._updateTree));
    this._subscriptions.add(this._dndService.dragActive$.subscribe(this.onDragActive));
    this._subscriptions.add(this._viewportService.windowSize$.subscribe(this.updateViewport));
    this._subscriptions.add(
      this._dndService.dropLocation$.pipe(auditTime(0)).subscribe(this._onDropLocation)
    );
  }

  onShowingIds = (showIds: boolean) => {
    this.debugIds = showIds;
    this._cdRef.markForCheck();
  };
  /**
   * The virtual scrollview needs the height of the container to work
   * We use a hardcoded value here because the native element may not be visible when this initalizes
   * */
  updateViewport = (size: IWindowSize) => {
    const height = size.height - HEADER_HEIGHT;
    const min = Math.ceil(height / CELL_SIZE) * CELL_SIZE;
    this.minScrollBuffer = min;
    this.maxScrollBuffer = min + CELL_SIZE * BUFFER_COUNT;
    this._cdRef.markForCheck();
  };

  onContextMenu(e: MouseEvent) {
    e.preventDefault();
    const targetNode = treeUtils.nodeDetailsFromTarget(e);
    const id = targetNode && targetNode.id;
    const selection = this._selectionContext.selection;
    const selectionHasId = id && selection && selection.ids.has(id);
    // if current selection does not include target, clear selection
    // and select target then show context menu
    if (!selectionHasId && targetNode) {
      this.onClick(e);
    }
    this._componentRef = this._selectionContext.createMenuForCurrentContext(e);
  }

  stopRightClickPropagation(e: MouseEvent) {
    if (e.button === MouseButton.Right) e.stopPropagation();
  }

  handleTreeCellArrowClick(id: string, e: MouseEvent) {
    if (this.isSearching) return;
    this.stopRightClickPropagation(e);
    const node = this.controller.findNodeWithId(id);
    if (!node || !node.expandable) return;

    if (e.shiftKey) {
      this.controller.toggleNodeAndDescendants(node);
    } else {
      this.controller.toggle(node.id);
    }

    this._cdRef.markForCheck();
  }

  onHiddenChange(hidden: boolean, node: layer.FlatLayersNode) {
    if (models.isBoard(node)) return; // Boards are not allowed to be hidden
    const { id } = node;
    const includesId = this.controller.isSelected(node);
    if (!includesId) this._selectNode(node);
    const elementIds = new Set([id]);
    this.toggleHidden.emit({ hidden, elementIds });
    this._cdRef.markForCheck();
  }

  handleTreeInteractionClick(e: MouseEvent) {
    this.stopRightClickPropagation(e);
    const action = new projStore.PanelSetPropertyPanelState(cd.PropertyPanelState.Actions);
    this._projectStore.dispatch(action);
  }

  treeCellVisClick(id: string, e: MouseEvent) {
    this.stopRightClickPropagation(e);
    const node = this.controller.findNodeWithId(id);
    if (!node) return;
    const visibility = this.controller.isHidden(id);
    this.onHiddenChange(!visibility, node);
  }

  snapToBoardWithId(id: string) {
    this._interactionService.snapToBoardWithId(id);
  }

  onClick(e: MouseEvent) {
    const targetNode = treeUtils.nodeDetailsFromTarget(e);
    if (targetNode) {
      if (treeUtils.nodeIsExpansionArrow(e)) return this.handleTreeCellArrowClick(targetNode.id, e);
      if (treeUtils.nodeIsVisibilityToggle(e)) return this.treeCellVisClick(targetNode.id, e);
      if (treeUtils.nodeIsActionButton(e)) this.handleTreeInteractionClick(e);
      if (treeUtils.nodeIsGotoBoardButton(e)) this.snapToBoardWithId(targetNode.id);
    }

    if (e.detail === 2) return this.onDoubleClick(e);
    if (!targetNode) return;

    this.stopRightClickPropagation(e);
    e.preventDefault();
    const node = this.controller.findNodeWithId(targetNode.id);
    if (!node) return;
    if (e.shiftKey) return this._addAllBetweenToSelection(node);
    if (isControlKeyPressed(e)) return this._toggleSingleInSelection(node);
    // Select when target select mode is active
    if (this._selectTargetService.active) return this._selectTargetService.setSelection(node.id);
    //
    this._selectNode(node);
  }

  onElementProps = (props: cd.ElementPropertiesMap) => {
    this.controller.updateProps(props);
    this._cdRef.markForCheck();
  };

  onDragActive = (isDragging: boolean) => {
    if (this.isDragging === isDragging) return;
    this.isDragging = isDragging;
    this._cdRef.markForCheck();
  };

  onHighlight = (highlight: cd.RenderElementMap) => {
    if (this.isDragging) return;
    this.controller.highlight = highlight;
    this.hoverBoardId = [...highlight.keys()][0] ?? '';
    this._cdRef.markForCheck();
  };

  private _updateTree = (treeNodes: layer.ILayersNode[]) => {
    this.controller.data = treeNodes;
    this._expandSelection();
    this._cdRef.markForCheck();
  };

  // Toggled when user is currently editing tree cell label
  onEditingLabel = (editingLabel: boolean, node: layer.FlatLayersNode) => {
    node.editingLabel = editingLabel;
    this._cdRef.markForCheck();
  };

  onLabelChange(label: string, { id }: layer.FlatLayersNode) {
    this.labelChange.emit({ id, label });
  }

  collapseAllNodes() {
    this.controller.collapseAllNodes();
    this._interactionService.deselectAll();
    this._cdRef.markForCheck();
  }

  private _selectNode({ id }: layer.FlatLayersNode) {
    this._interactionService.toggleElements([id]);
  }

  private _toggleSingleInSelection({ id }: layer.FlatLayersNode) {
    const { selectionIds } = this.controller;
    const updatedIds = treeUtils.toggleSet(selectionIds, id);
    this._interactionService.toggleElements(Array.from(updatedIds));
  }

  private _addAllBetweenToSelection(node: layer.FlatLayersNode) {
    const updatedSelection = this.controller.addAllToSelectionBetweenNodes(node);
    this._interactionService.toggleElements(Array.from(updatedSelection));
  }

  private _expandSelection() {
    const lastId = this.controller.expandSelection();
    if (lastId) this._scrollNodeIntoViewIfNeeded(lastId);
  }

  isIndexVisible(idx: number): boolean {
    const { start, end } = this.virtualScroll.getRenderedRange();
    const OFFSET = 2;
    const endValue = end - BUFFER_COUNT - OFFSET;
    return idx >= start && idx <= endValue;
  }

  private _scrollNodeIntoViewIfNeeded(id: string) {
    requestAnimationFrame(() => {
      const query = `[data-id="${id}"]`;
      const elem = this._wrapper.nativeElement.querySelector(query);
      if (elem) {
        scrollElementIntoViewIfNeeded(elem, false);
      } else {
        const node = this.controller.findNodeWithId(id);
        const visibleIndex = node && this.controller.visibleIndexOfNode(node);
        if (visibleIndex === undefined) return;
        const visible = this.isIndexVisible(visibleIndex);
        if (visible === false) {
          this.virtualScroll.scrollToIndex(visibleIndex);
        }
      }
    });
  }

  /**
   * When dragging over the layers tree and the user holds the cursor over
   * a node that is collapsed we expand after some time
   */
  private expandChildNodesAfterDelayOverTree(
    targetNode: layer.FlatLayersNode,
    relation: cd.InsertRelation,
    timeout = DRAG_OVER_TIMER
  ) {
    if (relation !== cd.InsertRelation.Prepend) return;
    // if (this._dndService.dragCursorOverCanvas) return false;
    if (!targetNode.expandable || this.controller.isExpanded(targetNode)) return false;
    this._dragOverTimer = window.setTimeout(() => {
      this.controller.expandNode(targetNode);
      this._cdRef.markForCheck();
    }, timeout);
    return true;
  }
  /**
   * Might be worth tracking the previous state to collapse those
   */
  private expandAllParentsNodes(targetNode: layer.FlatLayersNode) {
    // Might be worth tracking the previous state to collapse those
    this.controller.expandAncestors(targetNode);
    this._cdRef.markForCheck();
  }

  private resetDragOverTimer() {
    window.clearTimeout(this._dragOverTimer);
  }

  private _onDropLocation = (dropLocation?: cd.IInsertLocation) => {
    this._dropManager.reset();
    this.resetDragOverTimer();

    if (dropLocation) {
      const { relation, elementId } = dropLocation;
      const { controller } = this;
      const targetNode = controller.findNodeWithId(elementId);
      if (targetNode) {
        if (this._dndService.dragCursorOverCanvas) {
          this.expandAllParentsNodes(targetNode);
          // When dragging over the canvas we may have a node that is inside a collapsed container,
          // we should expand that to give the user context
        } else {
          this.expandChildNodesAfterDelayOverTree(targetNode, relation);
        }

        const parentNode = controller.getParentNode(targetNode) || targetNode;
        const lastChild = controller.lastChildFromTargetNode(relation, targetNode, parentNode);
        this._dropManager.setRelation(relation, targetNode, parentNode, lastChild);
        this.indentValue = this._dropManager.parentLevel + 1;
      }
    }

    this._cdRef.markForCheck();
  };

  ngOnDestroy() {
    this._subscriptions.unsubscribe();
    this.resetDragOverTimer();
    if (this._componentRef) {
      this._selectionContext.destroyMenu();
      this._componentRef = undefined;
    }
  }
}
