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

import { switchMap, withLatestFrom, filter, map, tap } from 'rxjs/operators';
import { createEffect, ofType, Actions } from '@ngrx/effects';
import { Injectable, OnDestroy } from '@angular/core';
import { IProjectState } from '../reducers/index';
import { Store } from '@ngrx/store';
import { RecordActionService } from '../../services/record-action/record-action.service';
import { forkJoin, from, Observable, of, Subscription } from 'rxjs';
import { RendererService } from 'src/app/services/renderer/renderer.service';
import { DataPickerService } from 'cd-common';
import { UploadService } from '../../services/upload/upload.service';
import { DatasetService } from '../../services/dataset/dataset.service';
import { getModels } from 'cd-common/models';
import { DisconnectProject, DISCONNECT_PROJECT, ElementPropertiesUpdate } from '../actions';
import { AnalyticsService } from 'src/app/services/analytics/analytics.service';
import { AnalyticsEvent, DIRECT_INPUT } from 'cd-common/analytics';
import { ProjectContentService } from 'src/app/database/changes/project-content.service';
import { ProjectChangeCoordinator } from 'src/app/database/changes/project-change.coordinator';
import * as actions from '../actions/datasets.action';
import * as utils from 'cd-common/utils';
import type * as cd from 'cd-interfaces';

@Injectable()
export class DatasetEffects implements OnDestroy {
  private subscriptions = new Subscription();
  constructor(
    private actions$: Actions,
    private _recordSerivce: RecordActionService,
    private _projectStore: Store<IProjectState>,
    private _rendererService: RendererService,
    private _dataPickerService: DataPickerService,
    private _datasetService: DatasetService,
    private _uploadService: UploadService,
    private _analyticsService: AnalyticsService,
    private _projectContentService: ProjectContentService,
    private _projectChangeCoordinator: ProjectChangeCoordinator
  ) {
    const { updateData$, openAddDatasetMenu$ } = this._dataPickerService;
    this.subscriptions.add(updateData$.subscribe(this.onDataUpdatedFromDataPicker));
    this.subscriptions.add(openAddDatasetMenu$.subscribe(this.onOpenDatasetMenu));
  }

  createDataset$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType<actions.DatasetCreate>(actions.DATASET_CREATE),
        withLatestFrom(this._projectContentService.currentUserIsProjectEditor$),
        filter(([, editor]) => editor && this._recordSerivce.isRecording === false),
        tap(([action]) => {
          const change = utils.createDatasetChangePayload(action.datasets);
          this._projectChangeCoordinator.dispatchChangeRequest([change]);
        })
      ),
    { dispatch: false }
  );

  updateDataset$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType<actions.DatasetUpdate>(actions.DATASET_UPDATE),
        withLatestFrom(this._projectContentService.currentUserIsProjectEditor$),
        filter(([, editor]) => editor && this._recordSerivce.isRecording === false),
        tap(([action]) => {
          const { id, changes } = action;
          const update = { id, update: changes };
          const change = utils.createDatasetChangePayload(undefined, [update]);
          this._projectChangeCoordinator.dispatchChangeRequest([change]);
        })
      ),
    { dispatch: false }
  );

  deleteDataset$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType<actions.DatasetDelete>(actions.DATASET_DELETE),
        withLatestFrom(this._projectContentService.currentUserIsProjectEditor$),
        filter(([, editor]) => editor && this._recordSerivce.isRecording === false),
        tap(([action]) => {
          const deletes = [action.dataset.id];
          const change = utils.createDatasetChangePayload(undefined, undefined, deletes);
          this._projectChangeCoordinator.dispatchChangeRequest([change]);
        })
      ),
    { dispatch: false }
  );

  fetchDatasetData$ = createEffect(
    () =>
      this._projectContentService.datasetArray$.pipe(
        map((datasets) => {
          // filter out any datasets we've already loaded into the picker
          return datasets.filter((d) => !this._dataPickerService.hasDatasetData(d));
        }),
        filter((datasets) => !!datasets.length),
        switchMap((datasets) => {
          const jsonDatasets = utils.filterStoredDatasets(datasets);
          return forkJoin([of(datasets), this._getJsonDatasetBlobs(jsonDatasets)]);
        }),
        map(([datasets, jsonBlobs]) => {
          this._rendererService.addDatasetData(jsonBlobs);

          // load each dataset blob into data picker
          for (const dataset of datasets) {
            const blob = jsonBlobs[dataset.id];
            if (!blob) continue;
            this._dataPickerService.addDataSourceWithBlobValue(dataset, blob);
          }
        })
      ),
    { dispatch: false }
  );

  /** Anytime that a dataset is deleted remove any data-bindings to it */
  removeDataBindingsOnDatasetDelete$ = createEffect(() =>
    this.actions$.pipe(
      ofType<actions.DatasetDelete>(actions.DATASET_DELETE),
      withLatestFrom(this._projectContentService.currentUserIsProjectEditor$),
      filter(([, editor]) => editor && this._recordSerivce.isRecording === false),
      map(([action]) => action),
      withLatestFrom(this._projectContentService.elementProperties$),
      map(([action, elementProperties]) => {
        const { dataset } = action;
        const elementModels = getModels(elementProperties);
        const updates = elementModels.reduce<cd.IPropertiesUpdatePayload[]>((acc, curr) => {
          const dataBoundInputs = utils.getDataBoundInputsToDataset(curr, dataset.id);
          if (!dataBoundInputs) return acc;
          const loadedData = this._dataPickerService.getLoadedData();
          const inputs = utils.replaceDataBindingsWithValue(
            dataBoundInputs,
            elementProperties,
            loadedData
          );
          const update = utils.buildPropertyUpdatePayload(curr.id, { inputs });
          acc.push(update);
          return acc;
        }, []);

        // Also remove this dataset from the data picker once we complete this computation
        this._dataPickerService.removeDataSource(dataset.id);

        return new ElementPropertiesUpdate(updates, false);
      })
    )
  );

  openAddDatasetMenu$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType<actions.OpenAddDatasetMenu>(actions.OPEN_ADD_DATASET_MENU),
        map(() => {
          this._datasetService.openAddDatasetMenu();
        })
      ),
    { dispatch: false }
  );

  disconnectProject$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType<DisconnectProject>(DISCONNECT_PROJECT),
        tap(() => {
          this._dataPickerService.reset();
        })
      ),
    { dispatch: false }
  );

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  private _getJsonDatasetBlobs = (
    jsonDatasets: cd.IStoredDataset[]
  ): Observable<Record<string, Blob>> => {
    const datasetIds = jsonDatasets.map((d) => d.id);
    const storagePaths = jsonDatasets.map((d) => d.storagePath);
    const downloads$ = from(this._uploadService.downloadMultipleFiles(storagePaths));
    const downloadMap$ = downloads$.pipe(
      map((blobs) => {
        return blobs.reduce<Record<string, Blob>>((acc, curr, idx) => {
          const id = datasetIds[idx];
          acc[id] = curr;
          return acc;
        }, {});
      })
    );
    return downloadMap$;
  };

  private onDataUpdatedFromDataPicker = (dataset: cd.IPickerDataset) => {
    const { id, value } = dataset;
    if (value !== undefined) {
      // log analytics event
      this._analyticsService.logEvent(AnalyticsEvent.DatasetDataModified, { name: DIRECT_INPUT });

      this._datasetService.replaceDatasetData(id, value);
    }
  };

  private onOpenDatasetMenu = () => {
    this._projectStore.dispatch(new actions.OpenAddDatasetMenu());
  };
}
