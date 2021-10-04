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

import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { buildPropertyUpdatePayload, deepMerge, getElementBaseStyles } from 'cd-common/utils';
import { ElementPropertiesUpdate } from '../../store/actions/element-properties.action';
import { PropertiesService } from '../properties/properties.service';
import { removeValueFromArrayAtIndex } from 'cd-utils/array';
import { IProjectState } from '../../store/reducers';
import { Store } from '@ngrx/store';
import { deepCopy, simpleClone } from 'cd-utils/object';
import * as utils from './record-action.utils';
import * as cd from 'cd-interfaces';

/**
 * Will need custom undo stack
 */
@Injectable({ providedIn: 'root' })
export class RecordActionService {
  private _initalStateChanges: cd.IActionStateChange[] = [];
  public currentActionId = '';
  public currentElementId = '';
  public propsSnapshot: cd.ElementPropertiesMap = {};
  public stateChanges$ = new BehaviorSubject<cd.IActionStateChange[]>([]);
  public isRecording = false;

  constructor(
    private _propertiesService: PropertiesService,
    private _projectStore: Store<IProjectState>
  ) {}

  private get stateChanges() {
    return this.stateChanges$.getValue();
  }

  private set stateChanges(changes) {
    this.stateChanges$.next(changes);
  }

  /**
   * Used to delete multiple recorded states at specific indexes
   */
  deleteMultipleIndexes(indexes: number[]) {
    const updates: cd.IPropertiesUpdatePayload[] = [];
    this.stateChanges = this.stateChanges.reduce<cd.IActionStateChange[]>((acc, item, idx) => {
      const hasIndex = indexes.includes(idx);
      if (hasIndex) {
        const update = this.resetActionForElement(item);
        if (update) updates.push(update);
        return acc;
      }
      acc.push(item);
      return acc;
    }, []);

    if (!updates.length) return;
    this.updateElementProperties(updates);
  }

  deleteRecordAtIndex(index: number) {
    const changeToRemove = this.stateChanges[index];
    if (!changeToRemove) return;
    this.stateChanges = removeValueFromArrayAtIndex(index, this.stateChanges);
    const update = this.resetActionForElement(changeToRemove);
    if (!update) return;
    this.updateElementProperties([update]);
  }

  /** Generate a payload for sending to the renderer to remove a style or input change */
  resetActionForElement(change: cd.IActionStateChange): cd.IPropertiesUpdatePayload | undefined {
    const { key, type, elementId } = change;
    if (!elementId) return;

    const originalElement = this.propsSnapshot[elementId];
    if (!originalElement) return;
    if (type === cd.ActionStateType.Input) return this.resetInputForKey(key, originalElement);
    if (type === cd.ActionStateType.Style) return this.resetStyleForKey(key, originalElement);
    return;
  }

  resetInputForKey(key: string, originalElement: cd.PropertyModel): cd.IPropertiesUpdatePayload {
    const originalElementInput = originalElement?.inputs;
    const originalInput = originalElementInput && (originalElementInput as any)[key];
    const properties = utils.addInputAttribute(key, originalInput);
    return buildPropertyUpdatePayload(originalElement.id, properties);
  }

  resetStyleForKey(key: string, originalElement: cd.PropertyModel) {
    const originalElementStyle = getElementBaseStyles(originalElement);
    const originalStyle = originalElementStyle && originalElementStyle[key];
    const properties = utils.addStyleAttribute(key, originalStyle);
    return buildPropertyUpdatePayload(originalElement.id, properties);
  }

  updateElementProperties(payloads: cd.IPropertiesUpdatePayload[]) {
    // If undable is set to true these changes will be captured by Record Effects
    // Just update the renderer to remove styles.
    const undoable = false;
    this._projectStore.dispatch(new ElementPropertiesUpdate(payloads, undoable));
  }

  updateRecordAtIndex(idx: number, change: cd.IActionStateChange) {
    const clone = deepCopy(this.stateChanges);
    const valueChanged = change.value !== clone[idx].value;
    clone[idx] = change;
    this.stateChanges = clone;
    if (valueChanged) this.handleRecordValueChange(change);
  }

  /** This is called when a user modfies a recorded input state while recording is active */
  handleRecordValueChange(change: cd.IActionStateChange) {
    const elementId = change.elementId;
    if (!elementId) return;
    console.assert(change.type === cd.ActionStateType.Input, 'Only input updates can be modified');
    const properties = utils.addInputAttribute(change.key, change.value, change.symbolChildId);
    this.updateElementProperties([{ elementId, properties }]);
  }

  assignInitialStateChanges(changes: cd.IActionStateChange[]) {
    this.stateChanges = changes;
    this._initalStateChanges = changes;
  }

  addStateChanges(changes: cd.IActionStateChange[]) {
    const { propsSnapshot, stateChanges, _initalStateChanges } = this;
    this.stateChanges = utils.mergeAddedStateChange(
      changes,
      stateChanges,
      _initalStateChanges,
      propsSnapshot
    );
  }

  startRecording(elementId: string, actionId?: string) {
    this.isRecording = true;
    this.currentElementId = elementId;
    this.currentActionId = actionId || '';
    this.stateChanges = [];
    this.propsSnapshot = simpleClone(this._propertiesService.getElementProperties());
  }

  stopRecording(): {
    elementId: string;
    actionId: string;
    stateChanges: cd.IActionStateChange[];
    propsSnapshot: cd.ElementPropertiesMap;
  } {
    this.isRecording = false;
    const { currentElementId: elementId, currentActionId: actionId, stateChanges } = this;
    const propsSnapshot = simpleClone(this.propsSnapshot);
    this.propsSnapshot = {};
    this._initalStateChanges = [];
    return { elementId, actionId, stateChanges, propsSnapshot };
  }

  /** Converts the current recorded state changes into element properties payload */
  getPropertiesUpdateFromState(): cd.IPropertiesUpdatePayload[] {
    type PayloadMap = Map<string, cd.RecursivePartial<cd.PropertyModel>>;
    // Create a mapping of element changes
    const mappedChanges = this.stateChanges.reduce<PayloadMap>((acc, change) => {
      const { elementId } = change;
      if (!elementId) return acc;
      if (!this.propsSnapshot[elementId]) return acc;
      const value = utils.payloadForStateChange(change);
      if (acc.has(elementId)) {
        const current = acc.get(elementId) || {};
        acc.set(elementId, deepMerge(value, current));
      } else {
        acc.set(elementId, value);
      }
      return acc;
    }, new Map());
    // Convert mapping into Properties Update Payload
    return [...mappedChanges.entries()].map(([elementId, properties]) => {
      return { elementId, properties };
    });
  }
}
