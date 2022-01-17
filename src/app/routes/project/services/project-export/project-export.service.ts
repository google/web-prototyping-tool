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

import type JSZip from 'jszip';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Store } from '@ngrx/store';
import { downloadBlobAsFile, isBlobUrl, getBlobFromBlobUrl } from 'cd-utils/files';
import { PropertiesService } from '../properties/properties.service';
import { AnalyticsService } from 'src/app/services/analytics/analytics.service';
import { AssetsService } from '../assets/assets.service';
import { ToastsService } from 'src/app/services/toasts/toasts.service';
import { IProjectState } from '../../store/reducers';
import { ProjectDataUpdate } from '../../store';
import { BehaviorSubject, from, lastValueFrom, Observable } from 'rxjs';
import { UploadService } from '../upload/upload.service';
import { openLinkInNewTab } from 'cd-utils/url';
import { map, shareReplay } from 'rxjs/operators';
import { AnalyticsEvent } from 'cd-common/analytics';
import { DatasetService } from '../dataset/dataset.service';
import { DataPickerService } from 'cd-common';
import { isJsonDataset } from 'cd-common/utils';
import * as cd from 'cd-interfaces';
import * as consts from 'cd-common/consts';
import * as zipline from '../../utils/internal-apis/zipline.utils';

const TOAST_MESSAGE_GENERATING_EXPORT = 'Generating project bundle';
const TOAST_MESSAGE_PUBLISHING_TO_ZIPLINE = 'Publishing to Zipline';
const TOAST_MESSAGE_ZIPLINE_SUCCESS = 'Publish to Zipline succeeded.';
const EXPORT_ERROR_PREFIX = 'Failed to ';

@Injectable({
  providedIn: 'root',
})
export class ProjectExportService {
  private _currentToastId?: string;
  private _ziplineProjectUrls$ = new Map<string, Observable<string | null>>();
  public exportInProgress$ = new BehaviorSubject(false);

  constructor(
    private datasetService: DatasetService,
    private dataPickerService: DataPickerService,
    private propertiesService: PropertiesService,
    private assetsService: AssetsService,
    private httpClient: HttpClient,
    private toastService: ToastsService,
    private projectStore: Store<IProjectState>,
    private analyticsService: AnalyticsService,
    private uploadService: UploadService
  ) {}

  getZiplineProjectUrl$ = (ziplineData?: cd.IZiplinePublishData): Observable<string | null> => {
    if (!ziplineData) return new BehaviorSubject(null);

    const { projectId } = ziplineData;
    const cachedProjectUrl$ = this._ziplineProjectUrls$.get(projectId);
    if (cachedProjectUrl$) return cachedProjectUrl$;

    const projectLookup$ = from(zipline.findProjectById(projectId));
    const ziplineProjectUrl$ = projectLookup$.pipe(
      map((response) => {
        if ((response as cd.IZiplineNotFoundResponse).errors) {
          return null;
        }
        const ziplineProject = response as cd.IZiplineProject;
        const ziplineProjectUrl = zipline.constuctZiplineProjectUrlFromSlug(ziplineProject.slug);
        return ziplineProjectUrl;
      }),
      shareReplay({ bufferSize: 1, refCount: true })
    );

    this._ziplineProjectUrls$.set(projectId, ziplineProjectUrl$);
    return ziplineProjectUrl$;
  };

  exportProjectAsZip = async () => {
    if (this.exportInProgress$.value) return;
    this.exportInProgress$.next(true);

    this._showLoadingToast(TOAST_MESSAGE_GENERATING_EXPORT);

    const project = this.propertiesService.getProjectProperties();
    const cdExport = await this._createExportBundle();
    if (!project || !cdExport) return;

    try {
      const zipBlob = await cdExport.generateAsync({ type: 'blob' });
      const filename = project.name || consts.DEFAULT_EXPORT_PROJECT_TITLE;
      const zipFilename = `${filename}.zip`;
      downloadBlobAsFile(zipBlob, zipFilename);
      this.analyticsService.logEvent(AnalyticsEvent.ProjectZipDownload);
      this._reset();
    } catch (err) {
      this._onError('download project zip', err);
    }
  };

  exportProjectToZipline = async () => {
    if (this.exportInProgress$.value) return;
    this.exportInProgress$.next(true);

    this._showLoadingToast(TOAST_MESSAGE_GENERATING_EXPORT);

    const project = this.propertiesService.getProjectProperties();
    const cdExport = await this._createExportBundle();
    if (!project || !cdExport) return;

    this._showPublishingToZiplineToast();

    // if never published to zipline before, create new zipline project and export
    const { ziplineData } = project;
    if (!ziplineData) return this._exportToNewZiplineProject(project, cdExport);

    try {
      // If previously published to zipline, check to make sure previous zipline project still exists
      const { projectId } = ziplineData;
      const ziplineProjectExists = await zipline.checkZiplineProjectExists(projectId);
      if (!ziplineProjectExists) return this._exportToNewZiplineProject(project, cdExport);

      // Check to make sure previous prototype within zipline project still exists
      const ziplinePrototypeExists = await zipline.checkZiplinePrototypeExists(ziplineData);
      if (!ziplinePrototypeExists)
        return this._exportToNewPrototype(project, ziplineData, cdExport);

      this._exportToNewZiplineVersion(ziplineData, cdExport);
    } catch (err) {
      this._onError('publish to Zipline', err);
    }
  };

  private _exportToNewZiplineProject = async (project: cd.IProject, exportBundle: JSZip) => {
    const user = this.propertiesService.getCurrentUser();
    if (!user) return this._reset();

    try {
      const ziplineData = await zipline.exportToNewZiplineProject(project, exportBundle, user);
      const ziplineProjectUrl = await lastValueFrom(this.getZiplineProjectUrl$(ziplineData));
      this.projectStore.dispatch(new ProjectDataUpdate({ ziplineData }, false));
      this.analyticsService.logEvent(AnalyticsEvent.ProjectPublishToZipline);
      this._showZiplineSuccessToast(ziplineProjectUrl);
      this._reset(false);
    } catch (err) {
      this._onError('create new Zipline project', err);
    }
  };

  private _exportToNewPrototype = async (
    project: cd.IProject,
    currentZiplineData: cd.IZiplinePublishData,
    exportBundle: JSZip
  ) => {
    try {
      const { projectId } = currentZiplineData;
      const displayName = zipline.createZiplineProjectDisplayName(project);
      const ziplineProto = await zipline.exportToNewPrototype(projectId, displayName, exportBundle);
      const ziplineProjectUrl = await lastValueFrom(this.getZiplineProjectUrl$(currentZiplineData));
      const { id: prototypeId, timestamp } = ziplineProto;
      const ziplineData = { ...currentZiplineData, prototypeId, timestamp, numVersions: 1 };
      this.projectStore.dispatch(new ProjectDataUpdate({ ziplineData }, false));

      // Creating a new prototype only occurs if intial prototype within Zipline project was deleted
      // So we can just track this as publishing a new version
      this.analyticsService.logEvent(AnalyticsEvent.ProjectPublishNewVersionToZipline);

      this._showZiplineSuccessToast(ziplineProjectUrl);
      this._reset(false);
    } catch (err) {
      this._onError('create new Zipline prototype', err);
    }
  };

  private _exportToNewZiplineVersion = async (
    currentZiplineData: cd.IZiplinePublishData,
    exportBundle: JSZip
  ) => {
    try {
      const { projectId, prototypeId } = currentZiplineData;
      const timestamp = await zipline.exportToNewVersion(projectId, prototypeId, exportBundle);
      const ziplineProjectUrl = await lastValueFrom(this.getZiplineProjectUrl$(currentZiplineData));
      const numVersions = currentZiplineData.numVersions + 1;
      const ziplineData = { ...currentZiplineData, timestamp, numVersions };
      this.projectStore.dispatch(new ProjectDataUpdate({ ziplineData }, false));
      this.analyticsService.logEvent(AnalyticsEvent.ProjectPublishNewVersionToZipline);
      this._showZiplineSuccessToast(ziplineProjectUrl);
      this._reset(false);
    } catch (err) {
      this._onError('create new Zipline version', err);
    }
  };

  private _createExportBundle = async (): Promise<JSZip | void> => {
    const project = this.propertiesService.getProjectProperties();
    const designSystem = this.propertiesService.getDesignSystem();
    if (!project || !designSystem) return;

    try {
      // dynamically import jszip package
      const jsZip = (await import('jszip')).default;

      // Download and unzip prebuilt cd-export project
      const responseType = 'blob';
      const { EXPORT_APP_URL } = consts;
      const cdExportZip = await lastValueFrom(
        this.httpClient.get(EXPORT_APP_URL, { responseType })
      );
      const cdExport = await jsZip.loadAsync(cdExportZip);

      // Generate JSON for current project data
      const projectsAssets = Object.values(this.assetsService.assetsStream$.value);
      const assetPromises = projectsAssets.map(this._getAssetWithBlob);
      const assetsWithBlobs = await Promise.all(assetPromises);
      const elementProperties = this.propertiesService.getElementProperties();
      const projectCodeComponents = this.propertiesService.getCodeComponents();
      const codeComponentPromises = projectCodeComponents.map(this._getCodeComponentWithBlob);
      const codeComponentsWithBlobs = await Promise.all(codeComponentPromises);
      const projectDatasets = this.datasetService.getDatasets();
      const datasetPromises = projectDatasets.map(this._getDatasetWithBlob);
      const datasetsWithBlobs = await Promise.all(datasetPromises);
      const assets: cd.IProjectAsset[] = [];
      const codeComponents: cd.ICodeComponentDocument[] = [];
      const datasets: cd.ProjectDataset[] = [];

      // save each asset to a separate file in assets directory of zip file
      // And update origin url in asset document to point to this location
      for (const [asset, assetBlob] of assetsWithBlobs) {
        const assetFileExtension = consts.ASSET_EXTENSIONS_LOOKUP[asset.imageType];
        const assetFilename = `${asset.id}${assetFileExtension}`;

        // The image asset is placed in the /assets directory, but it will be renderered
        // in an iframe at /assets/render-outlet/, so we need to go up one directory
        // for src url of image
        const assetHostedPath = `../${assetFilename}`;
        const { urls } = asset;
        assets.push({ ...asset, urls: { ...urls, [cd.AssetSizes.Original]: assetHostedPath } });

        const zipFilePath = `${consts.EXPORT_APP}/${consts.ASSETS_DIR}/${assetFilename}`;
        cdExport.file(zipFilePath, assetBlob);
      }

      // save each code copmonent to a separate file in assets directory of zip file
      // And update jsBundleStoragePath code component document to point to this location
      for (const [codeCmp, codeCmpBlob] of codeComponentsWithBlobs) {
        const codeCmpFilename = `${codeCmp.id}.js`;

        // The code component is placed in the /assets directory, but it will be injected
        // in an iframe at /assets/render-outlet/, so we need to go up one directory
        // for src of script tag
        const codeComponentHostedPath = `../${codeCmpFilename}`;
        codeComponents.push({ ...codeCmp, jsBundleStoragePath: codeComponentHostedPath });

        const zipFilePath = `${consts.EXPORT_APP}/${consts.ASSETS_DIR}/${codeCmpFilename}`;
        cdExport.file(zipFilePath, codeCmpBlob);
      }

      // save the json for each dataset to a separate file in assets directory of zip file
      // And update storagePath dataset document to point to this location
      for (const [dataset, dataBlob] of datasetsWithBlobs) {
        if (!dataBlob || dataset.datasetType === cd.DatasetType.Jetway) continue;
        const datasetFileName = `${dataset.id}.json`;

        // The dataset json is placed in the /assets directory, but it will be injected
        // in an iframe at /assets/render-outlet/, so we need to go up one directory for request
        const dataHostedPath = `../${datasetFileName}`;
        datasets.push({ ...dataset, storagePath: dataHostedPath });

        const zipFilePath = `${consts.EXPORT_APP}/${consts.ASSETS_DIR}/${datasetFileName}`;
        cdExport.file(zipFilePath, dataBlob);
      }

      const projectExport: cd.IExportedProject = {
        project,
        elementProperties,
        designSystem,
        assets,
        codeComponents,
        datasets,
      };

      // Replace exported-project.json in zip file with data for this project
      cdExport.file(consts.PROJECT_JSON_ZIP_FILEPATH, JSON.stringify(projectExport));

      // Replace page title with name of project (leave deault if untitled project)
      if (!!project.name) {
        const currentIndexContents = await cdExport.file(consts.INDEX_HTML_FILEPATH)?.async('text');
        const updatedTitleHtml = `<title>${project.name}</title>`;
        const updatedIndexContents = currentIndexContents?.replace(
          consts.DEFAULT_EXPORT_TITLE_HTML,
          updatedTitleHtml
        );
        if (updatedIndexContents) {
          cdExport.file(consts.INDEX_HTML_FILEPATH, updatedIndexContents);
        }
      }

      return cdExport;
    } catch (err) {
      this._onError('create project export bundle', err);
    }
  };

  private _getAssetWithBlob = async (
    asset: cd.IProjectAsset
  ): Promise<[cd.IProjectAsset, Blob]> => {
    const originalUrl = asset.urls[cd.AssetSizes.Original];
    const responseType = 'blob';
    const blob = isBlobUrl(originalUrl)
      ? await getBlobFromBlobUrl(originalUrl)
      : await lastValueFrom(this.httpClient.get(originalUrl, { responseType }));

    return [asset, blob];
  };

  private _getCodeComponentWithBlob = async (
    codeComponent: cd.ICodeComponentDocument
  ): Promise<[cd.ICodeComponentDocument, Blob]> => {
    const blob = await this.uploadService.downloadFile(codeComponent.jsBundleStoragePath);
    return [codeComponent, blob];
  };

  private _getDatasetWithBlob = async (
    dataset: cd.ProjectDataset
    // eslint-disable-next-line require-await
  ): Promise<[cd.ProjectDataset, Blob | undefined]> => {
    if (!isJsonDataset(dataset)) return [dataset, undefined];
    try {
      const data = this.dataPickerService.getLoadedData()[dataset.id];
      const dataStr = JSON.stringify(data);
      const blob = new Blob([dataStr], { type: cd.FileMime.JSON });
      return [dataset, blob];
    } catch (e) {
      console.warn(`Failed to create dataset blob for project export. Dataset id: ${dataset.id}`);
      return [dataset, undefined];
    }
  };

  private _showLoadingToast = (message: string) => {
    this._hideToast();
    this._currentToastId = this.toastService.addToast({
      message,
      showLoader: true,
      duration: 100000,
      hideDismiss: true,
    });
  };

  private _showPublishingToZiplineToast = () => {
    const message = TOAST_MESSAGE_PUBLISHING_TO_ZIPLINE;
    const { _currentToastId } = this;
    if (_currentToastId) this.toastService.updateToastMessage(_currentToastId, message);
  };

  private _showZiplineSuccessToast = (ziplineProjectUrl: string | null) => {
    this._hideToast();
    const message = TOAST_MESSAGE_ZIPLINE_SUCCESS;
    const toast: Partial<cd.IToast> = { message };
    if (ziplineProjectUrl) {
      toast.confirmLabel = 'View';
      toast.callback = () => openLinkInNewTab(ziplineProjectUrl);
    }
    this._currentToastId = this.toastService.addToast(toast);
  };

  private _hideToast = () => {
    if (!this._currentToastId) return;
    this.toastService.removeToast(this._currentToastId);
    this._currentToastId = undefined;
  };

  private _reset = (hideToast = true) => {
    if (hideToast) this._hideToast();
    this.exportInProgress$.next(false);
  };

  private _onError = (errorMessage: string, error: any) => {
    this._reset();
    const errorString = JSON.stringify(error);
    const message = `${EXPORT_ERROR_PREFIX}${errorMessage}`;
    this.analyticsService.sendError(`${message}, ${errorString}`);
    this.toastService.addToast({ message });
  };
}
