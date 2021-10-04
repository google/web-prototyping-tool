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
  ChangeDetectionStrategy,
  Input,
  Output,
  EventEmitter,
  OnDestroy,
} from '@angular/core';
import * as cd from 'cd-interfaces';
import { AssetsService } from 'src/app/routes/project/services/assets/assets.service';
import { ToastsService } from 'src/app/services/toasts/toasts.service';
import { Subscription, fromEvent } from 'rxjs';
import { openLinkInNewTab } from 'cd-utils/url';
import { isImageOriginalSize } from '../../../../utils/assets.utils';

interface ISourceChange {
  src: cd.IValue;
}

@Component({
  selector: 'app-image-source-props',
  templateUrl: './image-source-props.component.html',
  styleUrls: ['./image-source-props.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImageSourcePropsComponent implements OnDestroy {
  private _subscription = Subscription.EMPTY;
  public binding = '';
  public url = '';
  public showRemoteURL = false;
  public currentToast = '';

  @Input()
  public set src(src: cd.IValue | undefined) {
    if (!src) return;
    const { id, value } = src;
    this.showRemoteURL = !id;
    this.url = String(value);
    this.binding = id ? id : '';
  }

  @Input() public set elementId(_id: string) {
    this.removeToastIfExists();
  }

  @Input() width?: cd.IValue;
  @Input() height?: cd.IValue;
  @Input() allowSizeUpdateToast = true;
  @Input() assetsMenu: ReadonlyArray<cd.ISelectItem> = [];

  @Output() sourceChange = new EventEmitter<ISourceChange>();
  @Output() action = new EventEmitter<cd.ISelectItem>();
  @Output() resetImageSize = new EventEmitter<void>();

  constructor(private _assetServce: AssetsService, private _toastService: ToastsService) {}

  emitValue(src: cd.IValue) {
    this.sourceChange.emit({ src });
  }

  onSourceSelect(item: cd.SelectItemOutput) {
    const { id: identifier, action, value } = item as cd.ISelectItem;
    if (action) {
      // Action is used to open the assets panel
      return this.action.emit(item as cd.ISelectItem);
    }

    const id = identifier ?? null;
    this.emitValue({ id, value });
    this.promptUserToUpdateSizeForAsset(id);
  }

  promptUserToUpdateSizeForAsset(assetId: string | null) {
    if (!assetId) return;
    const asset = this._assetServce.getAssetForId(assetId);
    if (!asset) return;
    this.checkDimensionsAndPromptUser(asset);
  }

  onOpenURL() {
    openLinkInNewTab(this.url);
  }

  isImageSizeSameAsElement(w: number, h: number) {
    const { width, height } = this;
    if (!width || !height) return false;
    if (width.value !== w || height.value !== h) return false;
    return true;
  }

  onImageLoad = (e: Event) => {
    const img = e.currentTarget as Partial<cd.IProjectAsset>;
    this.checkDimensionsAndPromptUser(img);
    this._subscription.unsubscribe();
  };

  checkDimensionsAndPromptUser(asset: Partial<cd.IProjectAsset>) {
    if (!this.allowSizeUpdateToast) return;
    const stylesPartial = { width: this.width, height: this.height };
    if (isImageOriginalSize(stylesPartial, asset)) return;
    this.removeToastIfExists();
    const { width, height } = asset;
    this.currentToast = this._toastService.addToast({
      iconName: 'image',
      message: `Update image size to match dimensions ${width} x ${height}?`,
      confirmLabel: 'Yes',
      callback: () => this.updateDimensions(),
    });
  }

  updateDimensions = () => {
    this.resetImageSize.emit();
  };

  onURLChange(url: cd.InputValueType) {
    const value = url as string;
    const img = new Image();
    this._subscription = fromEvent(img, 'load').subscribe(this.onImageLoad);
    img.src = value;
    this.emitValue({ id: null, value });
  }

  removeToastIfExists() {
    if (this.currentToast) {
      this._toastService.removeToast(this.currentToast);
    }
  }

  ngOnDestroy(): void {
    this._subscription.unsubscribe();
    this.removeToastIfExists();
  }
}
