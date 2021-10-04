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
  map,
  withLatestFrom,
  filter,
  distinctUntilChanged,
  debounceTime,
  tap,
} from 'rxjs/operators';
import { Observable } from 'rxjs';
import { PROJECT_ID_ROUTE_PARAM } from 'src/app/configs/routes.config';
import { ROUTER_NAVIGATION, RouterNavigationAction } from '@ngrx/router-store';
import { DndDirectorService } from '../../dnd-director/dnd-director.service';
import { getPageTitle } from '../../utils/project.utils';
import { ProjectChangeCoordinator } from 'src/app/database/changes/project-change.coordinator';
import { ProjectContentService } from 'src/app/database/changes/project-content.service';
import { Title } from '@angular/platform-browser';
import { createEffect, Actions, ofType } from '@ngrx/effects';
import { Injectable } from '@angular/core';
import * as actions from '../actions';
import * as appStoreModule from 'src/app/store';
import * as cd from 'cd-interfaces';
import { deepCopy } from 'cd-utils/object';
import { createProjectChangePayload } from 'cd-common/utils';

@Injectable()
export class ProjectDataEffects {
  constructor(
    private actions$: Actions,
    private _titleService: Title,
    private _dndSerivce: DndDirectorService,
    private _projectChangeCoordinator: ProjectChangeCoordinator,
    private _projectContentService: ProjectContentService
  ) {}

  /**
   * Update project in database
   */
  updateInDb$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType<actions.ProjectDataUpdate>(actions.PROJECT_DATA_UPDATE),
        withLatestFrom(this._projectContentService.currentUserIsProjectEditor$),
        filter(([, editor]) => editor),
        map(([action]) => action),
        withLatestFrom(this._projectContentService.project$),
        filter(([, proj]) => proj !== undefined),
        filter(([action, project]) => action.updateDatabase && project !== undefined),
        map(([action, project]) => {
          if (!project) return;
          const { id } = project;
          const { payload: update } = action;
          const type = cd.EntityType.Project;
          const updates: cd.IUpdateChange<cd.IProject>[] = [{ id, update }];
          const payload: cd.IProjectChangePayload = { type, updates };
          return this._projectChangeCoordinator.dispatchChangeRequest([payload]);
        })
      ),
    { dispatch: false }
  );

  /**
   * Delete home board in database
   */
  deleteHomeBoard$ = createEffect(() =>
    this.actions$.pipe(
      ofType(actions.PROJECT_DATA_DELETE_HOME_BOARD),
      withLatestFrom(this._projectContentService.currentUserIsProjectEditor$),
      filter(([, editor]) => editor),
      map(([action]) => action),
      withLatestFrom(this._projectContentService.project$),
      filter(([, proj]) => proj !== undefined),
      map(() => {
        // TODO: Allow null value for homeBoardId (occurs when no boards in project)
        return new actions.ProjectDataUpdate({ homeBoardId: null } as any, false);
      })
    )
  );

  /**
   * Disconnect project when navigating away from it
   */
  disconnect$: Observable<actions.DisconnectProject | undefined> = createEffect(() =>
    this.actions$.pipe(
      ofType(ROUTER_NAVIGATION),
      withLatestFrom(this._projectContentService.project$),
      filter(([, proj]) => proj !== undefined),
      map(([action, projectData]) => {
        const router = (action as RouterNavigationAction<appStoreModule.IRouterStateUrl>).payload;
        const projectIdRouteParam = router.routerState.params[PROJECT_ID_ROUTE_PARAM];
        return [projectIdRouteParam, projectData];
      }),
      filter(([projectIdRouteParam, projectData]) => {
        // only dispatch if a project is currently loaded
        // and a different project or non-project page is navigated to
        return projectIdRouteParam !== projectData.id;
      }),
      map(() => {
        this._dndSerivce.disconnectProject();
        return new actions.DisconnectProject();
      })
    )
  );

  /**
   * Set home board if nothing is set and we create a board
   */
  boardCreatedForHome$ = createEffect(
    () =>
      this._projectContentService.boardsArray$.pipe(
        withLatestFrom(this._projectContentService.project$),
        filter(([boards, project]) => {
          return !project?.homeBoardId && boards.length > 0;
        }),
        tap(([boards, project]) => {
          const homeBoardId = boards[0].id;
          if (!project || !homeBoardId) return;
          const update: cd.IUpdateChange<cd.IProject> = { id: project.id, update: { homeBoardId } };
          const payload = createProjectChangePayload(undefined, [update]);
          this._projectChangeCoordinator.dispatchChangeRequest([payload], false);
        })
      ),
    { dispatch: false }
  );

  /**
   * Delete homeBoardId on project doc if all boards are deleted
   */
  deleteHomeBoardId$ = createEffect(
    () =>
      this._projectContentService.boardsArray$.pipe(
        filter((boards) => boards.length === 0),
        withLatestFrom(this._projectContentService.project$),
        filter(([, project]) => !!project),
        tap(([, project]) => {
          const updatedProject = deepCopy(project) as cd.IProject;
          delete updatedProject.homeBoardId;
          // Create a payload with a set instead of update so we can remove the homeBoardId field
          // rather than writing an undefined value
          const payload = createProjectChangePayload([updatedProject]);
          this._projectChangeCoordinator.dispatchChangeRequest([payload], false);
        })
      ),
    { dispatch: false }
  );

  /**
   * Set home board (to the next board) if current home board is deleted
   * This is a bit tricky since we allow deleting multiple boards at the same time ---
   * we need some logic to find the next undeleted board.
   */
  checkDeletedHomeBoards$ = createEffect(
    () =>
      this._projectContentService.boardsMap$.pipe(
        withLatestFrom(this._projectContentService.project$),
        filter(([boardsMap, project]) => !!project?.homeBoardId && !boardsMap[project.homeBoardId]),
        tap(([boardsMap, project]) => {
          // If there are no remaining boards, we just reset the home board to nothing.
          // else, just set the home board as the first board in the list
          const boardIds = Object.keys(boardsMap);
          const updatedProject = deepCopy(project) as cd.IProject;
          updatedProject.homeBoardId = boardIds[0] || undefined;

          // Once again, use a set change in case we need to set to undefined
          const payload = createProjectChangePayload([updatedProject]);
          this._projectChangeCoordinator.dispatchChangeRequest([payload], false);
        })
      ),
    { dispatch: false }
  );

  /**
   * Update page title
   */
  updateTitle$ = createEffect(
    () =>
      this._projectContentService.project$.pipe(
        debounceTime(1000),
        map((project) => (project && project.name) || ''),
        distinctUntilChanged((x, y) => x === y),
        map((projectName) => this._titleService.setTitle(getPageTitle(projectName)))
      ),
    { dispatch: false }
  );
}
