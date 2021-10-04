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

import * as cd from 'cd-interfaces';
import { Injectable, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { AbstractStorageService } from 'src/app/services/storage/abstract-storage.service';
import { AngularFireStorage } from '@angular/fire/storage';
import { getBlobFromBlobUrl } from 'cd-utils/files';

@Injectable({
  providedIn: 'root',
})
export class UploadService implements OnDestroy {
  private _subscriptions = new Subscription();

  constructor(
    private readonly _storageService: AbstractStorageService,
    private afs: AngularFireStorage
  ) {}

  ngOnDestroy() {
    this._subscriptions.unsubscribe();
  }

  downloadFile = async (path: string): Promise<Blob> => {
    const fileRef = this.afs.storage.ref(path);
    const downloadUrl = await fileRef.getDownloadURL();
    const blob = await getBlobFromBlobUrl(downloadUrl);
    return blob;
  };

  downloadMultipleFiles = (paths: string[]): Promise<Blob[]> => {
    return Promise.all(paths.map(this.downloadFile));
  };

  getFileMetadata = async (path: string): Promise<cd.IFirebaseStorageFileMetadata | undefined> => {
    const fileRef = this.afs.storage.ref(path);
    const metadata: cd.IFirebaseStorageFileMetadata | undefined = await fileRef.getMetadata();
    return metadata;
  };

  uploadFile = (
    file: File,
    uploadPath: string,
    onComplete?: (uploadPath: string, fileName: string) => void,
    onError?: (err: any) => void,
    onProgress?: (progress: number) => void
  ) => {
    const fileName = file.name;
    const metadata: cd.IStringMap<string> = {};
    const metadataWithType = { ...metadata, type: file.type };
    const upload$ = this._storageService.uploadFile(uploadPath, file, metadataWithType);
    const subscription = upload$.subscribe(
      (progress: number) => onProgress && onProgress(progress),
      (error: any) => {
        if (onError) onError(error);
        subscription.unsubscribe();
      },
      () => {
        if (onComplete) onComplete(uploadPath, fileName);
        subscription.unsubscribe();
      }
    );

    this._subscriptions.add(subscription);
  };
}
