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
  Input,
  OnDestroy,
  ChangeDetectorRef,
} from '@angular/core';
import { Subscription } from 'rxjs';
import { PeopleService } from 'src/app/services/people/people.service';
import * as utils from 'src/app/utils/user.utils';
import * as cd from 'cd-interfaces';

@Component({
  selector: 'app-owner-details',
  templateUrl: './owner-details.component.html',
  styleUrls: ['./owner-details.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OwnerDetailsComponent implements OnDestroy {
  private _owner?: cd.IUserIdentity;
  private _subscription = Subscription.EMPTY;
  public ownerDetails?: cd.PartialUser;
  public ownerMenu: cd.IMenuConfig[] = utils.USER_ACTIONS_MENU;

  @Input()
  set owner(value: cd.IUserIdentity | undefined) {
    if (this._owner?.id === value?.id) return;
    const ownerEmail = value?.email;
    this._owner = value;
    if (!ownerEmail) return;
    this._subscription = this._peopleService
      .getUserDetailsForEmailAsObservable(ownerEmail)
      .subscribe(this.onOwnerDetails);
  }

  onOwnerDetails = (details: cd.PartialUser | undefined) => {
    this.ownerDetails = details;
    this._cdRef.markForCheck();
  };

  constructor(private _peopleService: PeopleService, private _cdRef: ChangeDetectorRef) {}

  ngOnDestroy(): void {
    this._subscription.unsubscribe();
  }

  onMenuSelect(item: cd.IMenuConfig, owner: cd.PartialUser) {
    const email = owner?.email;
    if (item.value === utils.UserMenuEvents.Projects) utils.openUserProjects(email);
    if (item.value === utils.UserMenuEvents.Teams) utils.openUserTeamsPage(email);
  }
}
