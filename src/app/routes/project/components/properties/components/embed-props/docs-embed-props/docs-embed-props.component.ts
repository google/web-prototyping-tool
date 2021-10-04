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
import { openLinkInNewTab } from 'cd-utils/url';
import { DOCS_BASE_URL, DOCS_ID_REGEX } from './docs-embed.config';
import { GOOGLE_DOCS_EMBED } from '../shared-docs.config';
import { extractDocsIdFromURL } from '../embed.utils';

@Component({
  selector: 'app-docs-embed-props',
  templateUrl: './docs-embed-props.component.html',
  styleUrls: ['./docs-embed-props.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocsEmbedPropsComponent {
  private _src = '';
  public docId = '';

  @Input()
  set src(value: string) {
    this._src = value;
    this.extractParamsFromSource(value);
  }
  get src(): string {
    return this._src;
  }

  @Output() srcChange = new EventEmitter<string>();

  extractParamsFromSource(value: string) {
    const docId = extractDocsIdFromURL(value, DOCS_ID_REGEX) || '';

    this.docId = docId;

    if (value.includes(GOOGLE_DOCS_EMBED)) return;
    this.updateId(docId);
  }

  updateId(docId: string) {
    const url = this.baseURL + docId + GOOGLE_DOCS_EMBED;
    this.srcChange.emit(url);
  }

  onDocIdChange(docId: string) {
    this.updateId(docId);
  }

  get baseURL() {
    return `https://${DOCS_BASE_URL}`;
  }

  openDocs() {
    const { docId } = this;
    if (!docId) return;
    openLinkInNewTab(`${this.baseURL}${docId}`);
  }
}
