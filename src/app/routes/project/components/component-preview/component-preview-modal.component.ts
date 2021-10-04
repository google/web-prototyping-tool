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
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy,
  ChangeDetectorRef,
  Input,
  OnInit,
  Output,
  EventEmitter,
} from '@angular/core';
import { AbstractOverlayContentDirective, OverlayInitService } from 'cd-common';
import { PropertiesService } from '../../services/properties/properties.service';
import { PublishService } from '../../services/publish/publish.service';
import { PeopleService } from 'src/app/services/people/people.service';
import { DatabaseService } from 'src/app/database/database.service';
import { publishEntryPathForId } from 'src/app/database/path.utils';
import { ICustomComponenSwapPayload } from '../../utils/symbol.utils';
import { fromEvent, Observable, Subscription } from 'rxjs';
import { UNTITLED_PROJECT_NAME } from 'cd-common/consts';
import { Route } from 'src/app/configs/routes.config';
import { debounceTime, take } from 'rxjs/operators';
import { deepCopy } from 'cd-utils/object';
import { isCodeComponent } from 'cd-common/models';
import type firebase from 'firebase/app';
import * as config from './component-preview.config';
import * as cd from 'cd-interfaces';

@Component({
  selector: 'app-component-preview-modal',
  templateUrl: './component-preview-modal.component.html',
  styleUrls: ['./component-preview-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ComponentPreviewModalComponent
  extends AbstractOverlayContentDirective
  implements AfterViewInit, OnDestroy, OnInit
{
  private _subscription = new Subscription();
  public showPublishDetails = false;
  public isLoaded = false;
  public published = true;
  public author$?: Observable<Partial<cd.IUser> | undefined>;
  public embedURL = '';
  public publishEntry?: cd.IPublishEntry;
  public currentProject?: cd.IProject;
  public currentImportedVersionId?: string;
  public selectedVersionId?: string;
  public selectedVersionTimestamp?: firebase.firestore.Timestamp;
  // Used by publish to hold temp changes
  public publishEntryUpdate?: cd.IPublishEntry;
  public publishName = '';
  ///
  @Input() userIsAnEditor = false;
  @Input() details?: cd.CustomComponent;
  @Output() edit = new EventEmitter<cd.CustomComponent>();
  @Output() swap = new EventEmitter<ICustomComponenSwapPayload>();

  @ViewChild('iframeRef', { read: ElementRef, static: true }) iframeRef!: ElementRef;

  constructor(
    public overlayInit: OverlayInitService,
    private _databaseService: DatabaseService,
    private _propertiesService: PropertiesService,
    private _peopleService: PeopleService,
    private _publishService: PublishService,
    private _cdRef: ChangeDetectorRef
  ) {
    super(overlayInit);
    this.currentProject = this._propertiesService.getProjectProperties();
  }

  generateEmbedURL(projectId?: string, compId?: string): string {
    if (!projectId || !compId) return '';
    const path = [window.location.origin, Route.Project, projectId, Route.Embed];
    return path.join('/') + `?id=${compId}`; // .../project/[projectId]/embed?id=[componentId]
  }

  showCurrentProjectComponent() {
    this.embedURL = this.generateEmbedURL(this.currentProject?.id, this.details?.id);
    this.setAuthor(this.currentProject?.owner.email);
  }

  ngOnInit(): void {
    const { publishEntryId } = this;
    this.published = publishEntryId !== undefined;
    this.publishName = this.componentName ?? '';
    if (!publishEntryId) return this.showCurrentProjectComponent();
    const activeVersion = this.details?.publishId?.versionId;
    this.currentImportedVersionId = activeVersion;
    const publishEntryPath = publishEntryPathForId(publishEntryId);
    const publishEntry$ = this._databaseService.getDocumentData<cd.IPublishEntry>(publishEntryPath);
    this._subscription.add(publishEntry$.subscribe(this.onPublishEntry));
  }

  get publishEntryId(): string | undefined {
    return this.details?.publishId?.entryId;
  }

  get publishLoaded(): boolean {
    return this.publishEntry !== undefined;
  }

  get author() {
    return this.published ? this.publishEntry?.owner.email : this.currentProject?.owner.email;
  }

  get timestamp(): firebase.firestore.Timestamp | undefined {
    return this.selectedVersionTimestamp;
  }

  get description(): string {
    if (this.published) {
      return this.publishLoaded ? this.publishEntry?.desc || config.FALLBACK_DESCRIPTION : '';
    }

    return config.FALLBACK_DESCRIPTION;
  }

  get msgConfig(): config.IPreviewMessage | undefined {
    const { msgState } = this;
    if (!msgState) return;
    return config.MESSAGE_CONFIG[msgState];
  }

  get msgState(): config.PreviewStateMessage | undefined {
    if (!this.published) return config.PreviewStateMessage.Unpublished;
    if (!this.publishLoaded) return;
    const isSelected = this.selectedVersionId === this.currentImportedVersionId;
    return isSelected
      ? config.PreviewStateMessage.PublishedCurrentVersion
      : config.PreviewStateMessage.PublishedDifferentVersion;
  }

  get componentName(): string | undefined {
    return (
      (this.details as cd.ISymbolProperties)?.name ||
      (this.details as cd.ICodeComponentDocument)?.title
    );
  }

  get title(): string {
    return this.publishEntry?.name || this.componentName || UNTITLED_PROJECT_NAME;
  }

  get tags(): string[] {
    return this.publishEntry?.tags || [];
  }

  get canShowVersionsSelect(): boolean {
    return this.published && Boolean(this.publishEntry?.versions.length);
  }

  setAuthor(email?: string | null) {
    if (!email) return;
    this.author$ = this._peopleService.getUserDetailsForEmailAsObservable(email);
  }

  onPublishEntry = (entry?: cd.IPublishEntry) => {
    // IF the entry is undefined, the component has been removed from the marketplace
    if (!entry) {
      this.published = false;
      return this.showCurrentProjectComponent();
    }
    ////////////////////////////////////////////////////////////////////////////////
    this.publishEntry = entry;
    this.publishEntryUpdate = deepCopy(entry);
    this.setSelectedVersion(this.currentImportedVersionId);
    this.setAuthor(entry?.owner.email);
    this._cdRef.markForCheck();
  };

  setSelectedVersion(versionId?: string) {
    if (!versionId || this.selectedVersionId === versionId) return;
    const selectedVersion = this.publishEntry?.versions.find((item) => item.id === versionId);
    const id = selectedVersion?.symbolId || selectedVersion?.codeComponentId;
    this.embedURL = this.generateEmbedURL(selectedVersion?.projectId, id);
    this.selectedVersionId = versionId;
    this.selectedVersionTimestamp = selectedVersion?.createdAt;
    this.listenForFrameLoad();
  }

  onVersionSelect(item: cd.SelectItemOutput) {
    const versionId = (item as cd.ISelectItem).value;
    this.setSelectedVersion(versionId);
  }

  ngOnDestroy(): void {
    this._subscription.unsubscribe();
  }

  listenForFrameLoad() {
    this.isLoaded = false;
    const load$ = fromEvent<Event>(this.iframeRef.nativeElement, 'load').pipe(
      debounceTime(500), // extra delay to wait for the renderer to display the component
      take(1)
    );
    this._subscription.add(load$.subscribe(this.frameDidLoad));
  }

  ngAfterViewInit() {
    super.ngAfterViewInit();
    this.listenForFrameLoad();
  }

  frameDidLoad = () => {
    this.isLoaded = true;
    this._cdRef.markForCheck();
  };

  onMsgAction(action?: config.PreviewAction) {
    if (action === config.PreviewAction.Edit) return this.handleEdit();
    if (action === config.PreviewAction.Publish) return this.handleStartPublishFlow();
    if (action === config.PreviewAction.SwapVersion) return this.handleSwapVersion();
  }

  handleEdit() {
    this.edit.emit(this.details);
  }

  handleSwapVersion() {
    const { selectedVersionId, publishEntry, currentImportedVersionId, details } = this;
    if (!publishEntry) return;
    const updatedVersion = publishEntry.versions.find((v) => v.id === selectedVersionId);
    const currentVersion = publishEntry.versions.find((v) => v.id === currentImportedVersionId);
    if (!updatedVersion || !details || !currentVersion) return;
    const isCodeComp = isCodeComponent(details);
    const componentId = details.id;
    this.swap.emit({ publishEntry, updatedVersion, componentId, isCodeComp });
  }

  handleStartPublishFlow() {
    this.showPublishDetails = true;
  }

  onPublishCancel() {
    this.showPublishDetails = false;
  }

  onPublishNewVersion() {
    const { publishEntryUpdate, publishName, details } = this;
    if (!details) return;
    const description = publishEntryUpdate?.desc || '';
    const tags = publishEntryUpdate?.tags || [];
    const name = publishName;
    const id = details.id;
    const type: cd.PublishType = isCodeComponent(details)
      ? cd.PublishType.CodeComponent
      : cd.PublishType.Symbol;

    const publishDetails: cd.IPublishDetails = { description, tags, name, type, id };
    this._publishService.onPublish(publishDetails);
    this.dismissOverlay.emit();
  }
}
