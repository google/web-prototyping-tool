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
  AfterViewInit,
  Input,
  Output,
  EventEmitter,
  ChangeDetectorRef,
  ViewChild,
  HostBinding,
  ElementRef,
} from '@angular/core';
import { OverlayInitService, OverlayService } from 'cd-common';
import { UserListComponent } from './user-list.component';
import * as cd from 'cd-interfaces';

@Component({
  selector: 'app-user-list-overlay',
  template: `
    <app-user-list
      [showSearch]="showSearch"
      [ownerEmail]="ownerEmail"
      [excludedUsers]="excludedUsers"
      [searchValue]="searchValue"
      (selectedUser)="onAddEditor($event)"
      (close)="onClose()"
    ></app-user-list>
  `,
  styleUrls: ['./user-list-overlay.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserListOverlayComponent implements AfterViewInit {
  private _searchValue = '';

  @Input() activeIndex = 0;
  @Input() ownerEmail = '';
  @Input() excludedUsers: string[] = [];
  @Input() showSearch = false;
  @Input() set searchValue(value: string) {
    this._searchValue = value;
    this._cdRef.markForCheck();
  }
  get searchValue() {
    return this._searchValue;
  }

  @Output() selectedUser = new EventEmitter<cd.PartialUser>();
  @Output() close = new EventEmitter<void>();

  @ViewChild(UserListComponent, { read: UserListComponent, static: true })
  userList?: UserListComponent;

  @HostBinding('class.hidden')
  get isHidden() {
    if (this.showSearch) return false;
    return !this.userList?.users.length;
  }

  constructor(
    private _overlayInit: OverlayInitService,
    private _overlayservice: OverlayService,
    private _elemRef: ElementRef,
    private _cdRef: ChangeDetectorRef
  ) {}

  get bounds(): DOMRect {
    return (this._elemRef.nativeElement as HTMLElement).getBoundingClientRect();
  }

  onAddEditor(user: cd.IUser) {
    this.selectedUser.emit(user);
    this._overlayservice.close();
  }

  onClose() {
    this._overlayservice.close();
  }

  ngAfterViewInit(): void {
    this._overlayInit.componentLoaded();
  }
}
