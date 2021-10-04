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
  OnDestroy,
  ChangeDetectionStrategy,
  OnInit,
  ChangeDetectorRef,
  Input,
} from '@angular/core';
import {
  AbstractOverlayControllerDirective,
  OverlayService,
  ConfirmationDialogComponent,
} from 'cd-common';
import { FILTER_CONFIG } from './component-filter/component.filter.config';
import { ComponentImportPickerComponent } from '../../component-import-picker/component-import-picker.component';
import { ComponentPreviewModalComponent } from '../../component-preview/component-preview-modal.component';
import { CodeComponentsModalComponent } from './code-components-modal/code-components-modal.component';
import { InteractionService } from '../../../services/interaction/interaction.service';
import { ComponentsService } from '../../../services/components/components.service';
import { PropertiesService } from '../../../services/properties/properties.service';
import { ICustomComponenSwapPayload } from '../../../utils/symbol.utils';
import { getInvalidSymbolIds } from '../../../utils/dependency.utils';
import { AuthService } from 'src/app/services/auth/auth.service';
import { isCodeComponent } from 'cd-common/models';
import { Subscription } from 'rxjs';
import { Store, select } from '@ngrx/store';
import { getUser } from 'src/app/store';
import { Dictionary } from '@ngrx/entity';
import * as projStore from '../../../store';
import * as cd from 'cd-interfaces';

const DELETE_COMPONENT_CONFIG = {
  title: 'Delete component?',
  message: 'This will permanently delete all instances of this component from the project.',
};

@Component({
  selector: 'app-components-panel',
  templateUrl: './components-panel.component.html',
  styleUrls: ['./components-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ComponentsPanelComponent
  extends AbstractOverlayControllerDirective
  implements OnDestroy, OnInit
{
  private _codeComponents: cd.ICodeComponentDocument[] = [];
  private _isolatedSymbolId?: string;
  private _subscriptions = new Subscription();
  private _modalSubscription = Subscription.EMPTY;
  private _symbolsLibrary: cd.ISymbolProperties[] = [];
  private _user?: cd.IUser;

  public activeFilter = cd.ComponentLibrary.All;
  public filters = FILTER_CONFIG;
  public isAdmin = false;
  public activeTabIndex = 0;
  public basePatterns: cd.IPattern[] = [];
  public customComponents: cd.CustomComponent[] = [];
  public EntityType = cd.EntityType;
  public isAdminUser = true;
  public publishEntries: Dictionary<cd.IPublishEntry> = {};
  public searchString: string | undefined;

  @Input() userIsAnEditor = false;

  @Input()
  set isolatedSymbolId(value: string | undefined) {
    this._isolatedSymbolId = value;
    this.updateCustomComponents();
  }
  get isolatedSymbolId() {
    return this._isolatedSymbolId;
  }

  constructor(
    private _authService: AuthService,
    private _propsService: PropertiesService,
    private _interactionService: InteractionService,
    private _projectStore: Store<projStore.IProjectState>,
    private _cdRef: ChangeDetectorRef,
    public componentsService: ComponentsService,
    overlayService: OverlayService
  ) {
    super(overlayService);
  }

  ngOnInit(): void {
    const user$ = this._projectStore.pipe(select(getUser));
    const publishEntries$ = this._projectStore.pipe(select(projStore.selectPublishEntries));
    const onCodeComponents$ = this.componentsService.codeComponents$;
    this._subscriptions.add(this._authService.isAdminUser$.subscribe(this._handleAdmin));
    this._subscriptions.add(onCodeComponents$.subscribe(this.handleCodeComponents));
    this._subscriptions.add(publishEntries$.subscribe(this.onPublishEntriesSubscription));
    this._subscriptions.add(user$.subscribe(this._onUserSubscription));
    this._subscriptions.add(this.componentsService.symbols$.subscribe(this.handleSymbols));
  }

  get showDiscoverBtn(): boolean {
    return (
      this.activeFilter === cd.ComponentLibrary.All ||
      (this.onlyShowingCustomComponents && !this.showCustomCompZeroState)
    );
  }

  get onlyShowingCustomComponents() {
    return this.activeFilter === cd.ComponentLibrary.Custom;
  }

  get showCustomCompZeroState(): boolean {
    return this.onlyShowingCustomComponents && this.customComponents.length === 0;
  }

  ngOnDestroy(): void {
    super.ngOnDestroy();
    this._subscriptions.unsubscribe();
    this._modalSubscription.unsubscribe();
  }

  private _handleAdmin = (isAdmin: boolean) => {
    this.isAdmin = isAdmin;
    this._cdRef.markForCheck();
  };

  private _onUserSubscription = (user?: cd.IUser) => {
    this._user = user;
  };

  private handleSymbols = (symbols: cd.ISymbolProperties[]) => {
    this._symbolsLibrary = symbols;
    this.updateCustomComponents();
    this._cdRef.markForCheck();
  };

  private handleCodeComponents = (codeComponents: cd.ICodeComponentDocument[]) => {
    this._codeComponents = codeComponents;
    this.updateCustomComponents();
    this._cdRef.markForCheck();
  };

  private onPublishEntriesSubscription = (entries: Dictionary<cd.IPublishEntry>) => {
    this.publishEntries = entries;
    this._cdRef.markForCheck();
  };

  private onImport = (publishEntries: cd.IPublishEntry[]) => {
    this._projectStore.dispatch(new projStore.CustomComponentImport(publishEntries));
    this._modalSubscription.unsubscribe();
  };

  /** Always reset the search when changing filters */
  onActiveFilterChange() {
    this.searchString = '';
  }

  /** Always reset active filter on search */
  onSearchValueChange() {
    this.activeFilter = cd.ComponentLibrary.All;
  }

  updateCustomComponents() {
    const { _symbolsLibrary, isolatedSymbolId, _codeComponents } = this;
    const elementProperties = this._propsService.getElementProperties();
    const invalidSymbols = getInvalidSymbolIds(elementProperties, isolatedSymbolId);
    const symbols = _symbolsLibrary.filter((symbol) => !invalidSymbols.has(symbol.id));
    this.customComponents = [...symbols, ..._codeComponents];
  }

  onComponentPreview(component: cd.CustomComponent) {
    const modal = this.showModal<ComponentPreviewModalComponent>(ComponentPreviewModalComponent);
    const { instance } = modal;
    instance.details = component;
    instance.userIsAnEditor = this.userIsAnEditor;
    this._modalSubscription = new Subscription();
    this._modalSubscription.add(instance.edit.subscribe(this.onEditComponnet));
    this._modalSubscription.add(instance.swap.subscribe(this.onComponentSwap));
  }

  onComponentSwap = (swapValue: ICustomComponenSwapPayload) => {
    this.closeModal();
    const action = swapValue.isCodeComp
      ? new projStore.CodeComponentSwapVersion(swapValue)
      : new projStore.SymbolSwapVersion(swapValue);
    this._projectStore.dispatch(action);
  };

  onMarketplaceClick(e?: MouseEvent) {
    if (e) e.preventDefault();
    const { _user } = this;
    if (!_user) return;
    const modal = this.showModal<ComponentImportPickerComponent>(ComponentImportPickerComponent);
    modal.instance.user = _user;
    this._modalSubscription = new Subscription();
    this._modalSubscription.add(modal.instance.confirm.subscribe(this.onImport));
  }

  onDeleteConfirmation(callback: () => any) {
    const confirmModal = this.showModal<ConfirmationDialogComponent>(ConfirmationDialogComponent);
    const { instance } = confirmModal;
    instance.title = DELETE_COMPONENT_CONFIG.title;
    instance.message = DELETE_COMPONENT_CONFIG.message;
    this._modalSubscription = new Subscription();
    this._modalSubscription.add(instance.cancel.subscribe(this.cancelModal));
    this._modalSubscription.add(instance.confirm.subscribe(callback));
  }

  onDeleteComponent(component: cd.CustomComponent) {
    this.onDeleteConfirmation(() => {
      // Delete code component
      if (isCodeComponent(component)) return this.onConfirmDeleteCodeComponent(component);
      // Delete symbol (composed component)
      return this._projectStore.dispatch(new projStore.SymbolDelete(component));
    });
  }

  onAddCodeComponent(e?: MouseEvent) {
    if (e) e.preventDefault();
    const codeCmpModal = this.showModal<CodeComponentsModalComponent>(CodeComponentsModalComponent);
    const { instance } = codeCmpModal;
    instance.projectId = this._propsService.getProjectProperties()?.id;
    this._modalSubscription = new Subscription();
    this._modalSubscription.add(instance.cancel.subscribe(this.cancelModal));
    this._modalSubscription.add(instance.confirm.subscribe(this.onConfirmCreateCodeComponent));
  }

  onEditComponnet = (component: cd.CustomComponent) => {
    this.closeModal();
    if (isCodeComponent(component)) return this._propsService.editCodeComponent(component.id);
    const props = this._propsService.getPropertiesForId(component.id);
    if (!props || !props.childIds) return;
    this._interactionService.isolateSymbol(props as cd.ISymbolInstanceProperties);
  };

  cancelModal = () => {
    this.closeModal();
    this._modalSubscription.unsubscribe();
  };

  onConfirmCreateCodeComponent = (codeComponent: cd.ICodeComponentDocument) => {
    // Add new code component definition to reduce store and database
    this._projectStore.dispatch(new projStore.CodeComponentCreate([codeComponent]));
    this._propsService.editCodeComponent(codeComponent.id);
    this.cancelModal();
  };

  onConfirmDeleteCodeComponent = (codeComponent: cd.ICodeComponentDocument) => {
    this._projectStore.dispatch(new projStore.CodeComponentDelete(codeComponent));
    this._modalSubscription.unsubscribe();
  };
}
