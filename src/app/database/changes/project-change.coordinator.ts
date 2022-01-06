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
import * as firestore from '@angular/fire/firestore';
import { Injectable, NgZone } from '@angular/core';
import { Observable, of, Subject, Subscription, asyncScheduler } from 'rxjs';
import { projectContentsPathForId, projectPathForId } from '../path.utils';
import { FirebaseCollection, FirebaseField, FirebaseQueryOperation } from 'cd-common/consts';
import {
  applyChangeToElementContent,
  applyChangeToContent,
  createChangeRequest,
  filterProcessedDatabaseChanges,
  getDatabaseChangePayload,
  payloadIsDefined,
  applyChangeToProject,
  changeMarkerIsOlder,
  getChangeMarkerIdsFromContent,
  calcDeletesFromRemote,
  shouldAcceptIncomingChange,
} from 'cd-common/utils';
import { getUser } from 'src/app/store/selectors';
import { IAppState } from 'src/app/store/reducers';
import { select, Store } from '@ngrx/store';
import { convertUserToUserIdentity } from 'src/app/utils/user.utils';
import { BatchChunker } from '../batch-chunker.class';
import { ProjectContentService } from './project-content.service';
import { bufferTime, filter, map, observeOn, take } from 'rxjs/operators';
import { enterZone, exitZone } from 'src/app/utils/zone.utils';
import { UndoRedoService } from './undo-redo.service';
import { Theme } from 'cd-themes';
import { createNewProjectPayload } from './project-create.utils';
import { constructProjectPath } from 'src/app/utils/route.utils';
import { AppGo } from 'src/app/store/actions';
import { offlineWorker } from '../workers';
import { getLocalDataForProject, isRemoteDataNewerThanLocalData } from '../workers/offline.utils';
import { PresenceService } from 'src/app/services/presence/presence.service';
import { RtcService } from 'src/app/services/rtc/rtc.service';
import { RtcMessageChangeRequest } from 'src/app/services/rtc/rtc.messages';

const REMOTE_DATABASE_BUFFER_TIME = 1000;
const LOCAL_DATABASE_BUFFER_TIME = 50;

// TODO: enable once we have a working approach for how to sync local vs remote databases
const LOCAL_DATABASE_DISABLED = true;

/**
 * This class coordinates all changes to a project between multiple editors and to the remote and
 * local database
 */
@Injectable({
  providedIn: 'root',
})
export class ProjectChangeCoordinator {
  private _processedChangeIds = new Set<string>();
  private _openProjectId?: string;
  private _user?: cd.IUserIdentity;
  private _isProjectEditor = false;
  private _subscriptions = new Subscription();
  private _querySubscriptions = new Subscription();
  private _userSubscription = new Subscription();
  private _remoteDatabaseWriteRequest$ = new Subject<cd.IChangeRequest>();
  private _localDatabaseWriteRequest$ = new Subject<cd.IProjectContent>();
  private _receivedContentFromRemote = false;

  public undoRedoChangeProcessed$ = new Subject<cd.ElementContent>();

  constructor(
    private afs: firestore.AngularFirestore,
    private store: Store<IAppState>,
    private zone: NgZone,
    private projectContentService: ProjectContentService,
    private undoRedoService: UndoRedoService,
    private presenceService: PresenceService,
    private rtcService: RtcService
  ) {
    const user$ = this.store.pipe(select(getUser));
    this._userSubscription.add(user$.subscribe(this.onUserSubscription));

    // Setup buffered writes to both the remote and local databases
    const { _remoteDatabaseWriteRequest$, _localDatabaseWriteRequest$ } = this;

    const remoteDatabaseWrites$ = _remoteDatabaseWriteRequest$.pipe(
      // Run the buffer outside angular's change detection
      bufferTime(REMOTE_DATABASE_BUFFER_TIME, exitZone(this.zone, asyncScheduler)),
      filter((changes: cd.IChangeRequest[]) => changes.length > 0),
      observeOn(enterZone(this.zone, asyncScheduler))
      // Re-enter Angular's zone);
    );

    const localDatabaseWrite$ = _localDatabaseWriteRequest$.pipe(
      // Run the buffer outside angular's change detection
      bufferTime(LOCAL_DATABASE_BUFFER_TIME, exitZone(this.zone, asyncScheduler)),
      filter((content: cd.IProjectContent[]) => content.length > 0),
      observeOn(enterZone(this.zone, asyncScheduler))
      // Re-enter Angular's zone);
    );

    this._subscriptions.add(remoteDatabaseWrites$.subscribe(this.writeChangeRequestsToRemoteQueue));
    this._subscriptions.add(localDatabaseWrite$.subscribe(this.writeChangeRequestsToLocalDb));

    // Subscribe to changes the are emitted from the undo/redo service
    this.undoRedoService.undoRedoChangeRequest$.subscribe(this.handleUndoRedoChangeRequest);

    // Subscribe to change requests sent over Rtc connections from peers
    this.rtcService.peerChangeRequest$.subscribe(this.handleChangeMessageFromPeer);

    // Track whether the current user is an editor of the currently open project
    this.projectContentService.currentUserIsProjectEditor$.subscribe(this.isEditorSubscription);
  }

  /** 
   * Steps:
    1. Create necessary project documents
    2. Load those documents into project content service
    3. Navigate to project editor / open project
    4. Write all new documents to database
   */
  async createAndOpenNewProject(themeId: Theme) {
    const { _user } = this;
    if (!_user) return;

    const { project, changes } = createNewProjectPayload(_user, themeId);
    const changeRequest = createChangeRequest(_user, project.id, changes);

    this._openProjectId = project.id;
    this.projectContentService.project$.next(project);
    this.applyChangeRequestLocally(changeRequest);

    const projectRoutePath = constructProjectPath(project.id);
    this.store.dispatch(new AppGo({ path: [projectRoutePath] }));

    // Since this is a new project, write documents directly to database
    // rather than to the change request queue.
    // After write is successful, then setup subscription to future changes.
    await this.writeNewProjectToRemote(project, changeRequest);
    this.subscribeToProject(project.id);
  }

  /**
   * Load all project content from the database. Returns a boolean Observable indicating when the
   * project document has been loaded successfully
   */
  openProject(projectId: string): Observable<boolean> {
    const { _openProjectId } = this;
    if (_openProjectId === projectId) return of(true); // if project already open, return
    if (_openProjectId) this.closeProject(); // if a different project is open, close it

    // TODO: if project fails to load this should be reset (i.e. trying to open a non-existent project)
    this._openProjectId = projectId;

    return this.subscribeToProject(projectId);
  }

  closeProject() {
    this._querySubscriptions.unsubscribe();
    this._querySubscriptions = new Subscription();
    this._processedChangeIds = new Set<string>();
    this._openProjectId = undefined;
    this.projectContentService.resetContent();
    this.undoRedoService.resetStack();
    this.presenceService.removePresence();
  }

  /** Handle a change request that originated from current session */
  dispatchChangeRequest(payload: cd.ChangePayload[], undoable = true) {
    const { _openProjectId, _user, _isProjectEditor } = this;
    if (!_openProjectId || !_user || !_isProjectEditor) return;

    // TODO: investigate using server timestamp / diff with local clock
    const changeRequest = createChangeRequest(_user, _openProjectId, payload);

    // Important: Add undo/redo stack before applying locally so that diff can be computed
    if (undoable) this.undoRedoService.addChangeToStack(changeRequest);

    // Update local state with these changes
    this.applyChangeRequestLocally(changeRequest);

    // Sent change request to all peers over WebRTC
    this.rtcService.broadcastChangeRequestMessage(changeRequest);

    // Trigger writing both the remote database
    this._remoteDatabaseWriteRequest$.next(changeRequest);
  }

  private subscribeToProject = (projectId: string) => {
    // If available, load project data from local database for faster load time or for offline
    this.loadProjectFromLocalDatabase(projectId);

    // As part of subscribing to a project, mark presence as being in this project
    this.presenceService.markPresenceInProject(projectId);

    // Set flag that we have not loaded content from yet
    this._receivedContentFromRemote = false;

    const projectPath = projectPathForId(projectId);
    const project$ = this.afs.doc<cd.IProject>(projectPath).valueChanges();
    const projectContent$ = this.afs
      .collection<cd.IProjectContentDocument>(FirebaseCollection.ProjectContents, (ref) =>
        ref.where(FirebaseField.ProjectId, FirebaseQueryOperation.Equals, projectId)
      )
      .stateChanges();

    this._querySubscriptions.add(project$.subscribe(this.handleProjectChangeFromDatabase));
    this._querySubscriptions.add(
      projectContent$.subscribe(this.handleProjectContentChangeFromDatabase)
    );

    return project$.pipe(
      map((project) => !!project),
      take(1)
    );
  };

  private loadProjectFromLocalDatabase = async (projectId: string) => {
    if (LOCAL_DATABASE_DISABLED) return;

    const projectContent = await getLocalDataForProject(projectId);
    if (!projectContent) return;
    const project = this.projectContentService.project$.value;
    const {
      project: localProj,
      elementContent,
      assetContent,
      designSystemContent,
      codeCmpContent,
      datasetContent,
    } = projectContent;
    if (project && isRemoteDataNewerThanLocalData(project.updatedAt, localProj.updatedAt)) return;

    this.projectContentService.project$.next(localProj);
    this.projectContentService.elementContent$.next(elementContent);
    this.projectContentService.assetContent$.next(assetContent);
    this.projectContentService.designSystemContent$.next(designSystemContent);
    this.projectContentService.codeCmpContent$.next(codeCmpContent);
    this.projectContentService.datasetContent$.next(datasetContent);

    const changeMarkerIds = getChangeMarkerIdsFromContent(projectContent);
    this._processedChangeIds = new Set([...changeMarkerIds, ...this._processedChangeIds]);
  };

  private onUserSubscription = (user?: cd.IUser) => {
    this._user = user ? convertUserToUserIdentity(user) : undefined;
  };

  private isEditorSubscription = (isProjectEditor: boolean) => {
    this._isProjectEditor = isProjectEditor;
  };

  private handleUndoRedoChangeRequest = (changeRequest: cd.IChangeRequest) => {
    // Get value of elementContent before the undo/redo change is processed
    const priorElementContent = this.projectContentService.elementContent$.getValue();

    // Dispatch the payload of the change request and mark as not undoable
    this.dispatchChangeRequest(changeRequest.payload, false);

    // Signal that an undo/redo change request has been processed, and pass the element content
    // state prior to it being processed
    this.undoRedoChangeProcessed$.next(priorElementContent);
  };

  /** Handle incoming changes from Firestore subscription to project document */
  private handleProjectChangeFromDatabase = (project?: cd.IProject) => {
    if (!project) return this.closeProject(); // if project was deleted remotely close it

    // If we've already loaded this change, ignore it
    const { changeMarker } = project;
    if (changeMarker?.id && this._processedChangeIds.has(changeMarker.id)) return;

    // if this change is older than current change ignore it
    const currentProject = this.projectContentService.project$.value;
    const olderChange = changeMarkerIsOlder(changeMarker, currentProject?.changeMarker);
    if (olderChange) return;

    // Otherwise, accept the updated project document
    this.projectContentService.project$.next(project);
  };

  /** Handle incoming changes from Firestore subscription to project contents collection */
  private handleProjectContentChangeFromDatabase = (
    changes: firestore.DocumentChangeAction<cd.IProjectContentDocument>[]
  ) => {
    const deletions = this._receivedContentFromRemote ? this.calcDeletionChanges(changes) : [];
    this._receivedContentFromRemote = true;

    // TODO: also filter out any older change markers
    const unprocessedChanges = filterProcessedDatabaseChanges(changes, this._processedChangeIds);
    if (!unprocessedChanges.length && !deletions.length) return;

    const { Element, Asset, CodeComponent, Dataset, DesignSystem } = cd.EntityType;
    const elementChange = getDatabaseChangePayload(Element, unprocessedChanges);
    const dsChange = getDatabaseChangePayload(DesignSystem, unprocessedChanges);
    const assetChanges = getDatabaseChangePayload(Asset, unprocessedChanges);
    const codeCmpChanges = getDatabaseChangePayload(CodeComponent, unprocessedChanges);
    const datasetChanges = getDatabaseChangePayload(Dataset, unprocessedChanges);

    const payload = [elementChange, dsChange, assetChanges, codeCmpChanges, datasetChanges];
    const filteredPayload = payload.filter(payloadIsDefined);
    this.processChangeRequestPayload([...filteredPayload, ...deletions]);
  };

  private applyChangeRequestLocally(changeRequest: cd.IChangeRequest) {
    this.processChangeRequestPayload(changeRequest.payload);
    this.recordProcessedChange(changeRequest);

    // request writing updated content to local database
    const updatedContent = this.projectContentService.getCurrentContent();
    if (updatedContent) this._localDatabaseWriteRequest$.next(updatedContent);
  }

  private processChangeRequestPayload(payload: cd.ChangePayload[]) {
    const { Project, Element, DesignSystem, Asset, CodeComponent, Dataset } = cd.EntityType;

    // TODO: apply all changes within the payload before calling next of any of the
    // projectContentService behavior subjects
    for (const change of payload) {
      switch (change.type) {
        case Project:
          this.applyProjectChange(change);
          break;
        case Element:
          this.applyElementChange(change);
          break;
        case DesignSystem:
          this.applyDesignSystemChange(change);
          break;
        case Asset:
          this.applyAssetChange(change);
          break;
        case CodeComponent:
          this.applyCodeComponentChange(change);
          break;
        case Dataset:
          this.applyDatasetChange(change);
          break;
      }
    }
  }

  private applyProjectChange(projectChange: cd.IProjectChangePayload) {
    const { project$ } = this.projectContentService;
    if (!project$.value) return;
    const updatedProject = applyChangeToProject(projectChange, project$.value);
    project$.next(updatedProject);
  }

  private applyElementChange(elementChange: cd.IElementChangePayload) {
    const { elementContent$ } = this.projectContentService;
    const updatedContent = applyChangeToElementContent(elementChange, elementContent$.value);
    elementContent$.next(updatedContent);
  }

  private applyDesignSystemChange(dsChange: cd.IDesignSystemChangePayload) {
    const { designSystemContent$ } = this.projectContentService;
    const updatedContent = applyChangeToContent(dsChange, designSystemContent$.value);
    designSystemContent$.next(updatedContent);
  }

  private applyAssetChange(assetChange: cd.IAssetChangePayload) {
    const { assetContent$ } = this.projectContentService;
    const updatedContent = applyChangeToContent(assetChange, assetContent$.value);
    assetContent$.next(updatedContent);
  }

  private applyCodeComponentChange(codeCmpChange: cd.ICodeCmpChangePayload) {
    const { codeCmpContent$ } = this.projectContentService;
    const updatedContent = applyChangeToContent(codeCmpChange, codeCmpContent$.value);
    codeCmpContent$.next(updatedContent);
  }

  private applyDatasetChange(datasetChange: cd.IDatasetChangePayload) {
    const { datasetContent$ } = this.projectContentService;
    const updatedContent = applyChangeToContent(datasetChange, datasetContent$.value);
    datasetContent$.next(updatedContent);
  }

  /**
   * Write the change request to the change_request collection in Firestore to be processed
   */
  private writeChangeRequestsToRemoteQueue = (changeRequests: cd.IChangeRequest[]) => {
    for (const changeRequest of changeRequests) {
      const { payload, ...changeRequestDocContents } = changeRequest;
      const batch = new BatchChunker(this.afs);
      const changeRequestsCollection = this.afs.collection(FirebaseCollection.ChangeRequests);
      const changeRequestDoc = changeRequestsCollection.doc<cd.IChangeRequest>();

      // set contents of change request doc
      batch.set(changeRequestDoc.ref, changeRequestDocContents);

      // add each payload item to subcollection so that we can scale to any size payload
      const payloadSubCollection = changeRequestDoc.collection(FirebaseField.Payload);

      for (const payloadItem of payload) {
        const payloadDoc = payloadSubCollection.doc();
        const { sets, updates, deletes, ...payloadDocContents } = payloadItem;

        // set contents of payload doc
        batch.set(payloadDoc.ref, payloadDocContents);

        // Sets and updates are written to separate subcollections to provide scale. Deletes are
        // written as a simple string array to payload doc
        if (sets) {
          const setSubCollection = payloadDoc.collection(FirebaseField.Sets);
          for (const set of sets) {
            const setDoc = setSubCollection.doc();
            batch.set(setDoc.ref, set);
          }
        }
        if (updates) {
          const updateSubCollection = payloadDoc.collection(FirebaseField.Updates);
          for (const update of updates) {
            const updateDoc = updateSubCollection.doc();
            batch.set(updateDoc.ref, update);
          }
        }
        if (deletes) {
          batch.update(payloadDoc.ref, { deletes });
        }
      }

      // commit batch
      batch.commit();
    }
  };

  /**
   * Bypass change request queue, and write directly to project/project_contents collections
   */
  private writeNewProjectToRemote = async (
    project: cd.IProject,
    changeRequest: cd.IChangeRequest
  ) => {
    // Project has to be written first since Firestore rules for writing other project_content
    // documents depend on it existing
    const projectPath = projectPathForId(project.id);
    await this.afs.doc(projectPath).set(project);

    const batch = new BatchChunker(this.afs);
    const { payload } = changeRequest;
    for (const payloadItem of payload) {
      const { type, sets } = payloadItem;
      // Only sets are supported since this is for writing new project contents
      // Project was already written above, so we can ignore here
      if (!sets || type === cd.EntityType.Project) continue;

      for (const set of sets) {
        const path = projectContentsPathForId(set.id);
        const setDoc = this.afs.doc<cd.IBaseProjectDocument>(path);
        batch.set(setDoc.ref, set);
      }
    }

    return batch.commit();
  };

  /**
   * When we first load content from the remote database, it is possible that deletes have occured.
   * This function computes what deletes are necessary from the local database based off of what
   * ids are no longer present in the remote database
   */
  private calcDeletionChanges = (
    changes: firestore.DocumentChangeAction<cd.IProjectContentDocument>[]
  ): cd.ChangePayload[] => {
    if (LOCAL_DATABASE_DISABLED) return [];

    const currentContent = this.projectContentService.getCurrentContent();
    if (!currentContent) return [];
    return calcDeletesFromRemote(currentContent, changes);
  };

  /**
   * Send the project content to the Offline Web Worker which will write it to the IndexedDB
   */
  private writeChangeRequestsToLocalDb = (projectContent: cd.IProjectContent[]) => {
    if (LOCAL_DATABASE_DISABLED) return;

    // TODO: prevent writing blob urls to local DB. Old code:
    // filter((assets) => !assetsContainBlobUrls(assets))

    // always just send last item in buffer to be written
    offlineWorker.postMessage(projectContent.pop());
  };

  private recordProcessedChange(changeRequest: cd.IChangeRequest) {
    this._processedChangeIds.add(changeRequest.changeMarker.id);
  }

  private handleChangeMessageFromPeer = (changeMessage: RtcMessageChangeRequest) => {
    const { changeRequest } = changeMessage;
    const { projectId, changeMarker } = changeRequest;
    if (projectId !== this._openProjectId) return;

    // Ignore change if we've already seen it
    if (this._processedChangeIds.has(changeMarker.id)) {
      console.log(`Ignoring already processed change from peer ${changeMarker.id}`);
      return;
    }

    // Only accept a change request from peer if all of its changes are newer than current content
    const currentContent = this.projectContentService.getCurrentContent();
    if (!currentContent || !shouldAcceptIncomingChange(changeRequest, currentContent)) {
      console.log(`Ignoring outdated change from peer ${changeMarker.id}`);
      return;
    }

    this.applyChangeRequestLocally(changeRequest);
    this.recordProcessedChange(changeRequest);
  };
}
