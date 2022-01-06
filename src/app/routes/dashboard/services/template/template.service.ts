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

import { FirebaseCollection, FirebaseField, FirebaseQueryOperation } from 'cd-common/consts';
import { Injectable } from '@angular/core';
import { Observable, forkJoin, of } from 'rxjs';
import { DatabaseService } from 'src/app/database/database.service';
import { switchMap, map } from 'rxjs/operators';
import { projectPathForId } from 'src/app/database/path.utils';
import { ScreenshotService } from 'src/app/services/screenshot-lookup/screenshot-lookup.service';
import * as cd from 'cd-interfaces';

type ImageUrlResult = string | undefined;
type PublishEntryWithProject = [cd.IPublishEntry, cd.IProject | undefined];
type PublishEntryWithImages = [cd.IPublishEntry, cd.IProject, ImageUrlResult, ImageUrlResult[]];

const TEMPLATE_IMAGES_LIMIT = 20;

@Injectable({
  providedIn: 'root',
})
export class TemplateService {
  constructor(
    private _databaseService: DatabaseService,
    private _screenshotService: ScreenshotService
  ) {}

  public getProjectTemplates = (): Observable<cd.ILoadedTemplate[]> => {
    const publishEntries$ = this._databaseService.getCollection<cd.IPublishEntry>(
      FirebaseCollection.PublishEntries,
      (ref) =>
        ref.where(
          FirebaseField.DocumentType,
          FirebaseQueryOperation.Equals,
          cd.PublishType.Template
        )
    );

    const projectTemplates$: Observable<cd.ILoadedTemplate[]> = publishEntries$.pipe(
      switchMap((publishEntries) => {
        if (!publishEntries.length) return of([]);

        const projectRequests: Observable<PublishEntryWithProject>[] = publishEntries.map(
          (entry) => {
            const latestVersion = entry.versions[0];
            const projectPath = projectPathForId(latestVersion.projectId);
            const project$ = this._databaseService.getDocumentData<cd.IProject>(projectPath);

            // using forkJoin here allows creating PublishEntryWithProject tuple
            return forkJoin([of(entry), project$]);
          }
        );
        return forkJoin(projectRequests);
      }),
      // filter out any undefined
      map((results: PublishEntryWithProject[]) => results.filter((r) => !!r[1])),
      // get download urls for all board screenshots in project
      switchMap((results: PublishEntryWithProject[]) => {
        const resultsWithImages: Observable<PublishEntryWithImages>[] = [];

        for (const res of results) {
          const [publishEntry, proj] = res;
          const project = proj as cd.IProject; // null check occurred in map above
          const { homeBoardId } = project;

          // get image for home board
          const homeImage$ = this._getImageUrl(homeBoardId);

          // get other images, and don't duplicate request for home board image
          const boards$ = this._databaseService.getProjectBoards(project, TEMPLATE_IMAGES_LIMIT);

          const otherImages$ = boards$.pipe(
            switchMap((boards) => {
              const otherBoardIds = boards.map((b) => b.id).filter((id) => id !== homeBoardId);
              if (!otherBoardIds.length) return of([]);
              const otherBoardImages$ = otherBoardIds.map(this._getImageUrl);
              return forkJoin(otherBoardImages$);
            })
          );

          const withImages$ = forkJoin([of(publishEntry), of(project), homeImage$, otherImages$]);
          resultsWithImages.push(withImages$);
        }

        return resultsWithImages.length ? forkJoin(resultsWithImages) : of([]);
      }),
      map((resultsWithImages) => {
        const loadedTemplates: cd.ILoadedTemplate[] = resultsWithImages.map((res) => {
          const [publishEntry, project, homeBoardImageUrl, otherImageUrls] = res;
          const { id, name } = publishEntry;
          const allUrlResults = [homeBoardImageUrl, ...otherImageUrls];
          const allBoardImageUrls = allUrlResults.filter((url) => !!url) as string[];
          return {
            id,
            name,
            publishEntry,
            project,
            homeBoardImageUrl,
            allBoardImageUrls,
          } as cd.ILoadedTemplate;
        });
        return loadedTemplates;
      })
    );

    return projectTemplates$;
  };

  private _getImageUrl = (id?: string): Observable<ImageUrlResult> => {
    if (!id) return of(undefined);
    return this._screenshotService
      .getScreenshot(id, cd.ScreenshotSizes.Original)
      .pipe(map((ref) => ref.url));
  };
}
