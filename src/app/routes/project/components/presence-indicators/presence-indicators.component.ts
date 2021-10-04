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
import { select, Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { PresenceService } from 'src/app/services/presence/presence.service';
import { IAppState } from 'src/app/store/reducers';
import { getDarkTheme } from 'src/app/store/selectors';

@Component({
  selector: 'app-presence-indicators',
  templateUrl: './presence-indicators.component.html',
  styleUrls: ['./presence-indicators.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PresenceIndicatorsComponent {
  public darkTheme$: Observable<boolean>;

  constructor(public presenceService: PresenceService, private store: Store<IAppState>) {
    this.darkTheme$ = this.store.pipe(select(getDarkTheme));
  }
}
