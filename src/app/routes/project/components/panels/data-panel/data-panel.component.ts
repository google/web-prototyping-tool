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

// prettier-ignore
import { Component, ChangeDetectionStrategy, ViewChild, AfterViewInit, OnDestroy, QueryList, ViewChildren, ChangeDetectorRef, ElementRef } from '@angular/core';
import { fetchBlob, fileFromBlob, selectFiles } from 'cd-utils/files';
import { Subscription } from 'rxjs';
import { Action, Store } from '@ngrx/store';
import { closestChildIndexForEvent, validateJsonFile } from 'cd-common/utils';
import { DatasetService } from '../../../services/dataset/dataset.service';
import {
  AbstractOverlayControllerDirective,
  DataPickerService,
  MenuButtonComponent,
  OverlayService,
} from 'cd-common';
import { BUILT_IN_DATASET_LOOKUP } from 'cd-common/datasets';
import { DatasetListItemComponent } from './components/dataset-list-item/dataset-list-item.component';
import { AnalyticsService } from 'src/app/services/analytics/analytics.service';
import { ToastsService } from 'src/app/services/toasts/toasts.service';
import { map, take } from 'rxjs/operators';
import { AnalyticsEvent, FILE_REPLACE } from 'cd-common/analytics';
import { LIST_ITEM_TAG } from 'cd-common/consts';
import { SheetsDatasetModalComponent } from './components/sheets-dataset-modal/sheets-dataset-modal.component';
import { ICreateSheetsDataset } from './components/sheets-dataset-modal/sheets-dataset-modal.consts';
import { UrlDatasetModalComponent } from './components/url-dataset-modal/url-dataset-modal.component';
import { ICreateGenericEndpointDataset } from './components/url-dataset-modal/url-dataset-modal.consts';
import { openLinkInNewTab } from 'cd-utils/url';
import * as config from './data-panel.config';
import * as store from '../../../store';
import * as cd from 'cd-interfaces';
import { IPanelZeroStateItem } from '../../zero-state-menu/zero-state.interface';

const DATA_DOCS_LINK = '';
const CONFIG_OVERLAY_CONFIG = { x: 260, y: 40, alignRight: false };

@Component({
  selector: 'app-data-panel',
  templateUrl: './data-panel.component.html',
  styleUrls: ['./data-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataPanelComponent
  extends AbstractOverlayControllerDirective
  implements AfterViewInit, OnDestroy
{
  private _subscriptions = new Subscription();
  public zeroStateItems = config.DATA_ZEROSTATE_ITEMS;
  public menuData = config.DATA_MENU;
  public activeIndex = -1;

  @ViewChild('addDatasetMenuRef', { read: MenuButtonComponent })
  addDatasetMenuRef!: MenuButtonComponent;

  @ViewChild('addButtonRef', { read: ElementRef, static: false }) addButtonRef?: ElementRef;

  @ViewChildren(DatasetListItemComponent) datasetListItems!: QueryList<DatasetListItemComponent>;

  constructor(
    private _cdRef: ChangeDetectorRef,
    private projectStore: Store<store.IProjectState>,
    private toastsService: ToastsService,
    private dataPickerService: DataPickerService,
    private analyticsService: AnalyticsService,
    public _overlayService: OverlayService,
    public datasetService: DatasetService
  ) {
    super(_overlayService);
  }

  ngAfterViewInit() {
    const { openAddDatasetMenuTrigger$ } = this.datasetService;
    this._subscriptions.add(openAddDatasetMenuTrigger$.subscribe(this.onOpenAddDatasetMenuTrigger));
  }

  ngOnDestroy() {
    this._subscriptions.unsubscribe();
  }

  onSelectDataset(e: MouseEvent) {
    const items = Array.from(this.datasetListItems);
    const idx = closestChildIndexForEvent(e, LIST_ITEM_TAG);
    if (idx === -1) return;
    items[idx]?.openDataset();
  }

  trackByFn(_index: number, item: cd.ProjectDataset): string {
    return `${item.id}-${item.name}`;
  }

  onUploadFile = async () => {
    const selectedFiles = await selectFiles([cd.FileMime.JSON], false);
    const jsonFile = selectedFiles?.[0];
    const valid = await validateJsonFile(jsonFile);
    if (jsonFile && valid) this.datasetService.createDatasetFromFile(jsonFile);
    else this.showInvalidJsonFileToast();
  };

  dispatch(action: Action) {
    this.projectStore.dispatch(action);
  }

  onActivePicker(active: boolean, i: number) {
    this.activeIndex = active ? i : -1;
  }

  onRenameDataset(name: string, dataset: cd.ProjectDataset) {
    if (!name) return;
    this.datasetService.updateDataset(dataset.id, { name });
    this.dataPickerService.updateDataSourceName(dataset.id, name);
    this.analyticsService.logEvent(AnalyticsEvent.DatasetRenamed);
  }

  onDuplicateDataset(dataset: cd.ProjectDataset) {
    this.datasetService.duplicateDataset(dataset);
  }

  onReplaceDataset = async (dataset: cd.ProjectDataset) => {
    if (dataset.datasetType !== cd.DatasetType.Json) return;
    const selectedFiles = await selectFiles([cd.FileMime.JSON], false);
    const jsonFile = selectedFiles?.[0];
    const valid = await validateJsonFile(jsonFile);
    if (jsonFile && valid) {
      // log analytics event
      this.analyticsService.logEvent(AnalyticsEvent.DatasetDataModified, { name: FILE_REPLACE });

      this.datasetService.replaceDatasetDataFromFile(dataset.id, jsonFile);
    } else this.showInvalidJsonFileToast();
  };

  onDownloadDataset = (dataset: cd.ProjectDataset) => {
    this.datasetService.downloadDatasetData(dataset);
  };

  onDeleteDataset = (dataset: cd.ProjectDataset) => {
    this.datasetService.deleteDataset(dataset);
  };

  onDirectInput = () => {
    const datasetId = this.datasetService.addNewDirectInputDataset();
    if (datasetId) this.openDataEditorWhenDatasetIsAvailable(datasetId);
  };

  onSheetsImport() {
    const componentRef = this._overlayService.attachComponent(
      SheetsDatasetModalComponent,
      CONFIG_OVERLAY_CONFIG
    );
    this._subscriptions.add(componentRef.instance.saveData.subscribe(this._onSheetsDatasetSaved));
  }

  private _onSheetsDatasetSaved = (results: ICreateSheetsDataset) => {
    const { results: data, sheetId, tabId } = results;
    if (!sheetId || !tabId || !data) return;
    this.datasetService.createSheetsDataset(data, sheetId, tabId);
    this._overlayService.close();
  };

  onGenericEndpointImport() {
    const componentRef = this._overlayService.attachComponent(
      UrlDatasetModalComponent,
      CONFIG_OVERLAY_CONFIG
    );
    this._subscriptions.add(componentRef.instance.saveData.subscribe(this._onGenericEndpointSaved));
  }

  private _onGenericEndpointSaved = (results: ICreateGenericEndpointDataset) => {
    const { results: data, url } = results;
    if (!url || !data) return;
    this.datasetService.createGenericEndpointDataset(data, url);
    this._overlayService.close();
  };

  addSampleTableData = async (datasetId?: string) => {
    const dataset = datasetId && BUILT_IN_DATASET_LOOKUP[datasetId];
    if (!dataset) return;
    const dataBlob = await fetchBlob(dataset.url);
    if (!dataBlob) return;
    const file = fileFromBlob(dataBlob, dataset.name);
    this.datasetService.createDatasetFromFile(file);
  };

  onMenuSelect(menuItem: cd.ISelectItem & cd.IMenuConfig) {
    const { action, id, value } = menuItem;
    // Sub-menu children
    if (action === config.DataMenuAction.SampleTableData) return this.addSampleTableData(id);
    if (action === config.DataMenuAction.GenericEndpoint) return this.onGenericEndpointImport();
    if (action === config.DataMenuAction.GoogleSheets) return this.onSheetsImport();
    // Main options
    if (value === config.DataMenuAction.UploadFile) return this.onUploadFile();
    if (value === config.DataMenuAction.DirectInput) return this.onDirectInput();
    // Open docs in new tab
    if (value === config.DataMenuAction.Help) return this.onHelp();
  }

  onZeroStateItemClicked(item: IPanelZeroStateItem) {
    const { id } = item;
    switch (id) {
      case config.DataMenuAction.DirectInput:
        return this.onDirectInput();
      case config.DataMenuAction.UploadFile:
        return this.onUploadFile();
      case config.DataMenuAction.GoogleSheets:
        return this.onSheetsImport();
    }
  }

  onOpenAddDatasetMenuTrigger = (openMenu: boolean) => {
    if (!openMenu) return;
    this.addDatasetMenuRef.open();

    // prevent showing add dataset menu the next time the data panel is opened unless the user
    // actually triggers showing it again.
    this.datasetService.openAddDatasetMenuTrigger$.next(false);
  };

  openDataEditorWhenDatasetIsAvailable = (datasetId: string) => {
    const dataAdded$ = this.datasetListItems.changes.pipe(
      map(() => datasetId),
      take(1)
    );
    this._subscriptions.add(dataAdded$.subscribe(this.onDirectInputDatasetAdded));
  };

  onDirectInputDatasetAdded = (datasetId: string) => {
    const { datasetListItems } = this;
    const items = Array.from(datasetListItems);
    const datasetItemIdx = items.findIndex((item) => item.dataset?.id === datasetId);
    const datasetItem = items[datasetItemIdx];
    if (!datasetItem) return;
    datasetItem.onOpenDataView(true);
    this._cdRef.detectChanges();
  };

  private showInvalidJsonFileToast = () => {
    this.toastsService.addToast(config.INVALID_JSON_FILE_TOAST);
  };

  onHelp() {
    openLinkInNewTab(DATA_DOCS_LINK);
  }

  // Blurs the add button so the focus styles do not persist once menu is open
  onAddButtonClick() {
    this.addButtonRef?.nativeElement.blur();
    this.onOpenAddDatasetMenuTrigger(true);
  }
}
