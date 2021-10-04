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

import { Component, OnDestroy, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { COMPONENTS_TAB_FRAGMENT } from 'src/app/configs/routes.config';
import { HELP_MENU_CONFIG } from 'src/app/configs/help-menu.config';
import { IMenuConfig, IUser, IUserSettings } from 'cd-interfaces';
import { Observable, Subscription, BehaviorSubject } from 'rxjs';
import { ActivatedRoute, Params, NavigationExtras } from '@angular/router';
import { openLinkInNewTab } from 'cd-utils/url';
import { Store, select } from '@ngrx/store';
import config from './configs/dashboard.config';
import * as appStoreModule from '../../store';
import { AuthService } from 'src/app/services/auth/auth.service';
import { PeopleService } from 'src/app/services/people/people.service';
import { debounceTime } from 'rxjs/operators';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent implements OnDestroy, OnInit {
  private _subscriptions = new Subscription();
  public settings$: Observable<IUserSettings>;
  public user$: Observable<IUser | undefined>;
  public googleUser$?: Observable<Partial<IUser> | undefined>;
  public avatarMenu: IMenuConfig[] = config.avatarMenu;
  public helpMenu: IMenuConfig[] = HELP_MENU_CONFIG;
  public searchValue$ = new BehaviorSubject('');
  public profileImgUrl = '';
  public activeTab = 0;

  constructor(
    public authService: AuthService,
    private _appStore: Store<appStoreModule.IAppState>,
    private _activatedRoute: ActivatedRoute,
    private _peopleService: PeopleService
  ) {
    this.user$ = _appStore.pipe(select(appStoreModule.getUser));
    this.settings$ = _appStore.pipe(select(appStoreModule.getUserSettings));
  }

  get searchValue() {
    return this.searchValue$.getValue();
  }

  set searchValue(value: string) {
    const search = value || '';

    if (this.searchValue === search) return;
    const queryParams = search ? { search } : { search: null };
    this.updateUrl({ queryParams, queryParamsHandling: 'merge', replaceUrl: false });
    this.searchValue$.next(search);
  }

  onUserSubscription = (user: IUser | undefined) => {
    if (!user || !user.email) return;
    this.googleUser$ = this._peopleService.getUserDetailsForEmailAsObservable(user.email);
  };

  updateUrl(extras: NavigationExtras) {
    const payload = { path: [], extras };
    const action = new appStoreModule.AppGo(payload);
    this._appStore.dispatch(action);
  }

  onTabChange(newTab: number) {
    this.activeTab = newTab;
    const fragment = newTab !== 0 ? COMPONENTS_TAB_FRAGMENT : undefined;
    this.updateUrl({ fragment, replaceUrl: true, queryParamsHandling: 'merge' });
  }

  ngOnInit() {
    // Debounce time fixes back button issue b/150645691 with query change
    const queryChange$ = this._activatedRoute.queryParams.pipe(debounceTime(0));
    this._subscriptions.add(queryChange$.subscribe(this.onQueryParams));
    this._subscriptions.add(this.user$.subscribe(this.onUserSubscription));
  }

  onQueryParams = (params: Params) => {
    this.searchValue = params.search;
  };

  ngOnDestroy(): void {
    this._subscriptions.unsubscribe();
  }

  get showProjectsTab(): boolean {
    return this.activeTab === 0;
  }

  get showComponentsTab(): boolean {
    return this.activeTab === 1;
  }

  onAvatarMenuSelect(item: IMenuConfig) {
    if (item.action === appStoreModule.APP_SIGN_OUT_USER) {
      this.authService.signOut();
    }
  }

  onThemeToggle(selected?: boolean) {
    const darkTheme = !selected;
    this._appStore.dispatch(new appStoreModule.SettingsUpdate({ darkTheme }));
  }

  onHelpMenuSelect(item: IMenuConfig) {
    if (item.action) return this._appStore.dispatch({ type: item.action });
    openLinkInNewTab(String(item.value));
  }

  onSearchValueChange(value: string) {
    // Clear the search when user hits the X
    if (value !== '') return;
    this.searchValue = '';
  }

  onSearchChange(e: Event) {
    this.searchValue = (e.target as HTMLInputElement).value;
  }

  onSearchUpdate(value: string) {
    this.searchValue = value;
  }
}
