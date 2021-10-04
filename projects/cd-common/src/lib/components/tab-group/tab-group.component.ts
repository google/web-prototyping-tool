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
  AfterContentInit,
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ContentChildren,
  ElementRef,
  EventEmitter,
  HostBinding,
  Input,
  Output,
  QueryList,
  ViewChild,
  ViewChildren,
} from '@angular/core';
import { coerceBooleanProperty } from '@angular/cdk/coercion';
import { KEYS, keyCheck } from 'cd-utils/keycodes';
import { TabComponent } from './tab.component';
import { translate } from 'cd-utils/css';
import { ObjectPosition } from 'cd-interfaces';
import { closestChildIndexForEvent } from 'cd-common/utils';
import { LIST_ITEM_TAG } from 'cd-common/consts';

@Component({
  selector: 'cd-tab-group',
  templateUrl: './tab-group.component.html',
  styleUrls: ['./tab-group.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TabGroupComponent implements AfterContentInit, AfterViewInit {
  private _activeTabIndex = 0;
  public inkBarHasInitialized = false;
  public maxTabWidth?: number;
  private _init = false;

  @HostBinding('class.fixed') _fixed = false;
  @HostBinding('class.small') _small = false;
  @HostBinding('class.large') _large = false;
  @HostBinding('class.center') _center = false;
  @HostBinding('class.full-height') _fullHeight = false;

  @Input() offsetScrollbar = false;

  @Input()
  set small(value: string | boolean) {
    this._small = coerceBooleanProperty(value);
  }

  @Input()
  set fullHeight(value: string | boolean) {
    this._fullHeight = coerceBooleanProperty(value);
  }

  @Input()
  set fixed(value: string | boolean) {
    this._fixed = coerceBooleanProperty(value);
  }

  @Input()
  set center(value) {
    this._center = coerceBooleanProperty(value);
  }
  get center() {
    return this._center;
  }

  @Input()
  get large() {
    return this._large;
  }
  set large(value) {
    this._large = coerceBooleanProperty(value);
  }

  @Input()
  set activeTabIndex(index: number) {
    const idxNumber = Number(index);
    if (this._activeTabIndex === idxNumber) return;
    if (!this._init) {
      this._activeTabIndex = idxNumber;
      return;
    }
    this.updateActiveTab(idxNumber);
  }
  get activeTabIndex() {
    return this._activeTabIndex;
  }

  @ContentChildren(TabComponent) _tabContents?: QueryList<TabComponent>;
  @ViewChildren('tabLabel') _tabLabels?: QueryList<ElementRef>;
  @ViewChild('inkBar') _inkBar!: ElementRef;

  @Output() tabChange = new EventEmitter<number>();

  constructor(protected _cdRef: ChangeDetectorRef) {}

  get inkBarStyle() {
    return this._inkBar.nativeElement.style;
  }

  get tabLabels() {
    return this._tabLabels?.toArray() || [];
  }

  get tabContents() {
    return this._tabContents?.toArray() || [];
  }

  ngAfterContentInit(): void {
    this._init = true;
    this.updateActiveTab(this._activeTabIndex);
  }

  ngAfterViewInit() {
    this._setInkBar(this._activeTabIndex, this._activeTabIndex);
    this.inkBarHasInitialized = true;
  }

  private _setInkBar(fromIdx: number, toIdx: number) {
    const activeTabLabel = this.tabLabels[toIdx]?.nativeElement;

    if (!activeTabLabel) return;
    activeTabLabel.blur();
    requestAnimationFrame(() => {
      const [firstChild] = activeTabLabel.children;
      const { left: childLeft, width: childWidth } = firstChild.getBoundingClientRect();
      const { left: parentLeft } = activeTabLabel.parentElement.getBoundingClientRect();
      const x = Math.round(childLeft - parentLeft);
      const width = Math.round(childWidth);
      const position = fromIdx > toIdx ? ObjectPosition.Right : ObjectPosition.Left;
      const resizeOrigin = `${ObjectPosition.Center} ${position}`;
      this.setInkbarStyles(x, width, resizeOrigin);
    });
  }

  setInkbarStyles(x: number, width: number, resizeOrigin: string) {
    this.inkBarStyle.transform = translate(x, 0);
    this.inkBarStyle.transformOrigin = resizeOrigin;
    this.inkBarStyle.width = `${width}px`;
  }

  updateActiveTab(index: number) {
    if (!this._init) return;
    const { tabContents, _activeTabIndex } = this;
    const activeTab = tabContents[_activeTabIndex];
    activeTab.active = false;
    const tabToActivate = tabContents[index];
    tabToActivate.active = true;
    this._setInkBar(_activeTabIndex, index);
    this._activeTabIndex = index;
    this._cdRef.detectChanges();
  }

  onTabClick(e: MouseEvent | KeyboardEvent) {
    const index = closestChildIndexForEvent(e, LIST_ITEM_TAG);
    if (index === -1 || this.activeTabIndex === index) return;
    this.updateActiveTab(index);
    this.tabChange.emit(index);
  }

  onTabKeydown(e: KeyboardEvent) {
    const { key } = e;
    if (keyCheck(key, KEYS.Enter)) {
      this.onTabClick(e);
    }
  }
}
