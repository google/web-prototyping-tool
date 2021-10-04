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
import * as consts from 'cd-common/consts';
import { Injectable } from '@angular/core';
import { AngularFireStorage } from '@angular/fire/storage';
import { environment } from 'src/environments/environment';
import { from, Observable, zip, of } from 'rxjs';
import { map, catchError, switchMap, take } from 'rxjs/operators';
import { DatabaseService } from '../../database/database.service';
import { createScreenshotTaskDocumentId, createScreenshotTask } from 'cd-common/utils';
import { screenshotTaskPathForId } from 'src/app/database/path.utils';
import { ToastsService } from '../toasts/toasts.service';

@Injectable({
  providedIn: 'root',
})
export class ScreenshotService {
  constructor(
    private afStorage: AngularFireStorage,
    private databaseService: DatabaseService,
    private toastService: ToastsService
  ) {}

  getScreenshot(
    id: string,
    size: cd.ScreenshotSizes = cd.ScreenshotSizes.BigThumbnailXHDPI
  ): Observable<cd.IScreenshotRef> {
    return from(
      this.afStorage.storage.ref(consts.SCREENSHOTS_PATH_PREFIX).child(id).listAll()
    ).pipe(
      map((results) => {
        const filename = consts.sizeToFileNameMap[size];
        if (!filename) throw new Error('Invalid screenshot size requested');
        const ref = results.items.find((i) => i.name === filename);
        if (!ref) throw new Error('No screenshot found for ' + id);
        return ref;
      }),
      switchMap((ref) => from(ref.getDownloadURL())),
      take(1),
      map((url) => ({ id, url })),
      catchError((err: any) => {
        if (!environment.production) console.log(err?.message);
        const ref = { id };
        return of(ref) as Observable<cd.IScreenshotRef>;
      })
    );
  }

  public getScreenshotUrl = (
    ids: string[],
    size: cd.ScreenshotSizes = cd.ScreenshotSizes.BigThumbnailXHDPI
  ): Observable<cd.IScreenshotRef[]> => {
    const list = ids.map((id) => this.getScreenshot(id, size));
    return zip(...list);
  };

  /**
   *
   * @param targetId The id of either a board, symbol
   *
   * @param projectId
   */
  public triggerCreateScreenshot(targetId: string, projectId: string, showToast = true) {
    if (showToast) this.showGeneratingScreenshotsToast('Generating screenshot');
    const screenshotTask = createScreenshotTask(projectId, targetId);
    const docId = createScreenshotTaskDocumentId(targetId);
    const docPath = screenshotTaskPathForId(docId);
    this.databaseService.setDocument(docPath, screenshotTask);
  }

  public triggerCreateProjectScreenshots(project: cd.IProject) {
    this.showGeneratingScreenshotsToast('Generating screenshots');
    const boards$ = this.databaseService.getProjectBoards(project);

    boards$.pipe(take(1)).subscribe((boards) => {
      for (const board of boards) {
        this.triggerCreateScreenshot(board.id, project.id, false);
      }
    });
  }

  private showGeneratingScreenshotsToast(message: string) {
    this.toastService.addToast({ message });
  }
}
