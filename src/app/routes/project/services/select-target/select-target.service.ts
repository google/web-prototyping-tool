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
import { Store } from '@ngrx/store';
import { iconForComponent } from 'cd-common/models';
import { keyCheck, KEYS } from 'cd-utils/keycodes';
import { BehaviorSubject, fromEvent, Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { ToastsService } from 'src/app/services/toasts/toasts.service';
import { PanelConfig } from '../../configs/project.config';
import { IProjectState, PanelSetActivityForced } from '../../store';
import { PropertiesService } from '../properties/properties.service';

const SELECT_TOAST_ID = 'select-target';
const SELECTED_TOAST_ID = 'selected-target';
/** This service is used by the select-target element only */
@Injectable({ providedIn: 'root' })
export class SelectTargetService {
  public active$ = new BehaviorSubject(false);
  public selectedId$ = new Subject<string>();
  public cancel$ = new Subject<void>();

  constructor(
    private _toastService: ToastsService,
    private _propertiesService: PropertiesService,
    private readonly _projectStore: Store<IProjectState>
  ) {}

  setSelection(id: string) {
    this.selectedId$.next(id);
    this.showSelectedToast(id);
    this.onCancel();
  }

  activate() {
    this.showActiveToast();
    this.listenForEscKey();
    this.openLayersTreePanel();
    this.active = true;
  }

  onCancel = () => {
    this._toastService.removeToast(SELECT_TOAST_ID);
    this.cancel$.next();
    this.active = false;
  };

  openLayersTreePanel() {
    this._projectStore.dispatch(new PanelSetActivityForced(PanelConfig.Layers, {}));
  }

  showSelectedToast(id: string) {
    const element = this._propertiesService.getPropertiesForId(id);
    if (!element) return;
    const iconName = iconForComponent(element);
    const message = `${element?.name} element picked`;
    this._toastService.addToast({ id: SELECTED_TOAST_ID, message, iconName });
  }

  removeSelectedToast() {
    this._toastService.removeToast(SELECTED_TOAST_ID);
  }

  showActiveToast() {
    this.removeSelectedToast();
    this._toastService.addToast({
      id: SELECT_TOAST_ID,
      message: 'Select an Element',
      iconName: 'gps_fixed',
      confirmLabel: 'Cancel',
      hideDismiss: true,
      duration: -1, // Prevent close
      callback: this.onCancel,
    });
  }

  listenForEscKey() {
    fromEvent<KeyboardEvent>(window, 'keyup')
      .pipe(
        takeUntil(this.cancel$),
        filter(({ key }) => keyCheck(key, KEYS.Escape))
      )
      .subscribe(this.onCancel);
  }

  set active(active: boolean) {
    if (active === this.active$.getValue()) return;
    this.active$.next(active);
  }

  get active() {
    return this.active$.getValue();
  }
}
