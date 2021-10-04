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
  ChangeDetectorRef,
  ComponentRef,
  Directive,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
} from '@angular/core';
import { OverlayService } from 'cd-common';
import { Subscription } from 'rxjs';
import { UserListOverlayComponent } from './user-list-overlay.component';
import { UserListComponent } from './user-list.component';
import * as cd from 'cd-interfaces';

@Directive({ selector: '[appUserPicker]' })
export class UserPickerDirective implements OnDestroy {
  private _componentRef?: ComponentRef<UserListOverlayComponent>;
  private _searchValue = '';

  @Input() ownerEmail = '';
  @Input() excludedUsers: string[] = [];
  @Input() showSearch = false;
  @Input() set searchValue(value: string) {
    this._searchValue = value;
    if (!this._componentRef) return;
    this._componentRef.instance.searchValue = value;
  }

  @Output() closePicker = new EventEmitter<void>();
  @Output() selectedUser = new EventEmitter<cd.PartialUser>();

  get element(): HTMLElement {
    return this._elemRef.nativeElement;
  }

  get bounds(): DOMRect {
    return this.element.getBoundingClientRect();
  }

  get active(): boolean {
    return this._componentRef !== undefined;
  }

  constructor(
    private _elemRef: ElementRef,
    private _overlayService: OverlayService,
    private _cdRef: ChangeDetectorRef
  ) {}

  cleanupComponentRef() {
    if (!this._componentRef) return;
    this._overlayService.close();
    this._componentRef = undefined;
  }

  ngOnDestroy() {
    this.cleanupComponentRef();
  }

  onSelectedUser = (user: cd.PartialUser) => {
    this.selectedUser.emit(user);
  };

  close() {
    this.cleanupComponentRef();
  }

  createPicker() {
    const { top, left: x, height } = this.bounds;
    const y = top + height;
    const subscription = new Subscription();
    const componentRef = this._overlayService.attachComponent(UserListOverlayComponent, { x, y });
    const { instance } = componentRef;
    instance.excludedUsers = this.excludedUsers;
    instance.ownerEmail = this.ownerEmail;
    instance.showSearch = this.showSearch;
    instance.searchValue = this._searchValue;
    subscription.add(instance.selectedUser.subscribe(this.onSelectedUser));
    this._componentRef = componentRef;
    componentRef.onDestroy(() => {
      subscription.unsubscribe();
      this.closePicker.emit();
      this._componentRef = undefined;
      this._cdRef.markForCheck();
    });
  }

  get instance(): UserListOverlayComponent | undefined {
    return this._componentRef?.instance;
  }

  get userList(): UserListComponent | undefined {
    return this.instance?.userList;
  }

  get triggerBottom() {
    const triggerBounds = this.bounds;
    return triggerBounds.top + triggerBounds.height;
  }

  selectActiveIndex() {
    this.userList?.onSelectActiveIndex();
  }

  nextIndex() {
    this.userList?.nextIndex();
  }

  prevIndex() {
    this.userList?.prevIndex();
  }

  updateOverlayPosition() {
    const { instance } = this;
    if (!instance) return;
    const overlayBounds = instance.bounds;
    const { triggerBottom } = this;
    if (triggerBottom > overlayBounds.top) {
      this._overlayService.updateParentTop(triggerBottom);
    }
  }
}
