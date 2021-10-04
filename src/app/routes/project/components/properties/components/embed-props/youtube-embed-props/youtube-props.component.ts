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
import { boolFromNumberString, getPathAndParamsFromEmbedURL, buildSourceURL } from '../embed.utils';
import { queryParamsFromPropertiesMap, openLinkInNewTab } from 'cd-utils/url';
import { YOUTUBE_EMBED_URL, YOUTUBE_WATCH_URL, YouTubeParams } from './youtube.config';

@Component({
  selector: 'app-youtube-props',
  templateUrl: './youtube-props.component.html',
  styleUrls: ['./youtube-props.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class YoutubePropsComponent {
  private _src = '';
  public showControls = false;
  public autoPlay = false;
  public videoId = '';

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
    const [videoId, queryString] = getPathAndParamsFromEmbedURL(value, YOUTUBE_EMBED_URL);
    const params = new URLSearchParams(queryString);
    const autoplay = params.get(YouTubeParams.AutoPlay);
    const controls = params.get(YouTubeParams.Controls);
    this.autoPlay = boolFromNumberString(autoplay);
    this.showControls = boolFromNumberString(controls);
    this.videoId = videoId;
  }

  updateParams(autoplay: boolean, controls = this.showControls, videoId?: string) {
    const params = queryParamsFromPropertiesMap({
      [YouTubeParams.AutoPlay]: Number(autoplay),
      [YouTubeParams.Controls]: Number(controls),
      [YouTubeParams.JSApi]: 1,
    });
    const id = videoId ?? this.videoId;
    const src = buildSourceURL(YOUTUBE_EMBED_URL, id, params);
    this.srcChange.emit(src);
  }

  onVideoIdChange(videoId: string) {
    this.updateParams(this.autoPlay, this.showControls, videoId);
  }

  onAutoplayChange(autoplay: boolean) {
    this.updateParams(autoplay, this.showControls);
  }

  onShowControlsChange(controls: boolean) {
    this.updateParams(this.autoPlay, controls);
  }

  onOpenURL() {
    const { videoId } = this;
    if (!videoId) return;
    const url = `${YOUTUBE_WATCH_URL}${videoId}`;
    openLinkInNewTab(url);
  }
}
