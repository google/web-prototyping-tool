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
import { openLinkInNewTab, queryParamsFromPropertiesMap } from 'cd-utils/url';
import { buildSourceURL, extractDocsIdFromURL, getPathAndParamsFromEmbedURL } from '../embed.utils';
import { GOOGLE_DOCS_EMBED, PREVIEW_ROUTE } from '../shared-docs.config';
import { coerceBooleanProperty } from '@angular/cdk/coercion';
import { isNumber } from 'cd-utils/numeric';
import * as config from './slides-embed.config';

@Component({
  selector: 'app-slides-embed-props',
  templateUrl: './slides-embed-props.component.html',
  styleUrls: ['./slides-embed-props.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SlidesEmbedPropsComponent {
  private _src = '';
  public docId = '';
  public loop = false;
  public slideId = '';
  public start = false;
  public delay: number = config.DEFAULT_SLIDE_DELAY;

  @Input()
  set src(value: string) {
    this._src = value;
    this.extractParamsFromSource(value);
  }
  get src(): string {
    return this._src;
  }

  get baseURL() {
    return `https://${config.SLIDES_BASE_URL}`;
  }

  @Output() srcChange = new EventEmitter<string>();

  extractParamsFromSource(value: string) {
    const [, queryString] = getPathAndParamsFromEmbedURL(value, config.SLIDES_BASE_URL);
    const queryParams = new URLSearchParams(queryString);
    const id = extractDocsIdFromURL(value, config.SLIDES_ID_REGEX) || '';

    this.docId = id;
    this.loop = coerceBooleanProperty(queryParams.get(config.SlidesParam.Loop));
    this.start = coerceBooleanProperty(queryParams.get(config.SlidesParam.Start));
    this.delay = Number(queryParams.get(config.SlidesParam.Delay)) || config.DEFAULT_SLIDE_DELAY;

    // The value of param 'slide' always starts with 'id.'
    // E.g.: slide=id.<slide-id>
    const slideIdParam = queryParams.get(config.SlidesParam.Slide) || '';
    const slideId = slideIdParam.split('.')?.[1];
    if (slideId) this.slideId = slideId;

    if (value.includes(GOOGLE_DOCS_EMBED)) return;

    this.updateSrc();
  }

  onDocIdChange(id: string) {
    this.docId = id;
    this.updateSrc();
  }

  onDelayChange(delay: number) {
    this.delay = isNumber(delay) ? delay : config.DEFAULT_SLIDE_DELAY;
    this.updateSrc();
  }

  onLoopToggle(loop: boolean) {
    this.loop = loop;
    this.updateSrc();
  }

  onStartToggle(start: boolean) {
    this.start = start;
    this.updateSrc();
  }

  onSlideIdChange(slideId: string) {
    this.slideId = slideId;
    this.updateSrc();
  }

  openSlides() {
    const { docId } = this;
    if (!docId) return;
    openLinkInNewTab(`${this.baseURL}${docId}`);
  }

  private updateSrc() {
    const slideId = this.slideId ? `id.${this.slideId}` : '';

    const params = queryParamsFromPropertiesMap({
      [config.SlidesParam.Loop]: this.loop,
      [config.SlidesParam.Slide]: slideId,
      [config.SlidesParam.Start]: this.start,
      [config.SlidesParam.Delay]: this.delay,
    });

    const route = `${this.docId}${PREVIEW_ROUTE}`;
    const url = buildSourceURL(config.SLIDES_BASE_URL, route, params);

    this.srcChange.emit(url);
  }
}
