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
import { DEFAULT_BOXSHADOW_CONFIG } from 'src/app/routes/project/configs/properties.config';
import { IShadowStyle, ISelectItem } from 'cd-interfaces';
import { coerceBooleanProperty } from '@angular/cdk/coercion';

@Component({
  selector: 'app-shadow-group',
  templateUrl: './shadow-group.component.html',
  styleUrls: ['./shadow-group.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShadowGroupComponent {
  private _hideInnerShadow = false;
  public outerShadows: IShadowStyle[] = [];
  public innerShadows: IShadowStyle[] = [];

  @Input()
  set hideInnerShadow(value: boolean | string) {
    this._hideInnerShadow = coerceBooleanProperty(value);
  }
  get hideInnerShadow() {
    return this._hideInnerShadow;
  }

  @Input()
  set data(styles: IShadowStyle[] | undefined) {
    const value = styles || [];
    this.outerShadows = value.filter((item) => !item.inset);
    this.innerShadows = value.filter((item) => item.inset);
  }

  @Input() colorMenuData: ReadonlyArray<ISelectItem> = [];
  @Output() action = new EventEmitter<ISelectItem>();
  @Output() dataChange = new EventEmitter<IShadowStyle[]>();

  onShadowAdd(inset = false): void {
    const shadow = { ...DEFAULT_BOXSHADOW_CONFIG, inset };
    if (inset) this.innerShadows.push(shadow);
    else this.outerShadows.push(shadow);
    this.sendUpdate();
  }

  updateInnerShadows(shadows: IShadowStyle[]) {
    this.sendUpdate(shadows);
  }

  updateOuterShadows(shadows: IShadowStyle[]) {
    this.sendUpdate(undefined, shadows);
  }

  sendUpdate(inner = this.innerShadows, outer = this.outerShadows) {
    this.dataChange.emit([...inner, ...outer]);
  }

  onAction(evt: ISelectItem) {
    this.action.emit(evt);
  }
}
