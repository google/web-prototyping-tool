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
  Input,
  Output,
  EventEmitter,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { getPathAndParamsFromEmbedURL, boolFromNumberString } from '../embed.utils';
import { queryParamsFromPropertiesMap, openLinkInNewTab } from 'cd-utils/url';
import { ISelectItem } from 'cd-interfaces';
import * as config from './figma.config';

@Component({
  selector: 'app-figma-props',
  templateUrl: './figma-props.component.html',
  styleUrls: ['./figma-props.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FigmaPropsComponent {
  private _src = '';
  public hideControls = false;
  public showHotspots = false;
  public nodeId?: string;
  public projectId?: string;
  public scaling: config.FigmaScaling = config.FigmaScaling.Default;
  public scalingMenu = config.FIGMA_SCALING_MENU;

  @Input()
  set src(value: string) {
    this._src = value;
    this.extractParamsFromSource(value);
  }
  get src(): string {
    return this._src;
  }

  @Output() srcChange = new EventEmitter<string>();

  @ViewChild('inputRef', { read: ElementRef, static: true }) inputRef!: ElementRef;

  extractParamsFromSource(value: string) {
    if (!value.includes(config.FIGMA_EMBED_URL)) return this.processFigmaURL(value);
    const decodedPath = decodeURIComponent(value);
    const [, embedProject, embedParams] = getPathAndParamsFromEmbedURL(
      decodedPath,
      config.FIGMA_EMBED_URL
    );
    const embedProjectParams = new URLSearchParams(embedProject);
    const embedURL = embedProjectParams.get(config.FigmaParams.URL) || '';
    const params = new URLSearchParams(embedParams);
    const scaling = params.get(config.FigmaParams.Scaling) || config.FigmaScaling.Default;
    const hideUI = params.get(config.FigmaParams.HideUI);
    const hostspots = params.get(config.FigmaParams.HotSpots);
    const nodeId = params.get(config.FigmaParams.NodeId) || '';

    this.showHotspots = boolFromNumberString(hostspots);
    this.hideControls = boolFromNumberString(hideUI);
    this.scaling = scaling as config.FigmaScaling;
    this.projectId = this.processProjectId(embedURL);
    this.nodeId = nodeId ?? config.DEFAULT_NODE_ID;
  }

  updateParams(
    projectId = '',
    nodeId = config.DEFAULT_NODE_ID,
    hideControls = this.hideControls,
    scaling = this.scaling,
    hotspots = this.showHotspots
  ) {
    const params = queryParamsFromPropertiesMap({
      [config.FigmaParams.NodeId]: nodeId,
      [config.FigmaParams.Scaling]: scaling,
      [config.FigmaParams.HideUI]: Number(hideControls),
      [config.FigmaParams.HotSpots]: Number(hotspots),
    });
    const src = config.buildFigmaProjectURL(projectId, params);

    this.srcChange.emit(src);
  }

  processProjectId(projectId: string): string | undefined {
    return projectId.match(config.FIGMA_PROJECT_ID_REGEX)?.[0];
  }

  processFigmaURL(url: string) {
    const projectId = this.processProjectId(url);
    this.updateParams(projectId, config.DEFAULT_NODE_ID, true, config.FigmaScaling.MinZoom, false);
  }

  onProjectIdChange(projectId: string) {
    this.updateParams(projectId);
  }

  onNodeIdChange(nodeId: string) {
    this.updateParams(this.projectId, decodeURIComponent(nodeId));
  }

  onShowControlsChange(showControls: boolean) {
    this.updateParams(this.projectId, this.nodeId, !showControls);
  }

  onScalingChange(item: ISelectItem) {
    const scaling = item.value as config.FigmaScaling;
    this.updateParams(this.projectId, this.nodeId, this.hideControls, scaling);
  }

  onShowHotspotsChange(showHotspots: boolean) {
    this.updateParams(this.projectId, this.nodeId, this.hideControls, this.scaling, showHotspots);
  }

  openProject() {
    const url = `https://www.${config.FIGMA_FILE_URL}/${this.projectId}`;
    openLinkInNewTab(url);
  }

  onEmbedCodeChange(src: string) {
    this.inputRef.nativeElement.querySelector('input').value = '';
    const url = src.match(config.IFRAME_SRC_REGEX)?.[0] || src;
    if (!url.includes(config.FIGMA_BASE)) return;
    this.srcChange.emit(url);
  }
}
