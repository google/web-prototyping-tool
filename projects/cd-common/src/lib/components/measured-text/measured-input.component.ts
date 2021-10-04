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
  ElementRef,
  ChangeDetectorRef,
  AfterViewInit,
  HostListener,
  OnChanges,
  SimpleChanges,
  Input,
  HostBinding,
} from '@angular/core';
import { AUTO_VALUE } from 'cd-common/consts';
import { coerceBooleanProperty } from '@angular/cdk/coercion';
import { KEYS, keyCheck } from 'cd-utils/keycodes';
import { measureTextWidth } from './measured-text.utils';

const DEFAULT_FONT_STYLE = '500 14px / 16.1px "Google Sans", sans-serif';

@Component({
  selector: `input[cd-measured-input]`,
  template: ``,
  styleUrls: ['./measured-text.scss', './measured-input.component.scss'],
  exportAs: 'cdMeasuredInput',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MeasuredInputComponent implements OnChanges, AfterViewInit {
  private _measureOnFocus = false;
  private _useDefaultFontStyle = false;
  private _fontStyle = '';
  private _value = '';

  /** An optimization to bypass the expensive
   * offscreen canvas and window.getComputedStyle  */
  @Input()
  set useDefaultFontStyle(value: boolean | string) {
    this._useDefaultFontStyle = coerceBooleanProperty(value);
  }
  get useDefaultFontStyle() {
    return this._useDefaultFontStyle;
  }

  @Input()
  set measureOnFocus(value: boolean | string) {
    this._measureOnFocus = coerceBooleanProperty(value);
  }
  get measureOnFocus() {
    return this._measureOnFocus;
  }

  @Input()
  @HostBinding('style.width.px')
  width: number | string = AUTO_VALUE;

  @Input() value = '';

  constructor(protected _elementRef: ElementRef, protected _cdRef: ChangeDetectorRef) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.value) {
      this.element.value = this.value;
      this.update();
    }
  }

  ngAfterViewInit(): void {
    this.update();
  }

  @HostListener('mousedown', ['$event'])
  onMouseDown(e: MouseEvent) {
    e.stopPropagation();
  }

  @HostListener('keydown', ['$event'])
  onKeyPress(e: KeyboardEvent) {
    const { key, target } = e;
    if (keyCheck(key, KEYS.Enter, KEYS.Escape)) {
      e.preventDefault();
      (target as HTMLElement).blur();
    }
  }

  @HostListener('focus')
  onfocus() {
    if (this.measureOnFocus) this.update();
  }

  measureText(text: string) {
    const { fontStyle } = this;
    return Math.ceil(measureTextWidth(text, fontStyle));
  }

  blur() {
    this.element.blur();
  }

  focus() {
    this.element.focus();
  }

  get element(): HTMLInputElement | HTMLTextAreaElement {
    return this._elementRef.nativeElement;
  }

  get fontStyle() {
    if (this.useDefaultFontStyle) return DEFAULT_FONT_STYLE;
    if (!this._fontStyle) {
      this._fontStyle = window.getComputedStyle(this.element).font as string;
    }
    return this._fontStyle;
  }

  requestUpdate = () => {
    const { textWidth } = this;
    const PLACEHOLDER_OFFSET = 2;
    const additional = this.element.value ? 0 : PLACEHOLDER_OFFSET;
    const actualWidth = textWidth + additional;
    this.width = actualWidth;
    this._cdRef.markForCheck();
  };

  get isFocused() {
    return this.element === document.activeElement;
  }

  get measurableText(): string {
    return this._value || this.element.value || this.element.placeholder;
  }

  get textWidth() {
    const { measurableText } = this;
    return this.measureText(measurableText);
  }

  @HostListener('blur')
  @HostListener('input')
  update() {
    if (this.measureOnFocus && !this.isFocused) return;
    this.requestUpdate();
  }
}
