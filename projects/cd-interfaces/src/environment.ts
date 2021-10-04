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

interface IFontsAPI {
  apiKey: string;
  url: string;
}

interface IMapsAPI {
  apiKey: string;
}

interface IFirebaseAPI {
  apiKey: string;
  appId: string;
  authDomain: string;
  databaseURL?: string;
  measurementId: string;
  messagingSenderId: string;
  projectId: string;
  storageBucket: string;
}

export interface IEnvironment {
  analyticsEnabled: boolean;
  clientId: string;
  e2e: boolean;
  databaseEnabled: boolean;
  firebase: IFirebaseAPI;
  gapiEnabled: boolean;
  googleFonts: IFontsAPI;
  googleMaps: IMapsAPI;
  peopleApiUrl: string;
  production: boolean;
  pwa: boolean;
  rendererUrl: string;
  renderOutletUrl: string;
  stackLoggingEnabled: boolean;
  showEditors?: boolean;
  presenceServiceUrl: string;
}
