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
  OnChanges,
  SimpleChanges,
  ChangeDetectorRef,
  ViewChild,
} from '@angular/core';
import { removeValueFromArrayAtIndex } from 'cd-utils/array';
import { QUICK_INTERACTIONS, INTERACTION_TYPE_MENU, ACTION_DOCS_URL } from './action-panel.config';
import { actionForTypeAndElement } from './action-panel.utils';
import { PropertiesService } from '../../../services/properties/properties.service';
import { ConfigAction, IConfigPayload } from '../../../interfaces/action.interface';
import { IInteractionClipboard } from '../../../store/reducers/interaction.reducer';
import { AnalyticsService } from 'src/app/services/analytics/analytics.service';
import { ToastsService } from 'src/app/services/toasts/toasts.service';
import { deepCopy } from 'cd-utils/object';
import { Store, select } from '@ngrx/store';
import * as cd from 'cd-interfaces';
import * as store from '../../../store';
import { Observable } from 'rxjs';
import { MenuButtonComponent } from 'cd-common';
import { AnalyticsEvent } from 'cd-common/analytics';
import { openLinkInNewTab } from 'cd-utils/url';

@Component({
  selector: 'app-actions-panel',
  templateUrl: './actions-panel.component.html',
  styleUrls: ['./actions-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActionsPanelComponent implements OnChanges {
  public zeroStateMenu = QUICK_INTERACTIONS;
  public actionClipboard$: Observable<IInteractionClipboard | undefined>;
  public menuData = INTERACTION_TYPE_MENU;
  public shownCards = new Set();

  @Input() isRecording = false;
  @Input() elementId = '';
  @Input() disabled = false;
  @Input() currentRootId = '';
  @Input() portals: cd.ISelectItem[] = [];
  @Input() boards: cd.IBoardProperties[] = [];
  @Input() actions: cd.ActionBehavior[] = [];
  @Input() colorMenuData: ReadonlyArray<cd.ISelectItem> = [];
  @Input() designSystem?: cd.IDesignSystem;
  @Input() symbolChildren: cd.ISelectItem[] = [];
  @Input() selectedElements: cd.PropertyModel[] = [];
  @Input() outputsConfig: ReadonlyArray<cd.IOutputProperty> = [];
  @Input() inputs: cd.IStringMap<any> = {};

  @Output() actionsChange = new EventEmitter<cd.ActionBehavior[]>();
  @Output() storeAction = new EventEmitter<cd.ISelectItem>();

  @ViewChild('actionMenuRef', { read: MenuButtonComponent })
  _actionMenuRef!: MenuButtonComponent;

  constructor(
    private _cdRef: ChangeDetectorRef,
    private _projectStore: Store<store.IProjectState>,
    private _analyticsService: AnalyticsService,
    private _toastService: ToastsService,
    private _propertiesService: PropertiesService
  ) {
    this.actionClipboard$ = this._projectStore.pipe(select(store.getInteractionClipboard));
  }

  ngOnChanges(changes: SimpleChanges): void {
    // This is how we determine which cards can should be animated in
    if (
      changes?.elementId?.currentValue !== changes?.elementId?.previousValue ||
      changes?.actions?.firstChange
    ) {
      this.shownCards = new Set(this.actions.map((item) => item.id));
      this._cdRef.markForCheck();
    }
  }

  get hasActions() {
    return this.actions.length > 0;
  }

  onChange(value: any, i: number) {
    const clone = deepCopy(this.actions);
    clone[i] = value;
    this.actionsChange.emit(clone);
  }

  onRemove(i: number) {
    let clone = deepCopy(this.actions);
    clone = removeValueFromArrayAtIndex(i, clone);
    this.actionsChange.emit(clone);
  }

  handleStartRecording(idx: number) {
    const data = this.actions[idx];
    if (!data?.id || !this.elementId) return;
    this._projectStore.dispatch(new store.PanelStartRecording(this.elementId, data.id));
  }

  handleStopRecording() {
    this._projectStore.dispatch(new store.PanelStopRecording());
  }

  onRecord(isRecording: boolean, i: number) {
    if (isRecording) {
      this.handleStartRecording(i);
    } else {
      this.handleStopRecording();
    }
  }

  get elementProperties(): cd.PropertyModel | undefined {
    return this._propertiesService.getPropertiesForId(this.elementId);
  }

  onQuickAdd(config: cd.IConfig) {
    if (!config.action) return;
    const { elementProperties } = this;
    if (!elementProperties) return;
    const payload: IConfigPayload = { propertyModels: [elementProperties] };
    const action = new ConfigAction(config, payload);
    this._projectStore.dispatch(action);
  }

  openActionMenu() {
    this._actionMenuRef.open();
  }

  onStoreAction(item: cd.ISelectItem) {
    this.storeAction.emit(item);
  }

  trackFn(idx: number, action: cd.ActionBehavior) {
    return action.id ?? idx + action.type;
  }

  onCopyAction(action: cd.ActionBehavior) {
    this._projectStore.dispatch(new store.InteractionCopyActions(this.elementId, [action]));
    this._toastService.addToast({
      duration: 3000,
      iconName: 'check_circle',
      message: `Action copied`,
    });
  }

  onPasteActions() {
    this._projectStore.dispatch(new store.InteractionPasteActions(this.elementId));
  }

  onMenuSelect(item: cd.IMenuConfig) {
    const { elementProperties } = this;
    if (!elementProperties) return;
    const actionType = item.value as cd.ActionType;
    const clone = deepCopy(this.actions);
    const action = actionForTypeAndElement(actionType, elementProperties);
    this._analyticsService.logEvent(AnalyticsEvent.ActionCreate, { name: actionType });
    this.actionsChange.emit([action, ...clone]);
  }

  onDocsClick() {
    openLinkInNewTab(ACTION_DOCS_URL);
  }
}
