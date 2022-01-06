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

import { Component, OnDestroy, ViewChild, ElementRef, HostListener } from '@angular/core';
import { lastValueFrom, Subscription } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import {
  getElementAndChildrenUpdatePayloadForId,
  getElementUpdatePayloadForId,
  handleURLNavigationMessage,
} from 'cd-common/utils';
import { CdPostMessage } from 'cd-common/services';
import { DEFAULT_DATASETS } from 'cd-common/datasets';
import * as consts from 'cd-common/consts';
import * as services from 'cd-common/services';
import * as cd from 'cd-interfaces';

const RENDER_OUTLET_URL = `assets/render-outlet/index.html?${consts.ANIMATIONS_ENABLED_QUERY_PARAM}=true`;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnDestroy {
  private _disableHotspots = false;
  private _projectLoadedInRenderer = false;
  private _renderOutletIframe?: HTMLIFrameElement;
  private _subscriptions = new Subscription();
  private rendererInit = false;
  public exportedProject?: cd.IExportedProject;

  @ViewChild('rendererIframeRef', { read: ElementRef }) rendererIframeRef!: ElementRef;

  constructor(private _messagingService: services.CdMessagingService, private http: HttpClient) {
    this._subscriptions.add(this._messagingService.messages$.subscribe(this._handleMessage));
    // Load data for project
    const projectDataRequest = this.http.get<cd.IExportedProject>(consts.PROJECT_JSON_PATH);
    lastValueFrom(projectDataRequest).then(this._handleExportedProject);
  }

  set disableHotspots(disable: boolean) {
    if (disable === this._disableHotspots) return;
    this._disableHotspots = disable;
    if (this._projectLoadedInRenderer) this.sendHotspotState();
  }

  @HostListener('window:hashchange')
  onHashChange() {
    this.disableHotspots = window.location.hash.endsWith('disableHotspots');
    this.sendHotspotState();
  }

  sendHotspotState() {
    const message = new services.PostMessageToggleHotspots(this._disableHotspots);
    this._postMessage(message);
  }

  private _postMessage(message: CdPostMessage) {
    this._messagingService.postMessageToSandbox(this.rendererIframe, message);
  }

  ngOnDestroy() {
    this._subscriptions.unsubscribe();
  }

  get rendererIframe(): HTMLIFrameElement {
    return this.rendererIframeRef.nativeElement as HTMLIFrameElement;
  }

  private _handleExportedProject = (exportedProject?: cd.IExportedProject) => {
    if (!exportedProject) {
      throw new Error('Failed to load exported project');
    }
    this.exportedProject = exportedProject;
    this._sendProjectToRenderer();
  };

  private _handleMessage = (message: services.CdPostMessage) => {
    switch (message.name) {
      case services.MESSAGE_SANDBOX_INIT:
        this.rendererInit = true;
        this._sendProjectToRenderer();
        break;
      case services.MESSAGE_SANDBOX_NAVIGATE_TO_URL:
        handleURLNavigationMessage(message);
        break;
      case services.MESSAGE_SANDBOX_RESET_STATE:
        this._resetProjectState();
        break;
      case services.MESSAGE_SANDBOX_RESET_ELEMENT_STATE:
        this._resetElementState(message as services.PostMessageResetElementState);
        break;
    }
  };

  private _resetProjectState() {
    if (!this.exportedProject) return;
    const { elementProperties, datasets } = this.exportedProject;
    // reload project state
    const propsMsg = new services.PostMessagePropertiesUpdate(elementProperties, true);
    this._postMessage(propsMsg);

    // reload data
    const dataMsg = new services.PostMessageLoadExportedProjectData(datasets);
    this._postMessage(dataMsg);
  }

  private _resetElementState({ elementId, children }: services.PostMessageResetElementState) {
    if (!this.exportedProject) return;
    const elementProps = this.exportedProject?.elementProperties;
    const payload = children
      ? getElementAndChildrenUpdatePayloadForId(elementId, elementProps)
      : getElementUpdatePayloadForId(elementId, elementProps);

    if (!payload.length) return;
    const message = new services.PostMessagePropertiesReplace(payload);
    this._postMessage(message);
  }

  private _sendBuiltInDatasetsToRenderer() {
    const message = new services.PostMessageAddBuiltInDatasets(DEFAULT_DATASETS);
    this._postMessage(message);
  }

  private _sendProjectToRenderer = () => {
    const { rendererInit, exportedProject } = this;
    if (rendererInit && exportedProject) {
      const message = new services.PostMessageLoadExportedProject(exportedProject);
      this._postMessage(message);
      this._projectLoadedInRenderer = true;
      this._sendBuiltInDatasetsToRenderer();
      this._createRenderOutletIframe(exportedProject.project.homeBoardId || '');
      this.onHashChange();
    }
  };

  private _createRenderOutletIframe = (renderBoardId: string) => {
    if (this._renderOutletIframe) document.body.removeChild(this._renderOutletIframe);
    const { IFRAME_TAG, NAME_ATTR, SRC_ATTR, ALLOW_ATTR, SANDBOX_ATTR } = consts;
    this._renderOutletIframe = document.createElement(IFRAME_TAG);
    this._renderOutletIframe.setAttribute(SANDBOX_ATTR, consts.getIframeSandbox());
    this._renderOutletIframe.setAttribute(NAME_ATTR, renderBoardId);
    this._renderOutletIframe.setAttribute(SRC_ATTR, RENDER_OUTLET_URL);
    this._renderOutletIframe.setAttribute(ALLOW_ATTR, consts.getIframeFeaturePolicy());
    this._renderOutletIframe.setAttribute('class', 'render-outlet-iframe');
    document.body.appendChild(this._renderOutletIframe);
  };
}
