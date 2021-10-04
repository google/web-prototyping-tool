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

import type { IEnvironment } from 'cd-interfaces';

// Enter Firebase and other setup information here
export const environment: IEnvironment = {
  rendererUrl: '/assets/renderer/index.html',
  renderOutletUrl: '/assets/render-outlet/index.html',
  clientId: '',
  googleFonts: {
    apiKey: '',
    url: 'https://www.googleapis.com/webfonts/v1/webfonts',
  },
  googleMaps: {
    apiKey: '',
  },
  databaseEnabled: false,
  firebase: {
    apiKey: '',
    authDomain: '',
    databaseURL: '',
    projectId: '',
    storageBucket: '',
    messagingSenderId: '',
    appId: '',
    measurementId: '',
  },
  peopleApiUrl: '',
  presenceServiceUrl: '',
  analyticsEnabled: false,
  stackLoggingEnabled: false,
  gapiEnabled: false,
  production: true,
  e2e: false,
  pwa: false,
};
