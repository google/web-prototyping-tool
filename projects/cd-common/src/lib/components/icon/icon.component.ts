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
  HostBinding,
  ChangeDetectionStrategy,
  ElementRef,
  ViewChild,
  OnDestroy,
  AfterViewInit,
} from '@angular/core';

import { ComponentSize, SelectedIcon } from 'cd-interfaces';
import { Subscription } from 'rxjs';
import { AUTO_VALUE } from 'cd-common/consts';
import { ICON_DIMENSIONS, SVG_SUFFIX } from './icon.utils';
import { IconService } from './icon.service';
import { isString } from 'cd-utils/string';

@Component({
  selector: 'cd-icon',
  templateUrl: './icon.component.html',
  styleUrls: ['./icon.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IconComponent implements OnDestroy, AfterViewInit {
  public iconSize: number | string = AUTO_VALUE;
  public fontSizePercent = 100;
  private _iconClass?: string;
  private _svgUrl?: string;
  private _name?: SelectedIcon;
  private _scale = 1;
  private _subscription = Subscription.EMPTY;
  private _init = false;

  @Input() size: ComponentSize = ComponentSize.Medium;

  @HostBinding('class.auto')
  get autoSize() {
    return this.size === ComponentSize.Auto;
  }

  @HostBinding('class.small')
  get smallSize() {
    return this.size === ComponentSize.Small;
  }

  @HostBinding('class.medium')
  get mediumSize() {
    return this.size === ComponentSize.Medium;
  }

  @HostBinding('class.large')
  get largeSize() {
    return this.size === ComponentSize.Large;
  }

  get scale(): number {
    return this._scale;
  }

  @Input()
  set scale(value: number) {
    this._scale = value;
    this.iconSize = ICON_DIMENSIONS[this.size] * value;
    this.fontSizePercent = value * 100;
  }

  @Input()
  set iconClass(value) {
    this._iconClass = value;
  }
  get iconClass() {
    return this._iconClass || 'google-material-icons';
  }

  get svgUrl(): string | undefined {
    return this._svgUrl;
  }

  set svgUrl(value: string | undefined) {
    this._svgUrl = value;
    if (value) this.loadSVGImage(value);
  }

  @Input()
  get name(): SelectedIcon | undefined {
    return this._name;
  }

  set name(value: SelectedIcon | undefined) {
    const svgIcon = isString(value) && value?.includes(SVG_SUFFIX);

    if (svgIcon) {
      this.svgUrl = value as string;
      this._name = '';
    } else {
      if (this._svgUrl) {
        this.resetSVGElement();
      }
      this._name = value;
    }
  }

  @ViewChild('contentRef', { read: ElementRef, static: true }) _contentRef?: ElementRef;

  constructor(public _elementRef: ElementRef, private _iconService: IconService) {}

  resetSVGElement() {
    this._svgUrl = '';
    const { contentElement } = this;
    if (!contentElement) return;
    contentElement.innerHTML = '';
  }

  get contentElement() {
    return this._contentRef?.nativeElement;
  }

  addSVGImage = (svg: HTMLOrSVGElement) => {
    const { contentElement } = this;
    const clone = (svg as HTMLElement).cloneNode(true);
    contentElement.innerHTML = '';
    contentElement.appendChild(clone);
  };

  ngOnDestroy(): void {
    this._subscription.unsubscribe();
  }

  ngAfterViewInit(): void {
    this._init = true;
    if (this._svgUrl) {
      this.loadSVGImage(this._svgUrl);
    }
  }

  loadSVGImage(svgUrl: string) {
    if (!svgUrl || this._init === false) return;
    this._subscription = this._iconService
      .getImageForUrl(svgUrl, this.size)
      .subscribe(this.addSVGImage);
  }
}
