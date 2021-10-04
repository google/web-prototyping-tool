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

import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { ComponentSize, IMenuConfig } from 'cd-interfaces';
import { getAvatarUrl } from 'cd-common/utils';

@Component({
  selector: 'cd-avatar',
  templateUrl: './avatar.component.html',
  styleUrls: ['./avatar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AvatarComponent {
  private _profileImgUrl = '';
  public errorLoadingImage = false;

  @Input() actionable = true;
  @Input() menuData: IMenuConfig[] = [];
  @Input() menuSize: ComponentSize = ComponentSize.Small;

  @Input()
  set profileImgUrl(value: string) {
    this._profileImgUrl = getAvatarUrl(value);
  }
  get profileImgUrl(): string {
    return this._profileImgUrl;
  }

  @Output() menuSelected = new EventEmitter<IMenuConfig>();
  onMenuSelected(menuConfig: IMenuConfig) {
    this.menuSelected.emit(menuConfig);
  }

  onLoadImageError() {
    this.errorLoadingImage = true;
  }
}
