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
import { HttpParams, HttpClient, HttpHeaders } from '@angular/common/http';
import { COOKIE_SYNC_PATH, NO_PREFLIGHT_CONTENT_TYPE } from '../../configs/app-engine.config';
import { lastValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AppEngineService {
  constructor(private http: HttpClient) {}

  // This one has to be fetch() API for mode: 'no-cors'
  private cookieSync = async (host: string) => {
    await fetch(`${host}${COOKIE_SYNC_PATH}`, {
      mode: 'no-cors',
      cache: 'no-cache',
      credentials: 'include',
    });
  };

  public post = async <T>(host: string, path: string, params: HttpParams) => {
    await this.cookieSync(host);

    const headers = new HttpHeaders().set('Content-Type', NO_PREFLIGHT_CONTENT_TYPE);

    return lastValueFrom(
      this.http.post<T>(`${host}${path}`, params, {
        headers,
        withCredentials: true,
        responseType: 'json',
      })
    );
  };
}
