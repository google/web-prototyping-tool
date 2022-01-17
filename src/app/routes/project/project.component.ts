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

// prettier-ignore
import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, OnDestroy, ViewChild, OnInit, HostListener, } from '@angular/core';
import { KeyboardShortcutsComponent } from './components/keyboard-shortcuts/keyboard-shortcuts.component';
import { SelectionContextService } from './services/selection-context/selection.context.service';
import { shareReplay, filter, map, switchMap, distinctUntilChanged } from 'rxjs/operators';
import { OverlayService, AbstractOverlayControllerDirective } from 'cd-common';
import { AssetsUploadService } from './services/assets/assets-upload.service';
import { DragUploadService } from './services/drag-upload/drag-upload.service';
import { RendererService } from 'src/app/services/renderer/renderer.service';
import { ClipboardService } from './services/clipboard/clipboard.service';
import { DndDirectorService } from './dnd-director/dnd-director.service';
import { ToastsService } from 'src/app/services/toasts/toasts.service';
import { ISelectionState } from './store/reducers/selection.reducer';
import { imageFileFromClipboardEvent } from 'cd-utils/clipboard';
import { CanvasService } from './services/canvas/canvas.service';
import { Observable, Subscription, fromEvent, of } from 'rxjs';
import { IPanelsState } from './interfaces/panel.interface';
import { PanelActivity } from './interfaces/activity.interface';
import { PanelSizeConfig } from './configs/panel.config';
import { ICanvas } from './interfaces/canvas.interface';
import { Store, select, Action } from '@ngrx/store';
import * as utils from './utils/project.utils';
import * as appStore from 'src/app/store';
import * as projectStore from './store';
import * as cd from 'cd-interfaces';

@Component({
  selector: 'app-project',
  templateUrl: './project.component.html',
  styleUrls: ['./project.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DragUploadService, SelectionContextService],
})
export class ProjectComponent
  extends AbstractOverlayControllerDirective
  implements AfterViewInit, OnInit, OnDestroy
{
  private _subscriptions = new Subscription();
  private _keyboardShortcutsModalOpen = false;

  public userIsAnEditor = false;
  public project?: cd.IProject;
  public Activities = PanelActivity;
  public selectedIds = new Set<string>();
  public propertiesLoaded$: Observable<boolean>;
  public canvas!: ICanvas;
  public currentBoardDropTarget?: string;
  public PanelSize = PanelSizeConfig;
  public panelState$: Observable<IPanelsState>;
  public projectData$: Observable<cd.IProject>;
  public propertiesMap$: Observable<cd.ElementPropertiesMap>;
  public propertyMode$: Observable<cd.IConfig>;
  public isolatedSymbolId$: Observable<string | undefined>;
  public breakGlass$: Observable<boolean>;
  public PropertyModes = cd.PropertyMode;
  public selectionState$: Observable<ISelectionState>;
  public projectHomeBoardId$?: Observable<string | undefined>;
  public commentCounts$: Observable<Map<string, number>>;
  public initialLoad$: Observable<boolean>;
  public isolatedSymbolId?: string;
  public showDropZone = false;
  public isRecording = false;

  @ViewChild('appCanvas', { read: ElementRef, static: true }) _appCanvas!: ElementRef;
  @ViewChild('panelWrapper', { read: ElementRef, static: true }) _panelWrapper!: ElementRef;

  constructor(
    public overlayService: OverlayService,
    private _cdRef: ChangeDetectorRef,
    private _canvasService: CanvasService,
    private _dragUploadService: DragUploadService,
    private _renderService: RendererService,
    private _selectionContext: SelectionContextService,
    private _assetUploadService: AssetsUploadService,
    private _clipboardService: ClipboardService,
    private _toastService: ToastsService,
    private _dndDirector: DndDirectorService,
    private readonly _projectStore: Store<projectStore.IProjectState>,
    private readonly _appStore: Store<appStore.IAppState>
  ) {
    super(overlayService);

    this.breakGlass$ = this._appStore.pipe(
      select(appStore.getBreakGlass),
      shareReplay({ bufferSize: 1, refCount: true })
    );

    this.panelState$ = _projectStore.pipe(
      select(projectStore.getPanelsState),
      shareReplay({ bufferSize: 1, refCount: true })
    );

    this.projectData$ = _projectStore.pipe(select(projectStore.getProject)).pipe(
      filter((project) => project !== undefined),
      map((value) => value as cd.IProject),
      shareReplay({ bufferSize: 1, refCount: true })
    );

    this.selectionState$ = _projectStore.pipe(
      select(projectStore.getSelectionState),
      shareReplay({ bufferSize: 1, refCount: true })
    );

    this.isolatedSymbolId$ = _projectStore.pipe(select(projectStore.getIsolatedSymbolId));

    this.canvas = this._canvasService.canvas;

    this.propertiesMap$ = _projectStore.pipe(select(projectStore.getElementProperties));
    this.propertiesLoaded$ = _projectStore.pipe(select(projectStore.getElementPropertiesLoaded));
    this.propertyMode$ = _projectStore.pipe(select(projectStore.getPropertyMode));
    this.projectHomeBoardId$ = _projectStore.pipe(select(projectStore.getHomeBoardId));
    this.commentCounts$ = _projectStore.pipe(select(projectStore.getCommentCounts));

    // Wait for Render Results before setting initial load to true
    // If a project has 0 boards instantly load as true
    this.initialLoad$ = this.projectData$.pipe(
      switchMap((project) =>
        project.boardIds.length === 0
          ? of(true)
          : this._renderService.activatedEditorRects$.pipe(filter((value) => value === true))
      )
    );
  }

  get canShowForkBanner(): boolean {
    return !this.isolatedSymbolId && !this.userIsAnEditor;
  }

  get zoom(): number {
    return this.canvas.position.z;
  }

  ngOnInit(): void {
    utils.toggleOverscrollOnBody();
    this._subscriptions.add(this._canvasService.canvas$.subscribe(this.canvasUpdate));
    this._subscriptions.add(this.selectionState$.subscribe(this.onSelectionStateSubscription));
    this._subscriptions.add(this.projectData$.subscribe(this.onProjectDataSubscription));
    this._subscriptions.add(this.isolatedSymbolId$.subscribe(this.onIsolatedSymbolIdSubscription));
    this._subscriptions.add(this._dragUploadService.showDropZone$.subscribe(this.onDropZone));

    const isEditor$ = this._projectStore.pipe(select(projectStore.getUserIsProjectEditor));
    this._subscriptions.add(isEditor$.subscribe(this.onProjectEditor));

    const shortcutModal$ = this.panelState$.pipe(
      map((state) => state.keyboardShortcutsModalOpen),
      distinctUntilChanged()
    );
    const recordState$ = this.panelState$.pipe(
      map((state) => state.recordStateChanges),
      distinctUntilChanged()
    );

    this._subscriptions.add(shortcutModal$.subscribe(this.onShowShortcutsModal));
    this._subscriptions.add(recordState$.subscribe(this.onRecordingState));
  }

  onProjectEditor = (isEditor: boolean) => {
    this.userIsAnEditor = isEditor;
    this._cdRef.markForCheck();
  };

  onDropZone = (value: boolean) => {
    this.showDropZone = value;
    this._cdRef.markForCheck();
  };

  ngOnDestroy(): void {
    this.closeModal();
    super.ngOnDestroy();
    this._subscriptions.unsubscribe();
    utils.toggleOverscrollOnBody(false);
  }

  ngAfterViewInit() {
    const wheelEvent = fromEvent<WheelEvent>(document, 'wheel', { passive: false });
    const pasteEvent = fromEvent<ClipboardEvent>(document, 'paste', { capture: true });
    this._subscriptions.add(wheelEvent.subscribe(this.onWheel));
    this._subscriptions.add(pasteEvent.subscribe(this.onPaste));
  }

  onRecordingState = (isRecording: boolean) => {
    this.isRecording = isRecording;
    this._cdRef.markForCheck();
  };

  onShowShortcutsModal = (show: boolean) => {
    if (this._keyboardShortcutsModalOpen === show) return;
    this._keyboardShortcutsModalOpen = show;
    if (show) return this.openKeyboardShortcutModal();
    this.closeModal();
  };

  onIsolatedSymbolIdSubscription = (symbolId?: string) => {
    this.isolatedSymbolId = symbolId;
    this._cdRef.markForCheck();
  };

  openKeyboardShortcutModal() {
    const componentRef = this.showModal<KeyboardShortcutsComponent>(KeyboardShortcutsComponent);
    componentRef.onDestroy(() => {
      if (!this._keyboardShortcutsModalOpen) return;
      this._keyboardShortcutsModalOpen = false;
      this.dispatch(new projectStore.PanelSetKeyboardShortcutModalVisibility(false));
    });
  }

  onProjectDataSubscription = (project: cd.IProject) => {
    this.project = project;
  };

  canvasUpdate = (canvas: ICanvas) => {
    this.canvas = canvas;
    this._cdRef.markForCheck();
  };

  onSelectionStateSubscription = (selection: ISelectionState) => {
    this.selectedIds = selection.ids;
    this._cdRef.markForCheck();
  };

  onPaste = (e: ClipboardEvent) => {
    const img = imageFileFromClipboardEvent(e.clipboardData);
    this.uploadFileAsset(img, e);
  };

  private dispatch(...args: Action[]): void {
    args.map((action: Action) => this._projectStore.dispatch(action));
  }

  async uploadFileAsset(img: File | null | undefined, e: ClipboardEvent) {
    if (!img) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    this._clipboardService.clearClipboard();
    const density = window.devicePixelRatio;
    const upload = await this._assetUploadService.uploadImageFile(img, density);
    if (!upload) return;
    this._clipboardService.pasteImage(upload.assetId, upload.metadata);
  }

  onAddBoard() {
    this.dispatch(new projectStore.BoardCreate());
  }

  onShowCodeView(show: boolean = true) {
    this.dispatch(new projectStore.PanelSetBottomVisibility(show));
  }

  onShowLeftPanel(show: boolean = true) {
    this.dispatch(new projectStore.PanelSetLeftVisibility(show));
  }

  onRightPanelSizeChange(size: number) {
    this.dispatch(new projectStore.PanelResizeRight(size));
  }

  onLeftPanelSizeChange(size: number) {
    this.dispatch(new projectStore.PanelResizeLeft(size));
  }

  onActivitySelected(config: cd.IConfig) {
    this.dispatch(new projectStore.PanelSetActivity(config, {}));
  }

  onProjectNameChange(name: string) {
    this.dispatch(new projectStore.ProjectDataUpdate({ name }));
  }

  updateElement(elementId: string, properties: Partial<cd.RootElement>): Action {
    return new projectStore.ElementPropertiesUpdate([{ elementId, properties }]);
  }

  onContextMenu(e: MouseEvent) {
    e.preventDefault();
    if (this.isRecording) return;
    const elem = e.target as HTMLElement;
    const canvasTag = this._appCanvas.nativeElement.tagName;
    const isCanvas = elem.tagName === canvasTag;
    if (isCanvas && this.selectedIds.size) {
      this.dispatch(new projectStore.SelectionDeselectAll());
    }
    this._selectionContext.createMenuForCurrentContext(e, this.canvas);
  }

  onAssetAction(type: string) {
    this.dispatch({ type });
  }

  showSavedToast() {
    this._toastService.addToast({
      id: 'save',
      iconName: 'cloud',
      message: 'WebPrototypingTool auto-saves in the cloud',
    });
  }

  @HostListener('document:keydown', ['$event'])
  onKeyDown(e: KeyboardEvent) {
    if (this.overlayService.isVisible) return;
    if (this._dndDirector.dragActive) return;
    const target = e.target as HTMLElement;
    utils.interceptBrowserKeyboardZoom(e);
    ///////////////////////////////////////////////
    if (this.isRecording) return;
    if (!utils.hotkeyAllowedOnTarget(target)) return;
    if (utils.checkForSaveShortcut(e)) return this.showSavedToast();
    if (utils.captureBrowserReload(e)) return utils.selectElementTitleForRename();

    const { canvas } = this;
    const action = this._selectionContext.actionForKeyboardShortcut(e, canvas);

    if (!action) return;

    const isActionEnabled = this._selectionContext.isActionEnabled(action, canvas);
    const isActionPassive = utils.isConfigActionPassive(action);

    if (isActionPassive === false || isActionEnabled === false) {
      e.preventDefault();
      if (e.repeat || !isActionEnabled) return;
    }

    this.dispatch(action);
  }

  private onWheel = (e: WheelEvent): void => {
    // Intercept pinch / zoom on macOS
    if (e.ctrlKey === true) e.preventDefault();
  };
}
