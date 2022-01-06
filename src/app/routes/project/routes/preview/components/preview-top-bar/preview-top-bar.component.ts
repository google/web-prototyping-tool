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
  Input,
  HostListener,
  OnDestroy,
  ChangeDetectorRef,
  AfterViewInit,
  OnInit,
} from '@angular/core';
import { sizeConfig } from 'src/app/routes/project/configs/root-element.properties.config';
import { PREVIEW_TOGGLE_SHORTCUT } from 'src/app/routes/project/configs/project.config';
import { RendererService } from 'src/app/services/renderer/renderer.service';
import { ToastsService } from 'src/app/services/toasts/toasts.service';
import { UNTITLED_PROJECT_NAME } from 'cd-common/consts';
import { HistoryStack } from './preview-top-bar.utils';
import { Subscription, Observable } from 'rxjs';
import { AnalyticsService } from 'src/app/services/analytics/analytics.service';
import { PeopleService } from 'src/app/services/people/people.service';
import { AnalyticsEvent } from 'cd-common/analytics';
import { ShareDialogComponent } from 'src/app/components/share-dialog/share-dialog.component';
import * as boardUtils from 'src/app/routes/project/utils/board.utils';
import * as config from '../../preview.config';
import * as common from 'cd-common';
import * as cd from 'cd-interfaces';

const HOVER_TIMEOUT = 500;

const RESET_PROTO_TOAST = {
  id: 'reset-proto',
  iconName: 'info',
  message: 'Prototype reset to original state',
};

@Component({
  selector: 'app-preview-top-bar',
  templateUrl: './preview-top-bar.component.html',
  styleUrls: ['./preview-top-bar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PreviewTopBarComponent
  extends common.AbstractOverlayControllerDirective
  implements OnDestroy, AfterViewInit, OnInit
{
  private _project?: cd.IProject;
  private _email = '';
  private _previewParams!: cd.IPreviewParams;
  private _subscription = Subscription.EMPTY;
  private _timer = 0;

  public historyStack = new HistoryStack();
  public deviceMenu: cd.IMenuConfig[] = [];
  public previewActionTooltip = PREVIEW_TOGGLE_SHORTCUT;
  public zoomMenu: cd.IMenuConfig[] = config.zoomMenuConfig;
  public owner$?: Observable<cd.PartialUser | undefined>;
  public hide = true;
  public init = false;
  public navHistory = [];

  @Input() commentCounts = new Map<string, number>();
  @Input() boards: ReadonlyArray<cd.IBoardProperties> = [];
  @Input()
  set project(value: cd.IProject | undefined) {
    this._project = value;
    this.setOwnerDetails(value);
  }
  get project(): cd.IProject | undefined {
    return this._project;
  }

  @Input() viewingComponent = false;
  @Input() projectName = '';
  @Input() isProjectOwner = true;
  @Input()
  set previewParams(value: cd.IPreviewParams) {
    this._previewParams = value;
    this.historyStack.pushStack(value.id);
  }
  get previewParams(): cd.IPreviewParams {
    return this._previewParams;
  }

  @Output() exit = new EventEmitter<void>();
  @Output() fork = new EventEmitter<void>();
  @Output() paramChange = new EventEmitter<Partial<cd.IPreviewParams>>();

  constructor(
    private _analyticsService: AnalyticsService,
    private _cdRef: ChangeDetectorRef,
    private _toastService: ToastsService,
    private _menuService: common.MenuService,
    private _peopleService: PeopleService,
    private _rendererService: RendererService,
    public overlayService: common.OverlayService
  ) {
    super(overlayService);

    this.deviceMenu = config.defaultDeviceMenu.concat(sizeConfig).map((item) => {
      const value = item.id;
      return { ...item, value };
    });
  }

  setOwnerDetails(project: cd.IProject | undefined) {
    const email = project?.owner.email;
    if (this._email === email || !email) return;
    this._email = email;
    this.owner$ = this._peopleService.getUserDetailsForEmailAsObservable(email);
  }

  ngAfterViewInit(): void {
    this.init = true;
    this.historyStack.initalId = this._previewParams.id;
    this._cdRef.markForCheck();
  }

  ngOnInit(): void {
    this._subscription = this._menuService.isVisible.subscribe(this.onMenuVisibilityChange);
  }

  get hidden() {
    const { fullscreen, embedMode } = this.previewParams;
    if (embedMode) return true;
    if (fullscreen) return this.hide;
    return false;
  }

  get isCommentToggleDisabled() {
    const boardCount = this.boards.length ?? 0;
    return boardCount === 0;
  }

  get title() {
    return this.projectName || UNTITLED_PROJECT_NAME;
  }

  get deviceMode() {
    return this.previewParams?.device || cd.DeviceMenuSizes.FitToBoard;
  }

  get highlightDeviceMenu() {
    return this.deviceMode !== cd.DeviceMenuSizes.FitToBoard;
  }

  get disableRotation() {
    const { fullscreen, device } = this.previewParams;
    return fullscreen || device === cd.DeviceMenuSizes.FitToScreen || this.viewingComponent;
  }

  get disableZoom() {
    return this.previewParams.device === cd.DeviceMenuSizes.FitToScreen;
  }

  get isFullscreen() {
    return this.previewParams.fullscreen;
  }

  get zoomLevel() {
    return this.previewParams?.zoom || cd.ZoomAmount.Default;
  }

  get highlightZoomMenu() {
    return this.zoomLevel !== cd.ZoomAmount.Default;
  }

  onClosePreview() {
    this.exit.emit();
  }

  onRotateOrientationClick() {
    const rotate = !this.previewParams.rotate;
    this.paramChange.emit({ rotate });
  }

  onDeviceMenuChange(item: cd.IMenuConfig) {
    const device = String(item.value);
    const isScreenFit = device === cd.DeviceMenuSizes.FitToScreen;
    const adjustZoom = isScreenFit ? { zoom: cd.ZoomAmount.Default } : {};
    this.paramChange.emit({ device, fullscreen: false, ...adjustZoom });
  }

  onZoomMenuChange(item: cd.IMenuConfig) {
    const zoom = item.value as cd.ZoomAmount;
    this.paramChange.emit({ zoom, fullscreen: false });
  }

  onFullScreenToggle() {
    const fullscreen = !this.isFullscreen;
    const comments = fullscreen ? false : this.previewParams.comments;
    const accessibility = fullscreen ? false : this.previewParams.accessibility;
    this.paramChange.emit({ fullscreen, zoom: cd.ZoomAmount.Default, comments, accessibility });
  }

  onAccessiblityToggle() {
    const accessibility = !this.previewParams.accessibility;
    this.paramChange.emit({ accessibility, comments: false });
  }

  onCommentToggle() {
    const comments = !this.previewParams.comments;
    this.paramChange.emit({ comments, accessibility: false });
  }

  onForkClick() {
    this.fork.emit();
  }

  onShareClick() {
    this.openShareDialog();
  }

  get hotspotsActive() {
    if (this.previewParams?.disableHotspots) return false;
    return true;
  }

  onToggleTargets() {
    const disableHotspots = !this.previewParams?.disableHotspots;
    this.paramChange.emit({ disableHotspots });
  }

  openShareDialog() {
    const { project } = this;
    if (!project) return;
    const { homeBoardId } = project;
    if (!homeBoardId) return;

    const boardSelectOptions = boardUtils.createBoardSelectMenu(this.boards, homeBoardId);
    const componentRef = this.showModal<ShareDialogComponent>(ShareDialogComponent);

    componentRef.instance.project = project;
    componentRef.instance.selectedBoardId = project.homeBoardId || '';
    componentRef.instance.boardOptions = boardSelectOptions;
    componentRef.instance.previewMode = true;
    componentRef.instance.openInPreview = true;
    componentRef.instance.setParams(this.previewParams);

    this._analyticsService.logEvent(AnalyticsEvent.ShareDialogOpenedFromPreview);
  }

  /** Close the top bar when fullscreen and menu closes */
  onMenuVisibilityChange = (visible: boolean) => {
    if (!this.isFullscreen && visible === true) return;
    this.startHideTimer();
  };

  startHideTimer() {
    if (!this.isFullscreen) return;
    clearTimeout(this._timer);
    this._timer = window.setTimeout(this.hideTopBar, HOVER_TIMEOUT);
  }

  hideTopBar = () => {
    // Don't close if a menu is open
    if (this._menuService.visible) return;
    this.hide = true;
    this._cdRef.markForCheck();
  };

  @HostListener('mouseout')
  @HostListener('mouseleave')
  onMouseout() {
    this.startHideTimer();
  }

  @HostListener('mouseover')
  @HostListener('mouseenter')
  onOpenerMouseover() {
    clearTimeout(this._timer);
    this.hide = false;
  }

  get initialBoardId() {
    return this.historyStack.initalId || this.project?.homeBoardId;
  }

  onResetPrototype() {
    const { initialBoardId: id } = this;
    if (!id) return;
    this.historyStack.resetStack();
    this._rendererService.resetState();
    this.paramChange.emit({ id });
    this._toastService.addToast(RESET_PROTO_TOAST);
  }

  onForwardNavigation() {
    const id = this.historyStack.goForward();
    this.paramChange.emit({ id });
  }

  onBackNavigation() {
    const id = this.historyStack.goBack();
    this.paramChange.emit({ id });
  }

  ngOnDestroy(): void {
    this._toastService.removeToast(RESET_PROTO_TOAST.id);
    this._subscription.unsubscribe();
    clearTimeout(this._timer);
    super.ngOnDestroy();
  }
}
