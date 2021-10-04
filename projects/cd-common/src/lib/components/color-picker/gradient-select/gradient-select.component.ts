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
  EventEmitter,
  Output,
  HostBinding,
} from '@angular/core';
import { GradientMode, isGradient, parseGradient, IGradient } from 'cd-utils/color';
import { ISelectItem } from 'cd-interfaces';
import { coerceBooleanProperty } from '@angular/cdk/coercion';
import { buildGradientString } from '../gradient/gradient.utils';

@Component({
  selector: 'cd-gradient-select',
  templateUrl: './gradient-select.component.html',
  styleUrls: ['./gradient-select.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GradientSelectComponent {
  private _embed = false;
  private _gradient = '';
  private _parsedGradient?: IGradient;
  public GradientMode = GradientMode;
  public gradientMenu = [
    { title: 'Linear', value: GradientMode.Linear },
    { title: 'Radial', value: GradientMode.Radial },
    { title: 'Conic', value: GradientMode.Conic },
  ];

  @Input() angle = 90;
  @Input() mode = GradientMode.Linear;

  @Input()
  set gradient(value: string) {
    const hasGradient = isGradient(value);
    if (!hasGradient) return;
    if (value === this._gradient) return;
    const gradient = parseGradient(value);
    this.mode = gradient.mode;
    this.angle = gradient.angle;
    this._parsedGradient = gradient;
    this._gradient = value;
  }

  @Input()
  @HostBinding('class.embed')
  public get embed() {
    return this._embed;
  }
  public set embed(value) {
    this._embed = coerceBooleanProperty(value);
  }

  @Output() selectGradient = new EventEmitter<GradientMode>();
  @Output() angleChange = new EventEmitter<number>();
  @Output() gradientChange = new EventEmitter<string>();

  get isRadial() {
    return this.mode === GradientMode.Radial;
  }

  publishGradient(update: Partial<IGradient>) {
    if (!this._parsedGradient) return;
    const { mode, stops, angle } = { ...this._parsedGradient, ...update };
    const gradient = buildGradientString(mode, stops, angle);
    this.gradientChange.emit(gradient);
  }

  onGradientMenuChange(item: ISelectItem) {
    const mode = item.value as GradientMode;
    this.selectGradient.emit(mode);
    this.publishGradient({ mode });
  }

  onAngleChange(value: number) {
    this.angleChange.emit(value);
    this.publishGradient({ angle: value });
  }

  onFlip() {
    const angle = (this.angle + 180) % 360;
    this.onAngleChange(angle);
  }
}
