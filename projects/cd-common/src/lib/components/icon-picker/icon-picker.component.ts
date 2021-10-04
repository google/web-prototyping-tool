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
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  ElementRef,
  AfterViewInit,
  OnInit,
  ViewChild,
  OnDestroy,
  NgZone,
  ChangeDetectorRef,
  HostBinding,
} from '@angular/core';
import { Subscription } from 'rxjs';
import { OverlayInitService } from '../overlay/overlay.init.service';
import { MATERIAL_ICONS_CLASS, ScrollBehavior } from 'cd-common/consts';
import { copyToClipboard } from 'cd-utils/clipboard';
import { SearchInputComponent } from '../search-input/search-input.component';
import { convertIconConfigToLookup, isIcon, isMaterialIcon } from 'cd-common/utils';
import { ScrollViewComponent } from '../scroll-view/scroll-view.component';
import { scrollElementIntoViewIfNeeded } from 'cd-utils/dom';
import { IconPickerService } from './icon-picker.service';
import { isString } from 'cd-utils/string';
import { take } from 'rxjs/operators';
import * as cd from 'cd-interfaces';

enum IconTabs {
  Material = 0,
}

@Component({
  selector: 'cd-icon-picker',
  templateUrl: './icon-picker.component.html',
  styleUrls: ['./icon-picker.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IconPickerComponent implements OnInit, AfterViewInit, OnDestroy {
  private _subscriptions = new Subscription();
  private _iconClass = MATERIAL_ICONS_CLASS;
  private _activeIcon?: cd.SelectedIcon = '';
  private _mode: cd.IconPickerMode = cd.IconPickerMode.AllIcons;
  private _iconSizesAllowed?: cd.IconSize[];

  public IconPickerMode = cd.IconPickerMode;
  public IconSize = cd.IconSize;
  public iconSizeFilter: cd.IconSize = cd.IconSize.Small;
  public filter = '';
  public activeTab = IconTabs.Material;
  public activeIconSvgLookup?: string;

  @Input() allowedIconSets?: string[];

  @Input()
  set iconSizesAllowed(sizes: cd.IconSize[] | undefined) {
    this._iconSizesAllowed = sizes;
    this.updateSizeFilterToAllowedSizes();
  }
  get iconSizesAllowed() {
    return this._iconSizesAllowed;
  }

  @Input()
  set activeIcon(icon: cd.SelectedIcon | undefined) {
    this._activeIcon = icon;
    this.activeIconSvgLookup = isIcon(icon) ? convertIconConfigToLookup(icon) : '';
  }
  get activeIcon() {
    return this._activeIcon;
  }

  @Input()
  set mode(value: cd.IconPickerMode | undefined) {
    if (!value) return;
    this._mode = value;
  }
  get mode() {
    return this._mode;
  }

  @Input()
  set iconClass(value: string) {
    if (!value) return;
    this._iconClass = value;
  }
  get iconClass() {
    return this._iconClass;
  }

  @Output() readonly close = new EventEmitter<boolean>();
  @Output() readonly pick = new EventEmitter<cd.SelectedIcon>();

  @ViewChild('overlayRef', { read: ElementRef, static: true }) overlayRef!: ElementRef;

  @ViewChild('scrollViewRef', { read: ScrollViewComponent, static: false })
  _scrollViewRef?: ScrollViewComponent;

  @ViewChild('searchRef', { read: SearchInputComponent, static: false })
  _searchRef?: SearchInputComponent;

  get containerBounds(): DOMRect {
    return this.overlayRef.nativeElement.getBoundingClientRect();
  }

  @HostBinding('class.with-tabs')
  get hasTabs() {
    return this.mode === this.IconPickerMode.AllIcons;
  }

  constructor(
    private _overlayInit: OverlayInitService,
    private _elementRef: ElementRef,
    private _ngZone: NgZone,
    private _cdRef: ChangeDetectorRef,
    public iconPickerService: IconPickerService
  ) {}

  get materialTabActive() {
    return this.activeTab === IconTabs.Material;
  }

  /** Test if the material icon content is showing */
  get showingMaterialIcons(): boolean {
    const { mode } = this;
    const { MaterialOnly, AllIcons } = cd.IconPickerMode;

    if (mode === MaterialOnly) return true;
    if (mode === AllIcons && this.materialTabActive) return true;
    return false;
  }

  get iconSizeSmall() {
    return this.iconSizeFilter === cd.IconSize.Small;
  }

  get iconSizeMedium() {
    return this.iconSizeFilter === cd.IconSize.Medium;
  }

  get iconSizeLarge() {
    return this.iconSizeFilter === cd.IconSize.Large;
  }

  onIconDataLoaded = () => {
    this._cdRef.markForCheck();
    this.scrollToSelectedIcon();
  };

  ngOnInit() {
    this._subscriptions.add(
      this.iconPickerService.iconDataLoaded$.subscribe(this.onIconDataLoaded)
    );

    this.switchToTabOfSelectedIcon();
    this.switchToSizeOfSelectedIcon();
    this._cdRef.markForCheck();
  }

  ngOnDestroy(): void {
    this._subscriptions.unsubscribe();
  }

  onFilter(value: string | undefined) {
    this.filter = value || '';
  }

  ngAfterViewInit() {
    this._overlayInit.componentLoaded();
    this.scrollToSelectedOnStable(false);
  }

  iconTrackFn(_index: number, item: cd.IIcon) {
    return item.id;
  }

  cloudIconsetTrackFn(_index: number, iconset: cd.IIconset) {
    return `${iconset.name}-${iconset.size}`;
  }

  cloudIconTrackFn(_index: number, icon: cd.IProcessedIcon) {
    return icon.svgLookup;
  }

  updateSelectedIcon(icon: cd.SelectedIcon) {
    this.pick.emit(icon);
    this.activeIcon = icon;
    const iconName = isString(icon) ? icon : (icon as cd.IIconsetIconConfig).name;
    copyToClipboard(iconName); // copy to clipboard for editing
  }

  selectIcon(iconId: string): void {
    this.updateSelectedIcon(iconId);
  }

  selectIconsetLibraryIcon(config: cd.IIconsetIconConfig) {
    this.updateSelectedIcon(config);
  }

  onFilterIconClick() {
    this._searchRef?.inputRef?.nativeElement.focus();
  }

  onFooterIconNameClick() {
    this.filter = ''; // clear filter to ensure selected icon is not filter out
    this.scrollToSelectedIcon();
  }

  filterToIconSize(iconSize: cd.IconSize) {
    this.iconSizeFilter = iconSize;
    this._scrollViewRef?.scrollToTop();
  }

  onTabChange(tabIndex: number) {
    this.activeTab = tabIndex;
    this._scrollViewRef?.scrollToTop();
  }

  scrollToSelectedIcon() {
    this.switchToTabOfSelectedIcon();
    this.switchToSizeOfSelectedIcon();
    this._cdRef.markForCheck();
    this.scrollToSelectedOnStable();
  }

  /**
   * Switch to tab of selected icon
   * only needed if icon picker mode is set to AllIcons
   */
  switchToTabOfSelectedIcon() {
    const { activeIcon, mode } = this;
    if (!activeIcon || mode !== cd.IconPickerMode.AllIcons) return;

    // const matIcon = isMaterialIcon(activeIcon);
    this.activeTab = IconTabs.Material;
  }

  switchToSizeOfSelectedIcon() {
    const { activeIcon } = this;
    if (!activeIcon || isMaterialIcon(activeIcon)) return;
    this.iconSizeFilter = (activeIcon as cd.IIconsetIconConfig).size;
  }

  /**
   * This is the ugly Angular way of waiting until the view has finished rendering.
   * This function waits until the view has finished rendering before attempting to scroll
   * the current active icon into view
   */
  scrollToSelectedOnStable = (animated = true) => {
    const stable$ = this._ngZone.onStable.asObservable().pipe(take(1));
    this._subscriptions.add(stable$.subscribe(() => this.scrollToSelected(animated)));
  };

  scrollToSelected(animated = true) {
    const { activeIcon } = this;
    if (!activeIcon) return;
    const val = isMaterialIcon(activeIcon) ? activeIcon : convertIconConfigToLookup(activeIcon);
    const selector = `[data-icon="${val}"`;
    const element = this._elementRef.nativeElement.querySelector(selector);
    if (!element) return;
    if (!animated) return scrollElementIntoViewIfNeeded(element);
    requestAnimationFrame(() => {
      element.scrollIntoView({ behavior: ScrollBehavior.Smooth, block: 'center' });
    });
  }

  /** Ensure that the currently chosen iconSizeFilter is within allowed sizes */
  private updateSizeFilterToAllowedSizes() {
    const { iconSizesAllowed, iconSizeFilter } = this;
    if (!iconSizesAllowed?.length || iconSizesAllowed.includes(iconSizeFilter)) return;
    this.iconSizeFilter = iconSizesAllowed[0];
    this._cdRef.markForCheck();
  }
}
