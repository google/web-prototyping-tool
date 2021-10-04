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

import {
  Component,
  ChangeDetectionStrategy,
  Input,
  AfterViewInit,
  Output,
  EventEmitter,
} from '@angular/core';
import { RecordedInputType } from '../record-list/record-list.utils';
import { OverlayInitService } from 'cd-common';
import { deepCopy } from 'cd-utils/object';
import * as cd from 'cd-interfaces';

@Component({
  selector: 'app-record-timing-overlay',
  templateUrl: './record-timing-overlay.component.html',
  styleUrls: ['./record-timing-overlay.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecordTimingOverlayComponent implements AfterViewInit {
  public RecordedInputType = RecordedInputType;
  public easingMenu: cd.ISelectItem[] = [
    { title: 'Linear', value: cd.ActionEasing.Linear },
    { title: 'Ease', value: cd.ActionEasing.Ease },
    { title: 'Ease in', value: cd.ActionEasing.EaseIn },
    { title: 'Ease out', value: cd.ActionEasing.EaseOut },
    { title: 'Ease in-out', value: cd.ActionEasing.EaseInOut, divider: true },
    { title: 'In Back', value: cd.ActionEasing.InBack },
    { title: 'Out Back', value: cd.ActionEasing.OutBack },
    { title: 'In Out Back', value: cd.ActionEasing.InOutBack, divider: true },
    { title: 'In Sine', value: cd.ActionEasing.InSine },
    { title: 'Out Sine', value: cd.ActionEasing.OutSine },
    { title: 'In Out Sine', value: cd.ActionEasing.InOutSine, divider: true },
    { title: 'In Quadratic', value: cd.ActionEasing.InQuadratic },
    { title: 'Out Quadratic', value: cd.ActionEasing.OutQuadratic },
    { title: 'In Out Quadratic', value: cd.ActionEasing.InOutQuadratic, divider: true },
    { title: 'In Cubic', value: cd.ActionEasing.InCubic },
    { title: 'Out Cubic', value: cd.ActionEasing.OutCubic },
    { title: 'In Out Cubic', value: cd.ActionEasing.InOutCubic, divider: true },
    { title: 'Fast Out, Slow in', value: cd.ActionEasing.FastOutSlowIn },
    { title: 'Fast Out, Linear In', value: cd.ActionEasing.FastLinearIn },
    { title: 'Linear Out, Slow In', value: cd.ActionEasing.LinearOutSlowIn },
  ];

  @Input() designSystem?: cd.IDesignSystem;
  @Input() model!: cd.IActionStateChange;
  @Input() boards: cd.IBoardProperties[] = [];
  @Input() showPin = false;
  @Output() modelChange = new EventEmitter<cd.IActionStateChange>();
  @Output() delete = new EventEmitter<void>();

  constructor(private _overlayInit: OverlayInitService) {}

  get isStyleAction() {
    return this.model.type === cd.ActionStateType.Style;
  }

  ngAfterViewInit() {
    this._overlayInit.componentLoaded();
  }

  updateModel(value: Partial<cd.IActionStateChange>) {
    const clone = deepCopy(this.model);
    const update = { ...clone, ...value };
    this.modelChange.emit(update);
    this.model = update;
  }

  updateAnimation(animationPartial: Partial<cd.IActionAnimation>) {
    const aniClone = deepCopy(this.model.animation);
    const animation = { ...aniClone, ...animationPartial };
    this.updateModel({ animation });
  }

  onDurationChange(duration: number) {
    this.updateAnimation({ duration });
  }

  onDelayChange(delay: number) {
    this.updateAnimation({ delay });
  }

  onPersistChange(persist: boolean) {
    this.updateModel({ persist });
  }

  onEasingChange(item: cd.SelectItemOutput) {
    const easing = (item as cd.ISelectItem).value as cd.ActionEasingType;
    this.updateAnimation({ easing });
  }

  updateModelValue(value: any) {
    if (this.model.value === value) return;
    // Persist prevents auto-removal
    this.updateModel({ value, persist: true });
  }

  onSelectValueChange(item: cd.SelectItemOutput) {
    const { value } = item as cd.ISelectItem;
    this.updateModelValue(value);
  }

  onBoolValueChange(value: boolean) {
    this.updateModelValue(value);
  }

  onTextValueChange(value: string) {
    this.updateModelValue(value);
  }

  onNumberValueChange(value: number) {
    this.updateModelValue(value);
  }
}
