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

// `ng build ---prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

import type { IEnvironment } from 'cd-interfaces';

// Enter Firebase and other setup information here
export const environment: IEnvironment = {
  rendererUrl: '//127.0.0.1:5432',
  renderOutletUrl: '//127.0.0.1:5432/assets/render-outlet/index.html',
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
  gapiEnabled: true,
  production: false,
  e2e: false,
  pwa: false,
};

/*
 * In development mode, to ignore zone related error stack frames such as
 * `zone.run`, `zoneDelegate.invokeTask` for easier debugging, you can
 * import the following file, but please comment it out in production mode
 * because it will have performance impact when throw error
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
