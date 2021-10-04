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
// prettier-ignore
import { Component, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef, OnInit, Input, NgZone } from '@angular/core';
// prettier-ignore
import { BLANK_MENU_ITEM, UPLOAD_MENU_ITEM, DEFINE_COLOR_MENU_ITEM, ADD_DATASET_MENU_ITEM } from '../../configs/properties.config';
import { ProjectContentService } from 'src/app/database/changes/project-content.service';
import { Store, select, Action } from '@ngrx/store';
import { ISelectionState } from '../../store/reducers/selection.reducer';
import { Subscription, Subject, ReplaySubject, Observable, of } from 'rxjs';
import { InteractionService } from '../../services/interaction/interaction.service';
import { PropertiesService } from '../../services/properties/properties.service';
import { RendererService } from 'src/app/services/renderer/renderer.service';
import { AssetsService } from '../../services/assets/assets.service';
import { AnalyticsService } from 'src/app/services/analytics/analytics.service';
import { PanelConfig } from '../../configs/project.config';
import { getShowingBoardIds, IAppState } from 'src/app/store';
import { IAnalyticsEvent } from 'cd-common/analytics';
import * as utils from './properties.utils';
import * as projectStore from '../../store';
import * as cdUtils from 'cd-common/utils';
import * as models from 'cd-common/models';
import * as rxjs from 'rxjs/operators';
import * as cd from 'cd-interfaces';

const RENDERER_UPDATE_TIME = 24;
const STORE_UPDATE_TIME = 48;
const STYLES_WHICH_HIDE_GLASS = ['border', 'borderRadius', 'boxShadow', 'background', 'opacity'];
const MULTI_SELECT_TITLE = '(Multiple)';

@Component({
  selector: 'app-properties-panel',
  templateUrl: './properties-panel.component.html',
  styleUrls: ['./properties-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PropertiesPanelComponent implements OnDestroy, OnInit {
  protected readonly destroyed = new ReplaySubject<void>(1);

  private _propertiesMap: cd.ElementPropertiesMap = {};
  private _selectionState?: ISelectionState;
  private _subscriptions = new Subscription();
  private _updateSubscriptions = new Subscription();
  private propUpdates$ = new Subject<utils.PropertyPartial>();
  private _isProjectEditor = false;

  public component?: cd.IComponent;
  public projectAssets: cd.AssetMap = {};
  public assetsMenuData: ReadonlyArray<cd.ISelectItem> = [];
  public datasetsMenuData: ReadonlyArray<cd.ISelectItem> = [];
  public colorMenuData: ReadonlyArray<cd.ISelectItem> = [];
  public designSystem?: cd.IDesignSystem;
  public boards: cd.IBoardProperties[] = [];
  public elementProps: cd.PropertyModel[] = [];
  public parentProps: cd.PropertyModel[] = [];
  public EntityType = cd.EntityType;
  public projectData: cd.IProject | undefined;
  public propIds: string[] = [];
  public projPanelState: cd.PropertyPanelState | undefined = cd.PropertyPanelState.Default;
  public selectedElementType?: utils.PropertyPanelType;
  public selectedEntityType: cd.EntityType = cd.EntityType.Project;
  public portalsInRoot: cd.ISelectItem[] = [];
  public symbolChildren: cd.ISelectItem[] = [];
  public symbolInputs: cd.IPropertyGroup[] = [];
  public symbolMap: cd.ISymbolMap = {};
  public showDebugIds$: Observable<boolean>;

  @Input() isolatedSymbolId?: string;
  @Input() isRecording = false;

  constructor(
    private _analyticsService: AnalyticsService,
    private _appStore: Store<IAppState>,
    private _projectStore: Store<projectStore.IProjectState>,
    private _projectContentService: ProjectContentService,
    private _interactionService: InteractionService,
    private _propertiesService: PropertiesService,
    private _rendererService: RendererService,
    private _assetsService: AssetsService,
    private _cdRef: ChangeDetectorRef,
    private _zone: NgZone
  ) {
    this.showDebugIds$ = this._appStore.pipe(select(getShowingBoardIds));
  }

  ngOnInit(): void {
    const {
      project$,
      designSystem$,
      elementProperties$,
      symbolsMap$,
      datasetArray$,
      boardsArray$,
      currentUserIsProjectEditor$,
    } = this._projectContentService;
    const selectionState$ = this._projectStore.pipe(select(projectStore.getSelectionState));
    const panelState$ = this._projectStore.pipe(select(projectStore.getPropertiesPanelState));
    this._subscriptions.add(panelState$.subscribe(this.onPanelState));
    this._subscriptions.add(boardsArray$.subscribe(this.onBoardUpdate));
    this._subscriptions.add(designSystem$.subscribe(this.onDesignSystemUpdate));
    this._subscriptions.add(project$.subscribe(this.onProjectDataSubscription));
    this._subscriptions.add(elementProperties$.subscribe(this.onPropertiesMapSubscription));
    this._subscriptions.add(selectionState$.subscribe(this.onSelectionStateSubscription));
    this._subscriptions.add(symbolsMap$.subscribe(this.onSymbolMapUpdate));
    this._subscriptions.add(this._assetsService.assets$.subscribe(this.onProjectAssets));
    this._subscriptions.add(datasetArray$.subscribe(this.onProjectDatasets));
    this._subscriptions.add(currentUserIsProjectEditor$.subscribe(this.onIsEditor));

    this._zone.runOutsideAngular(() => {
      this._updateSubscriptions = this.propUpdates$
        .pipe(
          rxjs.switchMap((updates) => {
            const ids = [...this.propIds];
            return of(updates).pipe(
              rxjs.bufferTime(RENDERER_UPDATE_TIME),
              rxjs.filter(utils.filterEmpty),
              rxjs.map(utils.mergeUpdateBuffer),
              // We need to capture propertyIds to safeguard if they change due to timing
              // Such as updating selection
              rxjs.map<utils.PropertyPartial, utils.IPropertiesPanelUpdate>((properties) => {
                return { ids, properties };
              }),
              rxjs.tap(this.onFastPropsUpdate),
              rxjs.bufferTime(STORE_UPDATE_TIME),
              rxjs.filter(utils.filterEmpty),
              rxjs.map(utils.mergeDatabaseUpdates),
              rxjs.takeUntil(this.destroyed)
            );
          })
        )
        .subscribe(this.onPropsUpdate);
    });
  }

  onPanelState = (state: cd.PropertyPanelState | undefined) => {
    this.projPanelState = state;
    this._cdRef.markForCheck();
  };

  get isShowingActions(): boolean {
    return this.projPanelState === cd.PropertyPanelState.Actions;
  }

  get activeSymbol(): cd.ISymbolProperties | undefined {
    if (!this.isolatedSymbolId) return;
    return this.symbolMap[this.isolatedSymbolId];
  }

  get isShowingA11y(): boolean {
    return this.projPanelState === cd.PropertyPanelState.Accessibility;
  }

  get multiSelect(): boolean {
    return this.elementProps.length > 1;
  }

  get panelTitle(): string {
    return this.multiSelect ? MULTI_SELECT_TITLE : this.mergedProps.name;
  }

  get isMixedMultiSelect(): boolean {
    return this.selectedElementType === cd.MIXED_COLLECTION;
  }

  updateSymbolInputs() {
    const { mergedProps, symbolMap } = this;
    if (!mergedProps) return;
    const { inputs, instanceInputs } = mergedProps as cd.ISymbolInstanceProperties;
    const { referenceId } = inputs;
    const symbolDefinition = referenceId && symbolMap && symbolMap[referenceId];

    if (!symbolDefinition) {
      this.symbolInputs = [];
      return;
    }

    const exposedInputs = symbolDefinition?.exposedInputs || {};
    const legacyInputs = symbolDefinition?.symbolInputs || {};
    const legacyKeys = Object.keys(legacyInputs);
    const updatedInputs = Object.keys(exposedInputs);
    const mergedInputs = [...new Set([...legacyKeys, ...updatedInputs])];

    // sort symbol inputs by layer name so that they show up in a predictable order
    const sortedInputs = cdUtils.sortElementIdsByName(mergedInputs, this._propertiesMap);

    this.symbolInputs = sortedInputs.reduce<cd.IPropertyGroup[]>((acc, id) => {
      const targetProps = this._propertiesService.getPropertiesForId(id);
      if (!targetProps) return acc;
      const legacy = legacyInputs[id];
      const exposed = exposedInputs[id];
      const showOverrides = utils.canShowSymbolInputOverride(exposed, legacy);
      if (!showOverrides) return acc;
      const item = utils.generateSymbolOverrideProp(targetProps, instanceInputs, id);
      if (item) acc.push(item);
      return acc;
    }, []);
  }

  onSymbolMapUpdate = (symbolMap: cd.ISymbolMap) => {
    this.symbolMap = symbolMap;
    this.updateSymbolInputs();
    this._cdRef.markForCheck();
  };

  get outputsConfig() {
    return this.component?.outputs || [];
  }

  ngOnDestroy(): void {
    this.destroyed.next();
    this.destroyed.complete();
    this._updateSubscriptions.unsubscribe();
    this._subscriptions.unsubscribe();
  }

  private onIsEditor = (isProjectEditor: boolean) => {
    this._isProjectEditor = isProjectEditor;
  };

  onBoardUpdate = (boards: cd.IBoardProperties[]) => {
    this.boards = cdUtils.sortElementsByName<cd.IBoardProperties>(boards);
  };

  onDesignSystemUpdate = (ds: cd.IDesignSystem | undefined) => {
    this.designSystem = ds;
    this.buildColorMenu(ds);
  };

  generateAssetsMenu(projectAssets: cd.AssetMap) {
    const assetsArray = Object.values(projectAssets);
    const menu = cdUtils.menuFromProjectAssets(assetsArray);
    this.assetsMenuData = [BLANK_MENU_ITEM, ...menu, UPLOAD_MENU_ITEM];
  }

  generateDatasetsMenu(datasets: cd.ProjectDataset[]) {
    const datasetMenuItems = cdUtils.menuFromProjectDatasets(datasets);
    const { length } = datasetMenuItems;
    if (length) datasetMenuItems[length - 1].divider = true;
    this.datasetsMenuData = [...datasetMenuItems, ADD_DATASET_MENU_ITEM];
  }

  buildColorMenu(ds: cd.IDesignSystem | undefined) {
    if (!ds) return;
    const colors = cdUtils.menuFromDesignSystemAttributes(ds.colors, cd.SelectItemType.Color);
    this.colorMenuData = [DEFINE_COLOR_MENU_ITEM, ...colors];
  }

  onPropertiesMapSubscription = (propertiesMap: cd.ElementPropertiesMap) => {
    this._propertiesMap = propertiesMap;
    this._calcElementProps();
  };

  onSelectionStateSubscription = (selectionState: ISelectionState) => {
    this._selectionState = selectionState;
    this._calcElementProps();
  };

  private _reset() {
    this.selectedEntityType = cd.EntityType.Project;
    this.selectedElementType = undefined;
    this.component = undefined;
    this._cdRef.markForCheck();
  }

  private _calcElementProps = () => {
    const { _propertiesMap, _selectionState } = this;
    if (!_selectionState) return this._reset();
    const { type, ids } = _selectionState;
    if (type !== cd.EntityType.Element) return this._reset();
    this.selectedEntityType = type;

    // If properties get deleted and trigger update before selectionState gets updated,
    // there are potentially selected ids that no longer exist.
    // This checks for this case and resets to project properties
    // if no selected ids actually exist
    this.propIds = Array.from(ids).filter((id) => !!_propertiesMap[id]);
    if (this.propIds.length === 0) return this._reset();

    const selectedElementType = utils.calcElementSubtype(_propertiesMap, this.propIds);
    this.selectedElementType = selectedElementType;

    if (selectedElementType !== cd.MIXED_COLLECTION) {
      const cmp = models.getComponent(selectedElementType as cd.ComponentIdentity);
      if (cmp) this.component = cmp;
      else return this._reset();
    }

    this.elementProps = this.propIds.reduce<cd.PropertyModel[]>((prev, curr) => {
      const props = _propertiesMap[curr];
      if (props) prev.push(props);
      return prev;
    }, []);

    this.parentProps = this.elementProps.reduce<cd.PropertyModel[]>((acc, curr) => {
      const props = curr.parentId && _propertiesMap[curr.parentId];
      if (props) acc.push(props);
      return acc;
    }, []);

    this.updateAvailablePortals(this.elementProps, _propertiesMap);
    this.updateSymbolChildren(this.elementProps, _propertiesMap);
    this.updateSymbolInputs();
    this._cdRef.markForCheck();
  };

  updateSymbolChildren([element]: cd.PropertyModel[], propsMap: cd.ElementPropertiesMap) {
    this.symbolChildren = utils.generateSymbolChildren(element, propsMap);
  }

  updateAvailablePortals([element]: cd.PropertyModel[], propsMap: cd.ElementPropertiesMap) {
    const boardId = element?.rootId;
    const values = boardId ? models.getModels(propsMap) : [];
    this.portalsInRoot = values
      .filter((props) => props.rootId === boardId && models.isBoardPortal(props))
      .map(({ name: title, id: value }) => ({ title, value }));
  }

  onProjectDataSubscription = (projectData: cd.IProject | undefined) => {
    this.projectData = projectData;
    this._cdRef.markForCheck();
  };

  /**
   * Looks at specific styles to determine if we should hide the glass layer while updating,
   * for example, If we're updating the border we dont want to show selection since that will cover the border up
   * */
  checkPayloadForInteractionStyles(payload: cd.IPropertiesUpdatePayload[]) {
    for (const item of payload) {
      const styles = item?.properties?.styles?.base?.style;
      if (!styles) continue;
      const hasStyle = STYLES_WHICH_HIDE_GLASS.some((key) => key in styles);

      if (hasStyle) return true;
    }
    return false;
  }

  onPropsUpdate = (payload: cd.IPropertiesUpdatePayload[]) => {
    const shouldHideGlassLayer = this.checkPayloadForInteractionStyles(payload);
    this._zone.run(() => {
      if (shouldHideGlassLayer) this._interactionService.propsPanelInteracting();
      this.onElementPropertiesUpdate(payload);
    });
  };

  onFastPropsUpdate = (update: utils.IPropertiesPanelUpdate) => {
    if (!this._isProjectEditor) return;
    const updates = update.ids.map((id) => {
      return cdUtils.buildPropertyUpdatePayload(id, update.properties);
    });
    this._rendererService.updateElementPropertiesPartial(updates);
  };

  onElementPropertiesUpdate(payload: cd.IPropertiesUpdatePayload[]) {
    if (!this._isProjectEditor) return;
    this.dispatch(new projectStore.ElementPropertiesUpdate(payload));
  }

  onSiblingsUpdate(payload: cd.IPropertiesUpdatePayload[]) {
    const { _propertiesMap } = this;
    const filtered = payload.filter((update) => update.elementId in _propertiesMap);
    this.onElementPropertiesUpdate(filtered);
  }

  onPropsChange(properties: utils.PropertyPartial) {
    this.propUpdates$.next(properties);
  }

  onProjectDataChange(change: cd.IProject) {
    this.dispatch(new projectStore.ProjectDataUpdate(change));
  }

  dispatch(action: Action) {
    this._projectStore.dispatch(action);
  }

  onAction({ value }: cd.ISelectItem) {
    if (value === DEFINE_COLOR_MENU_ITEM.value) {
      return this.dispatch(new projectStore.PanelSetActivityForced(PanelConfig.Theme, {}));
    }
    if (value === UPLOAD_MENU_ITEM.value) {
      this.dispatch(new projectStore.PanelSetActivityForced(PanelConfig.Assets, {}));
      this.dispatch(new projectStore.AssetsSelectFiles());
    }
    if (value === ADD_DATASET_MENU_ITEM.value) {
      this.dispatch(new projectStore.OpenAddDatasetMenu());
    }
  }

  onProjectAssets = (value: cd.AssetMap) => {
    this.projectAssets = value;
    this.generateAssetsMenu(value);
  };

  onProjectDatasets = (value: cd.ProjectDataset[]) => {
    this.generateDatasetsMenu(value);
  };

  onAttributesUpdate(update: cd.IKeyValue[]) {
    const attrs = [...update];
    this.onPropsChange({ attrs });
  }

  onA11yInputsUpdate(update: cd.IA11yInputs) {
    const a11yInputs = { ...update };
    this.onPropsChange({ a11yInputs });
  }

  onActionsChange(actionList: cd.ActionBehavior[]) {
    this.onPropsChange({ actions: actionList });
  }

  get hasA11y() {
    const { a11yInputs } = this.mergedProps;
    return a11yInputs && cdUtils.isA11yInfoModified(a11yInputs);
  }

  get hasActions(): boolean {
    return this.mergedProps.actions.length > 0;
  }

  get isBoard() {
    return this.selectedElementType === cd.ElementEntitySubType.Board;
  }

  get showHomeBoardButton() {
    return this.isBoard && this.elementProps.length === 1;
  }

  get mergedProps() {
    return this.elementProps?.[0];
  }

  get shouldDisableActionsTab() {
    return this.elementProps.length > 1;
  }

  get isStartBoard(): boolean {
    const { mergedProps, projectData } = this;
    return (
      !!projectData &&
      projectData.homeBoardId !== undefined &&
      mergedProps.id === projectData.homeBoardId
    );
  }

  onStartBoardToggle() {
    const { mergedProps, projectData } = this;
    if (!projectData) return;
    this.onProjectDataChange({ ...projectData, homeBoardId: mergedProps.id });
  }

  onTitleChange(name: string) {
    this.onPropsChange({ name });
  }

  /// STYLES
  get state() {
    const { mergedProps } = this;
    return mergedProps.state || cd.State.Default;
  }

  onStyleOverride(overrideStyles: cd.IStyleAttributes) {
    this.onPropsChange({ styles: { ...overrideStyles } });
  }

  onPropertyStateChange(panelState: cd.PropertyPanelState) {
    this.dispatch(new projectStore.PanelSetPropertyPanelState(panelState));
    const size = panelState === cd.PropertyPanelState.Accessibility ? 300 : 250;
    this.dispatch(new projectStore.PanelResizeRight(size));
  }

  onAnalyticsEvent(e: IAnalyticsEvent) {
    this._analyticsService.logEvent(e.type, e.params);
  }
}
