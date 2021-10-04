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
  Directive,
  Input,
  ElementRef,
  Output,
  EventEmitter,
  OnDestroy,
  ChangeDetectorRef,
  HostBinding,
  ComponentRef,
  HostListener,
} from '@angular/core';
import { OverlayService } from '../overlay/overlay.service';
import { MenuComponent } from '../menu/menu.component';
import { IMenuConfig, ComponentSize } from 'cd-interfaces';
import { Subscription } from 'rxjs';
import { MenuService } from './menu.service';

@Directive({
  selector: '[cdMenuWrapper]',
})
export class MenuWrapperDirective implements OnDestroy {
  private _componentRef?: ComponentRef<MenuComponent>;
  @Input() data: IMenuConfig[] | IMenuConfig[][] = [];
  @Input() size: ComponentSize = ComponentSize.Medium;
  @Input() menuSize?: ComponentSize;
  @Input() menuWidth?: number;
  @Output() selected = new EventEmitter<IMenuConfig>();

  @Input()
  @HostBinding('class.select')
  select = false;

  @HostBinding('class.active')
  get active() {
    return this._menuService.visible;
  }

  set active(visible: boolean) {
    this._menuService.visible = visible;
  }

  constructor(
    protected _elemRef: ElementRef,
    protected _overlayService: OverlayService,
    protected _menuService: MenuService,
    protected _cdRef: ChangeDetectorRef
  ) {}

  get bounds(): DOMRect {
    return this._elemRef.nativeElement.getBoundingClientRect();
  }

  createMenu(): void {
    const { data, bounds, menuSize } = this;
    if (!data.length) return;
    const config = { parentRect: bounds };
    const componentRef = this._overlayService.attachComponent(MenuComponent, config);
    const subscriptions = new Subscription();
    componentRef.instance.data = data;
    componentRef.instance.size = menuSize;
    this.select = true;
    subscriptions.add(componentRef.instance.close.subscribe(this.handleSubscriptionClose));
    subscriptions.add(componentRef.instance.selected.subscribe(this.handleSelectSubscription));
    subscriptions.add(this._overlayService.closed.subscribe(this.handleSubscriptionClose));
    componentRef.onDestroy(() => {
      subscriptions.unsubscribe();
      this.active = false;
      this.select = false;
      this._cdRef.markForCheck();
    });
    this._componentRef = componentRef;
  }

  handleSubscriptionClose = () => {
    this.cleanupComponentRef();
  };

  handleSelectSubscription = (item: IMenuConfig) => {
    this.selected.emit(item);
    this.cleanupComponentRef();
  };

  @HostListener('click', ['$event'])
  onClick(e: MouseEvent): void {
    const target = e.currentTarget as HTMLElement;
    target.blur();
    this.createMenu();
  }

  cleanupComponentRef = () => {
    this.active = false;
    this.select = false;
    this._cdRef.markForCheck();
    if (this._componentRef) {
      this._overlayService.close();
      this._componentRef = undefined;
    }
  };

  ngOnDestroy(): void {
    this.cleanupComponentRef();
  }
}
