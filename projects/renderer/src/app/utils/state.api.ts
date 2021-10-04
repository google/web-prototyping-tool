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

import { RENDERED_ELEMENT_CLASS, TEMPLATE_INSTANCE_ATTR } from 'cd-common/consts';
import { rendererState } from '../state.manager';
import { isObject, simpleClone } from 'cd-utils/object';
import { Subject, Subscription } from 'rxjs';
import { auditTime } from 'rxjs/operators';
import { wrapInBrackets } from 'cd-common/models';
import * as cd from 'cd-interfaces';
import { getClosestOverlayInstanceId } from '../interactions/action.event.utils';

export type StateAPIBoardNavEvt = [
  action: Partial<cd.IActionBehaviorNavigationToBoard>,
  instanceId: string | undefined,
  overlayInstanceIdx?: string
];

interface IAssetRecord {
  id: string;
  name: string;
  width: number;
  height: number;
}

const getClosestInstanceId = (target?: HTMLElement): string | undefined => {
  if (!target) return;
  const selector = wrapInBrackets(TEMPLATE_INSTANCE_ATTR);
  return (target.closest(selector) as HTMLElement)?.dataset?.id;
};

const getClosestRenderElementId = (context: HTMLElement): string | undefined => {
  return (context.closest(`.${RENDERED_ELEMENT_CLASS}`) as HTMLElement)?.dataset?.id;
};

/** Allows components and runJS access to the current state */
export class RendererAPI {
  public requestChangeDetection$ = new Subject<void>();
  public navigateToBoard$ = new Subject<StateAPIBoardNavEvt>();

  private _subscription = Subscription.EMPTY;
  private _callbacks = new Set<Function>();

  constructor(win: any, public noop = false) {
    if (!win) {
      console.warn('unable to initalize state api');
      return;
    }

    this._subscription = rendererState.stateDidChange$
      .pipe(auditTime(40))
      .subscribe(this.onStateChange);

    win.api = {
      // GET

      getProjectState: (): cd.ElementPropertiesMap => {
        return simpleClone(rendererState.mergedProperties);
      },

      getProjectData: (): Record<string, any> => {
        return simpleClone(rendererState.loadedData);
      },

      getProjectImageAssets: (): IAssetRecord[] => {
        const assets = Object.entries(rendererState.assets).map(([id, { name, width, height }]) => {
          return { id, name, width, height };
        });
        return simpleClone(assets);
      },

      getProjectBoards: (): cd.IBoardProperties[] => {
        return Object.values(rendererState.mergedProperties).filter(
          (item): item is cd.IBoardProperties => item?.elementType === cd.ElementEntitySubType.Board
        );
      },

      getDatasetDataForId: (datasetId: string): {} | undefined => {
        const data = rendererState.loadedData?.[datasetId];
        return data && simpleClone(data);
      },

      getComponentState: (context: HTMLElement): cd.PropertyModel | undefined => {
        const elementId = getClosestRenderElementId(context);
        if (!elementId) return;
        const details = rendererState.getElementById(elementId);
        return simpleClone(details);
      },

      getComponentStateForId: (elementId: string): cd.PropertyModel | undefined => {
        const details = rendererState.getElementById(elementId);
        return simpleClone(details);
      },

      getComponentsOnCurrentBoard: (context: HTMLElement): cd.PropertyModel[] | undefined => {
        const elementId = getClosestRenderElementId(context);
        const element = elementId && rendererState.getElementById(elementId);
        if (!element || !element.rootId) return [];
        return Object.values(rendererState.mergedProperties).filter(
          (item): item is cd.PropertyModel => {
            return item?.rootId === element.rootId;
          }
        );
      },

      // SET

      setInputForComponent: (elementId: string, inputName: string, value: any): void => {
        const details = rendererState.getElementById(elementId);
        if (!details?.inputs) return;
        const hasInput = inputName in details?.inputs;
        if (!hasInput) console.warn(`input does not exist on component ${elementId}`);
        rendererState.updateInputsOnElement(elementId, { [inputName]: value });
        this.requestChangeDetection$.next();
      },

      setDatasetData: (datasetId: string, data: any): void => {
        if (!datasetId) return;
        if (!isObject(data) && !Array.isArray(data)) {
          console.warn('Dataset data must be either an object or an array');
          return;
        }
        rendererState.loadedData[datasetId] = data;
        rendererState.refreshDataBindings();
        rendererState.dataLoaded$.next();
      },

      setStyleForComponent: (elementId: string, styleName: string, value: any): void => {
        const success = rendererState.updateStyleMapForElement(elementId, styleName, value);
        if (!success) console.warn(`Failed to update component's styles`);
        this.requestChangeDetection$.next();
      },

      // LISTEN

      addProjectStateListener: (_cb: (projectState: cd.ElementPropertiesMap) => {}): void => {
        this._callbacks.add(_cb);
      },

      /** Manually remove listener */
      removeProjectStateListener: (_cb: (projectState: cd.ElementPropertiesMap) => {}): void => {
        this._callbacks.delete(_cb);
      },

      // ACTIONS
      navigateToBoard: (target: string, from?: HTMLElement, topLevelNavigation?: boolean): void => {
        const instanceId = getClosestInstanceId(from);
        const overlayInstanceIdx = getClosestOverlayInstanceId(from);
        const action = { target, topLevelNavigation };
        const evt: StateAPIBoardNavEvt = [action, instanceId, overlayInstanceIdx];
        this.navigateToBoard$.next(evt);
      },
    };

    if (noop) {
      for (const key of Object.keys(win.api)) {
        win.api[key] = () => {
          console.warn(`${key} State API only works in preview`);
        };
      }
    }
  }

  onStateChange = () => {
    if (this._callbacks.size === 0) return;
    const clonedState = simpleClone(rendererState.mergedProperties);
    for (const callback of this._callbacks) {
      callback(clonedState);
    }
  };

  /** when switching boards we need to clear event listeners */
  clearEvents() {
    this._callbacks = new Set();
  }

  destroy(win: any) {
    this.clearEvents();
    this._subscription.unsubscribe();
    win.api = null;
  }
}
