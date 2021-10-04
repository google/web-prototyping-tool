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
  Input,
  HostListener,
  Output,
  EventEmitter,
  ViewChild,
  ElementRef,
  OnDestroy,
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  OnInit,
} from '@angular/core';
import { KEYS, keyCheck } from 'cd-utils/keycodes';
import { clamp } from 'cd-utils/numeric';
import { ISelectItem, TextAlign } from 'cd-interfaces';
import { OverlayInitService } from '../overlay/overlay.init.service';
import { Subscription, fromEvent } from 'rxjs';
import { scrollElementIntoViewIfNeeded } from 'cd-utils/dom';
import { filterMenu } from '../input/input.utils';
import { LIST_ITEM_TAG } from 'cd-common/consts';

const DEFAULT_INDEX = -1;

@Component({
  selector: 'cd-select',
  templateUrl: './select.component.html',
  styleUrls: ['./select.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectComponent implements OnDestroy, AfterViewInit, OnInit {
  private _subscriptions = new Subscription();
  private _trackMouse = false;
  private _selectedIndex = DEFAULT_INDEX;
  private _activeFilterIndex = DEFAULT_INDEX;
  private _activeIndex = DEFAULT_INDEX;

  private _filterValue = '';
  private _data: ReadonlyArray<ISelectItem> = [];
  private _filteredData: ReadonlyArray<ISelectItem> = [];
  public alignBottom = false;

  @Input() width?: number;
  @Input() showFilter = false;
  @Input() autoSelectMenuItem = false;
  @Input() textAlign: TextAlign = TextAlign.Left;

  @Input()
  set selectedIndex(value) {
    this._selectedIndex = value;
    this._activeIndex = this.selectedIndex;
  }

  get selectedIndex() {
    return this._selectedIndex;
  }

  @Input()
  set data(value: ReadonlyArray<ISelectItem>) {
    this._data = value;
    // Fix: For filtering data, do not remove
    this._cdRef.markForCheck();
  }
  get data(): ReadonlyArray<ISelectItem> {
    return this._filterValue ? this._filteredData : this._data;
  }

  @ViewChild('listRef', { read: ElementRef }) _listRef!: ElementRef;
  @ViewChild('wrapperRef', { read: ElementRef }) _wrapper!: ElementRef;

  @Output() selected = new EventEmitter<number>();
  @Output() close = new EventEmitter<boolean>();
  @Output() activeValue = new EventEmitter<string>();

  constructor(private _overlayInit: OverlayInitService, private _cdRef: ChangeDetectorRef) {}

  get containerWidth() {
    return this._wrapper.nativeElement.getBoundingClientRect()?.width;
  }

  ngOnInit(): void {
    this._subscriptions.add(this._overlayInit.init.subscribe(this.overlayInitSubscription));
  }

  /**
   * Only show filter when data requires it
   * showFilter comes from select-input, and turned off for autocomplete inputs
   */
  get canShowFilter() {
    return this.showFilter && this._data?.length > 6;
  }

  get hidden() {
    return this._data?.length === 0;
  }

  ngAfterViewInit() {
    this._overlayInit.componentLoaded();
    const keydown$ = fromEvent<KeyboardEvent>(window, 'keydown', { capture: true });
    this._subscriptions.add(keydown$.subscribe(this.onKeyDown));

    this.scrollItemIntoView();
  }

  overlayInitSubscription = (alignBottom: boolean) => {
    this.alignBottom = alignBottom;
    this._cdRef.detectChanges();
  };

  trackFn(index: number, item: ISelectItem) {
    const id = item.id || '';
    return `${index}${item.index}${id}`;
  }

  preventDefault(e?: KeyboardEvent) {
    if (!e) return;
    this._trackMouse = false;
    e.preventDefault();
    e.stopPropagation();
  }

  indexFromTarget(e: MouseEvent): number | undefined {
    const item = (e.target as HTMLElement).closest(LIST_ITEM_TAG) as HTMLElement;
    const idx = item && item.dataset.idx;
    return idx ? parseInt(idx, 10) : undefined;
  }

  emitActiveValue(idx: number) {
    const activeValue = this.data[idx]?.value ?? '';
    this.activeValue.emit(activeValue);
  }

  onHover(e: MouseEvent) {
    const idx = this.indexFromTarget(e);
    if (idx === undefined) return;
    if (this._trackMouse === false) return;
    if (idx === this.selectedIndex) return;
    this.emitActiveValue(idx);
    this._selectedIndex = idx;
  }

  onMouseDown(e: MouseEvent) {
    e.stopImmediatePropagation();
    e.preventDefault();
  }

  onItemClick(e: MouseEvent) {
    const idx = this.indexFromTarget(e);
    if (idx === undefined) return;
    e.preventDefault();
    if (this.data[idx].disabled) return;
    this.selectedIndex = idx;
    this.onSelected();
  }

  get hasSelection() {
    return this.selectedIndex !== DEFAULT_INDEX;
  }

  onSelected(e?: KeyboardEvent) {
    if (!this.hasSelection) return;
    this.preventDefault(e);

    const selected = this.data[this.selectedIndex];
    if (selected) this.selected.emit(selected.index);
    this.close.emit(true);
  }

  closeSelect = () => {
    this.close.emit();
  };

  listItem(index: number): HTMLLIElement | null {
    return this._listRef?.nativeElement?.children[index] as HTMLLIElement;
  }

  scrollItemIntoView() {
    const item = this.listItem(this.selectedIndex);
    if (!item) return;
    this._cdRef.markForCheck();
    scrollElementIntoViewIfNeeded(item);
  }

  incrementSelectedIndex(e?: KeyboardEvent): void {
    this.preventDefault(e);
    const { data } = this;
    const len = data.length;
    this._selectedIndex++;
    this._selectedIndex = clamp(this.selectedIndex, 0, len - 1);
    this._selectedIndex %= len;

    if (data[this.selectedIndex].disabled) {
      return this.incrementSelectedIndex();
    }

    this.scrollItemIntoView();
  }

  get activeIndex() {
    return this._filterValue ? this._activeFilterIndex : this._activeIndex;
  }
  /** Get the active element from the original data */
  get activeDataElement() {
    return this._data[this._activeIndex];
  }

  scrollToActiveIndex() {
    this._cdRef.detectChanges();
    const item = this.listItem(this._activeIndex);
    if (!item) return;
    this._cdRef.markForCheck();
    scrollElementIntoViewIfNeeded(item);
  }

  /**
   * Always uses the widest state of the data to to prevent the menu from shrinking when filtering content
   */
  preventWidthFromShrinking() {
    const { containerWidth, width } = this;
    if (!width || width >= containerWidth) return;
    this.width = containerWidth;
  }

  onFilter(value?: string) {
    this.preventWidthFromShrinking();
    this._filteredData = value ? filterMenu(value, this._data) : [];
    this._filterValue = value ?? '';
    this._selectedIndex = DEFAULT_INDEX;
    if (!value) this.scrollToActiveIndex();
    const { activeDataElement } = this;
    if (!activeDataElement) return;
    this._activeFilterIndex = this._filteredData.findIndex(
      (item) => item.value === activeDataElement.value
    );
  }

  decrementSelectedIndex(e?: KeyboardEvent): void {
    this.preventDefault(e);
    this._selectedIndex--;
    const { data } = this;
    const max = data.length - 1;

    this._selectedIndex = clamp(this._selectedIndex, 0, max);
    if (this._selectedIndex < 0) this._selectedIndex = max;

    if (data[this._selectedIndex].disabled) {
      return this.decrementSelectedIndex();
    }

    this.scrollItemIntoView();
  }

  @HostListener('mousemove')
  onMouseMove() {
    this._trackMouse = true;
  }

  onMouseLeave() {
    this._selectedIndex = DEFAULT_INDEX;
  }

  onKeyDown = (e: KeyboardEvent) => {
    const { key, shiftKey } = e;
    const isTab = key === KEYS.Tab;
    if (isTab && !this.hasSelection) return this.close.emit(true);
    if (this.data.length === 0) return;
    if (keyCheck(key, KEYS.Enter) && !shiftKey) return this.onSelected(e);
    if (keyCheck(key, KEYS.ArrowDown)) return this.incrementSelectedIndex(e);
    if (keyCheck(key, KEYS.ArrowUp)) return this.decrementSelectedIndex(e);

    // For autcomplete don't hide when the backspace is pressed

    this._selectedIndex = this.autoSelectMenuItem ? 0 : DEFAULT_INDEX;

    if (key === KEYS.Escape || isTab) {
      e.stopImmediatePropagation();
      return this.close.emit(true);
    }
  };

  ngOnDestroy(): void {
    this._subscriptions.unsubscribe();
  }
}
