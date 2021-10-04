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
  ViewChild,
  ElementRef,
  Input,
  Output,
  EventEmitter,
  ChangeDetectorRef,
  HostBinding,
} from '@angular/core';

import { MenuWrapperDirective } from '../menu-wrapper/menu-wrapper.directive';
import { OverlayService } from '../overlay/overlay.service';
import { MenuService } from '../menu-wrapper/menu.service';

@Component({
  selector: 'cd-menu-combo-button',
  templateUrl: './menu-combo-button.component.html',
  styleUrls: ['./menu-combo-button.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MenuComboButtonComponent extends MenuWrapperDirective {
  @Input() mainIconName = '';

  @ViewChild('arrow', { read: ElementRef, static: true }) _btnRef!: ElementRef;
  @Output() click = new EventEmitter<void>();

  constructor(
    protected _elemRef: ElementRef,
    protected _overlayService: OverlayService,
    protected _menuService: MenuService,
    protected _cdRef: ChangeDetectorRef
  ) {
    super(_elemRef, _overlayService, _menuService, _cdRef);
  }

  @HostBinding('class.title')
  @Input()
  actionTitle = '';

  handleSubscriptionClose = () => {
    this._btnRef.nativeElement.focus();
    this.active = false;
    this.cleanupComponentRef();
  };

  onClick(_e: MouseEvent) {
    // Capture click event and prevent menu from showing
  }

  onButtonClick(e: MouseEvent) {
    e.preventDefault();
    e.stopImmediatePropagation();
    this.click.emit();
  }

  onArrowClick(e: MouseEvent): void {
    e.preventDefault();
    e.stopImmediatePropagation();
    const target = e.currentTarget as HTMLElement;
    this.active = true;
    target.blur();
    this.createMenu();
  }
}
