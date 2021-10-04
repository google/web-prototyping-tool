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

import { environment } from 'src/environments/environment';

export interface IAutocompleteService {
  getPlacePredictions: any;
  getQueryPredictions: any;
}

export interface IPlaceSuggestion {
  id: string;
  title: string;
  description: string;
  place_id: string;
}

export enum MapParam {
  Center = 'center',
  Zoom = 'zoom',
  Query = 'q',
  Key = 'key',
}

export const MAPS_PLACE = 'place';
export const MAPS_VIEW = 'view';
export const DEFAULT_ZOOM = 10;
export const DEFAULT_LAT = 47.6062;
export const DEFAULT_LNG = -122.3321;
export const MAPS_API_KEY = environment.googleMaps.apiKey;
export const DEFAULT_PLACE = 'Seattle';
export const GOOGLE_MAPS_EMBED_URL = 'google.com/maps/embed/v1/';
export const DEFAULT_MAPS_URL = `https://www.${GOOGLE_MAPS_EMBED_URL}${MAPS_PLACE}?${MapParam.Query}=Seattle&${MapParam.Key}=${MAPS_API_KEY}`;
export const MAPS_JS_API = `https://maps.googleapis.com/maps/api/js?${MapParam.Key}=${MAPS_API_KEY}&libraries=places`;
export const PLACE_DATA_ICON = 'location_on';
