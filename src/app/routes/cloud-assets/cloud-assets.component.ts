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

import { Component, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { Observable } from 'rxjs';
import { Store, select } from '@ngrx/store';

import AssetsManifest from 'src/assets/assets-gallery/catalog/assets.json';
import { copyToClipboard } from 'cd-utils/clipboard';
import * as appStore from '../../store';
import * as cd from 'cd-interfaces';

const COPY_SUCCESS_MESSAGE_TIME = 3000;

@Component({
  selector: 'app-cloud-assets',
  templateUrl: './cloud-assets.component.html',
  styleUrls: ['./cloud-assets.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CloudAssetsComponent implements OnDestroy {
  public settings$: Observable<cd.IUserSettings>;
  public assets = AssetsManifest;
  public copied = false;
  private _copiedTimer = 0;

  constructor(private _appStore: Store<appStore.IAppState>) {
    this.settings$ = this._appStore.pipe(select(appStore.getUserSettings));
  }

  ngOnDestroy() {
    window.clearTimeout(this._copiedTimer);
  }

  onClick(product: any, asset: any) {
    clearTimeout(this._copiedTimer);

    const url = `${window.location.origin}/${product.dir}/${asset}`;
    copyToClipboard(url);
    this.copied = true;
    this._copiedTimer = window.setTimeout(() => {
      this.copied = false;
    }, COPY_SUCCESS_MESSAGE_TIME);
  }

  onDarkThemeToggle(selected?: boolean) {
    const darkTheme = !selected;
    this._appStore.dispatch(new appStore.SettingsUpdate({ darkTheme }));
  }
}
