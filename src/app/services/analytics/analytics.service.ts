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
  AnalyticsEvent,
  AnalyticsEventType,
  IAnalyticsEventParams,
  IAnalyticsService,
} from 'cd-common/analytics';
import firebase from 'firebase/app';
import 'firebase/analytics';
import { createAnalyticsErrorEntry } from './analytics.service.utils';
import { DatabaseService } from 'src/app/database/database.service';
import { environment } from 'src/environments/environment';
import { SRC_ATTR, SCRIPT_TAG } from 'cd-common/consts';
import { IExceptionEvent } from 'cd-interfaces';
import { isString } from 'cd-utils/string';
import { Injectable } from '@angular/core';
import { of } from 'rxjs';

// Firebase Analytics setup instructions at:
// https://firebase.google.com/docs/analytics/get-started?platform=web

const GTAG_URL = 'https://www.googletagmanager.com/gtag/js';

// Errors that we prevent from showing up in the chat bot.
// These are partial error messages - if an error contains any part of them it will be ignored
const IGNORED_ERRORS = ['Error retrieving icon'];

// Prevents spamming the same error to the database
const SENT_ERROR_LIST = new Set<string>();

@Injectable()
export class AnalyticsService implements IAnalyticsService {
  constructor(private _databaseService: DatabaseService) {
    if (environment.analyticsEnabled) {
      this._loadGoogleAnalytics();
    }
  }

  // Add Global site tag (gtag.js) - Google Analytics
  private _loadGoogleAnalytics() {
    const gaScript = document.createElement(SCRIPT_TAG);
    gaScript.setAttribute('async', 'true');
    gaScript.setAttribute('importance', 'low');
    gaScript.setAttribute(SRC_ATTR, GTAG_URL);

    const gaScript2 = document.createElement(SCRIPT_TAG);

    gaScript2.text = `
      window.dataLayer = window.dataLayer || [];
      function gtag() { dataLayer.push(arguments); }
      gtag('js', new Date());
      gtag('config', '${environment.firebase.measurementId}');
    `;

    document.body.appendChild(gaScript);
    document.body.appendChild(gaScript2);
  }

  get analyticsDisabled(): boolean {
    return !environment.analyticsEnabled;
  }

  errorToString(err: string | Error): string {
    return isString(err) ? err : err.message;
  }

  sendError(err: string | Error, stack?: string) {
    const msg = this.errorToString(err);
    if (this.analyticsDisabled || this.ignoreError(msg)) return;
    const analyticsEntry = createAnalyticsErrorEntry(msg, stack);
    const uniqueId = analyticsEntry.messageHash;
    if (SENT_ERROR_LIST.has(uniqueId)) return;
    SENT_ERROR_LIST.add(uniqueId);
    this.sendGoogleAnalyticsEvent(msg, false);
    this.sendFirebaseExceptionEvent(analyticsEntry);
  }

  // NOTE: This is marked public to be used by the app console cli
  sendFirebaseExceptionEvent(analyticsEntry: IExceptionEvent) {
    this._databaseService.writeAnalyticsEvent(analyticsEntry).catch((error) => {
      console.error(error);
      return of(undefined);
    });
  }

  private sendGoogleAnalyticsEvent(message: string, fatal = false) {
    firebase.analytics().logEvent(AnalyticsEvent.Exception, { message, fatal });
  }

  logEvent(event: AnalyticsEventType, eventParams: IAnalyticsEventParams = {}) {
    if (this.analyticsDisabled) return;
    firebase.analytics().logEvent<any>(event, { ...eventParams });
  }

  private ignoreError = (msg: string): boolean => {
    if (!msg) return true;
    return IGNORED_ERRORS.some((e) => msg.includes(e));
  };
}
