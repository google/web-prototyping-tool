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

import { DomSanitizer, SafeUrl, SafeResourceUrl } from '@angular/platform-browser';
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'safeURL',
})
export class SafeURLPipe implements PipeTransform {
  constructor(private _sanitizer: DomSanitizer) {}
  transform(value: string): SafeUrl {
    return this._sanitizer.bypassSecurityTrustUrl(value);
  }
}

@Pipe({
  name: 'safeResourceURL',
})
export class SafeResourceURLPipe implements PipeTransform {
  constructor(private _sanitizer: DomSanitizer) {}
  transform(value: string): SafeResourceUrl {
    return this._sanitizer.bypassSecurityTrustResourceUrl(value);
  }
}
