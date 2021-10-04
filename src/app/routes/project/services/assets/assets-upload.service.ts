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

import { AbstractStorageService } from '../../../../services/storage/abstract-storage.service';
import { acceptedImageTypes, MAXIMUM_IMAGE_MB } from '../../configs/assets.config';
import { AngularFirestore, AngularFirestoreDocument } from '@angular/fire/firestore';
import { AssetsService } from './assets.service';
import { IAppState, getUser } from 'src/app/store';
import { filter, first } from 'rxjs/operators';
import { DatabaseService } from 'src/app/database/database.service';
import { ProjectContentService } from 'src/app/database/changes/project-content.service';
import { Injectable } from '@angular/core';
import { Observable, Subscription, BehaviorSubject, lastValueFrom } from 'rxjs';
import { projectContentsPathForId } from 'src/app/database/path.utils';
import { ToastsService } from 'src/app/services/toasts/toasts.service';
import { Store, select } from '@ngrx/store';
import { AnalyticsService } from 'src/app/services/analytics/analytics.service';
import { AnalyticsEvent, IAnalyticsEventParams } from 'cd-common/analytics';
import { createId } from 'cd-utils/guid';
import * as assetUtils from '../../utils/assets.utils';
import * as config from './assets-upload.config';
import * as utils from 'cd-utils/files';
import * as cd from 'cd-interfaces';

interface IUploadFileResult {
  assetId: string;
  metadata: utils.IImageFileMetadata;
}

type UploadStatusType = cd.IStringMap<cd.IProjectAssetUploadStatus>;

const SIZE_ERROR = `File cannot be larger than ${MAXIMUM_IMAGE_MB} MB`;
const DELETE_WITHOUT_PROJ_ERROR = 'Attempting to delete asset without project';
const UPLOAD_WITHOUT_PROJ_ERROR = 'Attempting to upload assets without project';
const UPLOAD_WITHOUT_AUTH = 'Attempting to upload assets without authorized user';

@Injectable({
  providedIn: 'root',
})
export class AssetsUploadService {
  private _subscriptions = new Subscription();
  private _projectId?: string;
  private _userId?: string;
  private _project$: Observable<cd.IProject | undefined>;

  public uploadStatusStream$ = new BehaviorSubject<UploadStatusType>({});

  constructor(
    private readonly _assetsService: AssetsService,
    private readonly _storageService: AbstractStorageService,
    private readonly _afs: AngularFirestore,
    private readonly _databaseService: DatabaseService,
    private readonly _appStore: Store<IAppState>,
    private _projectContentService: ProjectContentService,
    private _toastService: ToastsService,
    private _analyticsService: AnalyticsService
  ) {
    this._project$ = this._projectContentService.project$;
    this._subscriptions.add(this._project$.subscribe(this.onProjectSubscription));
    const getUser$ = this._appStore.pipe(select(getUser));
    this._subscriptions.add(getUser$.subscribe(this.onUserSubscription));
  }

  /** Uploads multiple files to backend storage.  See `uploadFile`. */
  uploadImageFiles = (
    files: File[] | null,
    showToast = true
  ): Promise<IUploadFileResult | undefined>[] => {
    if (files === null || files.length === 0) return [];

    // UI puts latest uploaded asset in the front, so if we don't reverse the
    // array, if user drags in [A, B, C], the displayed order will be [C, B, A].
    files = files.reverse();

    return files.map((file) => this.uploadImageFile(file, undefined, showToast));
  };

  uploadFilesFromAssetGallery = async (assets: string[]) => {
    this._toastService.addToast(config.IMPORT_ASSETS_TOAST);

    const files = await assetUtils.downloadFilesAndReturnImageBlobs(assets);
    await Promise.all(this.uploadImageFiles(files, false));

    for (const file of files) {
      const params: IAnalyticsEventParams = { items: [file] };
      this._analyticsService.logEvent(AnalyticsEvent.AssetsGallerySelection, params);
    }
    this.removeUploadingToast();
    this._toastService.addToast(config.ALL_UPLOADED_TOAST);
  };

  removeUploadingToast() {
    this._toastService.removeToast(config.UPLOADING_TOAST_ID);
  }

  showUploadToast() {
    this._toastService.addToast(config.UPLOADING_TOAST);
  }

  showUploadCompleteToast(filename: string) {
    this.removeUploadingToast();
    this._toastService.addToast(config.generateUploadCompleteToast(filename));
  }

  uploadImageFile = (
    file: File,
    density?: number,
    showToast = true
  ): Promise<IUploadFileResult | undefined> => {
    const { _projectId, _userId, _storageService } = this;
    if (!_projectId) throw new Error(UPLOAD_WITHOUT_PROJ_ERROR);
    if (!_userId) throw new Error(UPLOAD_WITHOUT_AUTH);

    return new Promise(async (resolve) => {
      // If invalid, show error message and return undefined for result
      if (!this.validateImageFile(file)) return resolve(undefined);

      // Show uploading message
      if (showToast) this.showUploadToast();

      const metadata = await utils.getImageFileMetadata(file);

      if (density) {
        metadata.density = density;
        metadata.width = Math.round(metadata.width / density);
        metadata.height = Math.round(metadata.height / density);
      }

      const assetId = createId();
      this.emitNewUploadStatus(assetId, { progress: 0, finishing: false, failed: false });

      const asset = assetUtils.generateAssetFromMetadata(assetId, _projectId, _userId, metadata);
      this._assetsService.addUploadingAsset(asset);

      // Store doc in database, but don't store blob urls in database
      const { urls, ...docWithoutBlobUrls } = asset;
      const docPath = projectContentsPathForId(docWithoutBlobUrls.id);
      const docRef = this._afs.doc<cd.IProjectAsset>(docPath);
      await this._databaseService.setDocument(docPath, docWithoutBlobUrls as cd.IProjectAsset);

      const remoteFilename = assetUtils.generateRemoteImageFilename(
        _projectId,
        assetId,
        docWithoutBlobUrls.imageType as cd.ImageMime
      );

      const uploadConfig = { id: assetId, owner: _userId };
      const progressStream = _storageService.uploadFile(remoteFilename, file, uploadConfig);

      await this.waitForUpload(docRef, progressStream, asset);

      utils.destroyImageFileMetadata(metadata);

      // Show success message
      if (showToast) this.showUploadCompleteToast(file.name);

      resolve({ assetId, metadata });
    });
  };

  /**
   * Validates all files before upload, including images, and other assets.
   * Currently, the MIME type and size is checked.  A toast message is shown on invalid.
   */
  validateImageFile(file: File): boolean {
    const { type, size } = file;

    // File type
    if (!utils.isImageMime(type)) {
      this.showInvalidMessage(config.FILE_ERROR);
      return false;
    }

    // Image type
    if (utils.isImageMime(type) && !(acceptedImageTypes as string[]).includes(file.type)) {
      this.showInvalidMessage(config.IMAGE_ERROR);
      return false;
    }

    // File size
    // TODO: Consider automatically resizing/compressing very large images
    if (size > MAXIMUM_IMAGE_MB * 1000000) {
      this.showInvalidMessage(SIZE_ERROR);
      return false;
    }

    return true;
  }

  private showInvalidMessage(message: string) {
    this._toastService.addToast({ iconName: 'warning', message });
  }

  selectFilesAndUpload = async () => {
    const files = await utils.selectFiles(acceptedImageTypes);
    if (!files) return;
    this.uploadImageFiles(files);
  };

  async replaceAsset({ id: oldId }: cd.IProjectAsset) {
    const { _projectId, _databaseService, _assetsService } = this;
    if (!_projectId) throw new Error(DELETE_WITHOUT_PROJ_ERROR);
    const files = await utils.selectFiles(acceptedImageTypes);
    const file = files && files[0];
    if (!file) return;
    const docPath = projectContentsPathForId(oldId);
    await _databaseService.deleteDocument(docPath);

    const upload = await this.uploadImageFile(file);
    if (upload) {
      _assetsService.replaceAsset(oldId, upload.assetId, '');
    }
  }

  private onProjectSubscription = (project: cd.IProject | undefined) => {
    this._projectId = project && project.id;
  };

  private onUserSubscription = (user: cd.IUser | undefined) => {
    this._userId = user && user.id;
  };

  private monitorProgressStream(id: string, progressStream: Observable<number>) {
    // No need to unsubscribe for this subscribe(), as Observable cleans up
    // after itself when the stream ends (which we guarantee in StorageService).
    progressStream.subscribe(
      (progress) => this.onUploadProgress(id, progress),
      (_error) => this.onUploadFailed(id),
      () => this.onUploadFinishing(id)
    );
  }

  private waitForUpload = (
    docRef: AngularFirestoreDocument,
    progressStream: Observable<number>,
    { id }: cd.IProjectAsset
  ): Promise<void> => {
    this.monitorProgressStream(id, progressStream);

    return lastValueFrom(
      docRef.valueChanges().pipe(
        filter((data) => !!data && !!data.urls),
        first()
      )
    ).then((data) => {
      if (!data || !data.urls) return;
      this._assetsService.onUrlChangedFromRemote(id, data.urls);
    });
  };

  private onUploadProgress = (id: string, progress: number) => {
    return this.emitNewUploadStatus(id, { progress });
  };

  private onUploadFinishing = (id: string) => this.emitNewUploadStatus(id, { finishing: true });

  private onUploadFailed = (id: string) => this.emitNewUploadStatus(id, { failed: true });

  private emitNewUploadStatus = (id: string, newStatus: Partial<cd.IProjectAssetUploadStatus>) => {
    const { uploadStatusStream$: _uploadStatusStream } = this;
    const statuses = _uploadStatusStream.getValue();
    const status = { ...statuses[id], ...newStatus };
    _uploadStatusStream.next({ ...statuses, [id]: status });
  };

  deleteAsset = (asset: cd.IProjectAsset) => {
    const { _projectId, _databaseService, _assetsService } = this;
    const { id } = asset;
    if (!_projectId) throw new Error(DELETE_WITHOUT_PROJ_ERROR);
    const docPath = projectContentsPathForId(id);
    _databaseService.deleteDocument(docPath);
    _assetsService.deleteAsset(id);
  };
}
