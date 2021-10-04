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
  EventEmitter,
  Output,
  ChangeDetectorRef,
  ViewChild,
  AfterViewInit,
  OnDestroy,
} from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { AbstractOverlayContentDirective, InputComponent, OverlayInitService } from 'cd-common';
import * as consts from './url-dataset-modal.consts';
import * as cd from 'cd-interfaces';

@Component({
  selector: 'app-url-dataset-modal',
  templateUrl: './url-dataset-modal.component.html',
  styleUrls: ['./url-dataset-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UrlDatasetModalComponent
  extends AbstractOverlayContentDirective
  implements AfterViewInit, OnDestroy
{
  private _subscriptions = new Subscription();
  private _focusTimer = 0;
  private _retrying = false; // Used to stop retrying after one try
  public url = '';
  public results: cd.IStringMap<any> = {};
  public hasResults = false;

  // State of overlay
  public RequestState = consts.RequestState;
  public requestState = consts.RequestState.Default;
  public errorMessage = '';

  @Output() saveData = new EventEmitter<consts.ICreateGenericEndpointDataset>();

  get loading() {
    return this.requestState === consts.RequestState.Loading;
  }

  get runDisabled() {
    const { url, loading } = this;
    return !url || loading;
  }

  @ViewChild('urlInputRef', { read: InputComponent }) urlInputRef!: InputComponent;

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
      const input = this.urlInputRef.inputRef.nativeElement;
      if (!input) return;
      input.focus();
      input.select();
    }, 100);
  }

  onUrlChange(value: cd.InputValueType) {
    this.url = value as string;
    this._runQuery();
  }

  private _runQuery(withCredentials = false) {
    const { url } = this;
    if (!url) return;

    this.errorMessage = '';
    this.hasResults = false;
    this.requestState = consts.RequestState.Loading;

    this._subscriptions.add(
      this._httpClient
        .get<cd.IStringMap<any>>(url, { withCredentials })
        .subscribe(this._onDataResponse, this._onError)
    );
  }

  private _onDataResponse = (results: cd.IStringMap<any>) => {
    this.results = results;
    this.requestState = consts.RequestState.Default;
    this.hasResults = true;
    this._cdRef.markForCheck();
  };

  private _onError = (error: HttpErrorResponse) => {
    // Catch CORS error that happens when not sending credentials when needed
    if (error.status === 0 && this._retrying === false) {
      this._retrying = true;
      return this._runQuery(true);
    }

    console.error(error);
    this._retrying = false;
    this.requestState = consts.RequestState.Error;
    this.errorMessage = error.message;
    this._cdRef.markForCheck();
  };

  onRunClick() {
    this._runQuery();
  }

  onSaveClick() {
    const { url, results } = this;
    if (!url || !results) return;
    this.saveData.emit({ url, results });
  }
}
