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
  ChangeDetectorRef,
  AfterViewInit,
  EventEmitter,
  Output,
  ViewChild,
} from '@angular/core';
import { KEYS } from 'cd-utils/keycodes';
import { OverlayInitService } from '../../overlay/overlay.init.service';
import { InputComponent } from '../../input/input.component';
import { prefixUrlWithHTTPS } from 'cd-utils/url';

export interface IHyperlink {
  text: string;
  url: string;
  openInTab?: boolean;
  range?: Range;
}

@Component({
  selector: 'cd-link-overlay',
  templateUrl: './link-overlay.component.html',
  styleUrls: ['./link-overlay.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LinkOverlayComponent implements AfterViewInit {
  hasLink = false;
  @Input() link: IHyperlink = { text: '', url: '', openInTab: false };
  @Output() linkChange = new EventEmitter<IHyperlink>();
  @Output() removeLink = new EventEmitter<Range>();
  @ViewChild('linkInput', { read: InputComponent, static: true }) _linkInput!: InputComponent;
  @ViewChild('textInput', { read: InputComponent, static: true }) _textInput!: InputComponent;

  constructor(private _overlayInit: OverlayInitService, protected _cdRef: ChangeDetectorRef) {}

  ngAfterViewInit() {
    this.hasLink = !!this.link.url;
    this._overlayInit.componentLoaded();
    const hasText = !!this.link.text;
    this.focusInput(hasText ? this._linkInput : this._textInput);
    this._cdRef.detectChanges();
  }

  focusInput(inputCompRef: InputComponent) {
    const input = inputCompRef.inputRef.nativeElement;
    if (!input) return;
    input.setSelectionRange(0, input.value.length);
    input.focus();
  }

  onTextChange(text: string) {
    this.link.text = text;
  }

  onUrlChange(value: string) {
    this.link.url = prefixUrlWithHTTPS(value);
  }

  onRemove() {
    this.removeLink.emit(this.link.range);
  }

  onURLWindowTargetChange(value: boolean) {
    this.link.openInTab = value;
  }

  get openInTab() {
    return !!this.link.openInTab;
  }

  onApply() {
    this.closeAndApply();
  }

  closeAndApply() {
    this.linkChange.emit(this.link);
  }

  onKeyUp({ key }: KeyboardEvent) {
    if (key !== KEYS.Enter) return;
    this.closeAndApply();
  }
}
