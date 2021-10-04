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
import { Component, Input, ChangeDetectionStrategy, Output, EventEmitter, OnDestroy, ChangeDetectorRef, OnInit, } from '@angular/core';
import { buildMenuConfig, getIsoloatedSymbolObservable, GroupAction } from './top-bar.utils';
import { OverlayService, AbstractOverlayControllerDirective } from 'cd-common';
import { SelectionContextService } from '../../services/selection-context/selection.context.service';
import { PublishService } from '../../services/publish/publish.service';
import { GROUP_ELEMENT_NAME } from '../../utils/group.utils';
import { AssetsService } from '../../services/assets/assets.service';
import { CanvasService } from '../../services/canvas/canvas.service';
import { ConfigAction } from '../../interfaces/action.interface';
import { PropertiesService } from '../../services/properties/properties.service';
import { InteractionService } from '../../services/interaction/interaction.service';
import { ISelectionState } from '../../store/reducers/selection.reducer';
import { AnalyticsService } from 'src/app/services/analytics/analytics.service';
import { MIN_ZOOM, MAX_ZOOM } from '../../configs/canvas.config';
import { toPercent, toDecimal, isNumber } from 'cd-utils/numeric';
import { UNTITLED_PROJECT_NAME } from 'cd-common/consts';
import { zoomMenuConfig } from '../../configs/zoom.config';
import { PeopleService } from 'src/app/services/people/people.service';
import { doesImageMatchAspectRatio } from '../../utils/assets.utils';
import { DatabaseService } from 'src/app/database/database.service';
import { auditTime, distinctUntilChanged } from 'rxjs/operators';
import { Observable, Subscription } from 'rxjs';
import { select, Store } from '@ngrx/store';
import { createBoardSelectMenu } from '../../utils/board.utils';
import { AnalyticsEvent } from 'cd-common/analytics';
import { PREVIEW_TOGGLE_SHORTCUT } from '../../configs/project.config';
import { ShareDialogComponent } from 'src/app/components/share-dialog/share-dialog.component';
import { generateGridLayout, isGridLayout } from '../layout-engine/layout-engine.utils';
import * as actions from '../../store/actions';
import * as cd from 'cd-interfaces';
import * as projectStore from '../../store';
import * as utils from 'cd-common/utils';
import * as models from 'cd-common/models';
import { ProjectContentService } from 'src/app/database/changes/project-content.service';

enum SelectionContext {
  Project,
  Board,
  Element,
}

@Component({
  selector: 'app-top-bar',
  templateUrl: './top-bar.component.html',
  styleUrls: ['./top-bar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopBarComponent
  extends AbstractOverlayControllerDirective
  implements OnDestroy, OnInit
{
  private _subscription: Subscription = Subscription.EMPTY;
  private _selectedIds = new Set<string>();
  private _project?: cd.IProject;
  private _zoom = 1;
  private _boards: cd.IBoardProperties[] = [];
  public previewActionTooltip = PREVIEW_TOGGLE_SHORTCUT;
  public isUserOwnerOfIsolatedSymbol$: Observable<boolean>;
  public projectName = '';
  public UNTITLED_PROJECT_NAME = UNTITLED_PROJECT_NAME;
  public selectionContext = SelectionContext;
  public showCreateComponent = false;
  public activeContext = SelectionContext.Project;
  public zoomMenu = zoomMenuConfig;
  public minZoom = toPercent(MIN_ZOOM);
  public maxZoom = toPercent(MAX_ZOOM);
  public groupBtnDisabled = false;
  public unGroupDisabled = true;
  public fitBoardBtnDisabled = false;
  public showGridAdjustmentBtn = false;
  public groupMenuData: cd.IMenuConfig[] = [];
  public showFitContent = true;
  public showImageFit = false;
  public showLayoutDropdown = false;
  public imageMatchesAspectRatio = false;
  public saving = false;
  public boardIds$: Observable<string[]>;

  @Input() isRecording = false;
  @Input() initialLoad = false;
  @Input() isolatedSymbolId?: string;

  @Input()
  set project(project: cd.IProject) {
    this._project = project;
    this.projectName = project?.name || '';
  }

  @Input()
  set zoom(zoom: number) {
    this._zoom = toPercent(zoom);
  }
  get zoom(): number {
    return this._zoom;
  }

  @Output() addBoard = new EventEmitter<void>();
  @Output() projectNameChange = new EventEmitter<string>();

  constructor(
    public overlayService: OverlayService,
    private _canvasService: CanvasService,
    private _analyticsService: AnalyticsService,
    private _assetService: AssetsService,
    private _interactionService: InteractionService,
    private _selectionContext: SelectionContextService,
    private _cdRef: ChangeDetectorRef,
    private _projectStore: Store<projectStore.IProjectState>,
    private _projectContentService: ProjectContentService,
    private _propertiesService: PropertiesService,
    private _publishService: PublishService,
    private _peopleService: PeopleService,
    private _dbService: DatabaseService
  ) {
    super(overlayService);
    const { elementProperties$, boardIds$ } = this._projectContentService;
    this.boardIds$ = boardIds$;
    this.isUserOwnerOfIsolatedSymbol$ = getIsoloatedSymbolObservable(
      _projectStore,
      elementProperties$
    );
  }

  ngOnInit(): void {
    const boards$ = this._projectContentService.boardsArray$;
    const selectionState = this._projectStore.pipe(select(projectStore.getSelectionState));

    this._subscription = selectionState.subscribe(this.onSelectionStateSubscription);
    this._subscription.add(
      this._selectionContext.selectedProperties.subscribe(this.onSelectedPropsUpdate)
    );
    this._subscription.add(boards$.subscribe(this.onBoardsSubscriptions));
    this._subscription.add(
      this._dbService.batchQueue.active$
        .pipe(auditTime(250), distinctUntilChanged())
        .subscribe(this.onWriteStatus)
    );
  }

  onSelectLayout(preset: cd.ILayoutDefinition) {
    const selected = [...this._selectedIds];
    this._projectStore.dispatch(new projectStore.LayoutApplyPresetToSelection(selected, preset));
  }

  onWriteStatus = (saving: boolean) => {
    this.saving = saving;
    this._cdRef.markForCheck();
  };

  getSelectionContext(selection: ISelectionState): SelectionContext {
    if (selection.outletFramesSelected) return SelectionContext.Board;
    if (selection.type !== cd.EntityType.Project) return SelectionContext.Element;
    return SelectionContext.Project;
  }

  canShowImageFitButton(props: cd.PropertyModel) {
    const img = props as cd.IImageProperties;
    const assetId = img.inputs?.src?.id;
    const isImg = models.isImage(props);
    this.showImageFit = isImg && !!assetId;
    const styles = models.getActiveStyleFromProperty(props);
    const asset = assetId && this._assetService.getAssetForId(assetId);
    if (!asset || !styles) return;
    const imgRect = this._interactionService.renderRectForId(img.id);
    if (!imgRect) return;
    const matchesAspectRatio = doesImageMatchAspectRatio(styles, asset, imgRect, img);
    this.imageMatchesAspectRatio = matchesAspectRatio;
  }

  onFinishEditingSymbol() {
    this._projectStore.dispatch(new actions.PanelExitSymbolMode());
  }

  onSelectionStateSubscription = (selection: ISelectionState) => {
    this.activeContext = this.getSelectionContext(selection);
    this.showCreateComponent = this._selectionContext.canCreateComponent();
    this._selectedIds = selection.ids;
    this.buildGroupMenu();
    this._cdRef.markForCheck();
  };

  onBoardsSubscriptions = (boards: cd.IBoardProperties[]) => (this._boards = boards);

  buildGroupMenu() {
    const ungroupDisabled = !this._selectionContext.canUngroup();
    this.groupMenuData = buildMenuConfig(ungroupDisabled);
    this.unGroupDisabled = ungroupDisabled;
  }

  onSelectedPropsUpdate = (props: cd.PropertyModel[]) => {
    const [first] = props;
    if (!first) return;
    this.updateGridActions(first);
    this.canShowImageFitButton(first);
    this.canShowLayoutPresets(props);
    this.fitBoardBtnDisabled = first.childIds.length === 0;
    this._cdRef.markForCheck();
  };

  canShowLayoutPresets(prop: cd.PropertyModel[]) {
    this.showLayoutDropdown = prop.length === 1 && models.isGeneric(prop[0]);
  }

  updateGridActions(props: cd.PropertyModel) {
    const styles = models.getActiveStyleFromProperty(props) || ({} as cd.IStyleDeclaration);
    const childCount = (props.childIds || []).length;
    const gridTemplateColumns = styles.gridTemplateColumns || [];
    const gridTemplateRows = styles.gridTemplateRows || [];
    const columns = gridTemplateColumns.length;
    const rows = gridTemplateRows.length;
    const isGrid = isGridLayout(styles);
    const max = (columns || 1) * (rows || 1);
    this.showGridAdjustmentBtn = isGrid && childCount > max;
  }

  ngOnDestroy() {
    super.ngOnDestroy();
    this._subscription.unsubscribe();
  }

  onProjectNameChange(e: Event) {
    const input = e.currentTarget as HTMLInputElement;
    this.projectNameChange.emit(input.value);
  }

  onAddBoard(e: MouseEvent): void {
    (e.currentTarget as HTMLButtonElement).blur();
    this.addBoard.emit();
  }

  onZoomChange(item: cd.ISelectItem | number) {
    // item can be an select item (autocomplete) or a number (input)
    const value = isNumber(item) ? item : (item as cd.ISelectItem).value;
    if (value) {
      const zoom = toDecimal(Number(value));
      this._canvasService.zoomTo(zoom, true);
    } else {
      this._canvasService.fitToBounds();
    }
  }

  onPublishClick() {
    if (!this.isolatedSymbolId) return;
    this._publishService.openPublishSymbolModal(this.isolatedSymbolId);
  }

  onShare() {
    this.openShareDialog();
  }

  openShareDialog() {
    const { _boards, _project } = this;
    if (!_project) return;
    const { homeBoardId } = _project;

    const boardSelectOptions = createBoardSelectMenu(_boards, homeBoardId);
    const componentRef = this.showModal<ShareDialogComponent>(ShareDialogComponent);
    componentRef.instance.project = _project;
    componentRef.instance.boardOptions = boardSelectOptions;
    componentRef.instance.selectedBoardId = _project.homeBoardId || '';

    const ownerEmail = _project.owner.email || '';
    const ownerSubscription = this._peopleService
      .getUserDetailsForEmailAsObservable(ownerEmail)
      .subscribe((user) => {
        componentRef.instance.owner = user;
      });
    this._subscription.add(ownerSubscription);
    this._analyticsService.logEvent(AnalyticsEvent.ShareDialogOpenedFromProject);
  }

  onCreateComponent() {
    const config = { title: '' };
    this._dispatchElementAction(config, actions.SymbolCreate);
  }

  onGroupMenuSelect(item: cd.IMenuConfig) {
    if (item.value === GroupAction.Group) return this.onGroup();
    if (item.value === GroupAction.Ungroup) return this.onUngroup();
    if (item.value === GroupAction.Vertical) return this.onVerGroup();
    if (item.value === GroupAction.Horizontal) return this.onHorzGroup();
    if (item.value === GroupAction.Grid) return this.onGridGroup();
  }

  onUngroup = () => {
    const payload = { title: '' };
    this._dispatchElementAction(payload, actions.ElementPropertiesUngroupElements);
  };

  onGroup = () => this._dispatchGroupElementAction(cd.LayoutMode.Auto);
  onVerGroup = () => this._dispatchGroupElementAction(cd.LayoutMode.Rows);
  onHorzGroup = () => this._dispatchGroupElementAction(cd.LayoutMode.Cols);
  onGridGroup = () => this._dispatchGroupElementAction(cd.LayoutMode.Grid);

  updateGridLayout() {
    const [first] = this._selectedIds;
    const props = this._propertiesService.getPropertiesForId(first);
    if (!props) return;
    const payload = generateGridLayout(props.childIds.length);
    const update = utils.buildBaseStylePropsUpdate(first, payload);
    this._projectStore.dispatch(new actions.ElementPropertiesUpdate([update]));
  }

  onFitAspectRatio(e: MouseEvent) {
    (e.currentTarget as HTMLButtonElement).blur();
    const [first] = this._selectedIds;
    const props = this._propertiesService.getPropertiesForId(first) as cd.IImageProperties;
    const payload = { propertyModels: [props] };
    this._projectStore.dispatch(new actions.ImagesFitToAspectRatio(null, payload));
  }

  private _dispatchGroupElementAction = (layout: cd.LayoutMode) => {
    const title = GROUP_ELEMENT_NAME;
    const config = { title };
    this._dispatchElementAction(config, actions.ElementPropertiesGroupElements, layout);
  };

  private _dispatchElementAction = (
    config: cd.IConfig,
    actionClass: typeof ConfigAction,
    layout: cd.LayoutMode = cd.LayoutMode.Auto
  ) => {
    const ids = Array.from(this._selectedIds);
    const propertyModels = this._propertiesService.getPropertiesForIds(...ids);
    const action = new actionClass(config, { propertyModels, layout });
    this._projectStore.dispatch(action);
  };

  onStopRecording() {
    this._projectStore.dispatch(new actions.PanelStopRecording());
  }

  onBoardFit() {
    const ids = Array.from(this._selectedIds);
    this._projectStore.dispatch(new actions.BoardFitContent(ids));
  }
}
