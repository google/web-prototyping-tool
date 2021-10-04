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
  Directive,
  OnDestroy,
  Output,
  EventEmitter,
  ComponentRef,
  ChangeDetectorRef,
  ElementRef,
  HostBinding,
} from '@angular/core';
import { HSVColor } from 'cd-utils/color';
import { OverlayService } from '../../overlay/overlay.service';
import { ColorPickerComponent } from '../../color-picker/color-picker.component';
import { Subscription } from 'rxjs';
import { half, clamp } from 'cd-utils/numeric';

const OVERLAY_OFFSET_Y = 15;
const PADDING = 20;
const OVERLAY_WIDTH = 220;
const OVERLAY_HEIGHT = 336;

@Directive({
  selector: '[cdColorPicker]',
  providers: [OverlayService],
})
export class ColorPickerDirective implements OnDestroy {
  @Output() gradientPick = new EventEmitter<string>();
  @Output() colorPick = new EventEmitter<HSVColor>();

  private _componentRef?: ComponentRef<ColorPickerComponent>;

  constructor(
    private _overlayService: OverlayService,
    private _cdRef: ChangeDetectorRef,
    private _elemRef: ElementRef
  ) {}

  @HostBinding('class.active')
  get pickerActive() {
    return this._componentRef !== undefined;
  }

  createColorPicker(color: string = '', disableGradient: boolean = false) {
    const [x, y] = this.getPickerPosition();
    const overlayConfig = { x, y: y + OVERLAY_OFFSET_Y };
    const componentRef = this._overlayService.attachComponent(ColorPickerComponent, overlayConfig);
    componentRef.instance.color = color;
    componentRef.instance.disableGradient = disableGradient;
    const subscription = new Subscription();
    subscription.add(componentRef.instance.pick.subscribe(this.onColorPick));
    subscription.add(componentRef.instance.pickGradient.subscribe(this.onGradientPick));
    componentRef.onDestroy(() => {
      subscription.unsubscribe();
      this._componentRef = undefined;
      this._cdRef.markForCheck();
    });
    this._componentRef = componentRef;
  }

  onGradientPick = (gradient: string): void => {
    this.gradientPick.emit(gradient);
  };

  onColorPick = (color: HSVColor): void => {
    this.colorPick.emit(color);
  };

  cleanupComponentRef() {
    if (!this._componentRef) return;
    this._overlayService.close();
    this._componentRef = undefined;
  }

  getPickerPosition(): [number, number] {
    // TODO: cleanup
    const { innerWidth, innerHeight } = window;
    const { top, left } = this._elemRef.nativeElement.getBoundingClientRect();
    const x = left - OVERLAY_WIDTH;
    const y = top - half(OVERLAY_HEIGHT);
    return [clamp(x, PADDING, innerWidth), clamp(y, PADDING, innerHeight)];
  }

  ngOnDestroy(): void {
    this.cleanupComponentRef();
  }
}
