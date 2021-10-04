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
  HostBinding,
  ChangeDetectorRef,
  ElementRef,
  HostListener,
  OnInit,
  OnDestroy,
  NgZone,
  OnChanges,
  SimpleChanges,
  ViewChildren,
  QueryList,
} from '@angular/core';
import { SelectionContextService } from '../../../services/selection-context/selection.context.service';
import { SelectTargetService } from '../../../services/select-target/select-target.service';
import { InteractionService } from '../../../services/interaction/interaction.service';
import { PropertiesService } from '../../../services/properties/properties.service';
import { GlassRectDragItemDirective } from '../../../dnd-director/drag-item.directive';
import { didArrayValueChangeForKey, didValueChangeForKey } from '../glass.utils';
import { Subscription, fromEvent, merge } from 'rxjs';
import { areSetsEqual } from 'cd-utils/object';
import { filter, map } from 'rxjs/operators';
import { RichTextService } from 'cd-common';
import { createPoint } from 'cd-utils/geometry';
import * as utils from './interaction-layer.utils';
import * as models from 'cd-common/models';
import * as cd from 'cd-interfaces';

@Component({
  selector: 'g[app-interaction-layer]',
  templateUrl: './interaction-layer.component.html',
  styleUrls: ['./interaction-layer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InteractionLayerComponent implements OnInit, OnDestroy, OnChanges {
  private _activeParent = new Set<string>();
  private _subscriptions = new Subscription();

  public hitRegions: ReadonlyArray<string> = [];
  public onlyOutletFrameSelected = false;
  public selectedIds = new Set<string>();

  @Input() zoom = 1;
  @Input() dragging = false;
  @Input() outletFrame!: cd.IRenderResult;
  @Input() renderRects: cd.RenderRectMap = new Map();
  @Input() selectAnyElement = false;
  @Input() elements: ReadonlyArray<string> = [];
  @Input() selection: cd.RenderElementMap = new Map();

  @Input()
  @HostBinding('class.debug')
  debug = false;

  @ViewChildren(GlassRectDragItemDirective) _dragItems?: QueryList<GlassRectDragItemDirective>;

  constructor(
    private _selectTargetService: SelectTargetService,
    private _interactionService: InteractionService,
    private _textService: RichTextService,
    private _propertiesService: PropertiesService,
    private _selectionContextService: SelectionContextService,
    private _elementRef: ElementRef,
    private _cdRef: ChangeDetectorRef,
    private _zone: NgZone
  ) {}

  get outletId() {
    return this.outletFrame.id;
  }

  get element() {
    return this._elementRef.nativeElement;
  }

  get dragItems() {
    return this._dragItems?.toArray() || [];
  }

  buildActiveParentListForValues(values: string[] = []) {
    const activeIds = values.flatMap((id) => this._propertiesService.getElementAncestors(id));
    this._activeParent = new Set(activeIds);
  }

  didSelectionChange(changes: SimpleChanges): boolean {
    const selectionChange = didValueChangeForKey<this>('selection', changes);
    if (!selectionChange) return false;
    const { outletId, selection } = this;
    const outletSelection = selection.get(outletId);
    const selectionSet = new Set(outletSelection);
    if (areSetsEqual(this.selectedIds, selectionSet)) {
      // ignore boards without selection
      if (selectionSet.size === 0 && this.selectedIds.size === 0) return false;
    }

    this.selectedIds = selectionSet;
    const isOutletFrameSelected = outletSelection?.[0] === outletId;
    const hasActiveParent = outletSelection?.some(this.hasActiveParent);
    if (!hasActiveParent || isOutletFrameSelected) this._activeParent.clear();

    const onlySelected = utils.isOnlyOutletFrameSelected(outletSelection, selection.size, outletId);
    this.onlyOutletFrameSelected = onlySelected;

    const shouldBuildActiveParentList = outletSelection && !isOutletFrameSelected;
    if (shouldBuildActiveParentList) {
      // When CMD + Clicking into a child we don't yet have
      // a list of active parents therefore, we must build it
      this.buildActiveParentListForValues(outletSelection);
    }

    return true;
  }

  ngOnChanges(changes: SimpleChanges): void {
    const selectAnyElemChange = didValueChangeForKey<this>('selectAnyElement', changes);
    const elementsChange = didArrayValueChangeForKey<this>('elements', changes);
    const selectionChange = this.didSelectionChange(changes);
    const canUpdateRegions = selectionChange || selectAnyElemChange || elementsChange;
    // Don't build hit regions while dragging (expensive)
    if (!this.dragging && canUpdateRegions) {
      this.buildHitRegion(this.selectAnyElement);
    }
  }

  ngOnInit(): void {
    const { element } = this;
    const MOUSE_OUT = 'mouseout';
    this._subscriptions = new Subscription();
    const mouseEvents$ = merge(
      fromEvent<MouseEvent>(element, 'mouseover'),
      fromEvent<MouseEvent>(element, 'mouseenter'),
      fromEvent<MouseEvent>(element, MOUSE_OUT)
    ).pipe(
      filter(() => this.dragging === false),
      map<MouseEvent, utils.ILayerHover>((e) => {
        const remove = e.type === MOUSE_OUT;
        return [remove, utils.idFromTarget(e), this.outletFrame.id];
      })
    );

    this._zone.runOutsideAngular(() => {
      this._subscriptions.add(mouseEvents$.subscribe(this.toggleHighlight));
    });

    const mousedown$ = fromEvent<MouseEvent>(element, 'mousedown');
    this._subscriptions.add(mousedown$.subscribe(this.onMousedown));
  }

  onMousedown = (e: MouseEvent) => {
    const id = utils.idFromTarget(e);
    if (id) {
      const directive = this.dragItems.find((item) => item.elementId === id);
      directive?.onMouseDown(e);
    }
  };

  toggleHighlight = ([remove, id, outletFrameId]: utils.ILayerHover) => {
    if (!id) return;
    this._zone.run(() => {
      if (remove) return this._interactionService.removeHighlight(outletFrameId, id);
      this._interactionService.highlight(outletFrameId, id);
    });
  };

  ngOnDestroy(): void {
    this._subscriptions.unsubscribe();
  }

  /**
   * Hit region are the selectable elements on the design surface,
   * @param metaKey - is the user holding down ALT or is the user in target select mode
   */
  buildHitRegion(metaKey = false) {
    if (this._interactionService.interacting === true) return;
    this._zone.runOutsideAngular(() => {
      const { elements = [], _activeParent, outletId } = this;
      const filterRoot = elements.filter((item) => item !== outletId);
      const props = this._propertiesService.getPropertiesForIds(...filterRoot);
      const elementProps = this._propertiesService.getElementProperties();
      const regions = utils.generateRegions(props, metaKey, outletId, _activeParent, elementProps);
      this._zone.run(() => {
        this.hitRegions = regions;
        this._cdRef.markForCheck();
      });
    });
  }

  selectChild(childId: string) {
    this._interactionService.toggleElements([childId], false, false);
  }

  selectChildElementUnderCursor(e: MouseEvent, childIds: string[], id: string) {
    // If there is only one childID, select that
    if (childIds.length === 1) {
      const [firstChild] = childIds;
      return this.selectChild(firstChild);
    }

    const { element, zoom, renderRects } = this;
    const cursor = createPoint(e.clientX, e.clientY);
    const selected = utils.getElementUnderCursor(cursor, zoom, childIds, renderRects, element);
    if (selected) return this.selectChild(selected);

    // IF child id cannot be determined
    // add this element to active targets
    this._activeParent.add(id);
    this.buildHitRegion();
  }

  hasActiveParent = (elementId: string): boolean => {
    const parentId = this._propertiesService.getPropertiesForId(elementId)?.parentId;
    return !!parentId && !this._activeParent.has(parentId);
  };

  public trackFn(index: number, item: string): string {
    return `${index}${item}`;
  }

  @HostListener('click', ['$event'])
  @HostListener('contextmenu', ['$event'])
  onClick(e: MouseEvent) {
    if (this.dragging === true) return;
    if (e.type === 'contextmenu') {
      e.preventDefault();
    }
    const { shiftKey, detail } = e;
    const id = utils.idFromTarget(e);
    if (!id || detail > 1) return;

    if (this._selectTargetService.active) {
      return this._selectTargetService.setSelection(id);
    }

    const isSelected = this._interactionService.isSelected(id);
    if (!isSelected || shiftKey) {
      if (this.hasActiveParent(id)) this._activeParent.clear();
      this._interactionService.toggleElements([id], shiftKey, true);
    }
  }

  get inSymbolIsolation(): boolean {
    return Boolean(this._selectionContextService.panelsState?.symbolMode);
  }
  /** Animate canvas to the board which hosts the portal */
  handleSnapToBoardPortal(props: cd.IBoardPortalProperties) {
    if (this.inSymbolIsolation) return; // don't snap in isolation mode
    const boardId = props.inputs.referenceId;
    this._interactionService.snapToBoardAndSelect(boardId);
  }

  handleSnapToTabsBoard(props: cd.ITabProperties) {
    if (this.inSymbolIsolation) return; // don't snap in isolation mode
    const selectedTabIdx = props.inputs.selectedIndex || 0;
    const selectedTabId = props.inputs.childPortals?.[selectedTabIdx]?.value;
    if (!selectedTabId) return;
    this._interactionService.snapToBoardAndSelect(selectedTabId);
  }

  @HostListener('dblclick', ['$event'])
  onDoubleClick(e: MouseEvent) {
    if (this.dragging === true) return;
    const { outletId } = this;
    const id = utils.idFromTarget(e);
    if (!id || id === outletId) return;
    const props = this._propertiesService.getPropertiesForId(id);
    if (!props) return;
    e.preventDefault();
    e.stopPropagation();

    this._interactionService.removeHighlight(outletId, id);
    if (models.isText(props)) return this._textService.focusOnText();
    if (models.isBoardPortal(props)) return this.handleSnapToBoardPortal(props);
    if (models.isTabs(props)) return this.handleSnapToTabsBoard(props);
    if (models.isSymbolInstance(props)) return this._interactionService.isolateSymbol(props);
    if (props.isCodeComponentInstance) return this.handleEditCodeComponent(props);
    if (props?.childIds?.length) return this.handleNestedElementSelection(e, props);
  }

  handleEditCodeComponent(props: cd.PropertyModel) {
    this._propertiesService.editCodeComponentInstance(props);
  }

  /** When a user doubleclicks on a element (group) we build a hit region and select the first child */
  handleNestedElementSelection(e: MouseEvent, props: cd.PropertyModel) {
    this.buildHitRegion();
    this.selectChildElementUnderCursor(e, props.childIds, props.id);
  }
}
