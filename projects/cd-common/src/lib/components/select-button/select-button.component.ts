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
  ElementRef,
  ChangeDetectorRef,
  OnDestroy,
  HostBinding,
  ComponentRef,
  ViewChild,
  Output,
  EventEmitter,
} from '@angular/core';
import { ComponentSize, ISelectItem } from 'cd-interfaces';
import { OverlayService } from '../overlay/overlay.service';
import { Subscription } from 'rxjs';
import { SelectComponent } from '../select/select.component';
import { assignMenuIndex } from '../input/input.utils';
import { injectResetState } from '../input/select-input/select-input.utils';

const MIN_WIDTH = 150;

@Component({
  selector: 'cd-select-button',
  templateUrl: './select-button.component.html',
  styleUrls: ['./select-button.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectButtonComponent implements OnDestroy {
  private _subscriptions: Subscription = Subscription.EMPTY;
  private _componentRef?: ComponentRef<SelectComponent>;
  private _menuData: ISelectItem[] = [];
  private _active = false;

  @Input() resetState?: string;
  @Input() size: ComponentSize = ComponentSize.Small;
  @Input() iconSize: ComponentSize = ComponentSize.Small;
  @Input() data: ISelectItem[] = [];
  @Input() iconName = 'add'; // Default material icon
  @Input() disabled = false;
  @Input() highlight = false;
  @Input() ariaLabel = '';

  @Output() selected = new EventEmitter<ISelectItem>();

  @HostBinding('class.active')
  set active(active: boolean) {
    this._active = active;
  }
  get active() {
    return this._active;
  }

  @ViewChild('btnRef', { read: ElementRef, static: true })
  _btnRef!: ElementRef;

  constructor(
    protected _elemRef: ElementRef,
    protected _overlayService: OverlayService,
    protected _cdRef: ChangeDetectorRef
  ) {}

  get bounds(): DOMRect {
    return this._elemRef.nativeElement.getBoundingClientRect();
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

  createMenu(): void {
    const { data } = this;
    if (!data.length) return;
    const config = { parentRect: this.bounds };
    const componentRef = this._overlayService.attachComponent(SelectComponent, config);
    const menuData = assignMenuIndex(injectResetState(this.data, this.resetState));
    componentRef.instance.data = menuData;
    componentRef.instance.showFilter = true;
    componentRef.instance.width = MIN_WIDTH;
    this._subscriptions = this._overlayService.closed.subscribe(this.handleCloseSubscription);
    // Component refs manage their own subscriptions
    const subscriptions = new Subscription();
    subscriptions.add(componentRef.instance.selected.subscribe(this.handleSelectionSubscription));
    subscriptions.add(componentRef.instance.close.subscribe(this.handleCloseSubscription));
    componentRef.onDestroy(() => subscriptions.unsubscribe());
    this._componentRef = componentRef;
    this._menuData = menuData;
  }

  handleCloseSubscription = (_focus: boolean) => {
    this.cleanupComponentRef();
  };

  handleSelectionSubscription = (index: number) => {
    const item = this._menuData[index];
    if (!item) return;
    this.selected.emit(item);
  };

  cleanupComponentRef = () => {
    this.active = false;
    this._cdRef.markForCheck();
    if (this._componentRef) {
      this._overlayService.close();
      this._componentRef = undefined;
    }
  };

  ngOnDestroy(): void {
    this.cleanupComponentRef();
    this._subscriptions.unsubscribe();
  }
}
