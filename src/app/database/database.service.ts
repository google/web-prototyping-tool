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

import { BatchChunker } from './batch-chunker.class';
import {
  FirebaseCollection,
  FirebaseCollectionType,
  FirebaseField,
  FirebaseQueryOperation,
} from 'cd-common/consts';
import { map, first, takeUntil, switchMap, retry, filter, take } from 'rxjs/operators';
import { BatchQueue, detectUndefinedObjects, RETRY_ATTEMPTS } from './database.utils';
import { Observable, Subject, from, fromEvent } from 'rxjs';
import { environment } from 'src/environments/environment';
import firebase from 'firebase/app';
import { Injectable } from '@angular/core';
import * as dbPathUtils from './path.utils';
import * as firestore from '@angular/fire/firestore';
import * as cd from 'cd-interfaces';

/**
 * Handles the most common database operations for the app. This service is
 * used by most other services for base database access.
 */
@Injectable({
  providedIn: 'root',
})
export class DatabaseService {
  public batchQueue = new BatchQueue();
  private _disconnectProject$ = new Subject<void>();

  static getTimestamp(): firebase.firestore.Timestamp {
    return firebase.firestore.Timestamp.now();
  }

  constructor(private _afs: firestore.AngularFirestore) {
    fromEvent<BeforeUnloadEvent>(window, 'beforeunload')
      .pipe(filter(() => this.batchQueue.active))
      .subscribe(this.handleBeforeUnload);
  }

  /**
   * Shows a native alert preventing tab / window close
   * only when there are pending batch writes
   */
  handleBeforeUnload = (e: BeforeUnloadEvent) => {
    e.preventDefault();
    e.returnValue = '';
  };

  setDocument(path: string, payload: cd.CdDatabaseDocument) {
    return this._afs.doc(path).set(payload);
  }

  updateDocument(path: string, payload: Partial<cd.CdDatabaseDocument>) {
    return this._afs.doc(path).update(payload);
  }

  deleteDocument(path: string): Promise<void> {
    return this._afs.doc(path).delete();
  }

  getDocument(path: string): Observable<firebase.firestore.DocumentSnapshot<unknown>> {
    return this._afs.doc(path).get().pipe(retry(RETRY_ATTEMPTS), first());
  }

  getDocumentData<T>(path: string): Observable<T | undefined> {
    return this.getDocument(path).pipe(map((doc) => doc.data() as T));
  }

  getCollection<T>(
    collection: FirebaseCollectionType,
    queryFn?: firestore.QueryFn
  ): Observable<T[]> {
    return this._afs
      .collection(collection, queryFn)
      .snapshotChanges()
      .pipe(
        retry(RETRY_ATTEMPTS),
        first(), // Auto unsubscribe
        map((actions) => actions.map((a) => a.payload.doc.data() as T))
      );
  }

  getProjectContents(projectId: string): Observable<cd.IProjectContentDocument[]> {
    return this._afs
      .collection(FirebaseCollection.ProjectContents, (ref) =>
        ref.where(FirebaseField.ProjectId, FirebaseQueryOperation.Equals, projectId)
      )
      .get()
      .pipe(
        retry(RETRY_ATTEMPTS),
        first(), // Auto unsubscribe
        map((snapshot) => snapshot.docs.map((doc) => doc.data() as cd.IProjectContentDocument))
      );
  }

  getProjectBoards = (project: cd.IProject, limit?: number): Observable<cd.IBoardProperties[]> => {
    const projectContentsRef = this._afs.collection(FirebaseCollection.ProjectContents).ref;
    const boardsQuery = projectContentsRef
      .where(FirebaseField.ProjectId, FirebaseQueryOperation.Equals, project.id)
      .where(
        FirebaseField.ElementType,
        FirebaseQueryOperation.Equals,
        cd.ElementEntitySubType.Board
      );
    const queryWithLimit = limit ? boardsQuery.limit(limit) : boardsQuery;
    const snapshot$ = from(queryWithLimit.get());
    const boards$ = snapshot$.pipe(
      map((snapshot) => {
        return snapshot.docs.map((d) => d.data() as cd.IBoardProperties);
      }),
      take(1)
    );

    return boards$;
  };

  writeProjectAndContents = (project: cd.IProject, contents: cd.IProjectContentDocument[]) => {
    const projectPath = dbPathUtils.projectPathForId(project.id);
    const writeProject$ = from(this.setDocument(projectPath, project));
    const contentBatch: cd.WriteBatchPayload = new Map();
    contentBatch.set(projectPath, project);

    for (const model of contents) {
      const docPath = dbPathUtils.projectContentsPathForId(model.id);
      contentBatch.set(docPath, model as cd.CdDatabaseDocument);
    }

    // Need to write project document before writing content docs so that we adhere to firestore
    // rules. I.e. Must be owner of existing project doc in order to set contents.
    return writeProject$.pipe(switchMap(() => this.batchChanges(contentBatch)));
  };

  subscribeToProjectComments(
    projectId: string
  ): Observable<firestore.DocumentChangeAction<unknown>[]> {
    const projectComments$ = this._afs
      .collection(FirebaseCollection.Comments, (ref) =>
        ref.where(FirebaseField.ProjectId, FirebaseQueryOperation.Equals, projectId)
      )
      .stateChanges()
      .pipe(takeUntil(this._disconnectProject$));

    return projectComments$;
  }

  subscribeToDocument<T>(path: string): Observable<T | undefined> {
    return this._afs.doc<T>(path).valueChanges();
  }

  unsubscribeProject() {
    this._disconnectProject$.next();
  }

  /**
   * @param writes Map from path to document to payload to be written to that document
   * @param deletes Set of strings that each represent the path to a document. E.g. project_contents/id
   */
  batchChanges(writes?: cd.WriteBatchPayload, deletes?: Set<string>): Promise<void> {
    const batchChunker = new BatchChunker(this._afs);
    this.batchQueue.add(batchChunker.id);

    if (writes) {
      const writeEntries = writes.entries();

      for (const [path, payload] of writeEntries) {
        const ref = this._getDocRef(path);
        batchChunker.set(ref, payload);
        this.checkForUndefinedPayload(payload); // only used in local development
      }
    }

    if (deletes) {
      for (const path of deletes) {
        const ref = this._getDocRef(path);
        batchChunker.delete(ref);
      }
    }

    return batchChunker
      .commit()
      .catch((err) => {
        const errMsg = 'Batch Write Error';
        if (!environment.production) {
          console.error(errMsg, err);
          console.log({ writes, deletes });
        } else {
          console.warn(errMsg, err);
        }
      })
      .finally(() => this.batchQueue.remove(batchChunker.id));
  }

  writeAnalyticsEvent = (exceptionEntry: cd.IExceptionEvent) => {
    const entryPath = dbPathUtils.exceptionsPathForId(exceptionEntry.id);
    return this.setDocument(entryPath, exceptionEntry);
  };

  checkIfAdminUser = (user: cd.IUser): Observable<boolean> => {
    const path = dbPathUtils.adminsPathForId(user.id);
    const adminDocRef = this._afs.doc(path);
    return adminDocRef.get().pipe(map((snapshot) => snapshot.exists));
  };

  /**
   * Firestore cannot write undefined values, when running locally this
   * will check for undefined values, and throw an error if found.
   */
  private checkForUndefinedPayload(payload: {}) {
    if (environment.production) return;
    const hasUndefined = detectUndefinedObjects(payload);
    if (!hasUndefined) return;
    const id = (payload as any)?.id;
    // If this is caused by an action (interaction), ignore it
    console.warn(`Batch Write: Undefined in ${id} - ${JSON.stringify(payload)}`);
  }

  private _getDocRef = (path: string) => this._afs.doc<cd.CdDatabaseDocument>(path).ref;
}
