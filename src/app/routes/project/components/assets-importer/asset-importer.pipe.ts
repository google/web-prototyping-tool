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
import { makePluralFromLength } from 'cd-utils/string';
import * as cd from 'cd-interfaces';

const filterTags = (item: cd.IAssetsImporterItem, query: string): boolean => {
  return item.tags.join(' ').includes(query);
};

const filterCategory = (item: cd.IAssetsImporterItem, section: string): boolean => {
  return item.category === section;
};

@Pipe({ name: 'assetCountPipe' })
export class AssetCountPipe implements PipeTransform {
  transform(section: string, assets: cd.IAssetsImporterItem[], query: string): number {
    const sectionAssets = assets.filter((item: any) => {
      return filterCategory(item, section) && filterTags(item, query);
    });

    return sectionAssets.length;
  }
}

@Pipe({ name: 'assetSectionFilterPipe' })
export class AssetSectionFilter implements PipeTransform {
  transform(
    section: string,
    assets: cd.IAssetsImporterItem[],
    query: string
  ): cd.IAssetsImporterItem[] {
    return query === ''
      ? assets.filter((item) => filterCategory(item, section))
      : assets.filter((item) => filterTags(item, query));
  }
}

@Pipe({ name: 'selectionCountLabelPipe' })
export class AssetSelectionCountLabelPipe implements PipeTransform {
  transform(count: number): string {
    const asset = makePluralFromLength('asset', count);
    return `${count} ${asset} selected`;
  }
}
