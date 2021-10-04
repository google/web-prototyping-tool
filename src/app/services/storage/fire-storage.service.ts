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

import { Injectable } from '@angular/core';
import { AbstractStorageService } from './abstract-storage.service';
import { ProgressStream } from '../../routes/project/interfaces/storage.interface';
import { AngularFireStorage } from '@angular/fire/storage';
import { AFStorageUploadHelper } from '../../routes/project/interfaces/afstorage-upload-helper.model';
import { IStringMap } from 'cd-interfaces';
import { Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';

const CACHE_CONTROL = 'private, max-age=31536000';

@Injectable({
  providedIn: 'root',
})
export class FireStorageService extends AbstractStorageService {
  constructor(private afStorage: AngularFireStorage, private httpService: HttpClient) {
    super();
  }

  uploadFile(path: string, blob: Blob, metadata?: IStringMap<string>): ProgressStream {
    const uploadTask = this.afStorage.upload(path, blob, {
      customMetadata: metadata,
      cacheControl: CACHE_CONTROL,
    });
    const helper = new AFStorageUploadHelper(uploadTask);

    return helper.getStream();
  }

  copyFile(srcPath: string, destPath: string, metadata?: IStringMap<string>): ProgressStream {
    return this._downloadFile(srcPath).pipe(
      switchMap((blob) => this.uploadFile(destPath, blob, metadata))
    );
  }

  deleteFile(path: string): void {
    this.afStorage.ref(path).delete();
  }

  private _downloadFile = (path: string): Observable<Blob> => {
    const downloadUrls$ = this.afStorage.ref(path).getDownloadURL();
    return downloadUrls$.pipe(
      switchMap((url) => this.httpService.get(url, { responseType: 'blob' }))
    );
  };
}
