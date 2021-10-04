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

import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { AbstractBannerDirective } from '../abstract.banner';
import { IProject, IUser } from 'cd-interfaces';
import { DuplicateService } from 'src/app/services/duplicate/duplicate.service';
import { Observable } from 'rxjs';
import { getUser, IAppState } from 'src/app/store';
import { select, Store } from '@ngrx/store';

@Component({
  selector: 'app-fork-banner',
  templateUrl: './fork-banner.component.html',
  styleUrls: ['./fork-banner.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ForkBannerComponent extends AbstractBannerDirective {
  public user$: Observable<IUser | undefined>;

  @Input() project!: IProject;

  constructor(private _duplicateService: DuplicateService, private appStore: Store<IAppState>) {
    super();

    this.user$ = this.appStore.pipe(select(getUser));
  }

  onFork(user: IUser) {
    this._duplicateService.duplicateProjectAndNavigate(this.project, user);
  }
}
