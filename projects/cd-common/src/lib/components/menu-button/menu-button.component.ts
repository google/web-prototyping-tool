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
  ElementRef,
  ChangeDetectionStrategy,
  ViewChild,
  ChangeDetectorRef,
  HostBinding,
} from '@angular/core';
import { ComponentSize } from 'cd-interfaces';
import { OverlayService } from '../overlay/overlay.service';
import { MenuService } from '../menu-wrapper/menu.service';
import { MenuWrapperDirective } from '../menu-wrapper/menu-wrapper.directive';

@Component({
  selector: 'cd-menu-button',
  templateUrl: './menu-button.component.html',
  styleUrls: ['./menu-button.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [OverlayService],
})
export class MenuButtonComponent extends MenuWrapperDirective {
  @Input() size: ComponentSize = ComponentSize.Small;
  @Input() iconName = 'more_vert'; // Default material icon
  @Input() iconSize: ComponentSize = ComponentSize.Small;
  @Input() disabled = false;
  @Input() highlight = false;
  @Input() ariaLabel = '';

  @HostBinding('class.square')
  @Input()
  square = false;

  @ViewChild('btnRef', { read: ElementRef, static: true })
  _btnRef!: ElementRef;

  handleSubscriptionClose = () => {
    this._btnRef.nativeElement.focus();
    this.active = false;
    this.cleanupComponentRef();
  };

  constructor(
    protected _elemRef: ElementRef,
    protected _overlayService: OverlayService,
    protected _menuService: MenuService,
    protected _cdRef: ChangeDetectorRef
  ) {
    super(_elemRef, _overlayService, _menuService, _cdRef);
  }

  open() {
    this.createMenu();
    this.active = true;
    this._cdRef.markForCheck();
  }

  onClick(e: MouseEvent): void {
    e.preventDefault();
    e.stopImmediatePropagation();
    if (this.disabled) return;

    const target = e.currentTarget as HTMLElement;
    this.active = true;
    target.blur();
    this.createMenu();
  }
}
