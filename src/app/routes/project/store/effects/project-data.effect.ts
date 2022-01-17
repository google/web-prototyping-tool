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
  switchMap,
  withLatestFrom,
  filter,
  distinctUntilChanged,
  debounceTime,
  tap,
  takeUntil,
} from 'rxjs/operators';
import { Observable, from, forkJoin, of } from 'rxjs';
import { PROJECT_ID_ROUTE_PARAM, RoutePath } from 'src/app/configs/routes.config';
import { ROUTER_NAVIGATION, RouterNavigationAction } from '@ngrx/router-store';
import { projectPathForId, pathForEntityType } from 'src/app/database/path.utils';
import { DatabaseService } from 'src/app/database/database.service';
import { RecordActionService } from '../../services/record-action/record-action.service';
import { DndDirectorService } from '../../dnd-director/dnd-director.service';
import { generateLoadLocalContentActions } from '../../utils/store.utils';
import { getPageTitle, processSyncOperationTimestamps } from '../../utils/project.utils';
import { DatabaseChangesService } from 'src/app/database/changes/database-change.service';
import { getLocalProjectDataForId } from '../../utils/offline.helper.utils';
import { Store, select } from '@ngrx/store';
import { Title } from '@angular/platform-browser';
import { createEffect, Actions, ofType } from '@ngrx/effects';
import { hasBoards, isBoard } from 'cd-common/models';
import { Injectable } from '@angular/core';
import { IProjectState } from '../reducers';
import * as actions from '../actions';
import * as appStoreModule from 'src/app/store';
import * as historyActions from '../actions/history.action';
import * as historySelectors from '../selectors/history.selector';
import * as projectSelectors from '../selectors/project-data.selector';
import * as utils from 'src/app/database/workers/offline.utils';
import * as cd from 'cd-interfaces';

const projectLog = (msg: string): void => console.log(`Project - ${msg}`);

@Injectable()
export class ProjectDataEffects {
  constructor(
    private actions$: Actions,
    private _titleService: Title,
    private _recordSerivce: RecordActionService,
    private _projectStore: Store<IProjectState>,
    private _dndSerivce: DndDirectorService,
    private _appStore: Store<appStoreModule.IAppState>,
    private _databaseService: DatabaseService,
    private _databaseChangesService: DatabaseChangesService
  ) {}

  /**
   * Get project data from database.
   * The project.guard triggers this action when navigating to the project route
   */

  query$ = createEffect(() =>
    this.actions$.pipe(
      ofType(actions.PROJECT_DATA_QUERY),
      withLatestFrom(this._projectStore.pipe(select(projectSelectors.getProjectDataLoaded))),
      filter(([, projectLoaded]) => !projectLoaded),
      withLatestFrom(this._appStore.pipe(select(appStoreModule.getRouterState))),
      switchMap(([, router]) => {
        const projectId = router.state.params[PROJECT_ID_ROUTE_PARAM] as string;
        const projectPath = projectPathForId(projectId);
        return this._databaseService.getDocument(projectPath);
      }),
      filter((doc) => {
        // TODO: what happens if project is deleted in DB but exists locally?
        if (!doc.exists) {
          // if project document does not exist, redirect to the project not found page
          const payload: appStoreModule.IGoPayload = { path: [RoutePath.ProjectNotFound] };
          this._projectStore.dispatch(new appStoreModule.AppGo(payload));
        }
        return doc.exists;
      }),
      switchMap((doc) => {
        // Check to see if we have data for this proejct in the local indexDB
        const projectDoc = doc.data() as Partial<cd.IProject>;
        const remoteProject = { id: doc.id, ...projectDoc } as cd.IProject;
        const localData = from(getLocalProjectDataForId(remoteProject.id));
        return forkJoin([of(remoteProject), localData]).pipe(
          takeUntil(this.actions$.pipe(ofType(actions.DISCONNECT_PROJECT)))
        );
      }),
      withLatestFrom(this._appStore.pipe(select(appStoreModule.getIsLocalDatabaseDisabled))),
      switchMap(([[remoteProject, localData], idbDisabled]) => {
        const loadRemoteActions = [
          new actions.ProjectDataQuerySuccess(remoteProject.id, remoteProject),
          new actions.ProjectContentQuery(),
        ];

        if (idbDisabled) {
          projectLog('Local data is disabled, retrieving remote data');
          return loadRemoteActions;
        }
        // If there is no data in local indexDB, dispatch actions to load project contents from remote
        if (!localData) {
          projectLog('No local data, retrieving remote data');
          return loadRemoteActions;
        }

        // If there is local data, check the timestamp on the project document to see which is newer
        const { project: localProject } = localData;
        const localTimestamp = localProject?.updatedAt;
        const { updatedAt } = remoteProject;
        const isRemoteDataNewer = utils.isRemoteDataNewerThanLocalData(updatedAt, localTimestamp);

        // if remote data is newer, load project contents from remote
        if (isRemoteDataNewer) {
          projectLog('Remote project is newer than local, loading remote data');
          return loadRemoteActions;
        }

        // Otherwise, load local data instead of remote
        projectLog('Local data is newer than remote data');
        const loadContentActions = generateLoadLocalContentActions(localData);
        const loadLocalActions = [
          new actions.ProjectDataQuerySuccess(localProject.id, localProject),
          ...loadContentActions,
          new actions.ProjectContentQuerySuccess(),
        ];

        // If remote data has same timestamp as local, don't compute any sync actions
        if (updatedAt?.seconds === localTimestamp?.seconds) return loadLocalActions;

        // if timestamps are not equal, we need to sync local data back to database
        loadLocalActions.push(new actions.SyncLocalDatabase(remoteProject, localData));
        return loadLocalActions;
      })
    )
  );

  /**
   * Update project in database
   */

  updateInDb$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType<actions.ProjectDataUpdate>(actions.PROJECT_DATA_UPDATE),
        withLatestFrom(this._projectStore.pipe(select(projectSelectors.getUserIsProjectEditor))),
        filter(([, editor]) => editor),
        map(([action]) => action),
        withLatestFrom(this._projectStore.pipe(select(projectSelectors.getProject))),
        filter(([, proj]) => proj !== undefined),
        filter(([action, project]) => action.updateDatabase && project !== undefined),
        map(([action, project]) => {
          if (!project) return;
          return this._databaseChangesService.updateProject(project.id, action.payload);
        })
      ),
    { dispatch: false }
  );

  undoRedoUpdate$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(historyActions.HISTORY_UNDO, historyActions.HISTORY_REDO),
        withLatestFrom(this._projectStore.pipe(select(historySelectors.getHistoryUndoneAction))),
        filter(([, undoneAction]) => {
          return !!undoneAction && undoneAction.type === actions.PROJECT_DATA_UPDATE;
        }),
        withLatestFrom(this._projectStore.pipe(select(projectSelectors.getProject))),
        withLatestFrom(this._projectStore.pipe(select(historySelectors.getHistoryCurrentState))),
        map(([[, project], destState]) => {
          if (!destState) throw new Error('No state to undo into');
          if (!project) throw new Error('Updating non-existent project');
          const updatePayload = destState.projectData;

          if (!updatePayload.project) throw new Error('No project to undo into');

          this._databaseChangesService.updateProject(project.id, updatePayload.project);
        })
      ),
    { dispatch: false }
  );

  /**
   * Delete home board in database
   */
  deleteHomeBoard$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(actions.PROJECT_DATA_DELETE_HOME_BOARD),
        withLatestFrom(this._projectStore.pipe(select(projectSelectors.getUserIsProjectEditor))),
        filter(([, editor]) => editor),
        map(([action]) => action),
        withLatestFrom(this._projectStore.pipe(select(projectSelectors.getProject))),
        filter(([, proj]) => proj !== undefined),
        map(([, proj]) => proj as cd.IProject),
        tap(({ id }) => {
          return this._databaseChangesService.updateProject(id, { homeBoardId: null } as any);
        })
      ),
    { dispatch: false }
  );

  /**
   * Disconnect project when navigating away from it
   */
  disconnect$: Observable<actions.DisconnectProject | undefined> = createEffect(() =>
    this.actions$.pipe(
      ofType(ROUTER_NAVIGATION),
      withLatestFrom(this._projectStore.pipe(select(projectSelectors.getProject))),
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
  boardCreatedForHome$: Observable<actions.ProjectDataUpdate> = createEffect(() =>
    this.actions$.pipe(
      ofType<actions.ElementPropertiesCreate>(actions.ELEMENT_PROPS_CREATE),
      withLatestFrom(this._projectStore.pipe(select(projectSelectors.getProject))),
      filter(([action, projectData]) => {
        return !projectData?.homeBoardId && hasBoards(action.payload);
      }),
      map(([action]) => {
        const { payload } = action;
        // assign home board as first board in payload
        const board = payload.find((model) => isBoard(model)) as cd.IBoardProperties;
        return new actions.ProjectDataUpdate({ homeBoardId: board.id }, false);
      })
    )
  );

  /**
   * Set home board (to the next board) if current home board is deleted
   * This is a bit tricky since we allow deleting multiple boards at the same time ---
   * we need some logic to find the next undeleted board.
   */

  checkDeletedHomeBoards$: Observable<
    actions.ProjectDataUpdate | actions.ProjectDataDeleteHomeBoard
  > = createEffect(() =>
    this.actions$.pipe(
      ofType<actions.ElementPropertiesDelete>(actions.ELEMENT_PROPS_DELETE),
      withLatestFrom(this._projectStore.pipe(select(projectSelectors.getProject))),
      filter(([{ payload }, projectData]) => {
        const homeId = projectData?.homeBoardId;
        if (!homeId) return false;
        const deletedModels = payload as cd.IBoardProperties[];
        return deletedModels.some((model) => model.id === homeId);
      }),
      map(([, projectData]) => {
        const project = projectData as cd.IProject;
        const { boardIds } = project;
        // If there are no remaining boards, we just reset the home board to nothing.
        // else, just set the home board as the first board in the list
        return boardIds.length < 1
          ? new actions.ProjectDataDeleteHomeBoard()
          : new actions.ProjectDataUpdate({ homeBoardId: boardIds[0] }, false);
      })
    )
  );

  updatedAtTimestamp$ = createEffect(() =>
    this.actions$.pipe(
      ofType(
        actions.ELEMENT_PROPS_CREATE,
        actions.ELEMENT_PROPS_UPDATE,
        actions.ELEMENT_PROPS_DELETE,
        actions.DESIGN_SYSTEM_UPDATE,
        actions.BUNDLED_UNDOABLE,
        actions.HISTORY_UNDO,
        actions.HISTORY_REDO
      ),
      debounceTime(1000),
      withLatestFrom(this._projectStore.pipe(select(projectSelectors.getProjectDataLoaded))),
      filter(([, loaded]) => loaded === true),
      // Don't update timestamp while recording
      filter(() => this._recordSerivce.isRecording === false),
      map(() => {
        const updatedAt = DatabaseService.getTimestamp();
        return new actions.ProjectDataUpdate({ updatedAt }, false, true);
      })
    )
  );

  updateTitle$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(
          actions.PROJECT_DATA_QUERY_SUCCESS,
          actions.PROJECT_DATA_UPDATE,
          actions.DISCONNECT_PROJECT
        ),
        debounceTime(1000),
        withLatestFrom(this._projectStore.pipe(select(projectSelectors.getProject))),
        map(([, project]) => project),
        map((project) => (project && project.name) || ''),
        distinctUntilChanged((x, y) => x === y),
        map((projectName) => this._titleService.setTitle(getPageTitle(projectName)))
      ),
    { dispatch: false }
  );

  // TODO: should we lock the UI until sync is complete?

  syncLocalDatabase$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType<actions.SyncLocalDatabase>(actions.SYNC_LOCAL_DATABASE),
        switchMap(({ remoteProject, localData }) => {
          const { project } = localData;
          const remoteProjectContents$ = this._databaseService.getProjectContents(project.id);
          return forkJoin([of(remoteProject), remoteProjectContents$, of(localData)]);
        }),
        switchMap(([remoteProject, remoteProjectContents, localData]) => {
          const remoteData = utils.convertProjectToOfflineState(
            remoteProject,
            remoteProjectContents
          );
          return utils.requestDataDiff(localData, remoteData);
        }),
        filter((diffResponse) => diffResponse.syncOperations.length > 0),
        map(processSyncOperationTimestamps),
        map((diffResponse: cd.IOfflineDiffResponse) => {
          projectLog('Got diff response. Sync operations: ');
          console.log(diffResponse.syncOperations);
          const batchPayload: cd.WriteBatchPayload = new Map();
          const deletionsSet = new Set<string>();

          for (const operation of diffResponse.syncOperations) {
            const { type, entityType, document, documentId } = operation;
            const docPath = pathForEntityType(documentId, entityType);

            if (type === cd.IOfflineSyncOperationType.Delete) {
              deletionsSet.add(docPath);
              continue;
            }

            if (document) batchPayload.set(docPath, document as cd.CdDatabaseDocument);
          }

          return this._databaseService.batchChanges(batchPayload, deletionsSet);
        })
      ),
    { dispatch: false }
  );
}
