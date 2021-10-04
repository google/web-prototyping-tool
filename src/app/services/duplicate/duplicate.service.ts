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
import * as cd from 'cd-interfaces';
import * as consts from 'cd-common/consts';
import {
  replaceStringsInDocs,
  filterProjectToSymbol,
  duplicateProjectDoc,
  filterProjectToCodeComponent,
} from './duplicate.utils';
import { DatabaseService } from 'src/app/database/database.service';
import { Observable, of, forkJoin } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';
import { ToastsService } from '../toasts/toasts.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { constructProjectPath } from 'src/app/utils/route.utils';
import { Store } from '@ngrx/store';
import { convertUserToUserIdentity } from 'src/app/utils/user.utils';
import { AnalyticsEvent } from 'cd-common/analytics';
import * as appStoreModule from '../../store';
import { createId } from 'cd-utils/guid';

interface IDuplicationResults {
  project: cd.IProject;
  contents: cd.IProjectContentDocument[];
  idMap: Map<string, string>;
}

@Injectable({
  providedIn: 'root',
})
export class DuplicateService {
  private _copyInProgress = false;

  constructor(
    private _databaseService: DatabaseService,
    private _toastsService: ToastsService,
    private _analyticsService: AnalyticsService,
    private _appStore: Store<appStoreModule.IAppState>
  ) {}

  public duplicateProjectAndNavigate = (project: cd.IProject, newOwner: cd.IUser) => {
    if (!this._copyInProgress) {
      this._copyInProgress = true;
      this.duplicateProject(project, newOwner).subscribe((newProjectId) => {
        if (!newProjectId) return;
        const path = constructProjectPath(newProjectId);
        this._appStore.dispatch(new appStoreModule.AppGo({ path: [path] }));
        this._copyInProgress = false;
      });
    }
  };

  private getAnalyticsEvent = (userId: string, ownerId: string) => {
    return userId === ownerId
      ? AnalyticsEvent.ProjectDuplicateByOwner
      : AnalyticsEvent.ProjectDuplicateByNonOwner;
  };

  private duplicateProject = (
    project: cd.IProject,
    newOwner: cd.IUser,
    showToast = true
  ): Observable<string | undefined> => {
    const { name, owner } = project;
    const projectName = name || consts.UNTITLED_PROJECT_NAME;
    const copyingToastId = showToast && this._showDuplicatingNotice(name);

    const analyticsEvt = this.getAnalyticsEvent(newOwner.id, owner.id);
    this._analyticsService.logEvent(analyticsEvt);

    return this.createProjectDuplicates(project, newOwner).pipe(
      switchMap(({ project: newProject, contents }) => {
        const databaseWrites$ = this._databaseService.writeProjectAndContents(newProject, contents);
        return forkJoin([of(newProject.id), databaseWrites$]);
      }),
      map(([newProjectId]) => {
        if (copyingToastId) {
          this._toastsService.removeToast(copyingToastId);
          this._showDuplicationDone(projectName);
        }

        return newProjectId;
      }),
      catchError((err) => {
        this._analyticsService.sendError(err);
        if (copyingToastId) {
          this._toastsService.removeToast(copyingToastId);
          this._showDuplicationError(projectName);
        }
        return of(undefined);
      })
    );
  };

  // This function duplicates a project document and its associated content documents and returns them
  // It does not actually write the results to the database
  public createProjectDuplicates = (
    project: cd.IProject,
    newOwner: cd.IUser,
    filterToSymbolId?: string, // only duplicate documents that are required by this symbol id
    filterToCodeComponentId?: string // only duplicate documents that are required by this code component id
  ): Observable<IDuplicationResults> => {
    const userIdentity = convertUserToUserIdentity(newOwner);

    return this._databaseService.getProjectContents(project.id).pipe(
      map<cd.IProjectContentDocument[], [cd.IProject, cd.IProjectContentDocument[]]>(
        (projectContents) => {
          if (filterToSymbolId) {
            return filterProjectToSymbol(filterToSymbolId, project, projectContents);
          }
          if (filterToCodeComponentId) {
            return filterProjectToCodeComponent(filterToCodeComponentId, project, projectContents);
          }
          return [project, projectContents];
        }
      ),
      map(([origProject, origContents]) => {
        // create map that will track old strings to new strings
        // strings can be new doc ids, projectId, owner id, or download urls
        const idMap = new Map<string, string>();

        // create new id for project and store mapping
        const newProjectId = createId();
        idMap.set(origProject.id, newProjectId);

        // create new ids for all project content docs and store mapping
        for (const { id } of origContents) {
          const newId = createId();
          idMap.set(id, newId);
        }

        // create new project doc with new ids, name, timestamps, etc
        const projectDuplicate = duplicateProjectDoc(origProject, idMap, userIdentity);

        // create new project contents docs with new ids and download urls (for assets)
        const contents = replaceStringsInDocs(origContents, idMap);

        return { project: projectDuplicate, contents, idMap } as IDuplicationResults;
      })
    );
  };

  private _showDuplicatingNotice = (name: string): string => {
    const id = this._toastsService.addToast({
      message: `Copying ${name}...`,
      duration: -1,
      showLoader: true,
    });
    return id;
  };

  private _showDuplicationError = (name: string) => {
    this._toastsService.addToast({
      message: `Failed to copy ${name}`,
      iconName: 'error',
    });
  };

  private _showDuplicationDone = (name: string) => {
    this._toastsService.addToast({
      message: `Copied ${name}`,
    });
  };
}
