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

import * as cd from 'cd-interfaces';
import { HttpClient } from '@angular/common/http';
import { Injectable, OnDestroy, Optional, SecurityContext } from '@angular/core';
import { EMPTY, Observable, Subject, Subscription } from 'rxjs';
// import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
// import { processIconset } from './icon-picker.utils';
import { catchError, retry } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class IconPickerService implements OnDestroy {
  private _subscription = new Subscription();
  private _matIconDataLoaded = false;

  public iconDataLoaded$ = new Subject<void>();
  public materialIconCategories: ReadonlyArray<cd.ICategory> = [];
  public SmallIconsets: ReadonlyArray<cd.IProcessedIconset> = [];
  public MediumIconsets: ReadonlyArray<cd.IProcessedIconset> = [];
  public LargeIconsets: ReadonlyArray<cd.IProcessedIconset> = [];

  constructor(
    @Optional() private _httpClient: HttpClient,
    private _sanitizer: DomSanitizer // private _matIconRegistry: MatIconRegistry
  ) {}

  loadMaterialIconData = (srcUrl: string) => {
    if (this._matIconDataLoaded) return;
    this.loadIconData<cd.IIconLibrary>(srcUrl, this.handleMaterialIconResults);
  };

  ngOnDestroy() {
    this._subscription.unsubscribe();
  }

  private loadIconData = <T>(srcUrl: string, callback: (results: T) => void) => {
    const url: string = this.sanitizeUrl(srcUrl);
    if (url) {
      this._subscription = this.loadIcons<T>(url)
        .pipe(
          retry(3),
          catchError(() => {
            console.error('Failed to load icon data');
            return EMPTY;
          })
        )
        .subscribe(callback);
    }
  };

  private loadIcons<T>(url: string): Observable<T> {
    return this._httpClient.get<T>(url, { responseType: 'json', withCredentials: true });
  }

  private sanitizeUrl(src: string = ''): string {
    return (
      this._sanitizer.sanitize(
        SecurityContext.RESOURCE_URL,
        this._sanitizer.bypassSecurityTrustResourceUrl(src)
      ) || ''
    );
  }

  private handleMaterialIconResults = (data: cd.IIconLibrary) => {
    this._matIconDataLoaded = true;
    this.materialIconCategories = Object.freeze(data.categories);
    this.iconDataLoaded$.next();
  };

  // private handleIconResults = (data: cd.IIconLibrary) => {
  //   this.registerSvgIconsets(data.iconsets);

  //   const { Small, Medium, Large } = cd.IconSize;
  //   const small = processIconset(data, Small);
  //   const medium = processIconset(data, Medium);
  //   const large = processIconset(data, Large);
  //   this.SmallIconsets = Object.freeze(small);
  //   this.MediumIconsets = Object.freeze(medium);
  //   this.LargeIconsets = Object.freeze(large);
  //   this.iconDataLoaded$.next();
  // };

  // private registerSvgIconsets = (iconsets: cd.IIconset[]) => {
  //   for (const iconset of iconsets) {
  //     const { name, size, svgPath } = iconset;
  //     const svgUrl = ICONS_BASE_URL + svgPath;
  //     const url = this._sanitizer.bypassSecurityTrustResourceUrl(svgUrl);
  //     const namespace = `${name}-${size}`;
  //     this._matIconRegistry.addSvgIconSetInNamespace(namespace, url);
  //   }
  // };
}
