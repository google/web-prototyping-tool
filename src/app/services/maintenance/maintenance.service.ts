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

import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { DatabaseService } from '../../database/database.service';
import { maintenanceModePathForId } from 'src/app/database/path.utils';
import { FirebaseCollection, FirebaseField } from 'cd-common/consts';
import { Router } from '@angular/router';
import { RoutePath, Route } from 'src/app/configs/routes.config';
import { environment } from 'src/environments/environment';

interface IMaintenanceModeDocument {
  [FirebaseField.MaintenanceModeEnabled]: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class MaintenanceService {
  public maintenanceModeEnabled$ = new BehaviorSubject(false);
  private _previousLocation?: string;

  constructor(private _databaseService: DatabaseService, private router: Router) {}

  checkForMaintenanceMode() {
    if (!environment.databaseEnabled) return;
    const path = maintenanceModePathForId(FirebaseCollection.MaintenanceMode);
    this._databaseService
      .subscribeToDocument<IMaintenanceModeDocument>(path)
      .subscribe(this._onMainteanceModeSubscription);
  }

  private _onMainteanceModeSubscription = (doc: IMaintenanceModeDocument | undefined) => {
    if (!doc) return;
    const { maintenanceModeEnabled } = doc;
    const currentValue = this.maintenanceModeEnabled$.value;
    if (maintenanceModeEnabled === currentValue) return;

    this.maintenanceModeEnabled$.next(maintenanceModeEnabled);

    // if enabled force to maintenance mode page
    const { pathname } = window.location;

    // Dont' apply maintenance mode to Admin page
    if (pathname.indexOf(Route.Admin) !== -1) return;

    if (maintenanceModeEnabled) {
      // Store current url (if not on maintenance mode page), so we can redirect to it when
      // maintenance mode is turned off
      if (pathname.indexOf(Route.MaintenanceMode) === -1) {
        this._previousLocation = this.router.url;
      }

      // navigate to "down for maintenace" page, but don't add entry to browser history
      // This way, even if a user refreshes when on the maintenance page, they don't lose their url
      this.router.navigate([RoutePath.MaintenanceMode], { skipLocationChange: true });
    }
    // If maintenance mode is now disabled, route to previous location (if any) or dashboard
    else {
      this._navigateToPreviousLocation();
    }
  };

  private _navigateToPreviousLocation = () => {
    const { _previousLocation } = this;
    const newLocation = _previousLocation || RoutePath.Dashboard;

    // Navigate to new location, and then perform a hard reload to ensure client has loaded
    // newest version of
    this.router.navigateByUrl(newLocation).then(() => {
      window.location.reload();
    });
  };
}
