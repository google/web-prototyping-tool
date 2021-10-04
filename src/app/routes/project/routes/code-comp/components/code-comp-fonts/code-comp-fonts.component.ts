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
  EventEmitter,
  Output,
  Input,
  ChangeDetectorRef,
  OnDestroy,
  ComponentRef,
  ElementRef,
  ViewChild,
} from '@angular/core';
import { FontPickerComponent, OverlayService } from 'cd-common';
import { removeValueFromArrayAtIndex } from 'cd-utils/array';
import { environment } from 'src/environments/environment';
import { IFontFamily } from 'cd-interfaces';

const OVERLAY_OFFSET = 200;

@Component({
  selector: 'app-code-comp-fonts',
  templateUrl: './code-comp-fonts.component.html',
  styleUrls: ['./code-comp-fonts.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CodeCompFontsComponent implements OnDestroy {
  private _componentRef?: ComponentRef<FontPickerComponent>;

  @Input() fontList: IFontFamily[] = [];
  @Output() fontListChange = new EventEmitter<IFontFamily[]>();

  constructor(protected _cdRef: ChangeDetectorRef, protected _overlayService: OverlayService) {}

  @ViewChild('propGroupRef', { read: ElementRef, static: true }) propGroupRef!: ElementRef;

  get existingFonts() {
    return this.fontList || [];
  }

  onAddItem() {
    const { top, left, width } = this.propGroupRef.nativeElement.getBoundingClientRect();
    const x = left + width;
    const y = top - OVERLAY_OFFSET;
    const overlayConfig = { x, y };
    const componentRef = this._overlayService.attachComponent(FontPickerComponent, overlayConfig);
    componentRef.instance.existingFonts = this.existingFonts;
    componentRef.instance.config = environment.googleFonts;
    const subscriptions = componentRef.instance.addFontFamily.subscribe(this.onFontPick);
    componentRef.onDestroy(() => subscriptions.unsubscribe());
    this._componentRef = componentRef;
  }

  onFontPick = (fontFamily: IFontFamily): void => {
    const fonts: IFontFamily[] = [...this.existingFonts, fontFamily];
    this.fontListChange.emit(fonts);
    this.cleanupComponentRef();
  };

  onDelete(i: number) {
    const update = removeValueFromArrayAtIndex(i, this.existingFonts);
    this.fontListChange.emit(update);
  }

  trackFn(_idx: number, font: IFontFamily) {
    return font.family;
  }

  cleanupComponentRef() {
    if (!this._componentRef) return;
    this._overlayService.close();
    this._componentRef = undefined;
  }

  ngOnDestroy(): void {
    this.cleanupComponentRef();
  }
}
