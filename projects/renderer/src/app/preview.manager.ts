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
import { fromEvent, Subscription } from 'rxjs';
import { auditTime, debounceTime, map } from 'rxjs/operators';
import { TooltipManager } from './utils/tooltip-manager';
import { rendererState } from './state.manager';
import { RendererAPI, StateAPIBoardNavEvt } from './utils/state.api';
import OutletService from './outlet.service';
import ModalOutlet from './outlet-components/modal/modal.outlet';
import DrawerOutlet from './outlet-components/drawer/drawer.outlet';
import InteractionManager from './interaction.manager';
import { AccessibilityManager } from './accessibility/accessibility.manager';
import { generateURLNavAction, generateBoardNavAction } from './utils/navigation.utils';
import { OUTLET_AUTO_NAV_EVENT } from './outlets/outlet.component';
import { ICompilationPayload, IOutletAutoNavEvent } from './utils/interfaces';
import { buildUniqueActionId, IActionPayload, IElementRefs } from './interactions/action.queue';
import OverlaysOutlet from './outlet-components/overlay/overlay.outlet';
import { queryElementByDataId } from './utils/query.utils';
import { rootIdsUpdated$ } from './utils/renderer.utils';
import type { ComponentRef, NgModuleRef } from '@angular/core';
import AbstractOutlet from './outlets/abstract.outlet';
import { PerfEvent } from './utils/performance.utils';
import * as utils from './interactions/interaction.utils';
import * as models from 'cd-common/models';
import * as msg from 'cd-common/services';
import * as cd from 'cd-interfaces';

const API_BUFFER = 10;

type OverlayActions =
  | cd.IActionBehaviorOpenDrawer
  | cd.IActionBehaviorPresentModal
  | cd.IActionBehaviorPresentOverlay;

export default class PreviewManager {
  private _modal = new ModalOutlet();
  private _drawer = new DrawerOutlet();
  private _overlays = new OverlaysOutlet();
  private _interactionManager: InteractionManager;
  private _a11yManager: AccessibilityManager;
  private _tooltipManager = new TooltipManager();
  private _subscription = Subscription.EMPTY;
  private _api: RendererAPI;
  private _previewMode = false;
  public prevRenderResults = '';

  constructor(
    private _id: string,
    public outletDocument: HTMLDocument,
    private _outletAppModuleRef: NgModuleRef<cd.IRenderOutletApp> | null,
    private _outletService: OutletService | null
  ) {
    const win = outletDocument.defaultView;
    this._api = new RendererAPI(win);
    this._interactionManager = new InteractionManager(_outletService);
    this._a11yManager = new AccessibilityManager(_id);
  }

  /** Outlet has loaded, set preview / a11y modes */
  init() {
    const canInitPreview = rendererState.previewMode || rendererState.exportMode;
    this.setPreviewMode(canInitPreview);
    this.setA11yMode(rendererState.a11yMode);
  }

  get appRef() {
    return this._outletAppModuleRef?.instance.appRef;
  }

  get previewMode(): boolean {
    return this._previewMode;
  }

  get outletWindow(): Window | null {
    return this.outletDocument?.defaultView;
  }

  setA11yMode(a11yMode: cd.IA11yModeState) {
    this._a11yManager.toggleA11yMode(a11yMode, this.outletDocument);
  }

  setPreviewMode(previewMode: boolean) {
    if (this._previewMode === previewMode) return;
    const { outletDocument, _outletAppModuleRef } = this;
    this._previewMode = previewMode;
    this._a11yManager.togglePreviewMode(previewMode);
    this._interactionManager.setPreviewMode(previewMode, outletDocument);
    if (previewMode) {
      performance.mark(PerfEvent.PreviewMode);
      this._attachEvents(outletDocument);
      this._resizeResults();
      this._tooltipManager.attachEvents(outletDocument);
      this._overlays.init(outletDocument, _outletAppModuleRef);
    } else {
      this._overlays.destroy(outletDocument);
      this.clearEvents();
      this._interactionManager.boardDidAppear = false;
    }
  }

  setRootId(id: string) {
    this._id = id;
    this._a11yManager.setRootId(id);
    this._interactionManager.boardDidAppear = false;
    this._interactionManager.clearBoardActionsInQueue();
    this.dismissOverlays();
    this._dismissSnackbar();
    this._api.clearEvents();
  }

  setPreviewRects(rects: Record<string, cd.IRenderResult>): boolean {
    const resString = JSON.stringify(rects);
    if (this.prevRenderResults === resString) return false;
    this.prevRenderResults = resString;
    return true;
  }

  private _handleStateAPINavigation = (evt: StateAPIBoardNavEvt) => {
    const [action, instanceId, overlayInstanceIdx] = evt;
    const config: Omit<IElementRefs, 'elementId'> = { instanceId, overlayInstanceIdx };
    this._navigateToBoard(action as cd.IActionBehaviorNavigationToBoard, config);
  };

  private _attachEvents(doc: Document) {
    const win = doc.defaultView;
    if (!win) return;
    const cd$ = this._api.requestChangeDetection$.pipe(auditTime(API_BUFFER));
    const nav$ = this._api.navigateToBoard$.pipe(auditTime(API_BUFFER));
    const wheel$ = fromEvent<WheelEvent>(doc, 'wheel', { passive: false });
    const scroll$ = fromEvent(doc, 'scroll', { capture: true });
    const resize$ = fromEvent(win, 'resize').pipe(
      debounceTime(0),
      map((e) => (e.currentTarget as HTMLDocument).defaultView)
    );

    this._subscription = new Subscription();
    this._subscription.add(scroll$.subscribe(this._outletService?.requestRenderRects));
    this._subscription.add(resize$.subscribe(this._resizeResults));
    this._subscription.add(wheel$.subscribe(this._onWheel));
    this._subscription.add(cd$.subscribe(this._outletService?.requestChangeDetection));
    this._subscription.add(nav$.subscribe(this._handleStateAPINavigation));

    // Interactions
    this._subscription.add(this._interactionManager.queue$.subscribe(this._actionDispatch));
    this._subscription.add(
      fromEvent<CustomEvent>(doc, OUTLET_AUTO_NAV_EVENT)
        .pipe(map((value) => value.detail))
        .subscribe(this.onAutoNavEvent)
    );
  }

  clearEvents() {
    this._interactionManager.clearEvents();
    this._a11yManager.clearAllEvents();
    this._tooltipManager.clearEvents();
    this._subscription.unsubscribe();
  }

  reset() {
    this._interactionManager.clearQueue();
    this.dismissOverlays();
    this._dismissSnackbar();
  }

  /** In preview we listen for document dimension change and send that to the renderer */
  private _resizeResults = () => {
    const win = this.outletWindow;
    if (!win) return;
    const { innerWidth, innerHeight } = win;
    if (innerWidth === 0 && innerHeight === 0) return;
    this._outletService?.requestRenderRects();
  };

  /** Prevents native browser zoom  */
  private _onWheel = (e: WheelEvent) => {
    if (e.ctrlKey) e.preventDefault();
  };

  destroy(win: Window | null) {
    this.clearEvents();
    this._api.destroy(win);
    this.dismissOverlays();
    this._a11yManager.destroy();
    (this.outletDocument as any) = null;
    this._outletService = null;
    this._outletAppModuleRef = null;
  }

  /** Initializing preview checks for board appearance events */
  checkForBoardAppearance(force = false) {
    this._interactionManager.didOutletBoardAppear(this._id, force);
  }
  //#region OVERLAYS

  private _dismissModal = () => {
    if (!this._modal.isActive) return;
    this._modal.dismiss(this.outletDocument);
    this._interactionManager.clearActionsForType(cd.EventTrigger.BoardAppear);
    this._a11yManager.resetBoardContext();
  };

  private _closeAllOverlays = () => {
    this._overlays.closeAll();
  };

  private _dismissDrawer = () => {
    if (!this._drawer.isActive) return;
    this._drawer.dismiss(this.outletDocument);
    this._interactionManager.clearActionsForType(cd.EventTrigger.BoardAppear);
    this._a11yManager.resetBoardContext();
  };

  dismissOverlays() {
    this._dismissDrawer();
    this._dismissModal();
    this._closeAllOverlays();
    this._dismissSnackbar();
  }

  _dismissSnackbar() {
    const { appRef } = this;
    if (!appRef) return;
    this._outletService?.componentRef?.instance.destroySnackbar(appRef);
  }

  //#endregion

  //#region INTERACTIONS

  private _actionDispatch = (payload: IActionPayload) => {
    const { action, elementId, instanceId, parentInstanceId, overlayInstanceIdx } = payload;
    const refs: IElementRefs = {
      elementId,
      instanceId,
      parentInstanceId,
      overlayInstanceIdx,
    };
    // Used to target the contents of a symbol
    if (action.childRef && action.childRef !== elementId) return;
    // prettier-ignore
    switch (action.type) {
      case cd.ActionType.NavigateToBoard: return this._navigateToBoard(action, refs);
      case cd.ActionType.NavigateToUrl:   return this._navigateToURL(action);
      case cd.ActionType.RecordState:     return this._playbackAction(action, elementId, instanceId);
      case cd.ActionType.PresentModal:    return this._presentModalAction(action, elementId);
      case cd.ActionType.PresentOverlay:  return this._presentOverlayAction(action, refs);
      case cd.ActionType.CloseOverlay:    return this._dismissOverlay(action, elementId, overlayInstanceIdx)
      case cd.ActionType.ExitModal:       return this._modal.close();
      case cd.ActionType.OpenDrawer:      return this._openDrawerAction(action, elementId);
      case cd.ActionType.CloseDrawer:     return this._drawer.close();
      case cd.ActionType.SwapPortal:      return this._handleSwapPortal(action);
      case cd.ActionType.PostMessage:     return this._handlePostMessageAction(action);
      case cd.ActionType.Snackbar:        return this._handleSnackbarAction(action);
      case cd.ActionType.RunJS:           return this._handleRunJSAction(action, elementId, instanceId);
      case cd.ActionType.ResetState:      return utils.resetStateAction(action, elementId, instanceId);
      case cd.ActionType.ScrollTo:        return utils.scrollToAction(action, elementId, instanceId, this.outletDocument);
    }
  };

  private _playbackAction(
    action: cd.IActionBehaviorRecordState,
    elementId: string,
    instanceId?: string
  ) {
    const { stateChanges } = action;
    if (!stateChanges) return;
    const { outletDocument, _interactionManager: im } = this;
    const evalAction = utils.evaluateActionForSymbolInstanceChanges(action, instanceId);
    const uid = buildUniqueActionId(action.id, elementId, instanceId);
    const updatedStyleIds = im.playStateChanges(uid, evalAction, outletDocument, instanceId);

    /** Styles have changed on element properties, update the renderState */
    if (updatedStyleIds.size > 0) {
      rendererState.generateStylesForIds([...updatedStyleIds]);
      // If modals are visible we need to update their bindings
      this._modal.updateStyles();
      this._drawer.updateStyles();
      this._overlays.updateStyles();
    }

    this._outletService?.update();

    // emit event notifying which root ids were updated
    // This will trigger updates on any symbol instances that depend on them
    const { mergedProperties } = rendererState;
    const actionRootIds = utils.getRootIdsInActionStateChanges(stateChanges, mergedProperties);
    rootIdsUpdated$.next(actionRootIds);
  }

  /** Attach a Modal or Drawer to the current outlet */
  private _presentOutletForAction(
    action: OverlayActions,
    outlet: AbstractOutlet,
    payload: ICompilationPayload<any> | undefined,
    dismissFn: () => void
  ) {
    const { target } = action;
    if (!target) return;
    const { _outletAppModuleRef, outletDocument, _id: rootId } = this;
    if (target === rootId) return console.warn('Attempting to show outlet of current board');
    const targetBoard = rendererState.getElementById(target);
    if (!targetBoard || !_outletAppModuleRef) return;
    outlet.insertComponent(outletDocument, _outletAppModuleRef, payload);
    // set data on outlet content component
    const { contentComponent } = outlet;
    if (!contentComponent) return;
    this._outletService?.bindDataToComponent(contentComponent, rendererState, rootId, target);
    this.runChangeDetectionGuarded(contentComponent);
    outlet.attachInputs(action, targetBoard);
    outlet.subscribeToDismiss(dismissFn);
    this._interactionManager.checkBoardForAppearActions(target, rootId);
    this._outletService?.requestChangeDetection();
  }

  private _openDrawerAction(action: cd.IActionBehaviorOpenDrawer, elementId: string) {
    const payload = DrawerOutlet.getCompilationPayoad();
    this._presentOutletForAction(action, this._drawer, payload, this._dismissDrawer);
    const drawerInstance = this._drawer?.component?.instance;
    if (!drawerInstance) return;
    drawerInstance.animateIn();
    // find and set drawer trigger
    const drawerTrigger = queryElementByDataId(this.outletDocument, elementId);
    drawerInstance.drawerTriggerElement = drawerTrigger;
    this._a11yManager.setBoardContext(drawerInstance.content);
  }

  private _dismissOverlay = (
    action: cd.IActionBehaviorCloseOverlay,
    elementId: string,
    overlayInstanceIdx?: string
  ) => {
    this._overlays.dismiss(action, elementId, overlayInstanceIdx);
  };

  private _overlayTrigger(
    action: cd.IActionBehaviorPresentOverlay,
    elementId: string,
    instanceId?: string
  ): string {
    if (action.anchor && rendererState.hasElement(action.anchor)) return action.anchor;

    if (instanceId) {
      const element = instanceId && rendererState.getElementById(instanceId);
      const symbolInstance = element && models.isSymbolInstance(element);
      if (symbolInstance) return instanceId;
    }

    return elementId;
  }

  private _presentOverlayAction(action: cd.IActionBehaviorPresentOverlay, refs: IElementRefs) {
    const { elementId, instanceId } = refs;
    const { _outletAppModuleRef: appModule, outletDocument: doc, _overlays, _id: rootId } = this;
    const boardId = action.target;
    if (!appModule || !boardId) return;

    const hovering = this._interactionManager.isOverlayHovering(action, elementId, instanceId);
    const trigger = this._overlayTrigger(action, elementId, instanceId);
    const outlet = _overlays.addAndReturnOutletInstance(action, trigger, doc, appModule, hovering);
    if (!outlet) return;
    this._outletService?.bindDataToComponent(outlet, rendererState, rootId, boardId);
    this.runChangeDetectionGuarded(outlet);
    this._interactionManager.checkBoardForAppearActions(boardId, rootId);
  }

  private _presentModalAction(action: cd.IActionBehaviorPresentModal, elementId: string) {
    const payload = ModalOutlet.getCompilationPayoad();
    this._presentOutletForAction(action, this._modal, payload, this._dismissModal);
    // find and set modal trigger
    const modalTrigger = queryElementByDataId(this.outletDocument, elementId);
    const modalInstance = this._modal?.component?.instance;
    if (!modalInstance) return;
    modalInstance.modalTriggerElement = modalTrigger;
    this._a11yManager.setBoardContext(modalInstance.content);
  }

  private _handleSwapPortal(action: cd.IActionBehaviorSwapPortal) {
    const target = action?.stateChanges?.[0];
    if (!target) return;
    const targetPortal = target.elementId;
    if (!targetPortal || !target.value) return;
    this._interactionManager.swapPortal(targetPortal, target.value, target.key);
  }

  private _handlePostMessageAction(action: cd.IActionBehaviorPostMessage) {
    if (!action.target) return;
    this._outletService?.postMessage(new msg.PostMessageExternalPostAction(action.target));
  }

  private _handleSnackbarAction(action: cd.IActionBehaviorSnackbar) {
    const { appRef } = this;
    if (!appRef) return;
    this._outletService?.componentRef?.instance.showSnackBar(action, appRef);
  }

  private _handleRunJSAction(
    action: cd.IActionBehaviorRunJS,
    elementId: string,
    instanceId?: string
  ) {
    utils.executeJSAction(action, this.outletDocument, elementId, instanceId);
  }

  private _updateOutletTarget(boardId: string, outlet: AbstractOutlet) {
    const contentComp = outlet.contentComponent;
    if (!contentComp) return;
    const { _id } = this;
    this._outletService?.bindDataToComponent(contentComp, rendererState, _id, boardId);
    contentComp.instance.markForChangeDetection();
    this.runChangeDetectionGuarded(contentComp);
    this._interactionManager.checkBoardForAppearActions(boardId, _id);
  }

  /** For the Angular Material componets we need to run gaurded to ensure they update */
  public runChangeDetectionGuarded = (componentRef: ComponentRef<any>) => {
    this._outletAppModuleRef?.instance.ngZone.runGuarded(() => {
      componentRef.changeDetectorRef.detectChanges();
    });
  };

  private _navigateOverlay(boardId: string, overlayInstanceIdx: string) {
    const { _id } = this;
    const overlayRef = this._overlays.navigate(overlayInstanceIdx);
    this._outletService?.bindDataToComponent(overlayRef, rendererState, _id, boardId);
    overlayRef.instance.markForChangeDetection();
    this.runChangeDetectionGuarded(overlayRef);
    this._interactionManager.checkBoardForAppearActions(boardId, _id);
  }

  private _navigateToBoard(
    action: cd.IActionBehaviorNavigationToBoard,
    refs?: Omit<IElementRefs, 'elementId'>
  ) {
    const instanceId = refs?.instanceId;
    const rootInstanceId = refs?.parentInstanceId;
    const overlayInstanceIdx = refs?.overlayInstanceIdx;

    const { target, topLevelNavigation } = action;
    if (!target) return;
    const { _id: rootId } = this;

    // Navigate within an overlay
    if (overlayInstanceIdx && !topLevelNavigation && !instanceId) {
      if (rootId === target) return;
      return this._navigateOverlay(target, overlayInstanceIdx);
    }

    // Update a modal
    if (this._modal.isActive && !topLevelNavigation && !instanceId) {
      if (rootId === target) {
        console.warn('Renderer: Attempting to navigate inside a portal to the current board');
        return;
      }
      const outletFrame = rendererState.getElementById(target)?.frame;
      this._modal.updateSize(outletFrame);
      return this._updateOutletTarget(target, this._modal);
    }

    // Update drawer
    if (this._drawer.isActive && !topLevelNavigation && !instanceId) {
      if (rootId === target) return;
      return this._updateOutletTarget(target, this._drawer);
    }

    const element = instanceId && rendererState.getElementById(instanceId);
    const symbolInstance = element && models.isSymbolInstance(element);

    // Handle the scenario of a nav action on a symbol instance within a portal
    if (instanceId && symbolInstance && !topLevelNavigation) {
      const symbolInstanceRootId = (element as cd.ISymbolInstanceProperties).rootId;
      if (symbolInstanceRootId !== rootId && rootInstanceId) {
        return this._interactionManager.swapPortal(rootInstanceId, target);
      }
    }

    if (!instanceId || topLevelNavigation || symbolInstance) {
      return this._interactionManager.navigateTopLevel(rootId, target);
    }

    // If instanceId we're inside a portal, change the portal's target

    this._interactionManager.swapPortal(instanceId, target);
  }

  private _navigateToURL({ target, openInTab }: cd.IActionBehaviorNavigationToURL) {
    if (!target) return;
    this._outletService?.postMessage(new msg.PostMessageURLNavigation(target, openInTab));
  }

  //#endregion

  onAutoNavEvent = ({ navItem, target, instanceId }: IOutletAutoNavEvent) => {
    // referenceId guaranteed here since it's checked before reaching this method
    if (navItem.linkType === cd.AutoNavLinkType.Url) {
      const { site, newTab } = navItem as cd.IAutoNavItemUrl;
      const urlAction = generateURLNavAction(site, newTab);
      return this._navigateToURL(urlAction);
    }

    const { top, referenceId } = navItem as cd.IAutoNavItemBoard;

    // Handle the scenario where a nav component is inside a portal
    const element = instanceId && rendererState.getElementById(instanceId);
    const symbolInstance = element && models.isSymbolInstance(element);
    if (instanceId && !symbolInstance && referenceId) {
      const portal = target || instanceId;
      this._interactionManager.swapPortal(portal, referenceId);
      return;
    }

    if (!target || top) {
      // No portal linked or navItem.top === true; Navigate Board
      const boardNavAction = generateBoardNavAction(referenceId, top);
      this._navigateToBoard(boardNavAction);
    } else {
      // Portal is linked AND navItem.top === false; Swap Portal
      if (!referenceId) return;
      this._interactionManager.swapPortal(target, referenceId);
    }
  };
}
