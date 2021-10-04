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
  EventEmitter,
  Output,
  ChangeDetectionStrategy,
  HostListener,
  AfterViewInit,
  ViewChild,
  ElementRef,
  ComponentRef,
  OnDestroy,
  HostBinding,
} from '@angular/core';

import * as cd from 'cd-interfaces';
import { SelectComponent } from '../select/select.component';
import { OverlayService } from '../overlay/overlay.service';
import { Subscription } from 'rxjs';
import { assignMenuIndex } from '../input/input.utils';

@Component({
  selector: 'cd-chip',
  templateUrl: './chip.component.html',
  styleUrls: ['./chip.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChipComponent implements AfterViewInit, OnDestroy {
  protected _subscriptions: Subscription = Subscription.EMPTY;
  protected _componentRef?: ComponentRef<SelectComponent>;
  private _data: cd.ISelectItem[] = [];

  @Input()
  set data(data: cd.ISelectItem[]) {
    this._data = assignMenuIndex(data);
  }

  @Input() iconClass?: string;

  @Input() chipTitle?: string;
  @Input() focus = false;

  @Input()
  @HostBinding('class.removeable')
  removeable = true;

  @Input()
  @HostBinding('class.has-swatch')
  swatchColor?: string;

  @Input()
  @HostBinding('class.has-icon')
  iconName?: string;

  @Input()
  @HostBinding('class.active')
  active = false;

  @Output() readonly remove = new EventEmitter<void>();
  @Output() readonly menuSelect = new EventEmitter<cd.ISelectItem>();

  @ViewChild('btnRef', { read: ElementRef, static: true }) _btnRef?: ElementRef;

  get bounds(): DOMRect {
    const { nativeElement } = this._elemRef;
    const bounds = nativeElement.getBoundingClientRect();
    // Ignore the height of the bottom label
    const chip = this._elemRef.nativeElement;
    bounds.height = chip.offsetHeight;
    return bounds;
  }

  constructor(protected _elemRef: ElementRef, protected _overlayService: OverlayService) {}

  ngOnDestroy() {
    this.cleanupComponentRef();
  }

  cleanupComponentRef = () => {
    this._subscriptions.unsubscribe();

    if (this._componentRef) {
      this._overlayService.close();
      this._componentRef.destroy();
      this._componentRef = undefined;
    }
  };

  @HostListener('click')
  onClick() {
    this.createMenu();
  }

  createMenu() {
    if (this._data.length === 0) return;

    const parentRect = this.bounds;
    const config = { parentRect };
    const componentRef = this._overlayService.attachComponent(SelectComponent, config);

    componentRef.instance.width = parentRect.width;
    // componentRef.instance.selectedIndex = this.selectedIndex;
    componentRef.instance.data = this._data;
    // Attach overlay service to main subscription
    this._subscriptions = this._overlayService.closed.subscribe(this.cleanupComponentRef);
    // Component refs manage their own subscriptions
    const subscriptions = new Subscription();
    subscriptions.add(componentRef.instance.selected.subscribe(this.handleSelectionSubscription));
    subscriptions.add(componentRef.instance.close.subscribe(this.cleanupComponentRef));
    componentRef.onDestroy(() => subscriptions.unsubscribe());
    this._componentRef = componentRef;
  }

  handleSelectionSubscription = (index: number) => {
    const item = this._data[index];
    if (!item) return;
    this.menuSelect.emit(item);
  };

  onRemoveChip(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    this.remove.emit();
  }

  ngAfterViewInit(): void {
    if (this.focus && this._btnRef) {
      this._btnRef.nativeElement.focus();
    }
  }
}
