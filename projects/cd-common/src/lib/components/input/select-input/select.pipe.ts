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
import { ISelectItem, SelectItemType } from 'cd-interfaces';

@Pipe({ name: 'selectedValuePipe' })
export class SelectedValuePipe implements PipeTransform {
  transform(data: ReadonlyArray<ISelectItem>, selectedIndex: number): string | undefined {
    if (selectedIndex === -1) return '';
    const item = data?.[selectedIndex];
    if (item.type === SelectItemType.Empty) return '';
    return item?.title || '';
  }
}

@Pipe({ name: 'selectedThumbnailPipe' })
export class SelectedThumbnailPipe implements PipeTransform {
  transform(data: ReadonlyArray<ISelectItem>, selectedIndex: number): string | undefined {
    if (selectedIndex === -1) return '';
    const item = data?.[selectedIndex];
    const isImage = item.type === SelectItemType.Image;
    return (isImage && item.value) || undefined;
  }
}
