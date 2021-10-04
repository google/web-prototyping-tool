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
  EventEmitter,
  ChangeDetectionStrategy,
  Input,
  Output,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
} from '@angular/core';
import { PeopleService } from 'src/app/services/people/people.service';
import { BehaviorSubject, Subscription } from 'rxjs';
import { debounceTime, switchMap } from 'rxjs/operators';
import { KEYS } from 'cd-utils/keycodes';
import { LIST_ITEM_TAG } from 'cd-common/consts';
import { closestChildIndexForEvent } from 'cd-common/utils';
import type * as cd from 'cd-interfaces';

const SEARCH_DEBOUNCE = 60;

@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserListComponent implements OnInit, OnDestroy {
  private _search$ = new BehaviorSubject('');
  private _subscription = Subscription.EMPTY;
  public users: cd.PartialUser[] = [];

  @Input() activeIndex = 0;
  @Input() ownerEmail = '';
  @Input() excludedUsers: string[] = [];
  @Input() showSearch = true;
  @Input() set searchValue(value: string | undefined) {
    const search = value || '';
    if (this._search$.getValue() === search) return;
    this._search$.next(search);
  }
  get searchValue() {
    return this._search$.getValue();
  }

  @Output() selectedUser = new EventEmitter<cd.PartialUser>();
  @Output() close = new EventEmitter<void>();

  constructor(public _peopleService: PeopleService, private _cdRef: ChangeDetectorRef) {}

  ngOnDestroy(): void {
    this._subscription.unsubscribe();
  }

  ngOnInit(): void {
    this._subscription = this._search$
      .pipe(
        debounceTime(SEARCH_DEBOUNCE),
        switchMap((query) => this._peopleService.getListOfUsersAsObservable(query))
      )
      .subscribe(this.onSearchResults);
  }

  updateActiveIndexForUserListSize(size: number) {
    if (this.activeIndex && this.activeIndex > size) {
      this.activeIndex = size;
    }
  }

  processExcludedUsers(users: cd.PartialUser[]) {
    const { excludedUsers, ownerEmail } = this;
    return users.filter((user) => {
      const email = user?.email;
      return email && !excludedUsers.includes(email) && email !== ownerEmail;
    });
  }

  onSearchResults = (users: cd.PartialUser[]) => {
    this.users = this.processExcludedUsers(users);
    this.updateActiveIndexForUserListSize(users.length - 1);
    this._cdRef.markForCheck();
  };

  get userLength() {
    return this.users.length;
  }

  nextIndex() {
    const next = this.activeIndex + 1;
    this.activeIndex = next % this.userLength;
    this._cdRef.markForCheck();
  }

  prevIndex() {
    let prev = this.activeIndex - 1;
    if (prev < 0) prev = this.userLength - 1;
    this.activeIndex = prev;
    this._cdRef.markForCheck();
  }

  onSelectActiveIndex() {
    this.emitSelectedUser(this.activeIndex);
  }

  cancel() {
    this.close.emit();
  }

  emitSelectedUser(idx: number) {
    const active = this.users[idx];
    if (!active) return;
    this.selectedUser.emit(active);
  }

  onKeyDown(e: KeyboardEvent) {
    if (e.key === KEYS.ArrowDown) return this.nextIndex();
    if (e.key === KEYS.ArrowUp) return this.prevIndex();
    if (e.key === KEYS.Enter) return this.onSelectActiveIndex();
    if (e.key === KEYS.Escape && !this.users.length) return this.cancel();
  }

  onSelectUser(e: MouseEvent) {
    const idx = closestChildIndexForEvent(e, LIST_ITEM_TAG);
    if (idx === -1) return;
    this.emitSelectedUser(idx);
  }

  onSearchValueChange(value: string) {
    this.searchValue = value;
  }

  trackByFn(_idx: number, item: cd.PartialUser) {
    return item?.email;
  }
}
