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

import { Subject } from 'rxjs';
import * as cd from 'cd-interfaces';

export interface IElementRefs {
  elementId: string;
  instanceId?: string;
  parentInstanceId?: string;
  overlayInstanceIdx?: string;
}

export interface IActionPayload extends IElementRefs {
  action: cd.ActionBehavior;
}

export const buildUniqueActionId = (
  id: string | undefined,
  elementId: string,
  instanceId?: string,
  rootInstanceId?: string
): string | undefined => {
  const instance = instanceId || '';
  const rootInstance = rootInstanceId || '';
  return id && [elementId, id, instance, rootInstance].join('-');
};

export class ActionQueue {
  private _queue = new Map<string, IActionPayload>();
  private _weakTimer = new WeakMap();
  public queue$ = new Subject<IActionPayload>();

  keyForPayload({ elementId, instanceId, action: { id } }: IActionPayload): string | undefined {
    return buildUniqueActionId(id, elementId, instanceId);
  }

  add(payload: IActionPayload) {
    const key = this.keyForPayload(payload);
    if (!key) return console.log('Actions should have an Id');
    if (this._queue.has(key)) {
      const existing = this._queue.get(key);
      this.clearActionTimer(existing as IActionPayload);
    }
    this.addAction(key, payload);
  }

  private addAction(key: string, payload: IActionPayload) {
    const { delay } = payload.action;
    const timeout = delay ?? 0;
    if (timeout === 0) {
      return this.queue$.next(payload); // Plays immediately
    }
    this._queue.set(key, payload);
    const timer = window.setTimeout(() => {
      this.queue$.next(payload);
      this._queue.delete(key);
      this._weakTimer.delete(payload);
    }, timeout);
    this._weakTimer.set(payload, timer);
  }

  private clearActionTimer(value: IActionPayload) {
    const timer = this._weakTimer.get(value);
    if (timer) window.clearTimeout(timer);
    this._weakTimer.delete(value);
  }

  removeFromQueue(key: string, value: IActionPayload) {
    this.clearActionTimer(value);
    this._queue.delete(key);
  }

  clearActionsForType(eventType: cd.EventTriggerType, instanceId?: string) {
    for (const [key, value] of this._queue) {
      if (value.action.trigger !== eventType) continue;
      if (instanceId !== undefined && value.instanceId !== instanceId) continue;
      this.removeFromQueue(key, value);
    }
  }

  clear() {
    for (const [key, value] of this._queue) {
      this.removeFromQueue(key, value);
    }
  }
}
