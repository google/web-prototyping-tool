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
import {
  createActionMouseEvents,
  getClosestInstances,
  IMouseEventCapture,
} from './interactions/action.event.utils';
import { generateActionHints } from './interactions/action.hints';
import { fromEvent, Subscription } from 'rxjs';
import { rendererState } from './state.manager';
import { OUTLET_BOARD_APPEARS_EVENT, OUTLET_OUTPUT_EVENT } from './outlets/outlet.component';
import { processCheckboxStateChange } from './utils/checkbox.utils';
import { IOutletOutputEvent, IStateChange } from './utils/interfaces';
import { ActionQueue, IElementRefs } from './interactions/action.queue';
import OutletService from './outlet.service';
import * as utils from './interactions/interaction.utils';
import * as consts from 'cd-common/consts';
import * as models from 'cd-common/models';
import * as msg from 'cd-common/services';
import * as cd from 'cd-interfaces';
import { map } from 'rxjs/operators';

const DEFAULT_COMPOSIT = 'replace';
const DEFAULT_FILL = 'backwards';
// The web animation api requires a value and will break if null | undefined
const FALLBACK_STYLE = '0';

export default class InteractionManager {
  private _subscription = Subscription.EMPTY;
  public toggledActions = new Set<string>();
  public hoveringElements = new Set<string>();
  public actionQueue = new ActionQueue();
  public delayTimers = new utils.StateChangeDelayTimer();
  public boardDidAppear = false;

  constructor(private _outletService: OutletService | null) {}

  get queue$() {
    return this.actionQueue.queue$;
  }

  clearEvents() {
    this.clearQueue();
    this._subscription.unsubscribe();
  }

  destroy() {
    this._outletService = null; // Remove reference
  }

  setPreviewMode(previewMode: boolean, doc: HTMLDocument) {
    if (!previewMode) return this.clearEvents();
    this._attachEvents(doc);
  }

  private _attachEvents(doc: HTMLDocument) {
    this._subscription = new Subscription();
    this._subscription.add(createActionMouseEvents(doc).subscribe(this.actionForEventTrigger));
    this._subscription.add(
      fromEvent<CustomEvent>(doc, OUTLET_OUTPUT_EVENT)
        .pipe(map((value) => value.detail))
        .subscribe(this.onOutputEvent)
    );
    this._subscription.add(
      fromEvent<CustomEvent>(doc, OUTLET_BOARD_APPEARS_EVENT)
        .pipe(map((value) => value.detail))
        .subscribe(this.onBoardAppearanceEvents)
    );
  }

  /** called when resetting */
  clearQueue() {
    this.hoveringElements.clear();
    this.toggledActions.clear();
    this.delayTimers.clearAll();
    this.actionQueue.clear();
  }

  clearActionsForType(eventType: cd.EventTriggerType, instanceId?: string) {
    if (!instanceId) return;
    this.actionQueue.clearActionsForType(eventType, instanceId);
  }

  clearBoardActionsInQueue() {
    this.actionQueue.clearActionsForType(cd.EventTrigger.BoardAppear);
  }

  /** Recursively lookup an action's parent element to use for queue purposes */
  parentIdForAction(action: cd.ActionBehavior, elementId: string): string {
    if (action.childRef) return action.childRef;
    const props = rendererState.mergedProperties;
    const propsForElement = props[elementId];
    if (propsForElement?.actions.some((item) => item.id === action.id)) return elementId;
    const parentId = propsForElement?.parentId;
    if (!parentId) return elementId;
    return this.parentIdForAction(action, parentId);
  }

  addToActionQueue(action: cd.ActionBehavior, elementRefs: IElementRefs) {
    const actionParentId = this.parentIdForAction(action, elementRefs.elementId);
    const modifiedRefs = { ...elementRefs, elementId: actionParentId };
    this.actionQueue.add({ action, ...modifiedRefs });
  }

  addActionsToQueue(actions: cd.ActionBehavior[] = [], elementRefs: IElementRefs) {
    if (!actions.length) return;
    for (const action of actions) {
      this.addToActionQueue(action, elementRefs);
    }
  }

  checkForOutputEvents(elementId: string, input: cd.IStringMap<any>, instanceId?: string) {
    const actionList = rendererState.actionEvents.actionsForOutputEvents(elementId, input);
    this.addActionsToQueue(actionList, { elementId, instanceId });
  }

  animationTimingFromTarget(target: cd.IActionStateChange): KeyframeAnimationOptions {
    const { delay, duration } = utils.durationAndDelayFromStateChange(target);
    const easing = target.animation?.easing ?? cd.ActionEasing.Linear;
    return { duration, delay, easing, composite: DEFAULT_COMPOSIT, fill: DEFAULT_FILL };
  }

  isOverlayHovering(
    action: cd.IActionBehaviorPresentOverlay,
    elementId: string,
    instanceId?: string
  ): boolean {
    const { hoveringElements } = this;
    const hoverId = utils.generateHoverId(elementId, instanceId);
    return Boolean(action.trigger === cd.EventTrigger.Hover && hoveringElements.has(hoverId));
  }
  /** Look up toggle states if needed */
  changesForAction(
    action: cd.IActionBehaviorRecordState,
    uniqueActionId: string,
    instanceId?: string
  ): cd.IActionStateChange[] {
    const stateChanges = action.stateChanges || [];
    // Should this action be handled as a toggle
    const toggle = action.toggle || action.trigger === cd.EventTrigger.Hover;
    if (!toggle || !action.id) return stateChanges;
    const toggled = this.toggledActions.has(uniqueActionId);

    if (toggled) {
      this.toggledActions.delete(uniqueActionId);
      const initalStates = rendererState.actionEvents.toggleActions.get(action.id);
      if (initalStates) {
        // Allows for toggling state within a symbol instance
        const isSymbolInstance = utils.isInstanceOfASymbol(instanceId);
        return isSymbolInstance
          ? utils.updateStateChangesForSymbolInstance(instanceId, initalStates)
          : initalStates;
      }
    } else {
      this.toggledActions.add(uniqueActionId);
    }

    return stateChanges;
  }

  /**
   * Use the web animation API to animate an element
   * https://developer.mozilla.org/en-US/docs/Web/API/Web_Animations_API/Using_the_Web_Animations_API
   */
  animateElement(element: Element, elemStyles: CSSStyleDeclaration, target: cd.IActionStateChange) {
    const { key, value } = target;
    const fromStyles = elemStyles[key as any] || FALLBACK_STYLE;
    const toStyles = rendererState.getStyleForKey(key, value) || FALLBACK_STYLE;
    if (fromStyles === toStyles) return;
    const animation = { [key]: [fromStyles, toStyles] };
    const config = this.animationTimingFromTarget(target);
    element.animate(animation, config);
  }

  playStateChanges(
    uniqueActionId: string | undefined,
    action: cd.IActionBehaviorRecordState,
    doc: HTMLDocument,
    instanceId?: string
  ): Set<string> {
    if (!uniqueActionId) throw new Error('Missing Action id');
    const didToggle = this.toggledActions.has(uniqueActionId);
    const stateChanges = this.changesForAction(action, uniqueActionId, instanceId);
    const { delayTimers } = this;
    const updatedStyleIds = new Set<string>();
    const elementCache: utils.ElementCacheType = new Map();
    const styleCache: utils.StyleCacheType = new Map();

    delayTimers.clearForAction(uniqueActionId);

    for (const target of stateChanges) {
      const { elementId, key, value, type, symbolChildId: symChildId } = target;
      const { delay } = utils.durationAndDelayFromStateChange(target);

      if (!elementId) continue;

      if (!rendererState.doElementsExist(elementId)) {
        // typically gets called if a user had removed an element
        console.log(`Render Interaction: Failed update input for ${elementId}`);
        continue;
      }

      if (type === cd.ActionStateType.Input) {
        delayTimers.addTimerOrExecute(uniqueActionId, delay, () => {
          const payload = { [key]: value };
          rendererState.updateInputsOnElement(elementId, payload, symChildId, true);
          this.checkForOutputEvents(elementId, payload);
          if (delay > 0) this._outletService?.requestChangeDetection();
        });
      }

      if (type === cd.ActionStateType.Style) {
        // Don't run action if styles have not changed
        const styleChanged = rendererState.updateStyleOnElement(elementId, key, value, symChildId);
        if (!styleChanged) continue;

        // Used to ensure styles are updated, this is returned at the end
        updatedStyleIds.add(elementId);

        // If there is no duration or delay, skip creating an animation
        if (!utils.hasValidAnimation(target)) continue;

        const didAnimate = symChildId
          ? this.animateSymbol(target, symChildId, elementId, doc, elementCache, styleCache)
          : this.animateElements(target, elementId, doc, elementCache, styleCache);

        if (!didAnimate) continue;
      }

      if (type === cd.ActionStateType.StyleOverride) {
        delayTimers.addTimerOrExecute(uniqueActionId, delay, () => {
          updatedStyleIds.add(elementId);
          rendererState.replaceStyleOverrides(elementId, key, value, didToggle, symChildId);
          if (delay > 0) this._outletService?.requestChangeDetection();
        });
      }
    }

    styleCache.clear();
    elementCache.clear();

    return updatedStyleIds;
  }

  animateElements(
    target: cd.IActionStateChange,
    elementId: string,
    outletDocument: HTMLDocument,
    elementCache: utils.ElementCacheType,
    styleCache: utils.StyleCacheType
  ): boolean {
    const elements = utils.getAllElements(outletDocument, elementId, elementCache);
    if (!elements?.length) return false;
    const [first] = elements;
    const styles = utils.getComputedStylesAndCache(first, elementId, styleCache);
    if (!styles) return false;
    for (const element of elements) {
      this.animateElement(element, styles, target);
    }
    return true;
  }

  /** Handles animating items within a symbol */
  animateSymbol(
    target: cd.IActionStateChange,
    symChildId: string,
    elementId: string,
    outletDocument: HTMLDocument,
    elementCache: utils.ElementCacheType,
    styleCache: utils.StyleCacheType
  ): boolean {
    const element = utils.getElementAndCache(outletDocument, elementId, elementCache);
    if (!element) return false;
    const elemCacheKey = elementId + symChildId;
    const ani = utils.getElementAndCache(element, symChildId, elementCache, elemCacheKey);
    if (!ani) return false;
    const styles = utils.getComputedStylesAndCache(ani, elemCacheKey, styleCache);
    if (!styles) return false;
    this.animateElement(ani, styles, target);
    return true;
  }

  findActionsForTrigger(
    type: cd.EventTriggerType,
    elementId: string,
    props: cd.ElementPropertiesMap,
    instanceId?: string
  ) {
    const actions = utils.actionsForTrigger(type, elementId, elementId, props, instanceId);
    const filtered = utils.filterSymbolInstanceActions(elementId, actions, props);

    // Handle Hovering Scenario
    const ids = utils.elementIdsForActions(elementId, props, filtered);
    const { hoveringElements } = this;
    const hoverElements = utils.getHoverState(type, ids, hoveringElements, elementId, instanceId);
    return utils.filterInvalidHoverActions(filtered, ids, hoverElements, instanceId);
  }

  actionForEventTrigger = ({ elementId, evt }: IMouseEventCapture) => {
    const target = evt.target as HTMLElement;
    const type = evt.type as cd.EventTriggerType;
    const [instanceId, parentInstanceId, overlayInstanceIdx] = getClosestInstances(target);
    const props = rendererState.mergedProperties;
    const actions = this.findActionsForTrigger(type, elementId, props, instanceId);
    const refs: IElementRefs = { elementId, instanceId, parentInstanceId, overlayInstanceIdx };
    this.addActionsToQueue(actions, refs);
    if (!rendererState.showHotspots) return;
    generateActionHints(target, type, actions, elementId, instanceId);
  };

  /** When the preview board changes, check for board appearance actions */
  didOutletBoardAppear(id: string, force = false) {
    if (this.boardDidAppear === true && force === false) return;
    this.boardDidAppear = true;
    this.checkBoardForAppearActions(id, id);
  }

  /** Sends an event to the main app via postmessage to retarget the current board in preview mode */
  navigateTopLevel = (rootId: string, targetId: string) => {
    if (rendererState.exportMode) {
      const retargetMessage = new msg.PostMessageRetargetOutlet(rootId, targetId);
      return rendererState.retargetOutletInternal$.next(retargetMessage);
    }

    const message = new msg.PostMessageRootNavigation(targetId);
    this._outletService?.postMessage(message);
  };

  checkBoardForAppearActions(rootId: string, elementId: string, instanceId?: string) {
    // setTimeout is needed here because on page load the renderer may not be fully initalized
    // this was identified when a user had placed a modal on board appearance

    setTimeout(() => {
      const boardAppearanceActions = rendererState.actionEvents.actionsForBoard(rootId);
      this.clearActionsForType(cd.EventTrigger.BoardAppear, instanceId);
      this.addActionsToQueue(boardAppearanceActions, { elementId, instanceId });
    }, 0);
  }

  swapPortal(portalId: string, targetBoardId: string, inputKey = consts.REFERENCE_ID) {
    const rootId = this._outletService?.id;
    if (!rootId) return;
    if (rootId === targetBoardId) {
      return console.log('Renderer: Attempting to navigate portal into parent (recursive)');
    }

    // Verify portal target (board) exists
    if (!rendererState.doElementsExist(targetBoardId)) {
      return console.log(`Renderer: Portal Target ${targetBoardId} is missing`);
    }

    const portalElement = rendererState.getElementById(portalId);

    if (targetBoardId === portalElement?.rootId) {
      return console.log('Renderer: Attempting to navigate portal into its parent (recursive)');
    }

    if (!portalElement) return console.log(`Renderer: Portal ${portalId} is missing`);
    if (!models.isBoardPortal(portalElement)) {
      // This could be inside a tab, stepper, etc. so let's treat this as a top level navigation
      console.log(`Renderer: Element ${portalId} is not a portal`);
      return this.navigateTopLevel(rootId, targetBoardId);
    }
    const payload = { [inputKey]: targetBoardId };
    this.writeInputStateChanges({ id: portalId, payload, instanceId: portalId });
  }

  /**
   * This occurs when something like a radiobutton group,
   * checkbox, switch, etc updates state inside a symbol instance.
   * We DO NOT set the child element's value, instead we set an instanceInput on the symbol instance.
   * Fixes b/153748238
   * */
  updateBindingInsideSymbolInstance(
    instanceId: string,
    elementId: string,
    element: cd.PropertyModel,
    payload: object
  ) {
    // Update the state of the element triggering an output event
    rendererState.updateInstanceInputs(instanceId, element, payload, elementId);
    this.updateAndCheckForOutputEvents(elementId, payload, instanceId);
  }

  writeInputStateChanges(...changes: IStateChange[]) {
    for (const change of changes) {
      const { id, payload, instanceId } = change;
      if (!rendererState.doElementsExist(id)) {
        return console.log(`Renderer: Failed update input for ${id}`);
      }

      rendererState.updateInputsOnElement(id, payload);
      this.checkForOutputEvents(id, payload, instanceId);
    }
    this._outletService?.update();
  }

  updateAndCheckForOutputEvents(
    id: string,
    payload: Record<string, any>,
    instanceId: string | undefined
  ) {
    this._outletService?.update();
    this.checkForOutputEvents(id, payload, instanceId);
  }

  onBoardAppearanceEvents = (evt: any) => {
    const { id, instanceId } = evt;
    this.checkBoardForAppearActions(id, id, instanceId);
  };

  onOutputEvent = (evt: IOutletOutputEvent) => {
    const { elementId, inputBinding, value, instanceId, writeValue } = evt;
    const instanceElem = instanceId && rendererState.getElementById(instanceId);
    const symbolInstance = instanceElem && models.isSymbolInstance(instanceElem);
    const payload = { [inputBinding]: value };

    /**
     * In the case of a Button's Menu (mat-menu), we're just triggering an Action and don't need
     * to write the selected value like we would for a radio button or mat-select
     */
    if (!writeValue) return this.checkForOutputEvents(elementId, payload, instanceId);

    if (symbolInstance) {
      if (!instanceId || !instanceElem) return;
      this.updateBindingInsideSymbolInstance(instanceId, elementId, instanceElem, payload);
      this.handleCheckboxUpdates(elementId, inputBinding, value, instanceId, symbolInstance);
      return;
    }

    this.writeInputStateChanges({ id: elementId, payload, instanceId });
    this.handleCheckboxUpdates(elementId, inputBinding, value, instanceId);
  };

  /** Used to update nested checkbox state */
  handleCheckboxUpdates(
    elementId: string,
    inputBinding: string,
    value: any,
    instanceId?: string,
    symbolInstance?: boolean
  ) {
    const elem = rendererState.getElementById(elementId);
    const isCheckbox = elem && elem.elementType === cd.ElementEntitySubType.Checkbox;
    if (isCheckbox && inputBinding === consts.CHECKED_ATTR) {
      const updates = processCheckboxStateChange(elem as cd.ICheckboxProperties, value, instanceId);

      if (!instanceId || !symbolInstance) {
        // For non-symbol instances we write updates directly otherwise
        return this.writeInputStateChanges(...updates);
      }

      // Otherwise we need to write to the symbol instance's instanceInputs
      for (const update of updates) {
        const { id, payload, instanceId: instId } = update;
        const instanceElem = instId && rendererState.getElementById(instId);
        if (!instanceElem) continue;
        // We need to do this each time to ensure that the element is updated
        this.updateBindingInsideSymbolInstance(instanceId, id, instanceElem, payload);
      }
    }
  }
}
