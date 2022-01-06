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

/* eslint-disable max-lines */
import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  OnDestroy,
  ChangeDetectorRef,
  HostListener,
  HostBinding,
  AfterViewInit,
  ViewChild,
  ElementRef,
  Optional,
} from '@angular/core';
import { LayerMode } from './components/preview-canvas/preview-glass-layer/preview-glass-layer.component';
import { Router, ActivatedRoute, Params, NavigationStart } from '@angular/router';
import { ExternalPreviewMessagingService } from 'cd-common/services';
import { PROJECT_ID_ROUTE_PARAM, Route } from '../../../../configs/routes.config';
import { constructProjectPath, constructProjectPathToBoard } from '../../../../utils/route.utils';
import { defaultPreviewConfig, PreviewShortcut, LEFT_PANEL_GAP_WIDTH } from './preview.config';
import { AnalyticsEvent, AnalyticsEventType, IAnalyticsEventParams } from 'cd-common/analytics';
import { ICommentsState } from '../../store/reducers/comment-threads.reducer';
import { RendererService } from '../../../../services/renderer/renderer.service';
import { PropertiesService } from '../../services/properties/properties.service';
import { DuplicateService } from '../../../../services/duplicate/duplicate.service';
import { CanvasService } from '../../services/canvas/canvas.service';
import { OverlayService } from 'cd-common';
import { PreviewService } from './preview.service';
import { ToastsService } from 'src/app/services/toasts/toasts.service';
import { Subscription, Observable, firstValueFrom } from 'rxjs';
import { filter, shareReplay, take } from 'rxjs/operators';
import { Store, select } from '@ngrx/store';
import { KEYS } from 'cd-utils/keycodes';
import { environment } from 'src/environments/environment';
import { ProjectContentService } from 'src/app/database/changes/project-content.service';
import { PreviewInteractionService } from './services/preview-interaction.service';
import { AnalyticsService } from 'src/app/services/analytics/analytics.service';
import { areObjectsEqual } from 'cd-utils/object';
import * as projectStore from '../../store';
import * as appStore from '../../../../store';
import * as utils from './utils/preview.utils';
import * as cd from 'cd-interfaces';
import { PresenceService } from 'src/app/services/presence/presence.service';

@Component({
  selector: 'app-preview',
  templateUrl: './preview.component.html',
  styleUrls: ['./preview.component.scss'],
  providers: [ExternalPreviewMessagingService, PreviewInteractionService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PreviewComponent implements OnInit, OnDestroy, AfterViewInit {
  private _subscriptions = new Subscription();
  private _symbolIsolationId?: string | null;
  private _activeOutletId = '';
  private _projectId = '';

  public boardHeight = 0;
  public boards: ReadonlyArray<cd.IBoardProperties> = [];
  public boardWidth = 0;
  public codeComponents: ReadonlyArray<cd.ICodeComponentDocument> = [];
  public commentCounts$: Observable<Map<string, number>>;
  public commentState?: ICommentsState;
  public elementProperties?: cd.ElementPropertiesMap;
  public homeBoardId?: string;
  public previewParams: cd.IPreviewParams = { ...defaultPreviewConfig };
  public previewSize?: utils.IBoardSize;
  public project?: cd.IProject;
  public projectUrl = '';
  public prevA11yMode?: cd.IA11yModeState;
  public propertiesLoaded = false;
  public symbols: ReadonlyArray<cd.ISymbolProperties> = [];
  public user?: cd.IUser;
  public viewingComponent = false;
  public zoomScale = 0.5;
  public darkTheme$: Observable<boolean>;

  @HostBinding('class.embed-mode')
  get isEmbedMode() {
    return this.previewParams.embedMode;
  }

  @ViewChild('previewCanvas', { read: ElementRef, static: true }) _previewCanvas!: ElementRef;

  constructor(
    public presenceService: PresenceService,
    @Optional() private _canvasService: CanvasService,
    private _analyticsService: AnalyticsService,
    private _propertiesService: PropertiesService,
    private _previewMessageService: ExternalPreviewMessagingService,
    private _duplicateService: DuplicateService,
    private _interactionService: PreviewInteractionService,
    private _projectStore: Store<projectStore.IProjectState>,
    private _projectContentService: ProjectContentService,
    private _appStore: Store<appStore.IAppState>,
    private _renderer: RendererService,
    private _overlayService: OverlayService,
    private _previewService: PreviewService,
    private _activatedRoute: ActivatedRoute,
    private _cdRef: ChangeDetectorRef,
    private _router: Router,
    private _toastsService: ToastsService
  ) {
    this.darkTheme$ = _appStore.pipe(select(appStore.getDarkTheme));

    this._subscriptions.add(this._activatedRoute.queryParams.subscribe(this.onQueryParams));
    this._subscriptions.add(this._activatedRoute.fragment.pipe(take(1)).subscribe(this.onFragment));
    this.commentCounts$ = this._projectStore.pipe(
      select(projectStore.getCommentCounts),
      shareReplay({ bufferSize: 1, refCount: true })
    );
  }

  getProjectIdFromRoute(): string {
    return this._activatedRoute.snapshot.params[PROJECT_ID_ROUTE_PARAM] || '';
  }

  getRouterPath() {
    return this._router.url;
  }

  ngOnInit() {
    this.initializeParams();
    const { _projectStore, _appStore, _subscriptions, _router, _renderer } = this;
    this._projectId = this.getProjectIdFromRoute();

    const codeComps$ = this._projectContentService.codeCmpArray$;
    const project$ = this._projectContentService.project$;
    const outlets$ = this._projectContentService.outletFrames$;
    const comments$ = _projectStore.pipe(select(projectStore.getCommentsState));
    const user$ = _appStore.pipe(select(appStore.getUser));
    const projectLoaded$ = this._projectContentService.projectLoaded$;
    const elemProps$ = this._projectContentService.elementProperties$;
    // Fixes an issue where navigating from preview to the dashboard fires unecissary query events
    const onNavigateFromPreview$ = _router.events.pipe(
      filter((e) => e instanceof NavigationStart && !e.url.includes(Route.Preview))
    );
    const { navigateHomeEvents$ } = this._previewMessageService;
    const { selectedElementId$ } = this._interactionService;

    _subscriptions.add(elemProps$.subscribe(this.onElementPropsLoad));
    _subscriptions.add(comments$.subscribe(this.onCommentsSubscription));
    _subscriptions.add(project$.subscribe(this.onProjectSubscription));
    _subscriptions.add(outlets$.subscribe(this.onOutletsSubscription));
    _subscriptions.add(user$.subscribe(this.onUserSubscription));
    _subscriptions.add(_renderer.navigationEvent$.subscribe(this.onRendererNavigationEvent));
    _subscriptions.add(navigateHomeEvents$.subscribe(this.handlePostMessage));
    _subscriptions.add(codeComps$.subscribe(this.onCodeComponentsSubscription));
    _subscriptions.add(projectLoaded$.subscribe(this.onPropertiesLoaded));
    _subscriptions.add(selectedElementId$.subscribe(this.onSelectedElementChanged));
    _subscriptions.add(onNavigateFromPreview$.subscribe(this.clearSubscriptions));

    this.sendAnalyticsFromEmbeddedProject();
  }

  get allOutlets() {
    return [...this.boards, ...this.symbols, ...this.codeComponents];
  }

  get showCommentsPanel() {
    const { comments, embedMode } = this.previewParams;
    return comments && !embedMode;
  }

  get currentSelectedElementId() {
    return this.previewParams.elementId;
  }

  get showAccessibilityPanel() {
    const { accessibility, embedMode } = this.previewParams;
    return accessibility && !embedMode;
  }

  get glassLayerMode(): LayerMode | undefined {
    if (this.showAccessibilityPanel) return LayerMode.A11y;
    if (this.showCommentsPanel) return LayerMode.Comments;
    return;
  }

  get showEmbedModeGreenlines() {
    return this.previewParams.embedMode && this.greenlinesEnabled;
  }

  get showPreviewGlassLayer() {
    return this.showCommentsPanel || this.showAccessibilityPanel || this.showEmbedModeGreenlines;
  }

  get greenlinesEnabled() {
    const { flow, landmarks, headings } = this.previewParams;
    return flow || landmarks || headings;
  }

  get canShowRightPanel() {
    return this.showCommentsPanel || this.showAccessibilityPanel;
  }

  get canShowBoardList() {
    const { fullscreen, embedMode, showLeftPanel } = this.previewParams;
    return !fullscreen && !embedMode && showLeftPanel;
  }

  get leftPanelGapWidth() {
    const hideLeftPanelGap = this.isFullscreen || this.previewParams.showLeftPanel;
    return hideLeftPanelGap ? 0 : LEFT_PANEL_GAP_WIDTH;
  }

  get isProjectOwner(): boolean {
    const userId = this.user?.id;
    const ownerId = this.project?.owner?.id;
    if (userId === undefined || ownerId === undefined) return false;
    return userId === ownerId;
  }

  get isFullscreen() {
    const { fullscreen, embedMode } = this.previewParams;
    return embedMode || fullscreen;
  }

  get isFitToScreen() {
    const { fullscreen, embedMode, device } = this.previewParams;
    return !fullscreen && !embedMode && device === cd.DeviceMenuSizes.FitToScreen;
  }

  get isScaleToFit() {
    const { fullscreen, embedMode, zoom } = this.previewParams;
    return !fullscreen && !embedMode && zoom === cd.ZoomAmount.ScaleToFit;
  }

  // Accessibility

  get isGrayscale() {
    return this.previewParams.accessibilityMode === cd.AccessibilityMode.Grayscale;
  }

  get isDeuteranomaly() {
    return this.previewParams.accessibilityMode === cd.AccessibilityMode.Deuteranomaly;
  }

  get isProtanopiam() {
    return this.previewParams.accessibilityMode === cd.AccessibilityMode.Protanopiam;
  }

  /** Only set when entering from symbol isolation */
  onFragment = (fragment: string | null) => {
    this._symbolIsolationId = fragment;
  };

  initializeParams() {
    // Ensure comments are loaded when navigating
    const comments = this.previewParams.comments ? { comments: true } : {};
    const initialParams = { ...this._previewService.getPreferences(), ...comments };
    this.onParamChange(initialParams);
  }

  ngAfterViewInit() {
    this.projectUrl = constructProjectPath(this._projectId);
  }

  isComponent = (id: string) => [...this.symbols, ...this.codeComponents].some((s) => s.id === id);

  onRendererNavigationEvent = (rootId: string) => {
    const rootElem = this._propertiesService.getPropertiesForId(rootId);
    if (!rootElem) return;
    this.updateCurrentBoard(rootId);
  };

  handlePostMessage = () => {
    if (!this.project) return;
    const { homeBoardId } = this.project;
    this.updateQueryParams({ id: homeBoardId });
  };

  updateQueryParams(_params: Params) {
    const queryParams = utils.cleanupParams(_params);
    this._router.navigate([], {
      queryParams,
      queryParamsHandling: 'merge',
      preserveFragment: true,
      replaceUrl: true,
    });
  }

  onElementPropsLoad = (props: cd.ElementPropertiesMap) => {
    this.elementProperties = props;
    this._cdRef.markForCheck();
  };

  onCommentsSubscription = (commentState: ICommentsState) => {
    this.commentState = commentState;
    this._cdRef.markForCheck();
  };

  /**
   * Detects if the preview is opening in an iframe or not. Used to differentiate
   * between the Preview page and embedded projects
   */
  private sendAnalyticsFromEmbeddedProject() {
    try {
      const topHost = window.top.location.hostname;
      this.logAnalytics(AnalyticsEvent.PreviewOpen, { message: topHost });
    } catch (e) {
      this.logAnalytics(AnalyticsEvent.EmbedRendered);
    }
  }

  private sendAnalyticsForIncomingTraffic(currentParams: Params) {
    const validAnalyticsParams = Object.values(cd.PreviewAnalyticsParam);
    const param = Number(currentParams.analyticsEvent);

    /** Ensures unexpected numerical values do not get logged as an analyticsEvent */
    if (!validAnalyticsParams.includes(param)) return;
    const embedClick = param === cd.PreviewAnalyticsParam.EmbedClickThrough;
    const evt = embedClick
      ? AnalyticsEvent.EmbedBadgeClickThrough
      : AnalyticsEvent.EmailAlertClickThrough;

    this.logAnalytics(evt);
  }

  private onQueryParams = (params: Params) => {
    this.viewingComponent = this.isComponent(params.id);

    // Must occur before params are cleaned up
    if (params.analyticsEvent) {
      this.sendAnalyticsForIncomingTraffic(params);
    }

    const preview = utils.paramsToPreviewParams(params, this.viewingComponent);
    this._renderer.toggleHotspots(params?.disableHotspots);
    this.setA11yModeState(preview);
    this.previewParams = preview;
    this.update(preview);

    // disable toasts when embed mode
    this._toastsService.disableToasts = preview.embedMode || false;

    this._cdRef.markForCheck();
  };

  onUserSubscription = (user: cd.IUser | undefined) => {
    this.user = user;
    this._cdRef.markForCheck();
  };

  onOutletsSubscription = ({ symbols, boards }: cd.IOutletFrameSubscription) => {
    this.symbols = symbols;
    this.boards = boards;
    this.viewingComponent = this.isComponent(this.previewParams.id);
    this.update(this.previewParams);
    this._cdRef.markForCheck();
  };

  onCodeComponentsSubscription = (codeComponents: cd.ICodeComponentDocument[]) => {
    this.codeComponents = codeComponents;
    this.viewingComponent = this.isComponent(this.previewParams.id);
    this.update(this.previewParams);
    this._cdRef.markForCheck();
  };

  onPropertiesLoaded = (propertiesLoaded: boolean) => {
    this.propertiesLoaded = propertiesLoaded;
    this.update(this.previewParams);
    this._cdRef.markForCheck();
  };

  updateCurrentBoard(id: string) {
    this._previewCanvas.nativeElement.scrollTop = 0;
    this.onParamChange({ id });
  }

  sendBoardIdToParentWindow(id: string) {
    if (!this.isEmbedMode) return;
    this._previewMessageService.sendBoardNavigationEvent(id);
  }

  updateOutletIdOnParamChange(id: string) {
    if (this._activeOutletId === id) return;
    this._activeOutletId = id;
    this._interactionService.clearSelectedElementId(); // Reset
    this._renderer.clearAllA11yRects();
    this.sendBoardIdToParentWindow(id);
  }

  updateBoardDimensionsOnParamUpdate(id: string, params: cd.IPreviewParams) {
    const { allOutlets, propertiesLoaded, viewingComponent } = this;
    if (!propertiesLoaded || !allOutlets.length) return;
    const activeOutlet = allOutlets.find((item) => item.id === id);
    // The screenshot service detects page errors and skips over
    // if this board is missing it should capture this error
    if (id && !activeOutlet) {
      const MISSING_ERROR = 'Board or symbol may have been removed';
      this._toastsService.addToast({ iconName: 'warning', message: MISSING_ERROR });
      setTimeout(this.navigateToHomeboard, 2000);
      // Only throw an error when gapi is not enabled such as in the screenshot service
      if (environment.gapiEnabled) return;
      throw new Error('Preview: Invalid outlet - ' + MISSING_ERROR);
    }

    const size = utils.paramToOutletFrameSize(activeOutlet, params, viewingComponent);
    if (!size) return;
    this.boardWidth = size.width;
    this.boardHeight = size.height;
  }

  navigateToHomeboard = () => {
    this.updateQueryParams({ id: this.homeBoardId });
  };

  update(params: cd.IPreviewParams) {
    this.zoomScale = utils.scaleFromZoomAmount(params?.zoom);
    this.updateBoardDimensionsOnParamUpdate(params.id, params);
    this.updateOutletIdOnParamChange(params.id);
    this._cdRef.markForCheck();
  }

  updateHomeboard(id: string | undefined) {
    this.homeBoardId = id;
    if (!this.previewParams.id && id) {
      this.updateCurrentBoard(id);
    }
  }

  onProjectSubscription = async (project: cd.IProject | undefined) => {
    if (!project) return;
    this.project = project;
    const boardIds = await firstValueFrom(this._projectContentService.boardIds$);
    const homeboard = project?.homeBoardId || boardIds[0];
    this.updateHomeboard(homeboard);
    this._cdRef.markForCheck();
  };

  /**
   * DO NOT MODFIY THIS METHOD, YOU MAY BREAK OTHER AREAS
   * If you want to say disable accessibilty when comments are open
   * do that in the method that toggles comments
   */
  onParamChange(params: Partial<cd.IPreviewParams>) {
    const queryParams = { ...this.previewParams, ...params };
    this.setAnalytics(this.previewParams, queryParams);
    this.previewParams = queryParams;
    this.updateQueryParams(queryParams);
    this._previewService.savePreferences(queryParams);
    this._cdRef.markForCheck();
  }

  setA11yModeState(newParams: cd.IPreviewParams) {
    const mode = utils.buildA11yModeState(newParams);
    if (areObjectsEqual(mode, this.prevA11yMode)) return;
    this._renderer.setA11yMode(mode);
    this.prevA11yMode = mode;
  }

  logAnalytics(evt: AnalyticsEventType, params?: IAnalyticsEventParams) {
    this._analyticsService.logEvent(evt, params);
  }

  didAccessibilityPanelOpen(oldParams: cd.IPreviewParams, newParams: cd.IPreviewParams) {
    if (newParams.accessibility && !oldParams.accessibility) {
      this.logAnalytics(AnalyticsEvent.A11yPreviewPanelOpen);
    }
  }

  wasElementInspected(oldParams: cd.IPreviewParams, newParams: cd.IPreviewParams) {
    if (newParams.elementId && newParams.elementId !== oldParams.elementId) {
      this.logAnalytics(AnalyticsEvent.A11yAttrInspected);
    }
  }

  didA11yColorChangeOccur(oldParams: cd.IPreviewParams, newParams: cd.IPreviewParams) {
    if (
      newParams.accessibilityMode !== undefined &&
      newParams.accessibilityMode !== oldParams.accessibilityMode
    ) {
      const mode = newParams.accessibilityMode;
      this.logAnalytics(AnalyticsEvent.A11yColorsChanged, { name: cd.AccessibilityMode[mode] });
    }
  }

  wereA11yFlowsViewed(oldParams: cd.IPreviewParams, newParams: cd.IPreviewParams) {
    if (newParams.flow && !oldParams.flow) {
      this.logAnalytics(AnalyticsEvent.A11yFlowGreenlinesViewed);
    }
  }

  wereA11yLandmarksViewed(oldParams: cd.IPreviewParams, newParams: cd.IPreviewParams) {
    if (newParams.landmarks && !oldParams.landmarks) {
      this.logAnalytics(AnalyticsEvent.A11yLandmarkGreenlinesViewed);
    }
  }

  wereA11yHeadingsViewed(oldParams: cd.IPreviewParams, newParams: cd.IPreviewParams) {
    if (newParams.headings && !oldParams.headings) {
      this.logAnalytics(AnalyticsEvent.A11yHeadingGreenlinesViewed);
    }
  }

  setAnalytics(oldParams: cd.IPreviewParams, newParams: cd.IPreviewParams) {
    this.didAccessibilityPanelOpen(oldParams, newParams);
    this.wasElementInspected(oldParams, newParams);
    this.didA11yColorChangeOccur(oldParams, newParams);
    this.wereA11yFlowsViewed(oldParams, newParams);
    this.wereA11yLandmarksViewed(oldParams, newParams);
    this.wereA11yHeadingsViewed(oldParams, newParams);
  }

  toggleFullscreen() {
    const fullscreen = !this.previewParams.fullscreen;
    const comments = fullscreen ? false : this.previewParams.comments;
    const zoom = cd.ZoomAmount.Default;
    this.onParamChange({ fullscreen, zoom, comments });
  }

  toggleComments() {
    const comments = !this.previewParams.comments;
    this.onParamChange({ comments, accessibility: false });
  }

  onSelectedElementChanged = (elementId?: string) => {
    this.onParamChange({ elementId });
  };

  handleEscapeKey() {
    if (this.previewParams.fullscreen) this.onParamChange({ fullscreen: false });
    this._interactionService.setSelectionActive(false);
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(e: KeyboardEvent) {
    if (this._overlayService.isVisible) return;
    const { key, metaKey } = e;
    if (metaKey && key === KEYS.Enter) this.exitPreview();
    if (!metaKey && key === PreviewShortcut.Comments) this.toggleComments();
    if (!metaKey && key === PreviewShortcut.Fullscreen) this.toggleFullscreen();
    if (!metaKey && key === KEYS.Escape) this.handleEscapeKey();
  }

  @HostListener('wheel', ['$event'])
  onWheel(e: WheelEvent) {
    if (e.ctrlKey) e.preventDefault(); // Prevents native browser zoom
  }

  exitPreview() {
    const path = constructProjectPath(this._projectId, this._symbolIsolationId);
    this._router.navigateByUrl(path);
  }

  /** If the canvas is already active, snap to it */
  snapToBoardAndExitPreview(boardId: string) {
    const board = this.elementProperties?.[boardId] as cd.IBoardProperties;
    if (!board) return;
    this._canvasService.snapToBoard([board], false, 1);
    this.exitPreview();
  }

  jumpToBoard(boardId: string) {
    if (this._canvasService.hasBounds) return this.snapToBoardAndExitPreview(boardId);
    const path = constructProjectPathToBoard(this._projectId, boardId);
    this._router.navigateByUrl(path);
  }

  onProjectFork() {
    const { user, project } = this;
    if (!user || !project) return;
    this._duplicateService.duplicateProjectAndNavigate(project, user);
  }

  onCloseLeftPanel() {
    this.onParamChange({ showLeftPanel: false });
  }

  onOpenLeftPanel() {
    this.onParamChange({ showLeftPanel: true });
  }

  clearSubscriptions = () => {
    this._subscriptions.unsubscribe();
  };

  ngOnDestroy() {
    this.clearSubscriptions();
  }
}
