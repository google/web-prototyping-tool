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
  ChangeDetectorRef,
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  OnDestroy,
} from '@angular/core';

import { ColorPickerComponent, OverlayService } from 'cd-common';
import { IDesignColor, IDesignSystem } from 'cd-interfaces';
import { HSVColor, IColorWithTonalPalette } from 'cd-utils/color';
import { generateIDWithLength } from 'cd-utils/guid';
import { Subscription } from 'rxjs';
import { incrementNameForDesignSystemCategory } from '../../utils/theme.utils';
import { IDesignColorWithId, stringValueFromColor } from './theme-color.utils';
import { sortDesignSystemValues } from 'cd-themes';

const OFFSET_OVERLAY_LEFT = 90;
const OFFSET_OVERLAY_LEFT_ADD = 60;
const OFFSET_OVERLAY_TOP = 120;

const defaultSwatch: IDesignColor = {
  name: 'Custom',
  value: '#F1F3F4',
};

class DesignColor implements IDesignColorWithId {
  public id = generateIDWithLength(5).toLowerCase();
  public name = defaultSwatch.name;
  public value = defaultSwatch.value;
  constructor(public index: number) {}
}

@Component({
  selector: 'app-theme-color',
  templateUrl: './theme-color.component.html',
  styleUrls: ['./theme-color.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [OverlayService],
})
export class ThemeColorComponent implements OnDestroy {
  private _subscriptions = Subscription.EMPTY;
  private _designSystem?: IDesignSystem;
  public currentlyEditingId?: string;
  public themeColors: Array<IDesignColorWithId> = [];

  @Output() colorPick = new EventEmitter<IDesignColorWithId>();
  @Output() colorRemoved = new EventEmitter<string>();

  @Input()
  set designSystem(designSystem: IDesignSystem | undefined) {
    this._designSystem = designSystem;
    const colors = designSystem?.colors;
    if (!colors) return;
    this.themeColors = Object.entries(colors)
      .map(([id, value]) => ({ ...value, id }))
      .filter((value) => value.hidden !== true)
      .sort(sortDesignSystemValues);
  }

  constructor(private _cdRef: ChangeDetectorRef, private _overlayService: OverlayService) {}

  onAddSwatch(event: MouseEvent) {
    const swatch = new DesignColor(this.themeColors.length);
    swatch.name = incrementNameForDesignSystemCategory(
      defaultSwatch.name,
      this._designSystem?.colors
    );
    this.onEditSwatch(event, swatch, OFFSET_OVERLAY_LEFT_ADD);
    this.colorPick.emit(swatch);
  }

  onColorPick = (color: HSVColor, swatch: IDesignColorWithId) => {
    const value = stringValueFromColor(color);
    const update = { ...swatch, value };
    this.colorPick.emit(update);
  };

  ngOnDestroy(): void {
    this._subscriptions.unsubscribe();
  }

  onEditSwatchIdChanged(e: MouseEvent | KeyboardEvent, themeColor: IDesignColorWithId) {
    this.onEditSwatch(e, themeColor);
  }

  onEditSwatch(e: MouseEvent | KeyboardEvent, themeColor: IDesignColorWithId, offsetLeft?: number) {
    const swatch = { ...themeColor };
    const overlayConfig = this.getOverlayConfig(e, offsetLeft);
    const componentRef = this._overlayService.attachComponent(ColorPickerComponent, overlayConfig);
    const subscription = new Subscription();
    componentRef.instance.color = themeColor.value;
    componentRef.instance.disableGradient = true;
    if (swatch.variants) {
      subscription.add(
        componentRef.instance.tonalPalettePick.subscribe((color: IColorWithTonalPalette) =>
          this.onVariantColorPick(color, swatch)
        )
      );
    } else {
      subscription.add(
        componentRef.instance.pick.subscribe((color: HSVColor) => this.onColorPick(color, swatch))
      );
    }

    this.currentlyEditingId = themeColor.id;
    this._cdRef.markForCheck();

    componentRef.onDestroy(() => {
      subscription.unsubscribe();
      this.currentlyEditingId = undefined;
      this._cdRef.markForCheck();
    });
  }

  onSwatchNameChange(event: IDesignColorWithId) {
    this.colorPick.emit(event);
  }

  onVariantColorPick = (colorWithPalette: IColorWithTonalPalette, swatch: IDesignColorWithId) => {
    const { color, tonalPalette } = colorWithPalette;
    const variants = tonalPalette;
    const value = stringValueFromColor(color);
    const update = { ...swatch, variants, value };
    this.colorPick.emit(update);
  };

  trackByFn(_index: number, item: IDesignColorWithId) {
    return item.id;
  }

  private getOverlayConfig(event: MouseEvent | KeyboardEvent, offsetLeft = OFFSET_OVERLAY_LEFT) {
    const target = event.currentTarget as HTMLElement;
    const { top, left, width } = target.getBoundingClientRect();
    const x = left + width + offsetLeft;
    const y = top - OFFSET_OVERLAY_TOP;
    return { x, y };
  }

  removeColor(id: string) {
    this.colorRemoved.emit(id);
  }
}
