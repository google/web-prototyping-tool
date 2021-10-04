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
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  OnInit,
  Optional,
  Output,
  ViewChild,
  Input,
  OnDestroy,
} from '@angular/core';
import { fromEvent, Observable, Subscription } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { IFontFamily, IWebFontList } from 'cd-interfaces';
import { OverlayInitService } from '../overlay/overlay.init.service';
import { KEYS, keyCheck } from 'cd-utils/keycodes';
import * as fontUtils from 'cd-common/utils';
import { FontWeight, FontStyle } from 'cd-metadata/fonts';
import { clamp } from 'cd-utils/numeric';
import { SearchInputComponent } from '../search-input/search-input.component';
import { ScrollBehavior } from 'cd-common/consts';

const DATA_TAG = 'data-family';
interface IFontConfig {
  apiKey: string;
  url: string;
}

@Component({
  selector: 'cd-font-picker',
  templateUrl: './font-picker.component.html',
  styleUrls: ['./font-picker.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FontPickerComponent implements OnInit, AfterViewInit, OnDestroy {
  private _filter = '';
  private _subscriptions: Subscription = new Subscription();

  public fontFamilies: ReadonlyArray<IFontFamily> = [];
  public fontFamilyLookup: ReadonlyArray<string> = [];
  public selectedFontFamily?: IFontFamily;
  public loadingPreview = false;

  @Input() config?: IFontConfig;
  @Input() existingFonts: ReadonlyArray<IFontFamily> = [];

  @Output() addFontFamily = new EventEmitter<IFontFamily>();
  @Output() close = new EventEmitter<boolean>();

  @ViewChild('overlayRef', { read: ElementRef, static: true }) overlayRef!: ElementRef;
  @ViewChild('searchRef', { read: SearchInputComponent, static: true })
  searchRef?: SearchInputComponent;
  @ViewChild('fontListRef', { read: ElementRef, static: true }) fontListRef!: ElementRef;

  get filter(): string {
    return this._filter;
  }
  set filter(filter: string) {
    this._filter = filter;
  }

  constructor(
    private _overlayInit: OverlayInitService,
    private _cdRef: ChangeDetectorRef,
    @Optional() private httpClient: HttpClient
  ) {}

  ngOnInit() {
    const { config } = this;
    if (config) {
      const url = `${config.url}?key=${config.apiKey}&prettyPrint=false`;
      this.loadFontsOptions(url);
      this._subscriptions.add(this.loadFontsOptions(url).subscribe(this.handleFontsResults));
    }
  }

  get selectedFontVariantLength(): number {
    return this.selectedFontFamily?.variants?.length || 0;
  }

  get fontList() {
    return this.fontListRef.nativeElement;
  }

  ngOnDestroy(): void {
    this._subscriptions.unsubscribe();
  }

  ngAfterViewInit() {
    const keyDown$ = fromEvent<KeyboardEvent>(this.fontList, 'keydown', { capture: true });
    this._subscriptions.add(keyDown$.subscribe(this.handleKey));
    this._overlayInit.componentLoaded();
    this.searchRef?.inputRef.nativeElement.focus();
  }

  onFilter(value: string | undefined) {
    this.filter = value || '';
  }

  handleClick(item: IFontFamily) {
    this._cdRef.markForCheck();
    this.selectedFontFamily = item;
    this.loadPreview(item);
  }

  handleFontsResults = (data: IWebFontList) => {
    const { existingFonts } = this;
    const existingKeys = new Set(existingFonts.map((item) => item.family));
    const list = data.items.filter((item) => !existingKeys.has(item.family));
    this.fontFamilies = list;
    this.fontFamilyLookup = list.map((item) => item.family);
    const [firstFont] = this.fontFamilies;
    this.selectedFontFamily = firstFont;
    this.loadPreview(firstFont);
  };

  handleKey = (e: KeyboardEvent) => {
    const { key } = e;
    if (keyCheck(key, KEYS.ArrowDown, KEYS.ArrowUp)) {
      const family = this.selectedFontFamily && this.selectedFontFamily.family;
      if (!family) return;
      e.preventDefault();
      e.stopPropagation();

      const { fontList } = this;
      const currentlyFocused = fontList.querySelector(`li[${DATA_TAG}="${family}"]`);
      const idx = currentlyFocused && [...fontList.children].indexOf(currentlyFocused);
      const increment = key === KEYS.ArrowDown ? 1 : -1;
      const next = idx + increment;
      const nextIdx = clamp(next, 0, fontList.children.length);
      const nextElem = fontList.children[nextIdx];
      const nextFamily = nextElem.getAttribute(DATA_TAG);
      const item = this.getItemByFamily(nextFamily);
      if (item) {
        this.selectedFontFamily = item;
        nextElem.querySelector('button').focus({ preventScroll: true });
        nextElem.scrollIntoView({ behavior: ScrollBehavior.Smooth });
        this.loadPreview(item);
      }
    }
  };

  onDoubleClick(item: IFontFamily) {
    this.selectedFontFamily = item;
    this.addFontFamilyToCollection();
  }

  addFontFamilyToCollection() {
    const { selectedFontFamily } = this;
    if (selectedFontFamily) {
      // Extract and store relevant details from font
      const { kind, files, version, lastModified, ...font } = selectedFontFamily;

      // This converts 'regular' -> '400' and 'italic' to '400italic'
      font.variants = font.variants.map((value) => {
        if (value === FontStyle.Italic) return FontWeight.RegularItalic;
        if (value === FontStyle.Regular) return FontWeight.Regular;
        return value;
      });

      fontUtils.loadFont(font.family, font.variants);
      this.addFontFamily.emit(font);
    }
  }

  trackByFn(_index: number, item: IFontFamily) {
    return item.family;
  }

  getItemByFamily(family: string): IFontFamily | undefined {
    return this.fontFamilies.find((font: IFontFamily) => font.family === family);
  }

  private loadFontsOptions(url: string): Observable<IWebFontList> {
    return this.httpClient.get(url, { responseType: 'json' }) as Observable<IWebFontList>;
  }

  private loadPreview(font: IFontFamily) {
    this.loadingPreview = true;
    this.selectedFontFamily = font;

    fontUtils.loadFontPreview(font).then(() => {
      this.loadingPreview = false;
      this._cdRef.markForCheck();
    });
  }
}
