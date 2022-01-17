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
import { withLatestFrom, map, filter, tap } from 'rxjs/operators';
import { createEffect, Actions } from '@ngrx/effects';
import { Injectable, OnDestroy } from '@angular/core';
import { IProjectState, getProjectState } from '../reducers/index';
import { Store, select } from '@ngrx/store';
import { checkOfflineActions } from '../reducers/reducer.utils';
import { offlineWorker } from 'src/app/database/workers';
import { AssetsService } from '../../services/assets/assets.service';
import { Subscription } from 'rxjs';
import { environment } from 'src/environments/environment';
import { assetsContainBlobUrls } from '../../utils/assets.utils';
import { OfflineWriteToLocalDB } from '../actions/offline.action';

/**
 * This Effect class handles writing all project changes to the local database.
 *
 * Because assets are not stored in our Redux store and only in the Assets Service, there are two
 * observable streams that we need to subscribe to in order to be notified of any project udpates:
 *
 * actions$ - this is the stream of all redux actions that are dispatched to the project store
 * assetsStream$ - this is the BehaviorSubject within the AssetsService that stores project assets
 */
@Injectable()
export class OfflineEffects implements OnDestroy {
  private _subscriptions = new Subscription();

  constructor(
    private actions$: Actions,
    private projectStore: Store<IProjectState>,
    private assetService: AssetsService
  ) {
    if (environment.e2e) return;

    // Setup subscription to Asset changes
    const assetUpdateState$ = this.assetService.assetsStream$.pipe(
      filter((assets) => !assetsContainBlobUrls(assets)), // prevent writing blob urls to local DB
      withLatestFrom(this.projectStore.pipe(select(getProjectState))),
      map(([, state]) => state)
    );

    this._subscriptions.add(
      assetUpdateState$.subscribe(() => {
        this.projectStore.dispatch(new OfflineWriteToLocalDB());
      })
    );
  }

  /**
   * This effect is triggered by any actions dispatched to the project store. It is filtered to
   * only write to the local database on CRUD actions or Undo/Redo. See checkOfflineActions in
   * reducer.utils.ts
   */

  writeToLocalDatabaseOnActions$ = createEffect(
    () =>
      this.actions$.pipe(
        filter(() => !environment.e2e),
        filter((action) => checkOfflineActions(action.type)),
        withLatestFrom(this.projectStore.pipe(select(getProjectState))),
        map(([, state]) => state),
        tap((state) => this.writeProjectStateToLocalDatabase(state))
      ),
    { dispatch: false }
  );

  ngOnDestroy() {
    this._subscriptions.unsubscribe();
  }

  /**
   * This function writes the entire project state to the local database.
   */
  private writeProjectStateToLocalDatabase = (state: IProjectState) => {
    if (!state || !state.elementProperties.loaded) return;
    const {
      elementProperties: { elementProperties },
      designSystem: { designSystem },
      projectData,
      panels,
    } = state;
    const projectId = projectData.project?.id;
    // TODO: Handle project editors not just owners
    const isOwner = projectData.isCurrentUserOwner; // Ignore if the user isn't the owner
    const isRecording = panels.recordStateChanges; // Don't save if recording state changes
    const { project } = projectData;
    const assets = this.assetService.assetsStream$.value;
    const blobUrls = assetsContainBlobUrls(assets);
    if (!isOwner || !projectId || isRecording || !project || !designSystem || blobUrls) return;

    const codeComponents = this.getCodeComponents(state);
    const datasets = this.getDatasets(state);

    const offlineState = {
      project,
      elementProperties,
      designSystem,
      assets,
      codeComponents,
      datasets,
    };
    const message: cd.IOfflineProjectStateMessage = { projectId, offlineState };
    offlineWorker.postMessage(message);
  };

  private getCodeComponents = (state: IProjectState): cd.ICodeComponentDocument[] => {
    return valuesFromState<cd.ICodeComponentDocument>(state.codeComponents.entities);
  };

  private getDatasets = (state: IProjectState): cd.ProjectDataset[] => {
    return valuesFromState<cd.ProjectDataset>(state.datasets.entities);
  };
}

const valuesFromState = <T>(obj: {}): T[] => {
  return Object.values(obj).filter((c) => !!c) as T[];
};
