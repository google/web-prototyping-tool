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
  Output,
  EventEmitter,
  ChangeDetectorRef,
} from '@angular/core';
import { IValue, Units, ILockingRect } from 'cd-interfaces';
import { UnitTypes } from 'cd-metadata/units';
import * as utils from 'cd-common/utils';
import * as consts from './element-size.consts';

@Component({
  selector: 'cd-element-size-props',
  templateUrl: './element-size-props.component.html',
  styleUrls: ['./element-size-props.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ElementSizePropsComponent {
  private _width?: IValue;
  private _height?: IValue;
  private _frame: ILockingRect = utils.generateLockingFrame();
  private _prevWidth = 0;
  private _prevHeight = 0;

  public lines: consts.ISvgLine[] = consts.DEFAULT_SVG_LINES;
  public units: Units[] = [UnitTypes.Pixels, UnitTypes.Percent, UnitTypes.None];
  public unitTypes = UnitTypes;
  public hoverLine = '';

  @Input()
  set width(value: IValue | undefined) {
    this._width = utils.getIValueSizeFromString(value);
  }
  get width(): IValue | undefined {
    return this._width;
  }

  @Input()
  set height(value: IValue | undefined) {
    this._height = utils.getIValueSizeFromString(value);
  }
  get height(): IValue | undefined {
    return this._height;
  }
  @Input()
  set frame(value: ILockingRect) {
    this.updatePrevWidth(value.width);
    this.updatePrevHeight(value.height);
    this._frame = value;
  }
  get frame(): ILockingRect {
    return this._frame;
  }

  @Output() lockChange = new EventEmitter<ILockingRect>();
  @Output() modelChange = new EventEmitter<Partial<consts.ISizeValues>>();

  onOver(line: consts.ISvgLine) {
    this.hoverLine = line.id;
    this.lines = this.lines.sort((a) => (a.id === line.id ? 1 : -1));
  }

  onOut() {
    this.hoverLine = '';
  }

  updatePrevWidth(width: number) {
    if (this.width && this.width.units === UnitTypes.Pixels) {
      this._prevWidth = width || consts.DEFAULT_SIZE_PX;
    }
  }

  updatePrevHeight(height: number) {
    if (this.height && this.height.units === UnitTypes.Pixels) {
      this._prevHeight = height || consts.DEFAULT_SIZE_PX;
    }
  }

  getNextUnitType(ref: IValue, shiftKey: boolean) {
    const unit = ref.units || '';
    const increment = shiftKey ? -1 : 1;
    let idx = (this.units.indexOf(unit) + increment) % this.units.length;
    if (idx === -1) idx = this.units.length - 1;
    return this.units[idx];
  }

  publishNoneValue(isWidth: boolean) {
    const noneValue = utils.generateIValue();
    if (isWidth) {
      if (!this._prevWidth) this._prevWidth = this._frame.width;
      this.updateDimensions({ width: noneValue });
    } else {
      if (!this._prevHeight) this._prevHeight = this._frame.height;
      this.updateDimensions({ height: noneValue });
    }
  }

  publishPercentValue(isWidth: boolean) {
    const percentValue = utils.generateIValue(consts.DEFAULT_SIZE_PERCENT, UnitTypes.Percent);

    if (isWidth) {
      this.updateDimensions({ width: percentValue });
    } else {
      this.updateDimensions({ height: percentValue });
    }
  }

  publishPixelValue(isWidth: boolean) {
    if (isWidth) {
      const width = utils.generateIValue(
        this._prevWidth || consts.DEFAULT_SIZE_PX,
        UnitTypes.Pixels
      );
      this.updateDimensions({ width });
    } else {
      const height = utils.generateIValue(
        this._prevHeight || consts.DEFAULT_SIZE_PX,
        UnitTypes.Pixels
      );
      this.updateDimensions({ height });
    }
  }

  toggleMode({ shiftKey }: MouseEvent, line: consts.ISvgLine) {
    const isWidth = line.id === consts.WIDTH_PROP;
    const ref = isWidth ? this.width : this.height;
    if (!ref) return;
    const units = this.getNextUnitType(ref, shiftKey);
    if (this._frame.locked) this.toggleLock();
    // prettier-ignore
    switch (units) {
      case UnitTypes.None: return this.publishNoneValue(isWidth);
      case UnitTypes.Percent: return this.publishPercentValue(isWidth);
      default: return this.publishPixelValue(isWidth);
    }
  }

  constructor(private _cdRef: ChangeDetectorRef) {}

  updateInputHeight(update?: IValue) {
    if (!update || !this._height) return;
    if (update.value !== this._height.value) return;
    this.height = undefined;
  }

  updateWidthInput(update?: IValue) {
    if (!update || !this._width) return;
    if (update.value !== this._width.value) return;
    this.width = undefined;
  }

  get widthValue() {
    const { width } = this;
    return Number(width && width.value) || 1;
  }

  get heightValue() {
    const { height } = this;
    return Number(height && height.value) || 1;
  }

  updateDimensions(update: Partial<consts.ISizeValues>) {
    this.updateWidthInput(update.width);
    this.updateInputHeight(update.height);
    this._cdRef.markForCheck();
    this.modelChange.emit({ ...update });
  }

  onWidthChange(width: IValue) {
    const { _frame } = this;
    if (_frame.locked) {
      const { widthValue, heightValue, height } = this;
      const aspectRatio = widthValue / heightValue;
      const wValue = Number(width.value);
      const update = Math.round(wValue / aspectRatio);
      const hUnits = (height && height.units) || width.units;
      const hvalue = utils.generateIValue(update, hUnits);
      this.updateDimensions({ width, height: hvalue });
    } else {
      this.updateDimensions({ width });
    }
  }

  onHeightChange(height: IValue) {
    const { _frame } = this;
    if (_frame.locked) {
      const { widthValue, heightValue, width } = this;
      const aspectRatio = heightValue / widthValue;
      const hValue = Number(height.value);
      const update = Math.round(hValue / aspectRatio);
      const wUnits = (width && width.units) || height.units;
      const wValue = utils.generateIValue(update, wUnits);
      this.updateDimensions({ width: wValue, height });
    } else {
      this.updateDimensions({ height });
    }
  }

  toggleLock() {
    const frame = { ...this._frame };
    frame.locked = !frame.locked;
    this.lockChange.emit(frame);
  }
}
