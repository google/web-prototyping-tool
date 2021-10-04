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

import { Component, ChangeDetectionStrategy, OnInit, AfterViewInit } from '@angular/core';
import { ToastsService } from './services/toasts/toasts.service';
import { IToast } from 'cd-interfaces';
import { environment } from 'src/environments/environment';
import { SwUpdate } from '@angular/service-worker';
import { debounceTime } from 'rxjs/operators';
import { MaintenanceService } from './services/maintenance/maintenance.service';
import { getDocumentVisibilityEvent$ } from 'cd-common/utils';

export const unregisterServiceWorkers = async (): Promise<boolean> => {
  if (!navigator.serviceWorker) return false;
  const registrations = await navigator.serviceWorker.getRegistrations();
  registrations.forEach((registration) => registration.unregister());
  return registrations.length > 0;
};

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent implements OnInit, AfterViewInit {
  constructor(
    private _swUpdate: SwUpdate,
    private readonly _maintenanceService: MaintenanceService,
    public readonly toastsService: ToastsService
  ) {}

  ngOnInit(): void {
    if (!environment.e2e) this._maintenanceService.checkForMaintenanceMode();
    if (!environment.pwa) this.handleUnregister();
    this.registerSessionRefreshOnVisibilityChange();
  }

  ngAfterViewInit() {
    if (!environment.production || !environment.pwa) return;
    this._swUpdate.available.pipe(debounceTime(100)).subscribe(this.showUpdateToast);
    this._swUpdate.unrecoverable.subscribe(this.reloadPage);
    this._swUpdate.checkForUpdate();
  }

  /** We unregister the service worker if the env flag for pwa is set to false */
  handleUnregister() {
    unregisterServiceWorkers().then((hadServiceWorker) => {
      if (hadServiceWorker) this.reloadPage();
    });
  }

  /** On doc visibility change, we check to see if the user's auth token has expired */
  registerSessionRefreshOnVisibilityChange() {
    getDocumentVisibilityEvent$().subscribe(this.checkForAuthSession);
  }

  /**
   * Checks to see if a local file request is being redirected due to expired cookies
   *  https://developer.mozilla.org/en-US/docs/Web/API/Response/type
   */
  checkForAuthSession = async () => {
    try {
      const res = await fetch('session-refresh.js', { cache: 'no-cache', redirect: 'manual' });
      if (res.type === 'opaqueredirect') this.showExpiredCredentialsToast();
    } catch (err) {}
  };

  reloadPage = () => window.location.reload();

  showExpiredCredentialsToast = () => {
    this.toastsService.addToast({
      id: 'session',
      iconName: 'account_circle',
      message: 'Your Google credentials have expired',
      confirmLabel: 'Refresh',
      duration: -1,
      hideDismiss: true,
      callback: this.reloadPage,
    });
  };

  updateVersion = () => {
    this._swUpdate.activateUpdate().then(() => this.reloadPage());
  };

  showUpdateToast = () => {
    this.toastsService.addToast({
      id: 'sw-update',
      message: 'New version available',
      confirmLabel: 'Update',
      duration: -1,
      callback: this.updateVersion,
    });
  };

  onToastDismissed({ id }: IToast) {
    this.toastsService.removeToast(id);
  }
}
