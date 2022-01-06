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

import { IProjectState, CodeComponentUpdate, selectPublishEntries } from '../../store';
import {
  Component,
  ChangeDetectionStrategy,
  HostListener,
  OnDestroy,
  ChangeDetectorRef,
  ViewChild,
} from '@angular/core';
import { RenderOutletIFrameComponent } from 'src/app/components/render-outlet-iframe/render-outlet-iframe.component';
import { SelectionContextService } from '../../services/selection-context/selection.context.service';
import { ProjectContentService } from 'src/app/database/changes/project-content.service';
import { RendererService } from 'src/app/services/renderer/renderer.service';
import { CODE_COMPONENT_ID_ROUTE_PARAM } from 'src/app/configs/routes.config';
import { AnalyticsService } from 'src/app/services/analytics/analytics.service';
import { storagePathForCodeComponentBundle } from 'src/app/utils/storage.utils';
import { Observable, Subscription, Subject, combineLatest } from 'rxjs';
import { PublishService } from '../../services/publish/publish.service';
import { ToastsService } from 'src/app/services/toasts/toasts.service';
import { UploadService } from '../../services/upload/upload.service';
import { ErrorService } from 'src/app/services/error/error.service';
import { IAppState, getRouterState } from 'src/app/store/reducers';
import { isConfigActionPassive } from '../../utils/project.utils';
import { downloadBlobAsFile, selectFiles } from 'cd-utils/files';
import { map, debounceTime } from 'rxjs/operators';
import { createCodeComponentInstance } from 'cd-common/models';
import { PanelSizeConfig } from '../../configs/panel.config';
import { menuFromProjectDatasets } from 'cd-common/utils';
import { CodeCompPanelState } from './code-comp.interfaces';
import { AnalyticsEvent } from 'cd-common/analytics';
import { OverlayService } from 'cd-common';
import { Store, select } from '@ngrx/store';
import { Dictionary } from '@ngrx/entity';
import { getDarkTheme, getUser } from 'src/app/store';
import { deepCopy } from 'cd-utils/object';
import { createId } from 'cd-utils/guid';
import * as customConfig from '../../configs/custom-component.config';
import * as config from './code-comp.config';
import * as cd from 'cd-interfaces';
import { PresenceService } from 'src/app/services/presence/presence.service';

const INPUTS_CONFIG_FILENAME = 'inputs-config.json';
const EVENTS_CONFIG_FILENAME = 'events-config.json';
const OUTLET_LIGHT_BKG_CLASS = 'code-component-outlet-light-bkg';
const OUTLET_LIGHT_GRAY_BKG_CLASS = 'code-component-outlet-light-gray-bkg';
const OUTLET_DARK_GRAY_BKG_CLASS = 'code-component-outlet-dark-gray-bkg';
const OUTLET_DARK_BKG_CLASS = 'code-component-outlet-dark-bkg';
const STORE_UPDATE_TIME = 24;
const PADDING_MULTIPLIER = 2;

@Component({
  selector: 'app-component',
  templateUrl: './code-comp.component.html',
  styleUrls: ['./code-comp.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CodeCompComponent implements OnDestroy {
  private _subscriptions = new Subscription();
  private _codeComponentId?: string;
  private _codeComponentsDictionary?: Dictionary<cd.ICodeComponentDocument>;
  private _codeCmpUpdateStream$ = new Subject<Partial<cd.ICodeComponentDocument>>();
  public userCanEditProject$: Observable<boolean>;
  public codeComponent?: cd.ICodeComponentDocument;
  public codeComponentProperties: cd.IPropertyGroup[] = [];
  public codeComponentUpdateMade = false;
  public CodeCompPanelState = CodeCompPanelState;
  public configViewCollapsed = true;
  public currOutletBackground = config.CC_LIGHT_BKG_COLOR;
  public designSystem$: Observable<cd.IDesignSystem | undefined>;
  public eventsConfig: cd.IOutputProperty[] = [];
  public inputsConfig: cd.IPropertyGroup[] = [];
  public isUserComponentOwner$: Observable<boolean>;
  public jsBundleMetadata?: cd.IFirebaseStorageFileMetadata;
  public PanelSize = PanelSizeConfig;
  public panelState: CodeCompPanelState = CodeCompPanelState.Default;
  public registeredCodeCmp?: cd.IComponent;
  public testInstance?: cd.ICodeComponentInstance;
  public updatingJSBundle = false;
  public datasetsMenuItems: cd.ISelectItem[] = [];
  public darkTheme$: Observable<boolean>;

  @ViewChild('renderOutletRef') renderOutletRef?: RenderOutletIFrameComponent;

  constructor(
    public presenceService: PresenceService,
    private _appStore: Store<IAppState>,
    private _projectStore: Store<IProjectState>,
    private _overlayService: OverlayService,
    private _selectionContext: SelectionContextService,
    private _uploadService: UploadService,
    private _publishService: PublishService,
    private _rendererService: RendererService,
    private _errorService: ErrorService,
    private _cdRef: ChangeDetectorRef,
    private _analyticsService: AnalyticsService,
    private _toastsService: ToastsService,
    private _projectContentService: ProjectContentService
  ) {
    this.designSystem$ = this._projectContentService.designSystem$;

    this.darkTheme$ = _appStore.pipe(select(getDarkTheme));

    this.userCanEditProject$ = this._projectContentService.currentUserIsProjectEditor$;
    // subscribe to route changes to get the current code component id
    const idFromRouterState$ = this._appStore
      .pipe(select(getRouterState))
      .pipe(map((routerState) => routerState?.state.params[CODE_COMPONENT_ID_ROUTE_PARAM]));

    this._subscriptions.add(idFromRouterState$.subscribe(this.onCodeComponentId));

    // subscribe to code component definitions that have been added to the project
    const codeComponents$ = this._projectContentService.codeCmpMap$;
    this._subscriptions.add(codeComponents$.subscribe(this.onCodeComponentsSubscription));

    // subscribe to datasets that have been added to the project
    const datasets$ = this._projectContentService.datasetArray$;
    this._subscriptions.add(datasets$.subscribe(this.onDatasetsSubscription));

    // setup stream to debounce updates to the store / database
    const debouncedUpdates$ = this._codeCmpUpdateStream$.pipe(debounceTime(STORE_UPDATE_TIME));
    this._subscriptions.add(debouncedUpdates$.subscribe(this.onUpdate));

    const user$ = _projectStore.pipe(select(getUser));
    const publishedEntries$ = _projectStore.pipe(select(selectPublishEntries));
    const owner$ = combineLatest([user$, codeComponents$, idFromRouterState$, publishedEntries$]);

    this.isUserComponentOwner$ = owner$.pipe(
      map(([user, components, componentId, entries]) => {
        if (!user || !componentId || !entries || !components) return false;
        const component = components[componentId];
        if (!component) return false;
        const entryId = component.publishId?.entryId;
        if (!entryId) return true;
        const publishEntry = entries[entryId];
        if (!publishEntry) return true;
        return user.id === publishEntry?.owner?.id;
      })
    );
  }

  get showTestPanel(): boolean {
    if (this.panelState !== CodeCompPanelState.Inputs) return false;
    const children = this.codeComponentProperties[0]?.children;
    if (!children) return false;
    return children.length > 0;
  }

  get configFileName() {
    const { panelState } = this;
    if (panelState === CodeCompPanelState.Inputs) return INPUTS_CONFIG_FILENAME;
    if (panelState === CodeCompPanelState.Events) return EVENTS_CONFIG_FILENAME;
    return undefined;
  }

  get configViewerData(): {} | undefined {
    const { panelState, inputsConfig, eventsConfig } = this;
    if (panelState === CodeCompPanelState.Inputs) return inputsConfig;
    if (panelState === CodeCompPanelState.Events) return eventsConfig;
    return undefined;
  }

  get outletBackgroundClass(): string | void {
    const { currOutletBackground } = this;
    if (currOutletBackground === config.CC_LIGHT_BKG_COLOR) return OUTLET_LIGHT_BKG_CLASS;
    if (currOutletBackground === config.CC_LIGHT_GRAY_BKG_COLOR) return OUTLET_LIGHT_GRAY_BKG_CLASS;
    if (currOutletBackground === config.CC_DARK_GRAY_BKG_COLOR) return OUTLET_DARK_GRAY_BKG_CLASS;
    if (currOutletBackground === config.CC_DARK_BKG_COLOR) return OUTLET_DARK_BKG_CLASS;
  }

  frameForSize(size?: number): number | null {
    if (!size) return null;
    return size + customConfig.CODE_CMP_OUTLET_FRAME_PADDING * PADDING_MULTIPLIER;
  }

  get frame() {
    return this.codeComponent?.frame;
  }

  get outletPreviewWidth(): number | null {
    return this.frameForSize(this.frame?.width);
  }

  get outletPreviewHeight(): number | null {
    return this.frameForSize(this.frame?.height);
  }

  ngOnDestroy() {
    this._subscriptions.unsubscribe();
    // If any updates were made to the code component while in code component editor
    // send recompile message to renderer
    if (this.codeComponentUpdateMade) this._rendererService.recompile();
  }

  onCodeComponentId = (id?: string) => {
    const prevId = this._codeComponentId;
    this._codeComponentId = id;
    this.loadCodeComponent();

    // If the code component id has changed, we need to reset the render outlet
    if (prevId && id && prevId !== id && this.renderOutletRef) {
      // Setting id manually on render outlet to ensure that updated id is used on reset()
      this.renderOutletRef.id = id;
      this.renderOutletRef.reset();
    }
  };

  onCodeComponentsSubscription = (dict: Dictionary<cd.ICodeComponentDocument>) => {
    this._codeComponentsDictionary = dict;
    this.loadCodeComponent();
  };

  onDatasetsSubscription = (datasets: cd.ProjectDataset[]) => {
    this.datasetsMenuItems = menuFromProjectDatasets(datasets);
    this._cdRef.markForCheck();
  };

  private loadCodeComponent = () => {
    const { _codeComponentsDictionary, _codeComponentId } = this;
    if (!_codeComponentsDictionary || !_codeComponentId) return;
    const codeComponent = _codeComponentsDictionary[_codeComponentId];
    if (!codeComponent) return;

    /**
     * Move all component properties into a single PropertyGroup so that there is not a separate
     * label generated for each one.
     * Also filter out any properties that do not have a name defined
     */
    const definedProperties = codeComponent.properties.filter((p) => !!p.name);
    this.codeComponentProperties = [{ children: definedProperties }];
    this.codeComponent = codeComponent;
    this.updateTestInstance();
    this.updateConfigs();
    this.getJsBundleMetadata();
    this._cdRef.markForCheck();
  };

  // Setup keyboard shortcut listeners so we can dispatch Undo/Redo actions
  @HostListener('document:keydown', ['$event'])
  onKeyDown(e: KeyboardEvent) {
    if (this._overlayService.isVisible) return;

    const action = this._selectionContext.actionForCodeComponentKeyboardShortcut(e);
    if (!action) return;

    const isActionEnabled = this._selectionContext.isActionEnabled(action);
    const isActionPassive = isConfigActionPassive(action);

    if (isActionPassive === false || isActionEnabled === false) {
      e.preventDefault();
      if (e.repeat || !isActionEnabled) return;
    }

    this._projectStore.dispatch(action);
  }

  onPanelStateChange(state: CodeCompPanelState) {
    this.panelState = state;
  }

  async onUploadBundle() {
    const files = await selectFiles([cd.FileMime.JS], false);
    if (!files?.length) return;
    const [newFile] = files;
    this.onUpdateJSBundle(newFile);
  }

  onTitleChange(title: string) {
    this.onCodeComponentChange({ title });
  }

  onTestPropsChange(updatedPreviewInstance: Partial<cd.ICodeComponentInstance>) {
    const { codeComponent, testInstance } = this;
    if (!codeComponent || !testInstance) return;
    const inputs = { ...testInstance.inputs, ...updatedPreviewInstance?.inputs };
    this.testInstance = { ...testInstance, inputs };
    this._rendererService.updateCodeComponentPreview(codeComponent.id, this.testInstance);
  }

  onResetPreviewProps() {
    const { codeComponent } = this;
    if (!codeComponent) return;
    const id = createId();
    this.testInstance = createCodeComponentInstance(id, codeComponent);
    this.codeComponentProperties = deepCopy(this.codeComponentProperties); // needed to force change detection
    this._rendererService.updateCodeComponentPreview(codeComponent.id, this.testInstance);
  }

  onBackgroundChange(backgroundColor: string) {
    this.currOutletBackground = backgroundColor;
  }

  onCodeComponentChange(change: Partial<cd.ICodeComponentDocument>) {
    const { codeComponent } = this;
    if (!codeComponent) return;
    this.codeComponentUpdateMade = true;
    this._codeCmpUpdateStream$.next(change);
    // if tag name changed update preview to reflect it
    const { tagName } = change;
    if (!tagName) return;
    this._rendererService.updateCodeComponentPreview(codeComponent.id, undefined, tagName);
  }

  onInputDefaultValueChange(change: [string, cd.PropertyValue]) {
    const { testInstance, codeComponent } = this;
    if (!testInstance || !codeComponent) return;
    const [name, value] = change;
    const inputs = { ...testInstance.inputs, [name]: value };
    this.testInstance = { ...testInstance, inputs };
    this._rendererService.updateCodeComponentPreview(codeComponent.id, this.testInstance);
  }

  onDownloadJsBundle = async () => {
    const { codeComponent, jsBundleMetadata } = this;
    if (!codeComponent || !jsBundleMetadata) return;
    this._analyticsService.logEvent(AnalyticsEvent.CodeComponentBundleDownloaded);
    const jsBundleFile = await this._uploadService.downloadFile(codeComponent.jsBundleStoragePath);
    downloadBlobAsFile(jsBundleFile, jsBundleMetadata.name);
  };

  // TODO: We could send file directly to renderer without waiting for upload to complete
  // Need to do validiation first
  onUpdateJSBundle(file: File) {
    const isValid = file.size <= customConfig.FILE_SIZE_LIMIT;
    if (!isValid) {
      this._toastsService.addToast({ message: customConfig.FILE_SIZE_LIMIT_ERROR });
      return;
    }
    // Create a separate id and unique path for the file. This enables multiple code component documents
    // referencing this same same JS file which will occur when a project id duplicated.
    const id = createId();
    const uploadPath = storagePathForCodeComponentBundle(id, file.name);

    // show loading spinner by setting updatingJSBundle to true
    this.updatingJSBundle = true;
    this._cdRef.markForCheck();

    this._uploadService.uploadFile(file, uploadPath, this.onUploadComplete, this.onUploadError);
  }

  onUploadComplete = (jsBundleStoragePath: string) => {
    this._analyticsService.logEvent(AnalyticsEvent.CodeComponentBundleUpdated);

    // Make this update directly rather than going through buffer
    this.onUpdate({ jsBundleStoragePath }, false);

    // wait an additional second before hidding the spinner
    // to give the renderer time to load the new bundle
    setTimeout(() => {
      this.updatingJSBundle = false;
      this._cdRef.markForCheck();
    }, 1500);
  };

  onUploadError = (e: any) => {
    this.updatingJSBundle = false;
    this._errorService.handleError(e);
    this._cdRef.markForCheck();
  };

  get componentId() {
    return this.codeComponent?.id;
  }

  onPublish() {
    const { componentId } = this;
    if (!componentId) return;
    this._publishService.openPublishCodeComponentModal(componentId);
  }

  private updateConfigs() {
    const { codeComponent } = this;
    const properties = codeComponent?.properties || [];
    const outputs = codeComponent?.outputs || [];
    this.inputsConfig = properties.map(({ collapsed, ...rest }) => rest);
    this.eventsConfig = [...outputs];
  }

  private getJsBundleMetadata = async () => {
    const jsBundle = this.codeComponent?.jsBundleStoragePath;
    if (!jsBundle) return;
    this.jsBundleMetadata = await this._uploadService.getFileMetadata(jsBundle);
    this._cdRef.markForCheck();
  };

  private onUpdate = (update: Partial<cd.ICodeComponentDocument>, undoable = true) => {
    const { componentId } = this;
    if (!componentId) return;
    this._projectStore.dispatch(new CodeComponentUpdate(componentId, update, undoable));
  };

  setTestInstance(value: cd.ICodeComponentInstance) {
    this.testInstance = value;
    this.onTestPropsChange(value);
  }
  /**
   * Create an instance of the code component for use in the Test panel
   */
  private updateTestInstance() {
    const { testInstance: currentInstance, codeComponent } = this;
    if (!codeComponent) return;
    const id = createId();
    const newInstance = createCodeComponentInstance(id, codeComponent);
    if (!currentInstance) return this.setTestInstance(newInstance);
    // If a testInstance already exists in test panel, we want to preserve any property
    // values that a user may have modified
    const { inputs } = newInstance;
    const { inputs: currInputs } = currentInstance;
    const mergedInputs = { ...inputs, ...currInputs };
    newInstance.inputs = mergedInputs;
    this.setTestInstance(newInstance);
  }
}
