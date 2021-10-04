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

import { IActivityConfig } from '../interfaces/activity.interface';
import { getCurrentActivity, getLeftPanel } from '../store/selectors/panels.selector';
import { PanelConfig } from '../configs/project.config';
import { IProjectState } from '../store/reducers';
import { Injectable, NgZone } from '@angular/core';
import { Subscription } from 'rxjs';
import { Store, select } from '@ngrx/store';
import * as actions from '../store/actions';
import { map, distinctUntilChanged } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class DndPanelManagerService {
  protected _subscriptions = Subscription.EMPTY;

  private _currentActivity?: IActivityConfig;
  private _activityBeforeSwitch?: IActivityConfig;
  private _switchedToLayersTree = false;
  private _leftPanelVisible = false;

  get activityBeforeSwitch() {
    return this._activityBeforeSwitch;
  }

  constructor(private readonly _projectStore: Store<IProjectState>, private _zone: NgZone) {
    const currentActivity$ = this._projectStore.pipe(select(getCurrentActivity));
    const leftPanelVisible$ = this._projectStore.pipe(
      select(getLeftPanel),
      map((panel) => !!panel.visible),
      distinctUntilChanged()
    );
    this._subscriptions = currentActivity$.subscribe(this.onCurrentActivity);
    this._subscriptions = leftPanelVisible$.subscribe(this.onLeftPanelVisible);
  }

  onLeftPanelVisible = (visible: boolean) => {
    this._leftPanelVisible = visible;
  };

  onCurrentActivity = (activity: IActivityConfig) => {
    this._currentActivity = activity;
  };

  dispatch(activity: IActivityConfig) {
    // Ensure this is run inside zone
    this._zone.run(() => {
      this._projectStore.dispatch(new actions.PanelSetActivity(activity, {}));
    });
  }

  openLeftPanelAndShowLayersTree() {
    if (this._leftPanelVisible) return;
    this.dispatch(PanelConfig.Layers);
    this._switchedToLayersTree = true;
  }

  switchToLayersTreeIfLeftPanelIsOpen() {
    const { _currentActivity } = this;
    if (!this._leftPanelVisible) return;
    if (_currentActivity && _currentActivity.id !== PanelConfig.Layers.id) {
      this._activityBeforeSwitch = _currentActivity;
      this._switchedToLayersTree = true;
      this.dispatch(PanelConfig.Layers);
    }
  }

  switchToPreviousView() {
    const { _switchedToLayersTree, _activityBeforeSwitch } = this;
    if (_switchedToLayersTree && _activityBeforeSwitch) {
      this.dispatch(_activityBeforeSwitch);
      this.reset();
    }
  }

  reset() {
    this._activityBeforeSwitch = undefined;
    this._switchedToLayersTree = false;
  }
}
