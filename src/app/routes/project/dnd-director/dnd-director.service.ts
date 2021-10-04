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

import { APP_ACTIVITY_BAR_TAG, APP_CANVAS_TAG, RECORDING_TOAST } from './dnd.config';
import { InteractionService } from '../services/interaction/interaction.service';
import { getIsRecordingStateChanges } from '../store/selectors/panels.selector';
import { getPrefersAbsolute } from 'src/app/store/selectors/settings.selector';
import { PropertiesService } from '../services/properties/properties.service';
import { auditTime, distinctUntilChanged, filter, tap } from 'rxjs/operators';
import { RendererService } from 'src/app/services/renderer/renderer.service';
import { getSelectionState } from '../store/selectors/selection.selector';
import { ToastsService } from 'src/app/services/toasts/toasts.service';
import { ISelectionState } from '../store/reducers/selection.reducer';
import { PanelStopRecording } from '../store/actions/panels.action';
import { FlatLayersNode } from '../interfaces/layers.interface';
import { Subscription, BehaviorSubject, fromEvent } from 'rxjs';
import { processDragAddtions } from './dnd-surface.abs.utils';
import { Injectable, OnDestroy, NgZone } from '@angular/core';
import { DndPanelManagerService } from './dnd-panel.service';
import { DndSurfaceService } from './dnd-surface.service';
import { IPoint } from 'cd-utils/geometry';
import { DndGhostService } from './dnd-ghost.service';
import { keyCheck, KEYS } from 'cd-utils/keycodes';
import { areObjectsEqual } from 'cd-utils/object';
import { IProjectState } from '../store/reducers';
import { Store, select } from '@ngrx/store';
import { CursorState } from 'cd-utils/css';
import { createId } from 'cd-utils/guid';
import * as mUtils from 'cd-common/models';
import * as dndUtils from './dnd-utils';
import * as cd from 'cd-interfaces';

/** How fast should we update the drop location */
const DRAG_UPDATE_TIMEOUT = 8;

@Injectable({ providedIn: 'root' })
export class DndDirectorService implements OnDestroy {
  private _cursor = new dndUtils.DndMouseCursor();
  private _dragAdditions?: cd.PropertyModel[];
  private _dragIds: string[] = [];
  private _dragSubscription = Subscription.EMPTY;
  private _dropPreview?: cd.IElementChangePayload[];
  private _selectedElementIds = new Set<string>();
  private _subscriptions = new Subscription();
  private _isRecordingAction = false;
  private _dropAllowed = true;
  private _prefersAbsolute = false;

  public dragCursorOverCanvas = false;
  public dragActive$ = new BehaviorSubject<boolean>(false);
  public dropLocation$ = new BehaviorSubject<cd.IInsertLocation | undefined>(undefined);

  constructor(
    private readonly _projectStore: Store<IProjectState>,
    private _ghostService: DndGhostService,
    private _surfaceService: DndSurfaceService,
    private _toastService: ToastsService,
    private _panelService: DndPanelManagerService,
    private _propertiesService: PropertiesService,
    private _interactionService: InteractionService,
    private _rendererService: RendererService,
    private _zone: NgZone
  ) {
    const recordingState$ = this._projectStore.pipe(select(getIsRecordingStateChanges));
    const selectionState$ = this._projectStore.pipe(select(getSelectionState));
    const dndAbsolute$ = this._projectStore.pipe(select(getPrefersAbsolute));
    this._subscriptions.add(dndAbsolute$.subscribe(this.onPrefersAbsolute));
    this._subscriptions.add(recordingState$.subscribe(this.onRecording));
    this._subscriptions.add(selectionState$.subscribe(this.onSelection));
    this._subscriptions.add(
      _surfaceService.dropLocation$
        .pipe(auditTime(DRAG_UPDATE_TIMEOUT))
        .subscribe(this.onSurfaceDropLocation)
    );
  }

  get elementProperties() {
    return this._propertiesService.getElementProperties();
  }

  set dragActive(value: boolean) {
    if (this.dragActive$.getValue() === value) return;
    this.dragActive$.next(value);
  }

  get dragActive() {
    return this.dragActive$.getValue();
  }

  get dropLocation() {
    return this.dropLocation$.getValue();
  }

  get dragIds() {
    return this._dragIds;
  }

  isDropLocationSame(dropLocation?: cd.IInsertLocation): boolean {
    return areObjectsEqual(dropLocation, this.dropLocation);
  }

  onPrefersAbsolute = (prefersAbsolute: boolean | undefined) => {
    this._prefersAbsolute = !!prefersAbsolute;
  };

  onRecording = (isRecording: boolean) => {
    this._isRecordingAction = isRecording;
  };

  onSelection = ({ ids, outletFramesSelected: boardsSelected }: ISelectionState) => {
    this._selectedElementIds = boardsSelected ? new Set() : ids;
  };

  propertiesFromElementId(id: string): cd.PropertyModel | undefined {
    return this._propertiesService.getPropertiesForId(id);
  }

  duplicateDragItems(dragItems: cd.PropertyModel[], properties: cd.ReadonlyElementPropertiesMap) {
    const dupe = mUtils.duplicateModelsAndChildren(dragItems, properties);
    const { rootIds, models } = dupe;
    this.setNewDragItems(rootIds, models);
  }

  setNewDragItems(ids: string[], additions?: cd.PropertyModel[]) {
    this._dragIds = ids;
    this._dragAdditions = processDragAddtions(additions, this._prefersAbsolute);
    this._surfaceService.setDragIds(ids, additions);
  }

  setDragItemById(id: string, { altKey: makeCopy }: MouseEvent) {
    const { _selectedElementIds, elementProperties } = this;
    const dragItems = dndUtils.dragItemsFromSelection(id, elementProperties, _selectedElementIds);
    if (makeCopy) return this.duplicateDragItems(dragItems, elementProperties);
    const dragIds = dragItems.map((item) => item.id);
    this.setNewDragItems(dragIds);
    this._surfaceService.setActiveDragId(id);
  }

  applyAssetToGhost(width: number, height: number) {
    const { _dragIds, elementProperties, _dragAdditions } = this;
    if (_dragIds.length > 1) return; // Dont show preview when multiple items are selected;
    const newDragItems = _dragAdditions && _dragAdditions.length && _dragAdditions[0];
    const fromAssetsPanel = !!newDragItems;
    const element = fromAssetsPanel ? newDragItems : elementProperties[_dragIds[0]];
    const assetId = element && dndUtils.assetIdFromProperties(element);
    // TODO: handle remote urls ghost items
    if (!assetId) return;
    if (fromAssetsPanel) {
      this._ghostService.setAsImageThumbnail(assetId);
    } else {
      this._ghostService.setAssetPanelImage(assetId, element as cd.PropertyModel, width, height);
    }
  }

  applySymbolToGhost() {
    const { _dragIds, elementProperties, _dragAdditions } = this;
    if (_dragIds.length > 1) return; // Dont show preview when multiple items are selected;
    const [first] = _dragIds;
    const newDragItems = _dragAdditions?.[0];
    const fromPanel = !!newDragItems;
    const item = (newDragItems || elementProperties[first]) as cd.ISymbolInstanceProperties;
    if (!item || !item.inputs.referenceId) return;
    this._ghostService.setImageForSymbol(item.inputs.referenceId, fromPanel);
  }

  dispatchStopRecording = () => this._projectStore.dispatch(new PanelStopRecording());

  showToastWhenUserIsRecordingAnAction() {
    this._toastService.addToast({ ...RECORDING_TOAST, callback: this.dispatchStopRecording });
  }

  get isRecording() {
    const { _isRecordingAction } = this;
    if (_isRecordingAction) this.showToastWhenUserIsRecordingAnAction();
    return _isRecordingAction;
  }

  handleDragStart(
    width: number,
    height: number,
    dragType: dndUtils.DragItemType,
    dragOffset: IPoint,
    roundedCorners: boolean
  ) {
    if (this.dragActive || this.isRecording) return;
    const { _dragIds, elementProperties, _dragAdditions } = this;
    if (!_dragIds.length) return;
    const title = dndUtils.calcDragLabel(elementProperties, _dragIds, _dragAdditions);
    this._ghostService.createGhost(_dragIds, width, height, dragType, title, roundedCorners);
    if (dragType === dndUtils.DragItemType.Asset) this.applyAssetToGhost(width, height);
    if (dragType === dndUtils.DragItemType.Symbol) this.applySymbolToGhost();
    this.dragActive = true;
    this._interactionService.resetHighlight();
    this._surfaceService.setDragIds(_dragIds);
    this._ghostService.globalCursor = CursorState.Grabbing;
    this.initalizeDragListener(dragOffset);
  }

  onSurfaceDropLocation = (dropLocation?: cd.IInsertLocation) => {
    const { _dragIds, elementProperties, _dragAdditions, dragActive } = this;
    if (!dragActive || this.isDropLocationSame(dropLocation)) return;
    if (this._dropPreview && !dropLocation) return this.clearPreview();
    if (!dropLocation) return;
    const allowed = this.isDropTargetAllowed(dropLocation.elementId);
    if (!allowed) return;
    this.updateDropPreview(_dragIds, dropLocation, elementProperties, _dragAdditions);
  };

  handleDragEnter(elementId?: string) {
    const allowed = this.isDropTargetAllowed(elementId);
    // only change cursor if allowed value has changed to prevent unnecessary reflow
    if (allowed === this._dropAllowed) return;
    this._dropAllowed = allowed;
    this._ghostService.globalCursor = allowed ? CursorState.Grabbing : CursorState.NotAllowed;
    if (!allowed) this.clearPreview();
  }

  handleDragOverTreeCell(e: MouseEvent, layersNode: FlatLayersNode, expanded: boolean) {
    if (!this._dropAllowed) return;
    this._panelService.switchToLayersTreeIfLeftPanelIsOpen();
    const elementId = layersNode.id;
    const { _dragIds = [], _dragAdditions, elementProperties } = this;
    const elementProps = elementProperties[elementId];
    if (!_dragIds.length || !elementProps) return;
    const isChildOfSelf = mUtils.isElementChildOfItems(elementId, _dragIds, elementProperties);
    const dropPayload: dndUtils.ITreeDropPayload = { layersNode, expanded, isChildOfSelf };
    const dropLocation = dndUtils.calcLayersTreeDropLocation(e, dropPayload, elementProperties);
    if (!dropLocation) return;
    this._surfaceService.setDragOverTreeCell(elementId);
    this._interactionService.bringOutletFrameToFront(elementProps.rootId);
    this.updateDropPreview(_dragIds, dropLocation, elementProperties, _dragAdditions);
  }

  updateDropPreview(
    ids: string[],
    dropLocation: cd.IInsertLocation,
    props: cd.ElementPropertiesMap,
    additions: cd.PropertyModel[] | undefined
  ): void {
    if (this.isDropLocationSame(dropLocation)) return;
    const showPreview = this._surfaceService.isAbsoluteDrag === false;
    const dropPreview = mUtils.insertElements(ids, dropLocation, props, additions, showPreview);
    if (areObjectsEqual(dropPreview, this._dropPreview)) return;
    this._dropPreview = [dropPreview];
    this._rendererService.showPreview(this._dropPreview);
    const elem = props[dropLocation.elementId];
    if (elem) this._interactionService.bringOutletFrameToFront(elem.rootId);
    this.dropLocation$.next(dropLocation);
  }

  handleDrop = () => {
    const { _dropPreview, _projectStore, _dragIds } = this;

    if (_projectStore && _dragIds && _dropPreview) {
      // If dragActive is not set immediately to false, it will re-activate the listeners
      // on JIT compile which causes the tree to rebuild
      this.dragActive = false;
      const absoluteUpdate = this._surfaceService.getAbsoluteStoreUpdate();
      const payload = dndUtils.generateDropChange(_dropPreview, absoluteUpdate);
      this._propertiesService.sendChangeRequestAndSelect(payload, _dragIds);
    }

    this._panelService.switchToPreviousView();
    this.onReset();
  };

  buildPropertyModel(componentId: cd.ComponentIdentity): cd.PropertyModel | undefined {
    const project = this._propertiesService.getProjectProperties();
    if (!project) return;
    const id = createId();
    const instance = mUtils.createInstance(componentId, project.id, id).build();
    const name = dndUtils.incrementNameForEntity(instance, componentId, this.elementProperties);
    instance.name = name;
    return instance as cd.PropertyModel;
  }

  isDropTargetAllowed = (dropTargetId: string | undefined): boolean => {
    return !!dropTargetId && dropTargetId in this.elementProperties;
  };

  isOverElement(element: HTMLElement, tagName: string) {
    return !!element.closest(tagName);
  }

  set overCanvas(over: boolean) {
    if (over === this.dragCursorOverCanvas) return;
    this.dragCursorOverCanvas = over;
    this._panelService.switchToLayersTreeIfLeftPanelIsOpen();
  }

  handleCursorPanelRelationship = ({ target }: MouseEvent) => {
    const element = target as HTMLElement;
    const overCanvas = this.isOverElement(element, APP_CANVAS_TAG);
    this.overCanvas = overCanvas;
    if (overCanvas) {
      this._panelService.switchToLayersTreeIfLeftPanelIsOpen();
    } else if (this.isOverElement(element, APP_ACTIVITY_BAR_TAG)) {
      this._panelService.openLeftPanelAndShowLayersTree();
    }
  };

  initalizeDragListener = (dragOffset: IPoint) => {
    this._cursor.setOffset(dragOffset);
    this._zone.runOutsideAngular(() => {
      this._dragSubscription = new Subscription();
      const move$ = fromEvent<MouseEvent>(window, 'mousemove').pipe(
        distinctUntilChanged(dndUtils.hasMouseMoved),
        tap(this.handleCursorPanelRelationship)
      );
      this._dragSubscription.add(move$.subscribe(this.onDragMove));
    });
    const commit$ = fromEvent<MouseEvent>(window, 'mouseup');
    const keydown$ = fromEvent<KeyboardEvent>(window, 'keydown').pipe(
      filter((e) => keyCheck(e.key, KEYS.Escape))
    );
    this._dragSubscription.add(keydown$.subscribe(this.onCancel));
    this._dragSubscription.add(commit$.subscribe(this.handleDrop));
  };

  onCancel = () => {
    this._panelService.switchToPreviousView();
    this.onReset();
  };

  onDragMove = ({ pageX, pageY }: MouseEvent) => {
    const { dragCursorOverCanvas, dragActive, _cursor } = this;
    if (dragActive === false) return;
    const { isAbsoluteDrag } = this._surfaceService;
    _cursor.update(pageX, pageY);
    if (!isAbsoluteDrag) this._ghostService.moveGhost(_cursor.offsetPosition);
    this._surfaceService.updateCursor(_cursor, dragCursorOverCanvas);
    const bounds = this._surfaceService.getDragBounds();
    this._ghostService.updateGhostSize(bounds, _cursor.offset);
  };

  private clearPreview = () => {
    this._rendererService.clearPreview();
    this._dropPreview = undefined;
    this.dropLocation$.next(undefined);
  };

  private onReset = () => {
    this._panelService.reset();
    this._dragAdditions = undefined;
    this.dragCursorOverCanvas = false;
    this._dragIds = [];
    this.dragActive = false;
    this._dropAllowed = true;
    this.clearPreview();
    this._surfaceService.reset();
    this._dragSubscription.unsubscribe();
    this._ghostService.resetGhost();
  };

  disconnectProject = () => this.onReset();

  ngOnDestroy() {
    this._subscriptions.unsubscribe();
    this._dragSubscription.unsubscribe();
  }
}
