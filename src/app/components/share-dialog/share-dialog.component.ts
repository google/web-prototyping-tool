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
  AfterViewInit,
  HostBinding,
  OnDestroy,
  ChangeDetectorRef,
} from '@angular/core';

import * as cd from 'cd-interfaces';
import * as utils from 'cd-common/utils';
import * as consts from 'cd-common/consts';
import { copyToClipboard } from 'cd-utils/clipboard';
import { queryParamsFromPropertiesMap } from 'cd-utils/url';
import { OverlayInitService, AbstractOverlayContentDirective } from 'cd-common';
import { AnalyticsEvent, AnalyticsEventType } from 'cd-common/analytics';
import { AnalyticsService } from 'src/app/services/analytics/analytics.service';
import { Route, EMBED_MODE_QUERY_PARAM } from 'src/app/configs/routes.config';

const EMBED_TAB_INDEX = 1;

@Component({
  selector: 'app-share-dialog',
  templateUrl: './share-dialog.component.html',
  styleUrls: ['./share-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShareDialogComponent
  extends AbstractOverlayContentDirective
  implements AfterViewInit, OnDestroy
{
  private _selectedBoardId = '';
  private _previewMode = false;
  private _timer = 0;

  public activeListRow = 0;
  public activeTab = 0;
  public url = '';
  public embedUrl = '';
  public projectId = '';
  public projectName = '';
  public owner?: Partial<cd.IUser> | undefined;
  public ownerEmail = '';
  public embedMode = false;
  public showBadge = true;
  public embedLinkOnly = false;
  public copied = false;
  public iFrameHtml = '';
  public badgePosition: cd.EmbedBadgePosition = cd.EmbedBadgePosition.TopRight;
  public fullscreen = false;
  public comments = false;
  public accessibility = false;
  public openInPreview = false;
  public flow = false;
  public landmarks = false;
  public headings = false;

  public badgePositionOptions: cd.ISelectItem[] = [
    {
      selected: true,
      title: consts.LayoutAlignment.TopRight,
      value: cd.EmbedBadgePosition.TopRight,
    },
    {
      title: consts.LayoutAlignment.BottomRight,
      value: cd.EmbedBadgePosition.BottomRight,
    },
    {
      title: consts.LayoutAlignment.BottomLeft,
      value: cd.EmbedBadgePosition.BottomLeft,
    },
    {
      title: consts.LayoutAlignment.TopLeft,
      value: cd.EmbedBadgePosition.TopLeft,
    },
  ];

  @Input() boardOptions: cd.ISelectItem[] = [];

  @Input() set previewMode(value: boolean) {
    this._previewMode = value;
    this.setUrl();
  }
  get previewMode() {
    return this._previewMode;
  }

  get projectUrl(): string {
    const root = window.location.origin;
    return `${root}/${Route.Project}/${this.projectId}`;
  }

  get embedTabActive(): boolean {
    return this.activeTab === EMBED_TAB_INDEX;
  }

  @Input() set project(project: cd.IProject) {
    const { id, name, owner } = project;
    this.projectId = id;
    this.projectName = name || consts.UNTITLED_PROJECT_NAME;
    this.untitledProject = !name;
    this.ownerEmail = owner.email || '';
    this.setUrl();
  }

  @Input() set selectedBoardId(id: string) {
    this._selectedBoardId = id;
    this.setIFrameCode();
  }
  get selectedBoardId(): string {
    return this._selectedBoardId;
  }

  @HostBinding('class.untitled-project')
  untitledProject = false;

  constructor(
    _overlayInit: OverlayInitService,
    private _cdef: ChangeDetectorRef,
    private _analyticsService: AnalyticsService
  ) {
    super(_overlayInit);
  }

  get embedQueryParams() {
    const { selectedBoardId: id, showBadge, badgePosition, flow, landmarks, headings } = this;

    const greenlinesEnabled = flow || landmarks || headings;
    const accessibility = greenlinesEnabled;

    const params = {
      id,
      ...(showBadge && { showBadge: badgePosition }),
      ...(flow && { flow }),
      ...(landmarks && { landmarks }),
      ...(headings && { headings }),
      ...(accessibility && { accessibility }),
    };

    return queryParamsFromPropertiesMap(params);
  }

  get linkParams() {
    const { comments, fullscreen, accessibility } = this;
    const params = {
      ...(comments && { comments }),
      ...(fullscreen && { fullscreen }),
      ...(accessibility && { accessibility }),
    };

    return queryParamsFromPropertiesMap(params);
  }

  get urlQueryParams() {
    const { embedMode, selectedBoardId: id, badgePosition: showBadge } = this;
    const params: Record<string, string | number | boolean> = this.showBadge
      ? { embedMode, id, showBadge }
      : { embedMode, id };

    return queryParamsFromPropertiesMap(params);
  }

  ngOnDestroy(): void {
    window.clearTimeout(this._timer);
  }

  ngAfterViewInit() {
    super.ngAfterViewInit();
  }

  getIframeHTML(embedUrl: string, linkOnly: boolean) {
    if (linkOnly) return embedUrl;
    return utils.constructElement(consts.IFRAME_TAG, '', '', [[consts.SRC_ATTR, embedUrl]]);
  }

  onFocus(e: FocusEvent) {
    (e.currentTarget as HTMLInputElement)?.select();
  }

  private setIFrameCode() {
    const embedUrl = `${this.projectUrl}/${Route.Preview}?${EMBED_MODE_QUERY_PARAM}=1&${this.embedQueryParams}`;
    this.embedUrl = embedUrl;
    this.iFrameHtml = this.getIframeHTML(embedUrl, this.embedLinkOnly);
  }

  private setLinkUrl() {
    this.url = !this.openInPreview ? this.projectUrl : `${this.projectUrl}/${Route.Preview}`;
    if (this.openInPreview && this.linkParams) {
      this.url += `?${this.linkParams}`;
    }
  }

  private setUrl() {
    const previewUrl = `${this.projectUrl}/${Route.Preview}`;
    this.url = this.previewMode ? previewUrl : this.projectUrl;
    this.setLinkUrl();
    this.setIFrameCode();
  }

  public setParams(params: cd.IPreviewParams) {
    const { fullscreen, comments, accessibility, flow, landmarks, headings } = params;
    this.fullscreen = fullscreen ?? false;
    this.comments = comments ?? false;
    this.accessibility = accessibility ?? false;
    this.flow = flow ?? false;
    this.landmarks = landmarks ?? false;
    this.headings = headings ?? false;
    this.setUrl();
  }

  onFullScreenChange(fullscreen: boolean) {
    this.fullscreen = fullscreen;
    this.setUrl();
  }

  onCommentsChange(comments: boolean) {
    this.comments = comments;
    if (this.comments) this.accessibility = false;
    this.setUrl();
  }

  onAccessibilityChange(accessibility: boolean) {
    this.accessibility = accessibility;
    this.setUrl();
  }

  onEnableFlowGreenlines(enabled: boolean) {
    this.flow = enabled;
    this.setUrl();
  }

  onEnableLandmarkGreenlines(enabled: boolean) {
    this.landmarks = enabled;
    this.setUrl();
  }

  onEnableHeadingGreenlines(enabled: boolean) {
    this.headings = enabled;
    this.setUrl();
  }

  onPreviewToggle(preview: boolean) {
    this.openInPreview = preview;
    this.setUrl();
  }

  onBadgePositionChange(option: cd.SelectItemOutput) {
    this.badgePosition = (option as cd.ISelectItem).value as cd.EmbedBadgePosition;
    this.setIFrameCode();
  }

  onEmbedTargetChange(option: cd.SelectItemOutput) {
    this.selectedBoardId = (option as cd.ISelectItem).value;
  }

  onDismissClicked() {
    this.dismissOverlay.emit();
  }

  onEmbedModeClick() {
    this.embedMode = !this.embedMode;
    this.setIFrameCode();
  }

  onShowBadgeChange(event: boolean) {
    this.showBadge = event;
    this.setIFrameCode();
  }

  onCopyClick(value: string) {
    const evt = this.getAnalyticsEventFromCopyEvent();
    if (evt) this._analyticsService.logEvent(evt);

    copyToClipboard(value);
    this.copied = true;
    window.clearTimeout(this._timer);
    this._timer = window.setTimeout(this.hideCopied, 2000);
  }

  hideCopied = () => {
    this.copied = false;
    this._cdef.markForCheck();
  };

  onURLInputFoucs(e: FocusEvent) {
    (e.target as HTMLInputElement).select();
  }

  onTabChange(newTab: number) {
    this.activeTab = newTab;
  }

  onEmbedLinkOnlyChange(event: boolean) {
    this.embedLinkOnly = event;
    this.setIFrameCode();
  }

  get isEmbedTabVisible() {
    return this.activeTab === EMBED_TAB_INDEX;
  }

  private getAnalyticsEventFromCopyEvent(): AnalyticsEventType | undefined {
    const { isEmbedTabVisible, embedLinkOnly } = this;

    if (!isEmbedTabVisible) return AnalyticsEvent.ShareDialogLinkCopied;
    if (isEmbedTabVisible && !embedLinkOnly) return AnalyticsEvent.ShareDialogEmbedCodeCopied;
    if (isEmbedTabVisible && embedLinkOnly) return AnalyticsEvent.ShareDialogEmbedLinkCopied;

    return;
  }
}
