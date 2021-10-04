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
  Output,
  HostBinding,
  ElementRef,
  ChangeDetectorRef,
} from '@angular/core';

import { parseShortcut } from 'cd-utils/keycodes';
import { IMenuConfig, ComponentSize } from 'cd-interfaces';

@Component({
  selector: 'ul[cd-menu-group]',
  templateUrl: './menu-group.component.html',
  styleUrls: ['./menu-group.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MenuGroupComponent {
  private _hidden = true;

  @Input() itemHeight?: number;

  @HostBinding('class.bottom-edge') bottomEdge = false;
  @HostBinding('class.right-edge') rightEdge = false;

  @HostBinding('class.hidden')
  @Input()
  set hidden(hidden) {
    if (hidden !== this._hidden) {
      this._hidden = hidden;
      this.updatePosition();
    }
  }
  get hidden() {
    return this._hidden;
  }

  @Input()
  @HostBinding('class.init')
  init = false;

  @Input() idx: number[] = [];
  @Input() data: IMenuConfig[] = [];
  @Input() hover: number[] = [];
  @Input() size?: ComponentSize;

  @Input()
  @HostBinding('style.zIndex')
  get zIndex() {
    return this.idx.length;
  }

  @Output() readonly clicked = new EventEmitter<IMenuConfig>();
  @Output() readonly hovering = new EventEmitter<number[]>();

  constructor(protected _elemRef: ElementRef, private _cdRef: ChangeDetectorRef) {}

  get elemRect(): DOMRect {
    return this._elemRef.nativeElement.getBoundingClientRect();
  }

  updatePosition() {
    const { innerWidth, innerHeight } = window;
    const { bottom, right } = this.elemRect;
    this.bottomEdge = bottom >= innerHeight;
    this.rightEdge = right >= innerWidth;
    this._cdRef.markForCheck();
  }

  onChildOver(args: number[]): void {
    this.hovering.emit(args);
  }

  onOver(e: MouseEvent, i: number): void {
    const itemMapping = this.getMapping(i);
    this.hovering.emit(itemMapping);
    e.preventDefault();
    e.stopPropagation();
  }

  onChildClicked(item: IMenuConfig): void {
    this.clicked.emit(item);
  }

  onClick(e: MouseEvent, item: IMenuConfig): void {
    this.clicked.emit(item);
    e.preventDefault();
    e.stopPropagation();
  }

  // TODO: allow selection on right click but currently breaks e2e
  // onRightClick(e: MouseEvent, item: IMenuConfig): void {
  //   if (e.button === 2) {
  //     this.clicked.emit(item);
  //     e.stopImmediatePropagation();
  //   }
  // }

  getShortcut({ shortcut }: IMenuConfig): string {
    return shortcut ? parseShortcut(shortcut) : '';
  }

  getMapping(i: number): number[] {
    return [...this.idx, i];
  }

  trackFn(i: number): string {
    return this.getMapping(i).toString();
  }

  isHovering(i: number): boolean {
    const { hover } = this;
    const itemMap = this.getMapping(i);
    const idxLen = itemMap.length - 1;
    return itemMap[idxLen] === hover[idxLen];
  }
}
