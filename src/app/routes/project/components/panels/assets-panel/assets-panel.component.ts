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
  OnDestroy,
  ChangeDetectorRef,
  HostBinding,
  OnInit,
  Output,
  EventEmitter,
} from '@angular/core';

import {
  OverlayService,
  AbstractOverlayControllerDirective,
  ConfirmationDialogComponent,
} from 'cd-common';
import { AssetsUploadService } from '../../../services/assets/assets-upload.service';
import { AssetsService } from '../../../services/assets/assets.service';
import { AssetsImporterComponent } from '../../assets-importer/assets-importer.component';
import { PanelConfig } from '../../../configs/project.config';
import { Subscription, ReplaySubject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import * as actions from 'src/app/routes/project/store';
import * as cd from 'cd-interfaces';

@Component({
  selector: 'app-assets-panel',
  templateUrl: './assets-panel.component.html',
  styleUrls: ['./assets-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AssetsPanelComponent
  extends AbstractOverlayControllerDirective
  implements OnDestroy, OnInit
{
  private readonly _destroyed = new ReplaySubject<void>(1);
  private _subscriptions = new Subscription();
  public hasAssets = false;
  public assets: cd.IOrderedProjectAssets = [];
  public searchString: string | undefined;
  public uploadStatus: cd.IStringMap<cd.IProjectAssetUploadStatus> = {};

  @Output() assetAddFired = new EventEmitter<string>();

  @HostBinding('class.upload-dragging') public uploadDragging = false;
  @HostBinding('class.upload-dragging-over') public uploadDraggingOver = false;

  constructor(
    public overlayService: OverlayService,
    private _assetsService: AssetsService,
    private _assetsUploadService: AssetsUploadService,
    private readonly _cdRef: ChangeDetectorRef,
    private readonly _projectStore: Store<actions.IProjectState>
  ) {
    super(overlayService);
  }

  ngOnInit() {
    const orderedAssets$ = this._assetsService.orderedAssets$;
    const uploadStream$ = this._assetsUploadService.uploadStatusStream$;
    this._subscriptions.add(orderedAssets$.subscribe(this.onAssetsSubscription));
    this._subscriptions.add(uploadStream$.subscribe(this.onAssetUploadStatus));
  }

  onAssetUploadStatus = (status: cd.IStringMap<cd.IProjectAssetUploadStatus>) => {
    this.uploadStatus = status;
    this._cdRef.markForCheck();
  };

  onAssetsSubscription = (assets: cd.IOrderedProjectAssets) => {
    this.assets = assets;
    this.hasAssets = this.assets.length > 0;
    this._cdRef.markForCheck();
  };

  onAssetAddClick = () => {
    const assetsImporterModal = this.showModal<AssetsImporterComponent>(AssetsImporterComponent);
    this._subscriptions.add(
      assetsImporterModal.instance.addSelectedFiles
        .pipe(takeUntil(this._destroyed))
        .subscribe(this.onAssetGallerySelection)
    );
  };

  onAssetGallerySelection = (filePaths: string[]) => {
    this._projectStore.dispatch(new actions.PanelSetActivityForced(PanelConfig.Assets, {}));
    this._assetsUploadService.uploadFilesFromAssetGallery(filePaths);
  };

  trackByFn = (_index: number, item: cd.IProjectAsset) => {
    return item.id;
  };

  onLabelChange(label: string, assetId: string) {
    this._assetsService.onNameChanged(assetId, label);
  }

  onDeleteAsset(asset: cd.IProjectAsset) {
    const cmpRef = this.showModal<ConfirmationDialogComponent>(ConfirmationDialogComponent);
    cmpRef.instance.title = 'Delete asset?';
    cmpRef.instance.message = `Asset "${asset.name}" will be permanently deleted.`;
    cmpRef.instance.confirm
      .pipe(takeUntil(this._destroyed))
      .subscribe(() => this.onDeleteAssetConfirm(asset));
  }

  onDeleteAssetConfirm = (asset: cd.IProjectAsset) => {
    this._assetsUploadService.deleteAsset(asset);
  };

  onReplaceAsset(asset: cd.IProjectAsset) {
    this._assetsUploadService.replaceAsset(asset);
  }

  onUploadFileClick() {
    this._projectStore.dispatch(new actions.AssetsSelectFiles());
  }

  ngOnDestroy() {
    this._destroyed.next();
    this._destroyed.complete();
    this._subscriptions.unsubscribe();
    super.ngOnDestroy();
  }
}
