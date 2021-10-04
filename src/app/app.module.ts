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

import { AngularFirestoreModule, SETTINGS } from '@angular/fire/firestore';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { NgModule, ErrorHandler } from '@angular/core';
import { AppRoutingModule } from './app-routing.module';
import { AngularFireStorageModule } from '@angular/fire/storage';
import { AppComponent } from './app.component';
import { environment } from '../environments/environment';
import { RendererIFrameComponent } from './components/renderer-iframe/renderer-iframe.component';
import { AngularFireAuthModule } from '@angular/fire/auth';
import { PeopleService } from './services/people/people.service';
import { APP_ENV, DATA_FORMATTER_TOKEN, ToastManagerModule, TooltipService } from 'cd-common';
import { extModules, exProviders } from './build-specifics';
import { AnalyticsService } from './services/analytics/analytics.service';
import { ErrorService } from './services/error/error.service';
import { ServiceWorkerModule } from '@angular/service-worker';
import { ANALYTICS_SERVICE_TOKEN } from 'cd-common/analytics';
import { ShareDialogModule } from 'src/app/components/share-dialog/share-dialog.module';
import { FormatDataService } from './services/formatting/formatting.service';
import { registerComponentDefinitions } from 'cd-definitions';

const MIN_CACHE_SIZE = 1048576; // 1Mb
const errorProvider = { provide: ErrorHandler, useClass: ErrorService };
const appEnvironmentProvider = { provide: APP_ENV, useValue: environment };
const analyticsServiceProvider = { provide: ANALYTICS_SERVICE_TOKEN, useClass: AnalyticsService };
const formatterServiceProvider = { provide: DATA_FORMATTER_TOKEN, useClass: FormatDataService };
const firestoreSettings = {
  provide: SETTINGS,
  useValue: { ignoreUndefinedProperties: true, cacheSizeBytes: MIN_CACHE_SIZE, merge: true },
};

@NgModule({
  declarations: [AppComponent, RendererIFrameComponent],
  imports: [
    ShareDialogModule,
    ToastManagerModule,
    BrowserModule,
    HttpClientModule,
    AngularFirestoreModule,
    AngularFireAuthModule,
    AngularFireStorageModule,
    AppRoutingModule,
    extModules,
    ServiceWorkerModule.register('ngsw-worker.js', {
      enabled: environment.production && environment.pwa,
    }),
    // AngularFirestoreModule.enablePersistence(),
  ],
  providers: [
    exProviders,
    appEnvironmentProvider,
    formatterServiceProvider,
    analyticsServiceProvider,
    AnalyticsService,
    TooltipService,
    PeopleService,
    ErrorService,
    firestoreSettings,
    errorProvider,
  ],
  bootstrap: [AppComponent],
})
export class AppModule {
  constructor(protected _analyticsService: AnalyticsService, protected _tooltips: TooltipService) {
    // Load all built-in component definitions - this will populate components panel
    // It is necessary to do this here so that the defitions are available on the project page,
    // and also on the dashboard so we can create new models as part of the create new project flow
    registerComponentDefinitions();
  }
}
