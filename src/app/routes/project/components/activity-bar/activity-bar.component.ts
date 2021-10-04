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

import { Component, Output, EventEmitter, Input, ChangeDetectionStrategy } from '@angular/core';
import { IActivityConfig } from '../../interfaces/activity.interface';
import { ActivityTopConfig, ActivityBottomConfig } from '../../configs/context.menu.config';

@Component({
  selector: 'app-activity-bar',
  templateUrl: './activity-bar.component.html',
  styleUrls: ['./activity-bar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivityBarComponent {
  private _currentActivity?: string;
  public top = ActivityTopConfig;
  public bottom = ActivityBottomConfig;

  @Input() active = false;
  @Output() activitySelected = new EventEmitter<IActivityConfig>();

  @Input()
  set currentActivity(currentActivity: string) {
    this._currentActivity = currentActivity;
  }

  get currentActivity() {
    return (this.active && this._currentActivity) || '';
  }

  selectActivity(item: IActivityConfig) {
    this.activitySelected.emit(item);
  }

  trackByFn(_idx: number, item: IActivityConfig) {
    return item.id;
  }
}
