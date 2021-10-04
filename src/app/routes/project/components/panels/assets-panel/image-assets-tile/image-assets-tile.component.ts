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
  ChangeDetectionStrategy,
  EventEmitter,
  Output,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { assetTileMenuConfig, AssetTileMenuActions } from './image-assets-tile.config';
import { getAssetUrl } from 'cd-common/utils';
import * as cd from 'cd-interfaces';
import { downloadResource } from './image-asset.utils';

type InputElement = ElementRef<HTMLInputElement>;

@Component({
  selector: 'app-image-assets-tile',
  templateUrl: './image-assets-tile.component.html',
  styleUrls: ['./image-assets-tile.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImageAssetsTileComponent {
  private _asset?: cd.IProjectAsset;
  private _uploadStatus: cd.IProjectAssetUploadStatus | undefined;
  public menuConfig = assetTileMenuConfig;
  public uploadPending = false;
  public thumbnailSrc = '';
  public label = '';

  @Input()
  public set asset(value: cd.IProjectAsset | undefined) {
    this._asset = value;
    if (!value) return;
    this.label = value.name;
    this.thumbnailSrc = value ? getAssetUrl(value.urls, cd.AssetSizes.BigThumbnail) : '';
  }
  public get asset(): cd.IProjectAsset | undefined {
    return this._asset;
  }

  @Input()
  public set uploadStatus(value: cd.IProjectAssetUploadStatus | undefined) {
    this._uploadStatus = value;
    this.uploadPending = !!(value && !value.finishing);
  }

  public get uploadStatus(): cd.IProjectAssetUploadStatus | undefined {
    return this._uploadStatus;
  }

  @Output() labelChange = new EventEmitter<string>();
  @Output() deleteAsset = new EventEmitter<cd.IProjectAsset>();
  @Output() replaceAsset = new EventEmitter<cd.IProjectAsset>();

  @ViewChild('nameInput', { read: ElementRef, static: true }) nameInput?: InputElement;

  get isSVG() {
    return this.asset && this.asset.imageType === cd.ImageMime.SVG;
  }

  onAssetNameChange(e: Event) {
    const value = (e.currentTarget as HTMLInputElement).value;
    this.labelChange.emit(value);
  }

  onInputMousedown(e: MouseEvent) {
    e.stopImmediatePropagation();
  }

  onMenuSelect = ({ id }: cd.IMenuConfig) => {
    if (!this.asset) return;
    // prettier-ignore
    switch (id) {
      case AssetTileMenuActions.Delete: return this.deleteAsset.emit(this.asset);
      case AssetTileMenuActions.Rename: return this.startRename();
      case AssetTileMenuActions.Download: return this.downloadAsset(this.asset);
      case AssetTileMenuActions.Replace: return this.replaceAsset.emit(this.asset);
      default: break;
    }
  };

  downloadAsset(asset: cd.IProjectAsset) {
    downloadResource(asset.urls.original, asset.name);
  }

  get nameInputElem(): HTMLInputElement | undefined {
    return this.nameInput && this.nameInput.nativeElement;
  }

  startRename() {
    const { nameInputElem } = this;
    if (!nameInputElem) return;
    nameInputElem.setSelectionRange(0, nameInputElem.value.length);
    nameInputElem.focus();
  }
}
