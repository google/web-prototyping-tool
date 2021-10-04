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
  OnChanges,
  SimpleChanges,
  ElementRef,
  ViewChild,
  HostListener,
  OnDestroy,
  OnInit,
  ChangeDetectorRef,
} from '@angular/core';
import {
  AbstractOverlayControllerDirective,
  ConfirmationDialogComponent,
  OverlayService,
} from 'cd-common';
import { applyDefaultUnits } from 'cd-common/utils';
import { matrix2d } from 'cd-utils/css';
import { SelectionContextService } from '../../../services/selection-context/selection.context.service';
import { configFromActionString } from '../../../services/selection-context/selection.context.utils';
import { AssetsService } from '../../../services/assets/assets.service';
import { Store, Action, select } from '@ngrx/store';
import { ConfigAction } from '../../../interfaces/action.interface';
import { areObjectsEqual } from 'cd-utils/object';
import { fromEvent, Subscription } from 'rxjs';
import { take } from 'rxjs/operators';
import * as utils from './context-menu-bar.utils';
import * as conf from './context-menu-bar.config';
import * as cd from 'cd-interfaces';
import * as models from 'cd-common/models';
import * as assetUtils from '../../../utils/assets.utils';
import * as cmb from './context-menu-bar.interface';
import * as projectStore from '../../../store';

const ANIMATION_CONFIG = { duration: 200, easing: 'cubic-bezier(0.4, 0, 0.2, 1)' };
const PORTAL_LINK = { url: '', text: 'Learn more' };

@Component({
  selector: 'app-context-menu-bar',
  templateUrl: './context-menu-bar.component.html',
  styleUrls: ['./context-menu-bar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContextMenuBarComponent
  extends AbstractOverlayControllerDirective
  implements OnChanges, OnDestroy, OnInit
{
  private _contentAnimation?: Animation;
  private _subscriptions = new Subscription();
  public componentAction = cmb.ComponentAction;
  public actionSizes = conf.CONTEXT_ACTION_SIZING;
  public contextActions = conf.CONTEXT_ACTIONS;
  public currentAction?: cmb.ComponentActionType;
  public position?: string;
  public selectedIds: string[] = [];
  public barHeight = cmb.BAR_MENU_ITEM_SIZE;
  public barWidth = cmb.BAR_MENU_ITEM_SIZE;
  public shown = false;
  public isSelectedHidden = false;
  public selectionBounds?: cd.Rect;
  public isolatedSymbolId?: string;

  @Input() moving = false;
  @Input() canvas!: cd.ICanvas;
  @Input() outletFrames: ReadonlyArray<cd.IRenderResult> = [];
  @Input() renderRects: cd.RenderRectMap = new Map();
  @Input() selectionMap: cd.RenderElementMap = new Map();
  @Input() selectedProperties: cd.ReadOnlyPropertyModelList = [];

  @Input()
  @HostBinding('style.transform')
  canvasPos?: string;

  @ViewChild('barWrapperRef', { read: ElementRef }) _barWrapperRef!: ElementRef;

  @HostBinding('class.hide')
  get overlayHidden() {
    return this.shown === false;
  }

  @HostListener('contextmenu', ['$event'])
  onRightClick(e: Event) {
    e.stopImmediatePropagation();
    e.preventDefault();
  }

  constructor(
    public overlayService: OverlayService,
    private _selectionContextService: SelectionContextService,
    private _assetsService: AssetsService,
    private _projectStore: Store<projectStore.IProjectState>,
    private _cdRef: ChangeDetectorRef
  ) {
    super(overlayService);
  }

  ngOnInit() {
    this._subscriptions.add(
      this._projectStore
        .pipe(select(projectStore.getIsolatedSymbolId))
        .subscribe(this._onIsolatedSymbolIdSubscription)
    );
  }

  get firstSelectedElement(): cd.PropertyModel | undefined {
    const [first] = this.selectedProperties;
    return first;
  }

  private _onIsolatedSymbolIdSubscription = (symbolId?: string) => {
    this.isolatedSymbolId = symbolId;
    this._cdRef.markForCheck();
  };

  ngOnChanges(changes: SimpleChanges) {
    // This prevents calling updateOverlay() multiple times
    let update = false;

    const selectionDidChange = changes.selectionMap || changes.selectedProperties;

    if (selectionDidChange) {
      this.setBarActions();
      this.setSelectedIds();

      const defaultSize = this.getDefaultBarSize();
      this.updateBarSize(defaultSize);
      this.currentAction = undefined;
      update = true;

      if (changes.selectedProperties) {
        const [first] = changes.selectedProperties.currentValue as cd.IComponentInstance[];
        this.isSelectedHidden = !!first?.inputs?.hidden;
      }
    }

    if (changes.zoom || changes.canvas) {
      update = true;
    }

    if (selectionDidChange || changes.outletFrames || changes.renderRects) {
      if (this.buildSelectionBounds()) {
        update = true;
      }
    }

    if (update) {
      this.updateOverlay();
    }
  }

  ngOnDestroy(): void {
    this.cancelAnimation();
    this._contentAnimation = undefined;
    this._subscriptions.unsubscribe();
  }

  get showMenu() {
    return this.shown && !this.moving && !this.isSelectedHidden;
  }

  private setSelectedIds() {
    const { selectionMap } = this;
    const selectedIds = utils.getSelectedIds(selectionMap);
    if (selectedIds.length === 0) this.hideOverlay(true);
    this.selectedIds = selectedIds;
  }

  private hideOverlay(clearSelectedId = false) {
    if (this.shown === false) return;
    this.shown = false;
    this.currentAction = undefined;
    if (clearSelectedId) {
      this.selectedIds = [];
    }
  }

  /** This only changes when rects, selectionIds and outlets changes, no need to update otherwise */
  private buildSelectionBounds(): boolean {
    const { selectedIds, renderRects, outletFrames } = this;
    const selectionBounds = utils.calculateSelectionBounds(selectedIds, renderRects, outletFrames);
    if (areObjectsEqual(this.selectionBounds, selectionBounds)) return false;
    this.selectionBounds = selectionBounds;
    return true;
  }

  private updateOverlay() {
    const { selectionBounds, contextActions, canvas, barHeight, barWidth } = this;
    if (!selectionBounds || contextActions.length === 0) return this.hideOverlay();
    const adjustedOverlay = utils.adjustedCanvasForOverlay(
      canvas,
      barHeight,
      barWidth,
      selectionBounds
    );

    this.shown = true;

    this.shown = utils.menuRectIsVisible(
      adjustedOverlay,
      selectionBounds,
      barWidth,
      barHeight,
      this.canvas.position.z
    );
    this.transformOverlay(adjustedOverlay);
  }

  private transformOverlay(adjustedOverlay: utils.IAdjustedOverlay) {
    const [x, y] = utils.getMenuPosition(adjustedOverlay);
    const zoomInverse = 1 / this.canvas.position.z;
    this.position = matrix2d(x, y, zoomInverse);
  }

  private setBarActions() {
    const { selectedProperties } = this;
    if (selectedProperties.length === 0) return;
    const [selectedElementProperties] = selectedProperties;
    // TODO: Re-enable this later when we want to tackle multi-select again
    // const newActions =
    //   selectedProperties.length > 1
    //     ? utils.getMultiSelectContextActions()
    //     : utils.getContextActionsForElement(selectedElementProperties);
    const newActions = utils.getContextActionsForElement(selectedElementProperties);
    const disableCheckedActions = this.checkForDisabledActions(newActions);
    this.contextActions = disableCheckedActions;
  }

  private checkForDisabledActions(contextActions: conf.ContextActions): conf.ContextActions {
    return contextActions.map((action) => {
      // prettier-ignore
      switch (action.id) {
        case cmb.ComponentAction.FitAspectRatio: return this.handleFitToAspectRatioDisabled(action);
        case cmb.ComponentAction.ResetImageSize: return this.handleResetImageSizeDisabled(action);
        case cmb.ComponentAction.FitBoardToContent: return this.handleFitBoardToContent(action);
        default: return action;
      }
    });
  }

  private setBarSize(
    newState: cmb.ComponentActionType,
    oldState: cmb.ComponentActionType,
    animate = true
  ) {
    const shouldAnimate = animate && oldState !== newState;
    const oldSize = this.getSizeForState(oldState);
    const newSize = this.getSizeForState(newState);
    if (!newSize || !oldSize) return;
    this.updateBarSize(newSize);
    if (shouldAnimate) this.animateBar(newSize, oldSize);
  }

  private getSizeForState(state: cmb.ComponentActionType) {
    return state === undefined ? this.getDefaultBarSize() : conf.CONTEXT_ACTION_SIZING[state];
  }

  private getDefaultBarSize(): cd.Dimensions {
    const defaultHeight = cmb.BAR_MENU_ITEM_SIZE * this.contextActions.length;
    const defaultWidth = cmb.BAR_MENU_ITEM_SIZE;
    return { height: defaultHeight, width: defaultWidth };
  }

  resetBar() {
    const oldState = this.currentAction;
    if (!oldState) return;
    const oldSize = this.getSizeForState(oldState);
    const newSize = this.getDefaultBarSize();
    this.currentAction = undefined;
    this.updateBarSize(newSize);
    this.animateBar(newSize, oldSize);
    this.updateOverlay();
  }

  private updateBarSize(newSize: cd.Dimensions) {
    const { height, width } = newSize;
    this.barHeight = height;
    this.barWidth = width;
  }

  private addUnitsToSize = (size: cd.Dimensions): { width: string; height: string } => {
    const width = applyDefaultUnits(size.width);
    const height = applyDefaultUnits(size.height);
    return { width, height };
  };

  private animateBar(newSize: cd.Dimensions, initialSize: cd.Dimensions) {
    if (!this._barWrapperRef) return;
    const wrapperElement = this._barWrapperRef.nativeElement;
    const transition = [initialSize, newSize].map(this.addUnitsToSize);
    this.cancelAnimation();
    wrapperElement.style.transition = `transform ${ANIMATION_CONFIG.duration}ms ${ANIMATION_CONFIG.easing}`;
    this._contentAnimation = wrapperElement.animate(transition, ANIMATION_CONFIG);
    if (!this._contentAnimation) return;
    this._subscriptions.add(
      fromEvent(this._contentAnimation, 'finish')
        .pipe(take(1))
        .subscribe(() => {
          wrapperElement.style.transition = '';
        })
    );
  }

  private cancelAnimation() {
    if (this._contentAnimation) this._contentAnimation.cancel();
  }

  private storeActionForContext(action: cd.IConfig): Action | null {
    const storeAction = this._selectionContextService.actionForMenuSelection(action);
    if (storeAction && storeAction.type === projectStore.BOARD_FIT_CONTENT && this.selectedIds) {
      return new projectStore.BoardFitContent(this.selectedIds);
    }
    return storeAction;
  }

  private dispatchForAction(action: cd.IConfig) {
    const storeAction = this.storeActionForContext(action);
    if (!storeAction) return;
    this._projectStore.dispatch(storeAction);
    this.checkForDisabledActions(this.contextActions);
  }

  private changeState(newState: cmb.ComponentActionType) {
    const oldState = this.currentAction as cmb.ComponentActionType;
    const shouldAnimate = oldState !== newState;
    this.currentAction = newState;
    this.setBarSize(newState, oldState, shouldAnimate);
    this.updateOverlay();
    this.checkForDisabledActions(this.contextActions);
  }

  dispatchAction(action: string) {
    const convertedAction = configFromActionString(action);
    return this.dispatchForAction(convertedAction);
  }

  onActionClick(contextAction: cmb.IContextAction) {
    const { id: newState, action } = contextAction;
    if (!action) return this.changeState(newState);
    if (newState === cmb.ComponentAction.CreatePortalFromElements) {
      return this.confirmPortalConversion(action);
    }
    this.dispatchAction(action);
  }

  confirmPortalConversion(action: string) {
    const cmpRef = this.showModal<ConfirmationDialogComponent>(ConfirmationDialogComponent);
    cmpRef.instance.title = 'Convert to a portal?';
    cmpRef.instance.message =
      'This element will be moved to a new board and replaced with a portal.';
    cmpRef.instance.link = PORTAL_LINK;
    cmpRef.instance.confirm.subscribe(() => this.dispatchAction(action));
  }

  onWheel(e: WheelEvent) {
    if (!e.ctrlKey && this.currentAction) {
      this.stopImmediateProp(e);
    }
  }

  stopImmediateProp(e: Event) {
    e.stopImmediatePropagation();
  }

  private getStylesAndAssetFromImageProps():
    | [cd.IStyleDeclaration, cd.IProjectAsset, cd.IImageProperties]
    | undefined {
    const [first] = this.selectedProperties;
    const img = first as cd.IImageProperties;
    const assetId = img.inputs.src.id;
    const styles = models.getActiveStyleFromProperty(img);
    if (!assetId || !styles) return;
    const asset = this._assetsService.getAssetForId(assetId);
    if (!asset) return;
    return [styles, asset, img];
  }

  private handleFitBoardToContent(action: cmb.IContextAction) {
    const [first] = this.selectedProperties;
    const disabled = first.childIds.length === 0;
    return { ...action, disabled };
  }

  private handleFitToAspectRatioDisabled(action: cmb.IContextAction) {
    const stylesAndAsset = this.getStylesAndAssetFromImageProps();
    if (!stylesAndAsset) return { ...action, disabled: true };
    const [styles, asset, img] = stylesAndAsset;
    const imgRect = this.renderRects.get(img.id);
    if (!imgRect) return { ...action, disabled: true };
    const disabled = assetUtils.doesImageMatchAspectRatio(styles, asset, imgRect, img);
    return { ...action, disabled };
  }

  private handleResetImageSizeDisabled(action: cmb.IContextAction) {
    const stylesAndAsset = this.getStylesAndAssetFromImageProps();
    if (!stylesAndAsset) return { ...action, disabled: true };
    const [styles, asset] = stylesAndAsset;
    const disabled = assetUtils.isImageOriginalSize(styles, asset);
    return { ...action, disabled };
  }

  handleInteractionSelected(action: ConfigAction) {
    this._projectStore.dispatch(action);
  }
}
