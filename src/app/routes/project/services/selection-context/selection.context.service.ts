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

import { Injectable, OnDestroy, ComponentRef } from '@angular/core';
import { Subscription, BehaviorSubject } from 'rxjs';
import { initialState, ISelectionState } from '../../store/reducers/selection.reducer';
import { IProjectState, getSelectionState, getPanelsState } from '../../store';
import { Store, select } from '@ngrx/store';
import { ProjectContentService } from 'src/app/database/changes/project-content.service';
import { PropertiesService } from '../properties/properties.service';
import { areObjectsEqual } from 'cd-utils/object';
import { IConfigAction } from '../../interfaces/action.interface';
import { OverlayService, MenuComponent } from 'cd-common';
import * as utils from './selection.context.utils';
import * as cd from 'cd-interfaces';
import { IPanelsState } from '../../interfaces/panel.interface';

@Injectable({ providedIn: 'root' })
export class SelectionContextService implements OnDestroy {
  private _panelsState?: IPanelsState;
  private _subscriptions = new Subscription();
  private _propsSubscription = new Subscription();
  public selectionState = new BehaviorSubject<ISelectionState>(initialState);
  public selectedProperties = new BehaviorSubject<cd.PropertyModel[]>([]);

  constructor(
    private _projectStore: Store<IProjectState>,
    private _propertiesService: PropertiesService,
    private _overlayService: OverlayService,
    private _projectContentService: ProjectContentService
  ) {
    const selectionState$ = this._projectStore.pipe(select(getSelectionState));
    const panelsState$ = this._projectStore.pipe(select(getPanelsState));

    this._subscriptions.add(selectionState$.subscribe(this.onSelectionStateSubscription));
    this._subscriptions.add(panelsState$.subscribe(this.onPanelsStateSubscription));
  }

  onPanelsStateSubscription = (panelsState: IPanelsState) => {
    this._panelsState = panelsState;
  };

  get panelsState() {
    return this._panelsState;
  }

  get properties(): cd.PropertyModel[] {
    return this.selectedProperties.getValue();
  }

  get selection(): ISelectionState {
    return this.selectionState.getValue();
  }

  onPropertiesUpdate = (props: cd.PropertyModel[]) => {
    const previous = this.selectedProperties.getValue();
    if (areObjectsEqual(props, previous)) return;
    this.selectedProperties.next(props);
  };

  resetSelectedProperties() {
    this.onPropertiesUpdate([]);
  }

  subscribeToSelectedPropertiesUpdates(selection: ISelectionState) {
    const ids = selection && selection.ids;
    this._propsSubscription = this._propertiesService
      .subscribeToProperties(...ids)
      .subscribe(this.onPropertiesUpdate);
  }

  onSelectionStateSubscription = (selection: ISelectionState) => {
    this.selectionState.next(selection);
    this._propsSubscription.unsubscribe();
    if (!selection) return this.resetSelectedProperties();
    this.subscribeToSelectedPropertiesUpdates(selection);
  };

  menuForCurrentContext(
    canvas?: cd.ICanvas,
    targetType?: cd.ConfigTargetType
  ): cd.IConfig[][] | undefined {
    const { selection } = this;
    const { project, elementProperties } = this._projectContentService;
    const selectedPropertyModels = this.selectedProperties.getValue();
    return utils.getMenuFromConfig(
      selection,
      project,
      elementProperties,
      selectedPropertyModels,
      canvas,
      targetType
    );
  }

  payloadAndTargetForContext(canvas?: cd.ICanvas): utils.TargetContextPayload {
    const propertyModels = this.selectedProperties.getValue();
    const payload = { propertyModels, canvas };
    const symbolMode = Boolean(this._panelsState?.symbolMode);
    const targetType = utils.targetTypeFromSelection(this.selection, symbolMode);
    return [payload, targetType];
  }

  propertiesForId(id: string): cd.PropertyModel | undefined {
    return this._propertiesService.getPropertiesForId(id);
  }

  actionForMenuSelection(config: cd.IConfig): IConfigAction | null {
    const [payload, targetType] = this.payloadAndTargetForContext();
    return utils.actionFromConfig(config, payload, targetType);
  }

  actionForKeyboardShortcut(e: KeyboardEvent, canvas?: cd.ICanvas): IConfigAction | null {
    const [payload, targetType] = this.payloadAndTargetForContext(canvas);
    return utils.actionFromKeyboard(e, payload, targetType);
  }

  // Lookup for keyboard shortcuts on code component page
  actionForCodeComponentKeyboardShortcut(e: KeyboardEvent): IConfigAction | null {
    const targetType = cd.ConfigTargetType.CodeComponent;
    const payload = {}; // empty payload
    return utils.actionFromKeyboard(e, payload, targetType);
  }

  isActionEnabled(action: IConfigAction, canvas?: cd.ICanvas): boolean {
    const { selection } = this;
    const { project, elementProperties } = this._projectContentService;
    return utils.shouldEnableAction(action, selection, project, elementProperties, canvas);
  }

  canCreateComponent(): boolean {
    return utils.canCreateComponentsFromSelectedProperties(this.properties);
  }

  canUngroup(): boolean {
    return utils.canUngroupSelectedProperties(this.properties);
  }

  destroyMenu = () => {
    this._overlayService.close();
  };

  attachMenuAndSubscribe(componentRef: ComponentRef<MenuComponent>, menu: cd.IConfig[][]): void {
    const subscriptions = new Subscription();
    componentRef.instance.data = menu;
    subscriptions.add(componentRef.instance.selected.subscribe(this.handleMenuSelect));
    subscriptions.add(componentRef.instance.close.subscribe(this.destroyMenu));
    componentRef.onDestroy(() => subscriptions.unsubscribe());
  }

  createMenuForCurrentContext(
    e: MouseEvent,
    canvas?: cd.ICanvas
  ): ComponentRef<MenuComponent> | undefined {
    const [, targetType] = this.payloadAndTargetForContext(canvas);
    const menu = this.menuForCurrentContext(canvas, targetType);
    if (!menu) return;
    const { clientX: x, clientY: y } = e;
    const overlayConfig = { x, y };
    const componentRef = this._overlayService.attachComponent(MenuComponent, overlayConfig);
    this.attachMenuAndSubscribe(componentRef, menu);
    return componentRef;
  }

  handleMenuSelect = (config: cd.IConfig) => {
    const action = this.actionForMenuSelection(config);
    if (!action) return;
    this._projectStore.dispatch(action);
  };

  ngOnDestroy(): void {
    this._propsSubscription.unsubscribe();
    this._subscriptions.unsubscribe();
  }
}
