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

import { Component, ChangeDetectionStrategy } from '@angular/core';
import { IMenuConfig, INewsItem } from 'cd-interfaces';
import { HELP_MENU_CONFIG } from 'src/app/configs/help-menu.config';
import { Store } from '@ngrx/store';
import { IAppState } from 'src/app/store';
import { openLinkInNewTab } from 'cd-utils/url';
import { DatabaseService } from 'src/app/database/database.service';
import { Observable } from 'rxjs';
import { FirebaseCollection, FirebaseField, FirebaseOrderBy } from 'cd-common/consts';

const MAX_NEWS_ITEMS = 20;

@Component({
  selector: 'app-about-panel',
  templateUrl: './about-panel.component.html',
  styleUrls: ['./about-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AboutPanelComponent {
  public feedbackMenu: IMenuConfig[] = HELP_MENU_CONFIG;
  public newsFeed: Observable<INewsItem[]> = this._db.getCollection(
    FirebaseCollection.NewsUpdates,
    (ref) => ref.orderBy(FirebaseField.Date, FirebaseOrderBy.Desc).limit(MAX_NEWS_ITEMS)
  );

  constructor(private _appStore: Store<IAppState>, private _db: DatabaseService) {}

  onLinkButtonClick(item: IMenuConfig) {
    if (item.action) return this._appStore.dispatch({ type: item.action });
    openLinkInNewTab(String(item.value));
  }
}
