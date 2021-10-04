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

import { Store, select } from '@ngrx/store';
import { createEffect, Actions, ofType } from '@ngrx/effects';
import { Injectable } from '@angular/core';
import { IAppState } from '../reducers';
import * as settingsActions from '../actions/settings.action';
import * as userActions from '../actions/user.action';
import * as settingsSelectors from '../selectors/settings.selector';
import { map, switchMap, withLatestFrom, filter, distinctUntilChanged, tap } from 'rxjs/operators';
import { IUser, IUserSettings } from 'cd-interfaces';
import { RendererService } from 'src/app/services/renderer/renderer.service';
import { DatabaseService } from 'src/app/database/database.service';
import { settingsPathForId } from 'src/app/database/path.utils';
import { withUser } from '../../utils/store.utils';

const DARK_THEME = 'dark-theme';

const toggleTheme = (className: string, value: boolean) => {
  document.body.classList.toggle(className, value);
  value ? localStorage.setItem(className, className) : localStorage.removeItem(className);
};

@Injectable()
export class SettingsEffects {
  constructor(
    private actions$: Actions,
    private appStore: Store<IAppState>,
    private rendererService: RendererService,
    private _databaseService: DatabaseService
  ) {
    if (localStorage.getItem(DARK_THEME)) toggleTheme(DARK_THEME, true);
  }

  /**
   * Add dark theme class to document body
   */

  darkTheme$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(settingsActions.SETTINGS_UPDATE, settingsActions.SETTINGS_REMOTE_MODIFIED),
        withLatestFrom(this.appStore.pipe(select(settingsSelectors.getUserSettings))),
        map(([, settings]) => settings.darkTheme),
        distinctUntilChanged(),
        tap((darkTheme) => {
          toggleTheme(DARK_THEME, darkTheme);
          this.rendererService.updateApplicationTheme();
        })
      ),
    { dispatch: false }
  );

  /**
   * Update settings in database
   */

  updateDatabase$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(settingsActions.SETTINGS_UPDATE),
        withLatestFrom(this.appStore.pipe(select(settingsSelectors.getUserSettings))),
        map(([, userSettings]) => userSettings),
        withUser(this.appStore),
        map(([userSettings, user]) => {
          // Rather than check to see if settings already exists for this user
          // just override entire object
          const settings = { ...userSettings, id: user.id };
          this._databaseService.setDocument(settingsPathForId(user.id), settings);
        })
      ),
    { dispatch: false }
  );

  /**
   * Get settings for user as soon as we have auth success
   */

  getSettings$ = createEffect(() =>
    this.actions$.pipe(
      ofType(userActions.APP_GET_USER_SUCCESS),
      withUser(this.appStore),
      map(([, user]) => user),
      switchMap((user: IUser) => {
        const settingsPath = settingsPathForId(user.id);
        return this._databaseService.getDocument(settingsPath);
      }),
      filter((doc) => doc.exists),
      map((doc) => {
        return new settingsActions.SettingsRemoteModified(doc.data() as IUserSettings);
      })
    )
  );
}
