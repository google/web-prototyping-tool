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

import { Pipe, PipeTransform } from '@angular/core';
import type { AssetMap, IValue } from 'cd-interfaces';
import { isBlobUrl } from 'cd-utils/files';

@Pipe({ name: 'imageLookupPipe', pure: false })
export class ImageLookupPipe implements PipeTransform {
  transform(source: IValue | undefined, assets: AssetMap, imageFallbackUrl: string): string {
    const id = source?.id;
    const idLookup = id ? assets[id]?.urls?.original : undefined;
    if (idLookup) return idLookup;

    const value = source?.value;
    if (value && !isBlobUrl(value as string)) return value as string;

    return imageFallbackUrl;
  }
}
