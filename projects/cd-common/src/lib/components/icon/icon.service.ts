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

import { SecurityContext, Optional, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer } from '@angular/platform-browser';
import { ComponentSize } from 'cd-interfaces';
import { Observable, from, EMPTY, of } from 'rxjs';
import { stringToSvg, ICON_DIMENSIONS } from './icon.utils';
import { finalize, share, retry, catchError, take, tap, mergeMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class IconService {
  private _iconCache = new Map<string, HTMLOrSVGElement>();
  private _queue = new Map<string, Observable<HTMLOrSVGElement>>();

  constructor(@Optional() private _httpClient: HttpClient, private _sanitizer: DomSanitizer) {}

  getImageForUrl(url: string, size: ComponentSize): Observable<HTMLOrSVGElement> {
    const cached = this._iconCache.get(url);
    if (cached) return of(cached);

    const observable = this._queue.get(url);
    if (observable) return observable;

    const req = this._httpClient.get(url, { responseType: 'text' }).pipe(
      retry(3),
      take(1),
      mergeMap((text: string) => this.parseSvg(text, size)),
      tap((svg) => this._iconCache.set(url, svg)),
      finalize(() => this._queue.delete(url)),
      share(),
      catchError(() => {
        console.log(`Failed to load asset ${url}`);
        return EMPTY;
      })
    );

    this._queue.set(url, req);
    return req;
  }

  parseSvg(text: string, size: ComponentSize): Observable<HTMLOrSVGElement> {
    const safeUrl = this._sanitizer.bypassSecurityTrustHtml(text);
    const sanitizedLiteral = this._sanitizer.sanitize(SecurityContext.HTML, safeUrl);
    const overWriteSize = size !== ComponentSize.Auto;
    const width = ICON_DIMENSIONS[size];
    const height = width;
    if (!sanitizedLiteral) throw new Error('Unable to load icon');
    return from(stringToSvg(sanitizedLiteral, overWriteSize, width, height));
  }
}
