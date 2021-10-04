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
import { Component, Input, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy, OnInit, TemplateRef } from '@angular/core';
// prettier-ignore
import { IProjectState, selectPublishEntries, PublishEntryUpdate, PublishEntryDelete, CodeComponentSwapVersion, SymbolSwapVersion } from '../../store';
// prettier-ignore
import { OverlayService, AbstractOverlayControllerDirective, ConfirmationDialogComponent } from 'cd-common';
import { Dictionary } from '@ngrx/entity';
import { Store, select } from '@ngrx/store';
import { Subscription } from 'rxjs';
import { PropertiesService } from '../../services/properties/properties.service';
import { PublishService } from '../../services/publish/publish.service';
import { ToastsService } from 'src/app/services/toasts/toasts.service';
import { MSG_CONFIG } from './publish-panel.config';
import * as cd from 'cd-interfaces';
import { AuthService } from '../../../../services/auth/auth.service';
import { areObjectsEqual } from 'cd-utils/object';

const REMOVED_FROM_MARKETPLACE_TOAST = {
  iconName: 'check_circle',
  message: 'Component removed from the Marketplace',
};

@Component({
  selector: 'app-publish-panel',
  templateUrl: './publish-panel.component.html',
  styleUrls: ['./publish-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublishPanelComponent
  extends AbstractOverlayControllerDirective
  implements OnInit, OnDestroy
{
  private _subscriptions = new Subscription();
  private _publishId?: cd.IPublishId;
  private _publishEntries?: Dictionary<cd.IPublishEntry>;

  public publishEntry?: cd.IPublishEntry;
  public isCurrentUserOwner = false;

  @Input() templateRef?: TemplateRef<any>;
  @Input() zeroStateIcon = 'shopping_cart';
  @Input() zeroStateMsg = 'Publish to the marketplace to share or use in other projects.';
  @Input() sectionTitle = 'Versions';
  @Input() id?: string; // ID of the item to be published (project, symbol, code component)
  @Input() publishType: cd.PublishType = cd.PublishType.Symbol;
  @Input() showOwner = true;
  @Input() showTitle = true;
  @Input() showFooterMsg = true;
  @Input() showBottomLine = false;

  @Input() set publishId(publishId: cd.IPublishId | undefined) {
    if (areObjectsEqual(this._publishId, publishId)) return;
    this._publishId = publishId;
    this.loadPublishEntry();
  }
  get publishId() {
    return this._publishId;
  }

  get isTemplate() {
    return this.publishType === cd.PublishType.Template;
  }

  get zeroStateMessage() {
    return this.isTemplate
      ? MSG_CONFIG.PublishTemplateZeroState
      : MSG_CONFIG.PublishComponentZeroState;
  }

  constructor(
    private _projectStore: Store<IProjectState>,
    private _propertiesService: PropertiesService,
    private _cdRef: ChangeDetectorRef,
    private _publishService: PublishService,
    private _toastService: ToastsService,
    private _authService: AuthService,
    _overlayService: OverlayService
  ) {
    super(_overlayService);
  }

  get hasPublishDetails(): boolean {
    const { publishEntry } = this;
    if (!publishEntry) return false;
    return !!publishEntry?.desc || (!!publishEntry?.tags && publishEntry?.tags.length > 0);
  }

  ngOnInit(): void {
    const publishEntries$ = this._projectStore.pipe(select(selectPublishEntries));
    this._subscriptions.add(publishEntries$.subscribe(this.onPublishEntriesSubscription));
  }

  ngOnDestroy() {
    super.ngOnDestroy();
    this._subscriptions.unsubscribe();
  }

  onPublishEntriesSubscription = (publishEntries: Dictionary<cd.IPublishEntry>) => {
    this._publishEntries = publishEntries;
    this.loadPublishEntry();
  };

  onDescriptionChange = (desc: string) => {
    this.updatePublishEntry({ desc });
  };

  onTagsChange = (tags: string[]) => {
    this.updatePublishEntry({ tags });
  };

  onPublishClick() {
    const { id, publishType, _publishService: publishService } = this;
    const { Symbol, CodeComponent, Template } = cd.PublishType;
    if (!id) return;
    if (publishType === Symbol) return publishService.openPublishSymbolModal(id);
    if (publishType === CodeComponent) return publishService.openPublishCodeComponentModal(id);
    if (publishType === Template) return publishService.openPublishTemplateModal();
  }

  onUnpublishClick() {
    if (!this.isUserPublishEntryOwner()) return;
    const cmpRef = this.showModal<ConfirmationDialogComponent>(ConfirmationDialogComponent);
    const { isTemplate } = this;
    cmpRef.instance.title = isTemplate
      ? MSG_CONFIG.UnpublishTemplateModalTitle
      : MSG_CONFIG.UnpublishComponentModalTitle;
    cmpRef.instance.message = isTemplate
      ? MSG_CONFIG.UnpublishTemplateModalMessage
      : MSG_CONFIG.UnpublishComponentModalMessage;
    cmpRef.instance.confirm.subscribe(this.onUnpublishConfirm);
  }

  onConfirmVersionSwap = (updatedVersion: cd.IPublishVersion) => {
    const { publishEntry, publishId, id: componentId } = this;
    if (!publishEntry || !publishId || !componentId) return;
    if (publishId.versionId === updatedVersion.id) return; // already set to this verison

    const isCodeComp = publishEntry.type === cd.PublishType.CodeComponent;
    const payload = { publishEntry, updatedVersion, isCodeComp, componentId };
    const action = isCodeComp
      ? new CodeComponentSwapVersion(payload, true)
      : new SymbolSwapVersion(payload, true);

    // go ahead and set local versionId to updated version so there isn't delay in active radio
    this._publishId = { entryId: publishId.entryId, versionId: updatedVersion.id };

    // dispatch swap action to store
    this._projectStore.dispatch(action);
  };

  onSwapToVersion(updatedVersion: cd.IPublishVersion) {
    if (this.isTemplate) return; // Dont update if this is a template
    const cmpRef = this.showModal<ConfirmationDialogComponent>(ConfirmationDialogComponent);
    cmpRef.instance.title = MSG_CONFIG.ConfirmSwapVersionTitle;
    cmpRef.instance.message = MSG_CONFIG.ConfirmSwapVersionMessage;
    cmpRef.instance.confirm.subscribe(() => this.onConfirmVersionSwap(updatedVersion));
  }

  private onUnpublishConfirm = () => {
    const { publishEntry } = this;
    if (!publishEntry) return;
    this._projectStore.dispatch(new PublishEntryDelete(publishEntry));
    setTimeout(() => this._toastService.addToast(REMOVED_FROM_MARKETPLACE_TOAST), 400);
  };

  private isUserPublishEntryOwner(): boolean {
    const { publishEntry } = this;
    if (this._authService.isAdminUser) return true;
    const currentUser = this._propertiesService.getCurrentUser();
    return !!(publishEntry && currentUser?.id === publishEntry?.owner?.id);
  }

  private updatePublishEntry(update: cd.PublishEntryUpdatePayload) {
    const { publishEntry } = this;
    if (!publishEntry) return;
    this._projectStore.dispatch(new PublishEntryUpdate(publishEntry.id, update));
  }

  get propertyGroupType() {
    return this.isCurrentUserOwner ? cd.PropertyGroupType.Add : undefined;
  }

  private loadPublishEntry = () => {
    const { publishId, _publishEntries } = this;
    const entry = publishId && _publishEntries ? _publishEntries[publishId.entryId] : undefined;
    this.publishEntry = entry;
    this.isCurrentUserOwner = this.isUserPublishEntryOwner();
    this._cdRef.markForCheck();
  };

  versionTrackBy(_idx: number, version: cd.IPublishVersion) {
    return version.id;
  }
}
