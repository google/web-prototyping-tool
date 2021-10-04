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
import { downloadBlobAsFile, isBlobUrl, getBlobFromBlobUrl } from 'cd-utils/files';
import { PropertiesService } from '../properties/properties.service';
import { AnalyticsService } from 'src/app/services/analytics/analytics.service';
import { AssetsService } from '../assets/assets.service';
import { ToastsService } from 'src/app/services/toasts/toasts.service';
import { BehaviorSubject, lastValueFrom } from 'rxjs';
import { UploadService } from '../upload/upload.service';
import { AnalyticsEvent } from 'cd-common/analytics';
import { DatasetService } from '../dataset/dataset.service';
import { DataPickerService } from 'cd-common';
import { isJsonDataset } from 'cd-common/utils';
import * as cd from 'cd-interfaces';
import * as consts from 'cd-common/consts';

const TOAST_MESSAGE_GENERATING_EXPORT = 'Generating project bundle';
const EXPORT_ERROR_PREFIX = 'Failed to ';

@Injectable({
  providedIn: 'root',
})
export class ProjectExportService {
  private _currentToastId?: string;
  public exportInProgress$ = new BehaviorSubject(false);

  constructor(
    private datasetService: DatasetService,
    private dataPickerService: DataPickerService,
    private propertiesService: PropertiesService,
    private assetsService: AssetsService,
    private httpClient: HttpClient,
    private toastService: ToastsService,
    private analyticsService: AnalyticsService,
    private uploadService: UploadService
  ) {}

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
        if (!dataBlob) continue;
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
