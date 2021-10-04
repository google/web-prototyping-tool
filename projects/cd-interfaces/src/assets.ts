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

import { AssetSizes, IStringMap } from './index';
import { EntityType } from './entity-types';
import { IProjectContentDocument } from './project';
import { ImageMime } from './files';
import { DimensionToArgs } from './image';

export type ProjectAssetUrls = Record<AssetSizes, string>;
export type ProjectAssetBlobs = Record<AssetSizes, Blob>;

export enum AssetCategory {
  ProductIcon = 'product-icon',
  // SystemIcon = 'system-icon',
  ProductCard = 'product-card',
}

export enum AssetVariant {
  Color = 'color',
  Multicolor = 'multicolor',
  Flat = 'flat',
  Shaded = 'shaded',
  Blue = 'blue',
}

export interface IAssetsImporterItem {
  category: string;
  name: string;
  dir: string;
  variants: IStringMap<string | undefined>;
  tags: string[];
}

export interface IProjectAssetUploadStatus {
  progress: number;
  finishing: boolean;
  failed: boolean;
}

export interface IProjectAsset extends IProjectContentDocument {
  created: number;
  density: number;
  height: number;
  id: string;
  imageType: ImageMime;
  name: string;
  owner: string;
  readonly type: EntityType.Asset;
  urls: ProjectAssetUrls;
  width: number;
}

export type AssetMap = Record<string, IProjectAsset>;
export type IOrderedProjectAssets = ReadonlyArray<IProjectAsset>;

export type AssetConversionArgsConfig = Record<
  Exclude<AssetSizes, AssetSizes.Original>,
  DimensionToArgs
>;
