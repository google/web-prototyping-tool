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
  Component,
  ChangeDetectionStrategy,
  Output,
  EventEmitter,
  ChangeDetectorRef,
  ViewChild,
  AfterViewInit,
  OnDestroy,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { AbstractOverlayContentDirective, InputComponent, OverlayInitService } from 'cd-common';
import * as consts from './sheets-dataset-modal.consts';
import * as cd from 'cd-interfaces';

const SHEETS_ENDPOINT_SHEET_ID = 'sheetId';
const SHEETS_ENDPOINT_TAB_ID = 'tabId';

@Component({
  selector: 'app-sheets-dataset-modal',
  templateUrl: './sheets-dataset-modal.component.html',
  styleUrls: ['./sheets-dataset-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SheetsDatasetModalComponent
  extends AbstractOverlayContentDirective
  implements AfterViewInit, OnDestroy
{
  private _subscriptions = new Subscription();
  private _focusTimer = 0;
  public results: cd.IStringMap<any> = {};
  public hasResults = false;

  // Required fields for fetch
  public SheetIdHelpText = consts.SHEET_ID_HELP_TEXT;
  public sheetId = '';
  public TabIdHelpText = consts.TAB_ID_HELP_TEXT;
  public tabId = '';

  // State of overlay
  public RequestState = consts.RequestState;
  public requestState = consts.RequestState.Default;
  public errorMessage = '';

  @Output() saveData = new EventEmitter<consts.ICreateSheetsDataset>();

  get loading() {
    return this.requestState === consts.RequestState.Loading;
  }

  get runDisabled() {
    const { loading, sheetId, tabId } = this;
    return loading || !sheetId || !tabId;
  }

  @ViewChild('sheetIdInputRef', { read: InputComponent }) sheetIdInputRef!: InputComponent;

  constructor(
    public overlayInit: OverlayInitService,
    private _httpClient: HttpClient,
    private _cdRef: ChangeDetectorRef
  ) {
    super(overlayInit);
  }

  ngOnDestroy() {
    this._subscriptions.unsubscribe();
    window.clearTimeout(this._focusTimer);
  }

  ngAfterViewInit() {
    super.ngAfterViewInit();
    // setTimeout is required here as other methods of autofocusing elements seem to not work
    this._focusTimer = window.setTimeout(() => {
      const input = this.sheetIdInputRef.inputRef.nativeElement;
      if (!input) return;
      input.focus();
      input.select();
    }, 100);
  }

  onSheetIdChange(sheetId: string) {
    this.sheetId = sheetId;
    this._runQuery();
    this._cdRef.markForCheck();
  }

  onTabIdChange(tabId: string) {
    this.tabId = tabId;
    this._runQuery();
    this._cdRef.markForCheck();
  }

  private _runQuery() {
    const { sheetId, tabId } = this;
    if (!sheetId || !tabId) return;
    this.errorMessage = '';
    this.hasResults = false;
    this.requestState = consts.RequestState.Loading;
    this._getData(sheetId, tabId);
  }

  private _getData(sheetId: string, tabId: string) {
    const url = new URL(consts.SHEETS_ENDPOINT_BASE);
    url.searchParams.append(SHEETS_ENDPOINT_SHEET_ID, sheetId);
    url.searchParams.append(SHEETS_ENDPOINT_TAB_ID, tabId);

    this._subscriptions.add(
      this._httpClient
        .get<consts.SheetsResponse>(url.toString(), { withCredentials: true })
        .subscribe(this._onDataResponse, this._onError)
    );
  }

  private _onDataResponse = (results: consts.SheetsResponse) => {
    if (!results.ok) return this._onError(results.error);
    this.results = results.data;
    this.requestState = consts.RequestState.Default;
    this.hasResults = true;
    this._cdRef.markForCheck();
  };

  private _onError = (error: consts.SheetsError) => {
    this.requestState = consts.RequestState.Error;
    this.errorMessage = error.statusMessage;
    this._cdRef.markForCheck();
  };

  onRunClick() {
    this._runQuery();
  }

  onSaveClick() {
    const { results, sheetId, tabId } = this;
    if (!results) return;
    this.saveData.emit({ tabId, sheetId, results });
  }
}
