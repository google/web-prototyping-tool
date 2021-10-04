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

import { Injectable, OnDestroy } from '@angular/core';
import { Action, Store } from '@ngrx/store';
import { ToastsService } from 'src/app/services/toasts/toasts.service';
import { IProjectState } from '../../store/reducers';
import {
  AbstractOverlayControllerDirective,
  ConfirmationDialogComponent,
  DataPickerService,
  OverlayService,
} from 'cd-common';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { downloadBlobAsFile, createJsonFile, fileFromBlob } from 'cd-utils/files';
import { UploadService } from '../upload/upload.service';
import { RendererService } from 'src/app/services/renderer/renderer.service';
import { storagePathForJsonDatasetFile } from 'src/app/utils/storage.utils';
import { PropertiesService } from '../properties/properties.service';
import { incrementedName } from 'cd-utils/string';
import { AnalyticsService } from 'src/app/services/analytics/analytics.service';
import { AnalyticsEvent, getDatasetAnalyticsName, UPLOAD_JSON_FILE } from 'cd-common/analytics';
import { createId } from 'cd-utils/guid';
import { ProjectContentService } from 'src/app/database/changes/project-content.service';
import * as actions from '../../store/actions';
import * as config from '../../components/panels/data-panel/data-panel.config';
import * as consts from 'cd-common/consts';
import * as utils from 'cd-common/utils';
import * as cd from 'cd-interfaces';

type BaseDatasetValues = [
  projId: string | undefined,
  dataId: string,
  fileName: string,
  uploadPath: string
];

@Injectable({
  providedIn: 'root',
})
export class DatasetService extends AbstractOverlayControllerDirective implements OnDestroy {
  private subscriptions = new Subscription();
  private confirmSubscription = Subscription.EMPTY;
  private _datasets: cd.ProjectDataset[] = [];

  public openAddDatasetMenuTrigger$ = new BehaviorSubject(false);
  public datasets$: Observable<cd.ProjectDataset[]>;

  constructor(
    overlayService: OverlayService,
    private projectStore: Store<IProjectState>,
    private toastService: ToastsService,
    private dataPickerService: DataPickerService,
    private uploadService: UploadService,
    private rendererService: RendererService,
    private propertiesService: PropertiesService,
    private analyticsService: AnalyticsService,
    private projectContentService: ProjectContentService
  ) {
    super(overlayService);
    this.datasets$ = this.projectContentService.datasetArray$;
    this.subscriptions.add(this.datasets$.subscribe(this.onDatasetsSubscription));
  }

  ngOnDestroy() {
    super.ngOnDestroy();
    this.confirmSubscription.unsubscribe();
  }

  onDatasetsSubscription = (datasets: cd.ProjectDataset[]) => (this._datasets = datasets);

  openAddDatasetMenu() {
    this.openAddDatasetMenuTrigger$.next(true);
  }

  addNewDirectInputDataset = (): string | undefined => {
    const [projId, dataId, fileName, uploadPath] = this._getBaseStoredDatasetValues();
    if (!projId) return;
    const dataset = utils.createJsonDataset(dataId, projId, fileName, uploadPath);
    const jsonValue = config.DIRECT_INPUT_INITIAL_JSON;
    return this._afterStoredDatasetCreated(dataId, fileName, dataset, jsonValue, uploadPath);
  };

  createGenericEndpointDataset(data: cd.IStringMap<any>, url: string) {
    const [projId, dataId, fileName, uploadPath] = this._getBaseStoredDatasetValues();
    if (!projId) return;
    const dataset = utils.createGenericEndpointDataset(dataId, projId, fileName, uploadPath, url);
    this._afterStoredDatasetCreated(dataId, fileName, dataset, data, uploadPath);
  }

  createSheetsDataset(data: cd.IStringMap<any>, sheetId: string, tabId: string) {
    const fileName = `sheets-${tabId}`;
    const [projId, dataId, _, uploadPath] = this._getBaseStoredDatasetValues(fileName);
    if (!projId) return;
    const dataset = utils.createSheetsDataset(dataId, projId, fileName, uploadPath, sheetId, tabId);
    this._afterStoredDatasetCreated(dataId, fileName, dataset, data, uploadPath);
  }

  private _getBaseStoredDatasetValues = (providedFileName = ''): BaseDatasetValues => {
    const projId = this.propertiesService.getProjectId();
    const dataId = createId();
    const jsonFileId = createId();
    const fileName = providedFileName || this.getIncrementedDefaultDatasetName();
    const uploadPath = storagePathForJsonDatasetFile(jsonFileId, fileName);
    return [projId, dataId, fileName, uploadPath];
  };

  /**
   * Sends the created dataset to the appropriate places if small enough
   * NOTE: Returns the dataset's ID if successful (to be used by the addNewDirectInputDataset function)
   */
  private _afterStoredDatasetCreated = (
    dataId: string,
    fileName: string,
    dataset: cd.IStoredDataset,
    data: cd.IStringMap<any>,
    uploadPath: string
  ): string | undefined => {
    const jsonFile = createJsonFile(data, fileName);
    if (!this.checkDatasetSize(jsonFile)) return;
    this.sendDatasetDataToRenderer(dataId, jsonFile); // send to renderer
    this.dataPickerService.addDataSource(dataset, data); // add to data picker
    this.dispatch(new actions.DatasetCreate([dataset as cd.ProjectDataset])); // Add to store // database
    this.uploadService.uploadFile(jsonFile, uploadPath); // Upload to firebase storage
    const name = getDatasetAnalyticsName(dataset.datasetType);
    this.analyticsService.logEvent(AnalyticsEvent.DatasetAdded, { name });
    return dataset.id;
  };

  createDatasetFromFile(file: File, showToast = true) {
    if (!this.checkDatasetSize(file)) return;

    // show uploading toast
    if (showToast) this.toastService.addToast(config.UPLOADING_TOAST);

    // log analytics event
    this.analyticsService.logEvent(AnalyticsEvent.DatasetAdded, { name: UPLOAD_JSON_FILE });

    // Generate storage path
    const id = createId();
    const uploadPath = storagePathForJsonDatasetFile(id, file.name);
    const { onUploadComplete, onUploadError } = this;

    // Upload file and resolve promise from success or error callbacks
    this.uploadService.uploadFile(
      file,
      uploadPath,
      () => onUploadComplete(uploadPath, file, showToast),
      onUploadError
    );
  }

  getDatasets() {
    return this._datasets;
  }

  updateDataset(datasetId: string, updates: Partial<cd.ProjectDataset>) {
    this.dispatch(new actions.DatasetUpdate(datasetId, updates));
  }

  replaceDatasetData(datasetId: string, data: string) {
    const file = createJsonFile(data, config.DEFAULT_DATASET_FILENAME);
    this.replaceDatasetDataFromFile(datasetId, file, false);
  }

  replaceDatasetDataFromFile(datasetId: string, file: File, showToast = true) {
    if (!this.checkDatasetSize(file)) return;

    // show uploading toast
    if (showToast) this.toastService.addToast(config.UPLOADING_TOAST);

    // send new data to renderer and update data picker immediately
    this.sendDatasetDataToRenderer(datasetId, file);
    this.dataPickerService.updateBlobDataSource(datasetId, file);

    // Upload file
    const id = createId();
    const uploadPath = storagePathForJsonDatasetFile(id, file.name);
    const { onReplaceComplete, onUploadError } = this;
    this.uploadService.uploadFile(
      file,
      uploadPath,
      () => onReplaceComplete(datasetId, uploadPath, showToast),
      onUploadError
    );
  }

  downloadDatasetData = async (dataset: cd.ProjectDataset) => {
    // TODO: how would we download other dataset types
    if (dataset.datasetType !== cd.DatasetType.Json) return;
    const { storagePath, name } = dataset as cd.IJsonDataset;
    const jsonBlob = await this.uploadService.downloadFile(storagePath);
    const fileName = utils.addJsonFileExtension(name);
    downloadBlobAsFile(jsonBlob, fileName);
  };

  duplicateDataset = async (dataset: cd.ProjectDataset) => {
    const { storagePath, name } = dataset as cd.IJsonDataset;
    const jsonBlob = await this.uploadService.downloadFile(storagePath);
    if (!jsonBlob) return;
    const fileName = this._incrementName(name);
    const file = fileFromBlob(jsonBlob, fileName);
    this.toastService.addToast(config.DUPLICATING_TOAST);
    this.createDatasetFromFile(file, false);
  };

  deleteDataset(dataset: cd.ProjectDataset) {
    const confirmModal = this.showModal<ConfirmationDialogComponent>(ConfirmationDialogComponent);
    const { instance } = confirmModal;
    const { cancel, confirm } = instance;
    instance.title = config.REMOVE_DATASET_TITLE;
    instance.message = config.REMOVE_DATASET_MESSAGE;
    this.confirmSubscription = new Subscription();
    this.confirmSubscription.add(cancel.subscribe(this.onCancelRemoveDataset));
    this.confirmSubscription.add(confirm.subscribe(() => this.onConfirmRemoveDataset(dataset)));
  }

  /** Send updated data to Renderer */
  private sendDatasetDataToRenderer(datasetId: string, dataFile: File) {
    const rendererData = { [datasetId]: dataFile };
    this.rendererService.addDatasetData(rendererData);
  }

  // eslint-disable-next-line require-await
  private onUploadComplete = async (filePath: string, file: File, showToast = true) => {
    const projectId = this.propertiesService.getProjectId();
    if (!projectId) return;
    const id = createId();
    const dataset = utils.createJsonDataset(id, projectId, file.name, filePath);
    this.dispatch(new actions.DatasetCreate([dataset]));
    if (showToast) this.showUploadToast(config.UPLOAD_SUCCESS_MESSAGE);

    // send new data to renderer and data picker immediately
    this.sendDatasetDataToRenderer(id, file);
    this.dataPickerService.addDataSourceWithBlobValue(dataset, file);
  };

  private onUploadError = (e: any) => {
    console.error(e);
    this.showUploadToast(config.UPLOAD_FAILED_MESSAGE);
  };

  private onReplaceComplete = (datasetId: string, storagePath: string, showToast = true) => {
    this.dispatch(new actions.DatasetUpdate(datasetId, { storagePath }));
    if (showToast) this.showUploadToast(config.REPLACE_SUCCESS_MESSAGE);
  };

  private onConfirmRemoveDataset = (dataset: cd.ProjectDataset) => {
    // log analytics event
    this.analyticsService.logEvent(AnalyticsEvent.DatasetRemoved);

    this.dispatch(new actions.DatasetDelete(dataset));
  };

  private onCancelRemoveDataset = () => {
    this.closeModal();
    this.confirmSubscription.unsubscribe();
  };

  private dispatch(action: Action) {
    this.projectStore.dispatch(action);
  }

  private showUploadToast(message: string) {
    this.toastService.addToast({ id: config.UPLOAD_TOAST_ID, message }, config.UPLOAD_TOAST_ID);
  }

  private checkDatasetSize(dataBlob: Blob): boolean {
    const validSize = dataBlob.size <= consts.DATASET_SIZE_LIMIT;
    if (validSize) return true;

    // log event
    this.analyticsService.logEvent(AnalyticsEvent.DatasetSizeLimitExceeded);

    this.toastService.addToast({ message: consts.DATASET_SIZE_LIMIT_ERROR });
    return false;
  }

  private getIncrementedDefaultDatasetName = () => {
    return this._incrementName(config.DEFAULT_DATASET_FILENAME);
  };

  private _incrementName = (name: string) => {
    const currentNames = this._datasets.map((d) => d.name);
    return incrementedName(name, currentNames);
  };
}
