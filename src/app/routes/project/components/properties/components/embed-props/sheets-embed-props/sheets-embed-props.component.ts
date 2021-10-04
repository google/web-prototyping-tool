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

import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter } from '@angular/core';
import { buildSourceURL, extractDocsIdFromURL, getPathAndParamsFromEmbedURL } from '../embed.utils';
import { SHEETS_ID_REGEX, SHEETS_BASE_URL, SheetsParam } from './sheets-embed.config';
import { openLinkInNewTab, queryParamsFromPropertiesMap } from 'cd-utils/url';
import { HTML_EMBED_ROUTE, GOOGLE_SHEETS_EMBED } from '../shared-docs.config';
import { coerceBooleanProperty } from '@angular/cdk/coercion';

@Component({
  selector: 'app-sheets-embed-props',
  templateUrl: './sheets-embed-props.component.html',
  styleUrls: ['./sheets-embed-props.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SheetsEmbedPropsComponent {
  private _src = '';
  public docId = '';
  public tableId = '';
  public title = false;
  public widget = false;
  public headers = false;

  @Input()
  set src(value: string) {
    this._src = value;
    this.extractParamsFromSource(value);
  }
  get src(): string {
    return this._src;
  }

  get baseURL() {
    return `https://${SHEETS_BASE_URL}`;
  }

  @Output() srcChange = new EventEmitter<string>();

  extractParamsFromSource(value: string) {
    const [, queryString] = getPathAndParamsFromEmbedURL(value, SHEETS_BASE_URL);
    const queryParams = new URLSearchParams(queryString);
    const id = extractDocsIdFromURL(value, SHEETS_ID_REGEX) || '';

    this.docId = id;
    this.headers = coerceBooleanProperty(queryParams.get(SheetsParam.Headers));
    this.tableId = queryParams.get(SheetsParam.TableId) || '';
    this.title = coerceBooleanProperty(queryParams.get(SheetsParam.Title));
    this.widget = coerceBooleanProperty(queryParams.get(SheetsParam.Widget));

    if (value.includes(GOOGLE_SHEETS_EMBED)) return;

    this.updateSrc();
  }

  onDocIdChange(id: string) {
    this.docId = id;
    this.updateSrc();
  }

  onHeadersToggle(headers: boolean) {
    this.headers = headers;
    this.updateSrc();
  }

  onTableIdChange(id: string) {
    this.tableId = id ? id : '';
    this.updateSrc();
  }

  onTitleToggle(title: boolean) {
    this.title = title;
    this.updateSrc();
  }

  onWidgetToggle(widget: boolean) {
    this.widget = widget;
    this.updateSrc();
  }

  openSheets() {
    const { docId } = this;
    if (!docId) return;
    openLinkInNewTab(`${this.baseURL}${docId}`);
  }

  private updateSrc() {
    const params = queryParamsFromPropertiesMap({
      [SheetsParam.Widget]: this.widget,
      [SheetsParam.Headers]: this.headers,
      [SheetsParam.TableId]: this.tableId,
      [SheetsParam.Title]: this.title,
    });

    const route = `${this.docId}${HTML_EMBED_ROUTE}`;
    const url = buildSourceURL(SHEETS_BASE_URL, route, params);

    this.srcChange.emit(url);
  }
}
