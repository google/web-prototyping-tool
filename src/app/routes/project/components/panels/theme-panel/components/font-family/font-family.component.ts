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
  Input,
  Output,
  EventEmitter,
  OnDestroy,
  ComponentRef,
} from '@angular/core';
import { FontPickerComponent, OverlayService } from 'cd-common';
import { IStringMap, IFontFamily } from 'cd-interfaces';
import { environment } from 'src/environments/environment';
import { FontKind } from 'cd-metadata/fonts';
import { sortDesignSystemValues } from 'cd-themes';

const PICKER_OFFSET_TOP = 100;

@Component({
  selector: 'app-font-family',
  templateUrl: './font-family.component.html',
  styleUrls: ['./font-family.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FontFamilyComponent implements OnDestroy {
  private _componentRef?: ComponentRef<FontPickerComponent>;
  private _fontFamilies: ReadonlyArray<IFontFamily> = [];

  @Input()
  public set fontFamilies(value: IStringMap<IFontFamily>) {
    const val = value || {};

    this._fontFamilies = Object.entries(val)
      .reduce((acc: IFontFamily[], item) => {
        const [id, font] = item;
        const systemOrIcon = font.kind === FontKind.System || font.kind === FontKind.Icon;
        if (systemOrIcon === false) acc.push({ ...font, id });
        return acc;
      }, [])
      .sort(sortDesignSystemValues);
  }

  @Output() addFont = new EventEmitter<IFontFamily>();
  @Output() removeFont = new EventEmitter<string>();

  constructor(protected _cdRef: ChangeDetectorRef, protected _overlayService: OverlayService) {}

  launchFontFamilyPicker(e: MouseEvent) {
    const target = e.currentTarget as HTMLElement;
    const { top, left, width } = target.getBoundingClientRect();
    const x = left + width;
    const y = top - PICKER_OFFSET_TOP;
    const overlayConfig = { x, y };
    const componentRef = this._overlayService.attachComponent(FontPickerComponent, overlayConfig);
    componentRef.instance.config = environment.googleFonts;
    componentRef.instance.existingFonts = this._fontFamilies;
    const subscriptions = componentRef.instance.addFontFamily.subscribe(this.onFontPick);
    componentRef.onDestroy(() => subscriptions.unsubscribe());
    this._componentRef = componentRef;
  }

  onFontPick = (fontFamily: IFontFamily): void => {
    this.addFont.emit(fontFamily);
    this._cdRef.markForCheck();
    this.cleanupComponentRef();
  };

  cleanupComponentRef() {
    if (!this._componentRef) return;
    this._overlayService.close();
    this._componentRef = undefined;
  }

  ngOnDestroy(): void {
    this.cleanupComponentRef();
  }

  get families() {
    return this._fontFamilies;
  }

  onRemoveChip(fontFamily: IFontFamily) {
    if (!fontFamily.id) return;
    this.removeFont.emit(fontFamily.id);
  }

  trackByFn(_index: number, item: IFontFamily) {
    return item.family;
  }
}
