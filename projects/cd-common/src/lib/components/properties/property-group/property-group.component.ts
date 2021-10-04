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
  Output,
  EventEmitter,
  HostBinding,
  ElementRef,
  ViewChild,
  ChangeDetectorRef,
  AfterViewInit,
  OnDestroy,
} from '@angular/core';
import { coerceBooleanProperty } from '@angular/cdk/coercion';
import { applyDefaultUnits } from 'cd-common/utils';
import * as consts from 'cd-common/consts';

@Component({
  selector: 'cd-property-group',
  templateUrl: './property-group.component.html',
  styleUrls: ['./property-group.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PropertyGroupComponent implements AfterViewInit, OnDestroy {
  private _type?: consts.PropertyGroupType;
  private _collapsing = false;
  private _collapsed = false;
  private _enabled = true;
  private _init = false;
  private _removePadding = false;
  private _contentAnimation?: Animation;

  public GroupType = consts.PropertyGroupType;
  public height = 0;
  public animating = false;

  @Input() addTooltip = 'Add';
  @Input() disable = false;
  @Input() groupTitle?: string;
  @Input()
  set type(value: consts.PropertyGroupType | undefined) {
    this.list = value === consts.PropertyGroupType.Add;
    this._type = value;
    this._collapsable = value === consts.PropertyGroupType.Collapse;
  }
  get type(): consts.PropertyGroupType | undefined {
    return this._type;
  }

  @Input()
  @HostBinding('class.remove-padding')
  set removePadding(value) {
    this._removePadding = coerceBooleanProperty(value);
  }
  get removePadding() {
    return this._removePadding;
  }

  @Input()
  set enabled(enabled) {
    this._enabled = coerceBooleanProperty(enabled);
    this.collapsed = !this._enabled;
  }
  get enabled() {
    return this._enabled;
  }

  @Input()
  set collapsed(collapsed: boolean) {
    this._collapsed = coerceBooleanProperty(collapsed);
  }
  get collapsed() {
    return this._init && this._collapsed;
  }

  @HostBinding('class.show-header')
  get hasHeader() {
    return !!this.groupTitle;
  }

  @HostBinding('class.list') list = false;

  @HostBinding('class.collapsable') _collapsable = false;
  @HostBinding('class.top-divider') _topDivider = false;
  @HostBinding('class.bottom-divider') _bottomDivider = false;
  @HostBinding('class.short-divider') _shortDivider = false;
  @HostBinding('class.no-padding') _noSidePadding = false;
  @HostBinding('class.no-bottom-padding') _noBottomPadding = false;
  @HostBinding('class.sub-header') _subHeader = false;

  @Input()
  set topDivider(value: boolean) {
    this._topDivider = coerceBooleanProperty(value);
  }

  @Input()
  set bottomDivider(value: boolean) {
    this._bottomDivider = coerceBooleanProperty(value);
  }

  @Input()
  set shortDivider(value: boolean) {
    this._shortDivider = coerceBooleanProperty(value);
  }

  @Input()
  set noSidePadding(value: boolean) {
    this._noSidePadding = coerceBooleanProperty(value);
  }

  @Input()
  set noBottomPadding(value: boolean) {
    this._noBottomPadding = coerceBooleanProperty(value);
  }

  @Input()
  set subHeader(value: boolean) {
    this._subHeader = coerceBooleanProperty(value);
  }

  @Input()
  groupHelpTooltip = '';

  @Output() readonly collapse = new EventEmitter<void>();
  @Output() readonly add = new EventEmitter<void>();
  @Output() readonly delete = new EventEmitter<void>();
  @Output() readonly disabled = new EventEmitter<boolean>();

  @ViewChild('contentWrapper', { read: ElementRef, static: true }) _contentWrapper!: ElementRef;
  @ViewChild('content', { read: ElementRef, static: true }) _content!: ElementRef;

  get contentWrapper() {
    return this._contentWrapper.nativeElement;
  }

  get contentCollapsed(): boolean {
    const { _init, _collapsed, _collapsing, animating } = this;
    return _init === true && _collapsed && _collapsing === false && animating === false;
  }

  constructor(private _cdRef: ChangeDetectorRef) {}

  get collapsable() {
    return (
      this.type === consts.PropertyGroupType.Collapse ||
      this.type === consts.PropertyGroupType.ToggleSwitch
    );
  }

  animateContentHeight(from: number, to: number) {
    const content = this._content.nativeElement;
    const transition = [{ height: applyDefaultUnits(from) }, { height: applyDefaultUnits(to) }];
    const config = { duration: 150, easing: 'ease-in-out' };
    this.cancelAnimation();
    const animation = content.animate(transition, config);
    this.animating = true;
    animation.addEventListener('finish', this.animationFinish);
    this._contentAnimation = animation;
  }

  cancelAnimation() {
    this._contentAnimation?.cancel();
    this._contentAnimation?.removeEventListener('finish', this.animationFinish);
  }

  ngOnDestroy(): void {
    this.cancelAnimation();
  }

  animationFinish = () => {
    this.animating = false;
    this._collapsing = false;
    this._cdRef.markForCheck();
  };

  onCollapseClick() {
    this.collapsePanel(!this._collapsed);
  }

  collapsePanel(collapsed: boolean) {
    if (this._collapsed === collapsed) return;
    this._collapsed = collapsed;
    this._collapsing = true;
    this._cdRef.detectChanges();
    const { height } = this.contentWrapper.getBoundingClientRect();
    const { _collapsed } = this;
    const to = _collapsed ? 0 : height;
    const from = _collapsed ? height : 0;
    this.animateContentHeight(from, to);
  }

  onSwitchToggle(on: boolean) {
    this.onCollapseClick();
    this.enabled = on;
    this.disabled.emit(!on);
  }

  onAddClick() {
    this.add.emit();
  }

  onDeleteClick() {
    this.delete.emit();
  }

  ngAfterViewInit(): void {
    this._init = true;
    if (this._collapsed) {
      this._cdRef.detectChanges();
    } else {
      this._cdRef.markForCheck();
    }
  }

  onTitleClick() {
    const { type } = this;
    // prettier-ignore
    switch (type) {
      case consts.PropertyGroupType.ToggleSwitch: return this.onSwitchToggle(!this.enabled);
      case consts.PropertyGroupType.Collapse: return this.onCollapseClick();
      case consts.PropertyGroupType.Delete: return this.onDeleteClick();
      case consts.PropertyGroupType.Add: {
        if (this.disable) return;
        return this.onAddClick();
      }
    }
  }
}
