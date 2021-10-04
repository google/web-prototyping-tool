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

import * as cd from 'cd-interfaces';
import { Injectable, OnDestroy } from '@angular/core';
import { PropertiesService } from '../properties/properties.service';
import { OverlayService, AbstractOverlayControllerDirective } from 'cd-common';
import { Store, select } from '@ngrx/store';
import { IProjectState } from '../../store/reducers';
import { ToastsService } from 'src/app/services/toasts/toasts.service';
import { PublishResult } from '../../store/actions/publish.action';
import { getUser } from 'src/app/store/selectors';
import { Subscription, Observable, of, forkJoin } from 'rxjs';
import { Dictionary } from '@ngrx/entity';
import { selectPublishEntries } from '../../store/selectors/publish.selector';
import { ElementPropertiesUpdate, CodeComponentUpdate } from '../../store/actions';
import { AnalyticsService } from 'src/app/services/analytics/analytics.service';
import { createPublishEntry, updatePublishEntry, createVersionMetadata } from './publish.utils';
import { DatabaseService } from 'src/app/database/database.service';
import { DuplicateService } from 'src/app/services/duplicate/duplicate.service';
import { switchMap, catchError, map } from 'rxjs/operators';
import { convertUserToUserIdentity } from 'src/app/utils/user.utils';
import { AnalyticsEvent } from 'cd-common/analytics';
import { DatabaseChangesService } from 'src/app/database/changes/database-change.service';
import { ProjectContentService } from 'src/app/database/changes/project-content.service';
import { PublishDetailsModalComponent } from '../../components/publish-details/publish-details-modal.component';

@Injectable({ providedIn: 'root' })
export class PublishService extends AbstractOverlayControllerDirective implements OnDestroy {
  private _user?: cd.IUser;
  private _project?: cd.IProject;
  private _publishEntries: Dictionary<cd.IPublishEntry> = {};
  private _subscriptions = new Subscription();
  private _currentToastId?: string;

  constructor(
    public overlayService: OverlayService,
    private _propertiesService: PropertiesService,
    private _projectStore: Store<IProjectState>,
    private _toastService: ToastsService,
    private _analyticsService: AnalyticsService,
    private _databaseService: DatabaseService,
    private _databaseChangesService: DatabaseChangesService,
    private _duplicateService: DuplicateService,
    private _projectContentService: ProjectContentService
  ) {
    super(overlayService);

    const user$ = this._projectStore.pipe(select(getUser));
    const project$ = this._projectContentService.project$;
    const publishEntries$ = this._projectStore.pipe(select(selectPublishEntries));

    this._subscriptions.add(user$.subscribe(this._onUserSubscription));
    this._subscriptions.add(project$.subscribe(this._onProjectSubscription));
    this._subscriptions.add(publishEntries$.subscribe(this._onPublishEntriesSubscription));
  }

  ngOnDestroy() {
    super.ngOnDestroy();
    this._subscriptions.unsubscribe();
  }

  /**
   * Open a modal to start publish process by providing publish details (name, desc, tags)
   *
   * @param itemId ID of the item being published (symbolId, codeComponentId, or projectId)
   * @param itemName Name of the item being published
   * @param publishType type of publish (symbol, template, code component)
   * @param publishId Current publish id of item (if already published)
   */
  public openPublishModal(
    itemId: string,
    itemName: string,
    publishType: cd.PublishType,
    publishId?: cd.IPublishId
  ) {
    const { _publishEntries } = this;
    const componentRef = this.showModal<PublishDetailsModalComponent>(PublishDetailsModalComponent);
    componentRef.instance.id = itemId;
    componentRef.instance.name = itemName;
    componentRef.instance.type = publishType;
    componentRef.instance.currentPublishId = publishId;
    componentRef.instance.publishEntry = publishId ? _publishEntries[publishId.entryId] : undefined;
    componentRef.instance.publish.subscribe(this.onPublish);
  }

  public openPublishSymbolModal(symbolId: string) {
    const props = this._propertiesService.getPropertiesForId(symbolId) as cd.ISymbolProperties;
    if (!props) return;
    const { name, publishId } = props;
    this.openPublishModal(symbolId, name, cd.PublishType.Symbol, publishId);
  }

  public openPublishCodeComponentModal(codeComponentId: string) {
    const codeCmp = this._propertiesService.getCodeComponentForId(codeComponentId);
    if (!codeCmp) return;
    const { title, publishId } = codeCmp;
    this.openPublishModal(codeComponentId, title, cd.PublishType.CodeComponent, publishId);
  }

  public openPublishTemplateModal() {
    const { _project } = this;
    if (!_project) return;
    const { id, name, publishId } = _project;
    this.openPublishModal(id, name, cd.PublishType.Template, publishId);
  }

  private _onUserSubscription = (user?: cd.IUser) => (this._user = user);

  private _onProjectSubscription = (project?: cd.IProject) => (this._project = project);

  private _onPublishEntriesSubscription = (publishEntries: Dictionary<cd.IPublishEntry>) => {
    this._publishEntries = publishEntries;
  };

  public onPublish = (details: cd.IPublishDetails) => {
    const { _user, _project } = this;
    const { id, type, name } = details;
    if (!_user || !_project) return;
    this.closeModal();
    this._showLoadingToast(`Publishing ${name}`);
    this._logAnalyticsEvent(type);

    this._publish(details).subscribe((result) => {
      if (!result) {
        return this._showCompletionToast('Publish failed', 'error_outline');
      }

      // If publish was successful, sync local name of component with published name
      if (type === cd.PublishType.Symbol) this._syncSymbolName(id, name);
      if (type === cd.PublishType.CodeComponent) this._syncCodeComponentName(id, name);

      this._projectStore.dispatch(new PublishResult(result));
      this._showCompletionToast('Publish successful', 'check_circle');
    });
  };

  private _logAnalyticsEvent = (type: cd.PublishType) => {
    const { _analyticsService } = this;

    // prettier-ignore
    switch (type) {
      case cd.PublishType.Template:       return _analyticsService.logEvent(AnalyticsEvent.ProjectTemplatePublish);
      case cd.PublishType.Symbol:         return _analyticsService.logEvent(AnalyticsEvent.ComponentPublish);
      case cd.PublishType.CodeComponent:  return _analyticsService.logEvent(AnalyticsEvent.CodeComponentPublish);
    }
  };

  private _showLoadingToast = (message: string) => {
    this._hideToast();
    this._currentToastId = this._toastService.addToast({ message, showLoader: true });
  };

  private _showCompletionToast = (message: string, iconName: string) => {
    this._hideToast();
    this._toastService.addToast({ message, iconName });
  };

  private _hideToast = () => {
    return this._currentToastId && this._toastService.removeToast(this._currentToastId);
  };

  // if the user changed the name of symbol in publish modal, rename locally also
  private _syncSymbolName = (symbolId: string, name: string) => {
    const props = this._propertiesService.getPropertiesForId(symbolId) as cd.ISymbolProperties;
    if (name === props.name) return;
    const update: cd.IPropertiesUpdatePayload = { elementId: symbolId, properties: { name } };
    this._projectStore.dispatch(new ElementPropertiesUpdate([update], false));
  };

  // if the user changed the name of code component in publish modal, rename locally also
  private _syncCodeComponentName = (codeComponentId: string, title: string) => {
    const codeComponent = this._propertiesService.getCodeComponentForId(codeComponentId);
    if (!codeComponent || title === codeComponent.title) return;
    this._projectStore.dispatch(new CodeComponentUpdate(codeComponentId, { title }));
  };

  /**
   * This function is used for publishing a template, symbol, or code component.
   * It will duplicate the project, filter it to only the symbol or code component (if needed),
   * create a publish entry, and write all new documents to the database
   */
  private _publish = (details: cd.IPublishDetails): Observable<cd.IPublishResult | undefined> => {
    const { id, type, name, description, tags, currentPublishId } = details;
    const { _user, _project, _publishEntries } = this;
    if (!_user || !_project) return of(undefined);

    const symbolId = type === cd.PublishType.Symbol ? id : undefined;
    const codeCmpId = type === cd.PublishType.CodeComponent ? id : undefined;

    return this._duplicateService
      .createProjectDuplicates(_project, _user, symbolId, codeCmpId)
      .pipe(
        switchMap((duplicate) => {
          const { project, contents, idMap } = duplicate;
          const userId = convertUserToUserIdentity(_user);

          // if this item has already been published, we need to get existing publish entry and create a new version
          // otherwise, we need to create a new publish entry and create the first version for it
          const currentPublishEntry = currentPublishId && _publishEntries[currentPublishId.entryId];
          const publishEntry = currentPublishEntry
            ? updatePublishEntry(currentPublishEntry, name, description, tags)
            : createPublishEntry(type, userId, name, description, tags);

          const publishedSymbolId = symbolId && idMap.get(symbolId);
          const publishedCodeComponentId = codeCmpId && idMap.get(codeCmpId);
          const versionName = `Version ${publishEntry.versions.length + 1}`;
          const newVersion = createVersionMetadata(
            project.id,
            versionName,
            publishedSymbolId,
            publishedCodeComponentId
          );

          // latest version is always stored at first position in array
          publishEntry.versions.unshift(newVersion);

          // update time of publish entry is creation time of newest version
          publishEntry.updatedAt = newVersion.createdAt;

          // Create a publish id that points to this new entry / version
          const publishId: cd.IPublishId = { entryId: publishEntry.id, versionId: newVersion.id };

          // If code component was published, set publishId and published name
          if (publishedCodeComponentId) {
            const publishedCmp = contents.find(
              (d) => d.id === publishedCodeComponentId
            ) as cd.ICodeComponentDocument;

            publishedCmp.title = name;
            publishedCmp.publishId = publishId;
          }
          // If symbol was published, set published name and publishId
          else if (publishedSymbolId) {
            const publishedSymbol = contents.find(
              (d) => d.id === publishedSymbolId
            ) as cd.ISymbolProperties;

            publishedSymbol.name = name;
            publishedSymbol.publishId = publishId;
          }
          // If template was published, remove publishId
          // when a new project is created from a template, it should not retain a link to this
          // publish entry. Rather, it should be a new standalone project.
          // publishId is deleted to remove this link.
          else if (type === cd.PublishType.Template) {
            delete project.publishId;
          }

          // Update properties on duplicated project
          project.name = name; // use publish name name not 'Copy of xyz'
          project.type = type;
          project.tags = tags;

          // Write duplicated project to the database
          const writeDupProject$ = this._databaseService.writeProjectAndContents(project, contents);

          // // write new publish entry to database
          const writeEntry$ = this._databaseChangesService.createPublishEntry(publishEntry);

          const result: cd.IPublishResult = { id, type, publishId, publishEntry };
          return forkJoin([of(result), writeDupProject$, writeEntry$]);
        }),
        map(([publishResult]) => publishResult),
        catchError((err) => {
          this._analyticsService.sendError(err);
          return of(undefined);
        })
      );
  };
}
