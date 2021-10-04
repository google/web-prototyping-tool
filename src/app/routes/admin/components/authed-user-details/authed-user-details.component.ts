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
  OnDestroy,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { Store, select } from '@ngrx/store';

import { APP_SIGN_OUT_USER } from 'src/app/store/actions';
import { ConfigAction } from 'src/app/routes/project/interfaces/action.interface';
import { PeopleService } from 'src/app/services/people/people.service';
import * as appStoreModule from 'src/app/store';
import * as cd from 'cd-interfaces';
import * as gapiUtils from 'src/app/utils/gapi.utils';

@Component({
  selector: 'app-authed-user-details',
  templateUrl: './authed-user-details.component.html',
  styleUrls: ['./authed-user-details.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthedUserDetailsComponent implements OnInit, OnDestroy {
  private _subscriptions = new Subscription();

  public grantedScopes?: string[];
  public user$: Observable<cd.IUser | undefined>;
  public googleUser$?: Observable<Partial<cd.IUser> | undefined>;

  constructor(
    private _appStore: Store<appStoreModule.IAppState>,
    private _cdRef: ChangeDetectorRef,
    private _peopleService: PeopleService
  ) {
    this.user$ = this._appStore.pipe(select(appStoreModule.getUser));
  }

  async ngOnInit() {
    this._subscriptions.add(this.user$.subscribe(this.onUserSubscription));

    this.grantedScopes = await gapiUtils.getGrantedScopesList();
    this._cdRef.markForCheck();
  }

  ngOnDestroy() {
    this._subscriptions.unsubscribe();
  }

  onClick() {
    gapiUtils.revokeGrantedScopes();
    this.dispatchLogoutUser();
  }

  onUserSubscription = (user: cd.IUser | undefined) => {
    if (!user || !user.email) return;

    this.googleUser$ = this._peopleService.getUserDetailsForEmailAsObservable(user.email, 128);
  };

  private dispatchLogoutUser() {
    const action = new ConfigAction(null, {});
    action.type = APP_SIGN_OUT_USER;
    this._appStore.dispatch(action);
  }
}
