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

import { withLatestFrom, switchMap, tap, filter, map, takeUntil } from 'rxjs/operators';
import { DatabaseService } from 'src/app/database/database.service';
import { createEffect, Actions, ofType } from '@ngrx/effects';
import {
  getElementPropertiesLoaded,
  getProject,
  getElementProperties,
  getUserIsProjectEditor,
} from '../selectors';
import { Injectable } from '@angular/core';
import { IProjectState } from '../reducers';
import { getLocalProjectDataForId } from '../../utils/offline.helper.utils';
import { PROJECT_ID_ROUTE_PARAM, Route } from 'src/app/configs/routes.config';
import { generateLoadContentActions, generateSyncContentActions } from '../../utils/store.utils';
import { DebugService } from 'src/app/services/debug/debug.service';
import { Store, select } from '@ngrx/store';
import { of, fromEvent, forkJoin, from, Observable } from 'rxjs';
import { AnalyticsService } from 'src/app/services/analytics/analytics.service';
import { projectPathForId } from 'src/app/database/path.utils';
import { LoadingOverlayService } from 'cd-common';
import { getSetChanges } from 'cd-utils/set';
import { AnalyticsEvent } from 'cd-common/analytics';
import * as offlineUtils from 'src/app/database/workers/offline.utils';
import * as appStoreModule from 'src/app/store';
import * as action from '../actions';
import * as cd from 'cd-interfaces';

@Injectable()
export class ProjectContentEffects {
  private _hasCheckedProjectID = '';

  constructor(
    private actions$: Actions,
    private _debugService: DebugService,
    private _databaseService: DatabaseService,
    private _appStore: Store<appStoreModule.IAppState>,
    private _projectStore: Store<IProjectState>,
    private _analyticsService: AnalyticsService,
    private _loadingOverlaySerive: LoadingOverlayService
  ) {}

  /*
   * Load all project contents (boards and element data)
   */

  query$ = createEffect(() =>
    this.actions$.pipe(
      ofType<action.ProjectContentQuery>(action.PROJECT_CONTENT_QUERY),
      withLatestFrom(this._projectStore.pipe(select(getElementPropertiesLoaded))),
      withLatestFrom(this._appStore.pipe(select(appStoreModule.getRouterState))),
      switchMap(([, router]) => {
        const projectId: string | undefined = router.state.params[PROJECT_ID_ROUTE_PARAM];
        const docs$ = projectId ? this._databaseService.getProjectContents(projectId) : of([]);
        return forkJoin([of(projectId), docs$]).pipe(
          takeUntil(this.actions$.pipe(ofType(action.DISCONNECT_PROJECT)))
        );
      }),
      switchMap(([projectId, docs]) => {
        const actions = projectId ? generateLoadContentActions(projectId, docs) : [];
        // append success action after contents have been retrieved
        const type = action.PROJECT_CONTENT_QUERY_SUCCESS;
        actions.push({ type });

        return actions;
      })
    )
  );

  projectQuerySuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(action.PROJECT_CONTENT_QUERY_SUCCESS),
      withLatestFrom(this._projectStore.pipe(select(getProject))),
      map(([, project]) => project),
      withLatestFrom(this._appStore.pipe(select(appStoreModule.getUser))),
      switchMap(([project, user]) => {
        const projectId = project?.id;
        if (!projectId || !user) return [];
        // TODO: Handle editors and owners
        const isOwner = project?.owner.id === user?.id;
        if (!isOwner) offlineUtils.deleteLocalDataForProject(projectId);
        return [new action.ProjectDataCurrentUserIsOwner(isOwner)];
      })
    )
  );

  // After first load of project, subscribe to visibility changes
  // Check if project has been updated since last loaded, if so, reload all project contents

  pageVisibility$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(action.PROJECT_CONTENT_QUERY_SUCCESS),
      switchMap(() =>
        fromEvent(window, 'focus').pipe(
          takeUntil(this.actions$.pipe(ofType(action.DISCONNECT_PROJECT)))
        )
      ),
      filter(() => !document.hidden), // only query when document has toggled to visibile
      withLatestFrom(this._projectStore.pipe(select(getProject))),
      filter(([, proj]) => proj !== undefined),
      withLatestFrom(this._appStore.pipe(select(appStoreModule.getIsLocalDatabaseDisabled))),
      filter(() => !this._databaseService.batchQueue.active), // Dont update if we're writing a batch
      switchMap(([[, project], idbDisabled]) => {
        const projectId = (project as cd.IProject).id;
        const projectPath = projectPathForId(projectId);
        const projectDoc$ = this._databaseService.getDocument(projectPath);
        const remoteProjectData$ = projectDoc$.pipe(map((doc) => doc.data() as cd.IProject));
        const currentProjectData$ = of(project as cd.IProject);
        const localDbProjectData$ = from(getLocalProjectDataForId(projectId, idbDisabled));
        return forkJoin([currentProjectData$, remoteProjectData$, localDbProjectData$]);
      }),
      filter(([, remoteProject]) => !!remoteProject),
      switchMap(([current, remote, localDb]) => {
        const currentTimestamp = current.updatedAt.seconds;
        const remoteTimestamp = remote.updatedAt.seconds;
        const localDbTimestamp = localDb?.project.updatedAt.seconds || currentTimestamp;
        // Current Project is up to data is newer or equal to remote and localdb
        if (currentTimestamp >= localDbTimestamp && currentTimestamp >= remoteTimestamp) {
          return []; // No change
        }
        // Local Database is newer than current & newer than remote project data
        if (
          localDb &&
          localDbTimestamp >= currentTimestamp &&
          localDbTimestamp >= remoteTimestamp
        ) {
          const syncRemoteData = localDbTimestamp !== remoteTimestamp;
          console.log('Visibility Change: Local DB data is newer, update');
          // Load remote local DB data and synchronize remote data if needed
          return [new action.ProjectContentLoadLocalData(remote, localDb, syncRemoteData)];
        }

        console.log('Visibility Change: Remote data is newer');
        // Load remote data to replace current state

        return [new action.ProjectContentLoadRemoteData(remote)];
      })
    ) as Observable<action.ProjectContentLoadLocalData | action.ProjectContentLoadRemoteData>;
    // TODO: figure out why this "as" cast is necessary for typings to work
    // UPDATE: commenting out any one of the the 3 filters at the top of this effect fixes
    // the typings issue. Likely something broken with the NgRx effects typings
  });

  loadLocalDBDataOnVisibilityChange$ = createEffect(() =>
    this.actions$.pipe(
      ofType<action.ProjectContentLoadLocalData>(action.PROJECT_CONTENT_LOAD_LOCAL_DATA),
      withLatestFrom(this._projectStore.pipe(select(getElementProperties))),
      switchMap(([{ remoteProject, localData, syncData }, currentElementProps]) => {
        const { project, designSystem, elementProperties, assets } = localData;
        const elementKeys = new Set(Object.keys(elementProperties));
        const currElementKeys = new Set(Object.keys(currentElementProps));
        const deletedIds = getSetChanges(currElementKeys, elementKeys, true);
        const assetValues = assets ? Object.values(assets) : [];
        const assetList = assetValues.length > 0 ? [new action.AssetsRemoteAdded(assetValues)] : [];
        const syncAction = syncData ? [new action.SyncLocalDatabase(remoteProject, localData)] : [];
        return [
          ...assetList,
          new action.DesignSystemRemoteAdded(designSystem),
          new action.ProjectDataQuerySuccess(project.id, project),
          new action.ElementPropertiesSetAll(elementProperties, deletedIds, false),
          ...syncAction,
        ];
      })
    )
  );

  loadRemoteDataOnVisibilityChange$ = createEffect(() =>
    this.actions$.pipe(
      ofType<action.ProjectContentLoadRemoteData>(action.PROJECT_CONTENT_LOAD_REMOTE_DATA),
      withLatestFrom(this._projectStore.pipe(select(getProject))),
      filter(([{ remoteProject }, currentProject]) => currentProject?.id === remoteProject.id),
      tap(() => this._loadingOverlaySerive.showLoadingOverlay()),
      switchMap(([{ remoteProject }]) => {
        // database timestamp is newer -> query for project contents
        const remoteProject$ = of(remoteProject);
        const projectContents$ = this._databaseService.getProjectContents(remoteProject.id);
        const resetLocalDb = of(offlineUtils.deleteLocalDataForProject(remoteProject.id));
        return forkJoin([remoteProject$, projectContents$, resetLocalDb]);
      }),
      withLatestFrom(this._projectStore.pipe(select(getElementProperties))),
      switchMap(([[project, contents], elementProperties]) => {
        const actions = generateSyncContentActions(project, contents, elementProperties);
        this._loadingOverlaySerive.hideLoadingOverlay();
        return actions;
      })
    )
  );

  /**
   * Disconnect database subscription when leaving project
   */

  disconnect$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType<action.DisconnectProject>(action.DISCONNECT_PROJECT),
        tap(() => {
          this._hasCheckedProjectID = '';
          this._databaseService.unsubscribeProject();
        })
      ),
    { dispatch: false }
  );

  healthCheck$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType<action.ProjectContentQuerySuccess>(action.PROJECT_CONTENT_QUERY_SUCCESS),
        withLatestFrom(this._projectStore.pipe(select(getProject))),
        filter(([, proj]) => proj !== undefined),
        filter(([, project]) => this._hasCheckedProjectID !== project?.id),
        withLatestFrom(this._appStore.pipe(select(appStoreModule.getRouterState))),
        withLatestFrom(this._projectStore.pipe(select(getUserIsProjectEditor))),
        tap(([[[, project], routerState], userIsEditor]) => {
          const projectIdFromRoute = routerState.state.params[PROJECT_ID_ROUTE_PARAM] as string;
          // log project opened
          if (!project) return;
          if (!projectIdFromRoute) return;
          if (project.id !== projectIdFromRoute) return;

          this._hasCheckedProjectID = project.id;
          const event = userIsEditor
            ? AnalyticsEvent.ProjectOpenedByOwner
            : AnalyticsEvent.ProjectOpenedByNonOwner;

          this._analyticsService.logEvent(event);
          // and run health checks you own the project
          const isPreviewRoute = routerState.state.url.includes(Route.Preview);
          if (!userIsEditor || isPreviewRoute) return;

          this._debugService.runHealthCheckAndRepairs();
        })
      ),
    { dispatch: false }
  );
}
