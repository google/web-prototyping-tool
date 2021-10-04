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
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
  OnInit,
  AfterViewInit,
  ViewChild,
  ElementRef,
  ChangeDetectorRef,
} from '@angular/core';

import { KEYS, keyCheck } from 'cd-utils/keycodes';
import { itemFromPos, flattenWithDividers } from './menu.utils';
import { MenuConfigList, IMenuConfig, ComponentSize } from 'cd-interfaces';
import { OverlayInitService } from '../overlay/overlay.init.service';
import { Subscription, fromEvent } from 'rxjs';

@Component({
  selector: 'cd-menu',
  template: `
    <ul
      #menuRef
      cd-menu-group
      [data]="data"
      [size]="size"
      [hover]="hover"
      (hovering)="onHover($event)"
      (mouseleave)="onLeave()"
      (contextmenu)="onContextMenu($event)"
      (clicked)="onSelected($event)"
    ></ul>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MenuComponent implements OnInit, OnDestroy, AfterViewInit {
  private _subscriptions = new Subscription();
  private _data: IMenuConfig[] = [];
  public hover: number[] = [];

  @Input() size?: ComponentSize;

  @Input()
  set data(dataEntry: MenuConfigList) {
    this._data = flattenWithDividers(dataEntry);
  }
  get data() {
    return this._data;
  }

  @ViewChild('menuRef', { read: ElementRef, static: true }) menuRef!: ElementRef;

  @Output() readonly selected = new EventEmitter<IMenuConfig>();
  @Output() readonly close = new EventEmitter<boolean>();

  constructor(private _overlayInit: OverlayInitService, private _cdRef: ChangeDetectorRef) {}

  ngOnDestroy(): void {
    this._subscriptions.unsubscribe();
  }

  ngOnInit() {
    this._subscriptions.add(
      fromEvent<KeyboardEvent>(window, 'keydown', { capture: true }).subscribe(this.onKeydown)
    );
  }

  ngAfterViewInit() {
    this._overlayInit.componentLoaded();
  }

  updatedPos(pos: number, hover: number[]): number[] {
    const update = [...hover];
    update[update.length - 1] = pos;
    return update;
  }

  incrementPosition(pos: number, length: number, hover: number[]): number[] {
    if (!hover.length) {
      hover = [length];
    }

    pos++;
    pos %= length;

    const update = this.updatedPos(pos, hover);

    const [nextItem] = itemFromPos(update, this._data);
    if (nextItem && nextItem.disabled) {
      return this.incrementPosition(pos, length, update);
    }

    return update;
  }

  decrementPosition(pos: number, length: number, hover: number[]): number[] {
    if (!hover.length) {
      hover = [length - 1];
    }

    pos--;

    if (pos < 0) {
      pos = length - 1;
    }

    const update = this.updatedPos(pos, hover);
    const [nextItem] = itemFromPos(update, this._data);

    if (nextItem && nextItem.disabled) {
      return this.decrementPosition(pos, length, update);
    }

    return update;
  }

  preventBehavior(e: KeyboardEvent) {
    e.preventDefault();
    e.stopPropagation();
  }

  onKeydown = (e: KeyboardEvent) => {
    const { key } = e;
    const { hover, _data } = this;
    const pos = hover.length ? hover[hover.length - 1] : -1;
    const [item, length] = itemFromPos(hover, _data);

    if (keyCheck(key, KEYS.Enter)) return this.onSelected(item);
    if (keyCheck(key, KEYS.Escape, KEYS.Backspace)) return this.closeMenu();

    if (keyCheck(key, KEYS.Tab)) {
      this.preventBehavior(e);
    } else if (keyCheck(key, KEYS.ArrowDown)) {
      this.preventBehavior(e);
      this.hover = this.incrementPosition(pos, length, hover);
    } else if (keyCheck(key, KEYS.ArrowUp)) {
      this.preventBehavior(e);
      this.hover = this.decrementPosition(pos, length, hover);
    } else if (keyCheck(key, KEYS.ArrowRight)) {
      this.preventBehavior(e);
      if (item?.children) {
        this.hover = [...this.hover, 0];
      }
    } else if (keyCheck(key, KEYS.ArrowLeft)) {
      this.preventBehavior(e);
      if (this.hover.length > 1) {
        this.hover = hover.slice(0, -1);
      }
    }

    this._cdRef.markForCheck();
  };

  onLeave(): void {
    this.hover = this.hover.slice(0, -1);
  }

  onHover(hover: number[]) {
    this.hover = hover;
  }

  closeMenu = () => {
    this.hover = [];
    this.close.emit();
  };

  onSelected(item: IMenuConfig | null) {
    if (!item) return;
    if (item.children) return;
    if (item.disabled) return;
    this.selected.emit(item);
    this.closeMenu();
  }

  onContextMenu(e: MouseEvent) {
    e.preventDefault();
  }
}
