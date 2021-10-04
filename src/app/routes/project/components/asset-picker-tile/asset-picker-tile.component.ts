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

import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  HostBinding,
  OnChanges,
  SimpleChanges,
} from '@angular/core';

import * as cd from 'cd-interfaces';
import * as assetUtils from '../../utils/assets.utils';
import { generateVariants, IAssetVariant, buildVariantSrc } from './asset-picker-tile.utils';

@Component({
  selector: 'app-asset-picker-tile',
  templateUrl: './asset-picker-tile.component.html',
  styleUrls: ['./asset-picker-tile.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AssetPickerTileComponent implements OnChanges {
  private _hoverPreview = '';

  public variants: IAssetVariant[] = [];
  public previewItems: string[] = [];

  @Output() variantSelectionAdd = new EventEmitter<string>();
  @Output() variantSelectionRemove = new EventEmitter<string>();
  @Output() variantSelectionRemoveAll = new EventEmitter<string[]>();

  @Input() asset: cd.IAssetsImporterItem = {} as cd.IAssetsImporterItem;
  @Input() selectedAssets = new Set<string>();

  @Input()
  @HostBinding('class.has-selection')
  hasSelection = false;

  get name() {
    return this.asset.name;
  }

  get hoverPreview(): string {
    return this._hoverPreview;
  }

  set hoverPreview(preview: string) {
    const alreadySelected = this.previewItems.includes(preview);
    this._hoverPreview = preview && !alreadySelected ? preview : '';
  }

  get hasMultipleVariants() {
    return this.variants.length > 1;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.asset) {
      this.buildVariants();
    }

    if (changes.asset || changes.selectedAssets) {
      const { selectedAssets } = this;
      this.hasSelection = this.variants.some((variant) => selectedAssets.has(variant.src));
      this.previewItems = this.variants
        .filter((variant) => selectedAssets.has(variant.src))
        .map((variant) => variant.src);
    }
  }

  //  HOTPATCH: Chrome bug with images + grid
  get rows() {
    return this.count > 2 ? '50% 50%' : '100%';
  }

  get cols() {
    return this.count <= 1 ? '1fr' : '1fr 1fr';
  }

  get count(): number {
    return this.previewItems.length;
  }
  // END HOTPATCH///////////////////////////

  buildVariants() {
    const { asset } = this;
    this.variants = generateVariants(asset);
  }

  get defaultVariantSource() {
    const defaultVariantKey: string = assetUtils.getDefaultVariant(this.asset);
    const { asset } = this;
    const src = asset.variants[defaultVariantKey] || '';
    return buildVariantSrc(asset.dir, src);
  }

  onPreviewClick() {
    if (this.hasSelection) {
      const allVariantSrcs = this.variants.map((item) => item.src);
      return this.variantSelectionRemoveAll.emit(allVariantSrcs);
    }
    const { defaultVariantSource } = this;
    if (this.selectedAssets.has(defaultVariantSource)) return;
    this.variantSelectionAdd.emit(defaultVariantSource);
  }

  onVariantToggle(e: Event, variantSrc: string) {
    e.stopImmediatePropagation();

    this.hoverPreview = '';
    const isSelected = this.selectedAssets.has(variantSrc);
    if (isSelected) return this.variantSelectionRemove.emit(variantSrc);
    return this.variantSelectionAdd.emit(variantSrc);
  }

  onVariantMouseEnter(variantSrc: string) {
    this.hoverPreview = variantSrc;
  }

  onVariantMouseLeave() {
    this.hoverPreview = '';
  }
}
