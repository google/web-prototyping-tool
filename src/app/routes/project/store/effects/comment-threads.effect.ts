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

import { DocumentChangeAction } from '@angular/fire/firestore';
import { getCommentsState, getComments, getCommentThreads } from '../selectors';
import { IAppState, getRouterState } from 'src/app/store';
import * as cd from 'cd-interfaces';
import { Injectable } from '@angular/core';
import { IProjectState } from '../reducers';
import { ofType, Actions, createEffect } from '@ngrx/effects';
import { select, Store } from '@ngrx/store';
import { withLatestFrom, switchMap, map, filter } from 'rxjs/operators';
import { typeForEntity } from 'src/app/database/path.utils';
import { withUser } from '../../../../utils/store.utils';
import * as commentActions from '../actions/comment-threads.action';
import { calculateCommentCounts, sortComments } from '../../utils/comments.utils';
import { PROJECT_CONTENT_QUERY_SUCCESS } from '../actions';
import { PROJECT_ID_ROUTE_PARAM } from 'src/app/configs/routes.config';
import { of } from 'rxjs';
import { dbContentTypeToActionMap } from '../../configs/project.config';
import { DatabaseService } from 'src/app/database/database.service';
import { createId } from 'cd-utils/guid';
import { DatabaseChangesService } from 'src/app/database/changes/database-change.service';
import { createChangeMarker } from 'cd-common/utils';
import { ProjectContentService } from 'src/app/database/changes/project-content.service';

@Injectable()
export class CommentThreadsEffects {
  constructor(
    private actions$: Actions,
    private projectStore: Store<IProjectState>,
    private appStore: Store<IAppState>,
    private _databaseService: DatabaseService,
    private _databaseChangesService: DatabaseChangesService,
    private _projectContentService: ProjectContentService
  ) {}

  /*
   * Subscribe to all project comments
   */

  queryComments$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PROJECT_CONTENT_QUERY_SUCCESS),
      withLatestFrom(this.appStore.pipe(select(getRouterState))),
      switchMap(([, router]) => {
        const projectId = router.state.params[PROJECT_ID_ROUTE_PARAM];
        return projectId ? this._databaseService.subscribeToProjectComments(projectId) : of([]);
      }),
      switchMap((databaseActions) => {
        const storeActions = databaseActions.map((action) => {
          const { type: entityType, payload } = action as DocumentChangeAction<{}>;
          const docData = payload.doc.data() as cd.IProjectContentDocument;

          // determine if comment or comment thread
          const entity = dbContentTypeToActionMap[docData.type];
          const type = typeForEntity(entity, entityType, true);
          return { type, payload: { ...docData } };
        });
        return storeActions;
      })
    )
  );

  createCommentThread$ = createEffect(() =>
    this.actions$.pipe(
      ofType<commentActions.CommentThreadCreate>(commentActions.COMMENT_THREAD_CREATE),
      withLatestFrom(this._projectContentService.project$),
      filter(([, proj]) => proj !== undefined),
      withUser(this.appStore),
      switchMap(([[action, project], user]) => {
        if (project && user) {
          const { id: projectId } = project;
          const { body, targetId, elementTargetId } = action;
          const id = createId();
          const type: cd.EntityType = cd.EntityType.CommentThread;
          const resolved = false;
          const owner: cd.IUserIdentity = { id: user.id, email: user.email };
          const elementTargetPayload = elementTargetId ? { elementTargetId } : {};
          const changeMarker = createChangeMarker();
          const payload: cd.ICommentThreadDocument = {
            id,
            changeMarker,
            owner,
            type,
            targetId,
            resolved,
            projectId,
            ...elementTargetPayload,
          };
          return [
            new commentActions.CommentThreadCreateSuccess(payload),
            new commentActions.CommentCreate(body, id),
          ];
        }
        throw new Error('Adding comment thread without a project');
      })
    )
  );

  createComment$ = createEffect(() =>
    this.actions$.pipe(
      ofType<commentActions.CommentCreate>(commentActions.COMMENT_CREATE),
      withLatestFrom(this._projectContentService.project$),
      filter(([, proj]) => proj !== undefined),
      withUser(this.appStore),
      map(([[action, project], user]) => {
        if (project && user) {
          const { id: projectId } = project;
          const { body, threadId } = action;
          const id = createId();
          const createdAt = Date.now();
          const updatedAt = createdAt;
          const type: cd.EntityType = cd.EntityType.Comment;
          const owner: cd.IUserIdentity = {
            id: user.id,
            email: user.email,
          };
          const changeMarker = createChangeMarker();
          const payload = {
            id,
            changeMarker,
            projectId,
            owner,
            threadId,
            createdAt,
            updatedAt,
            type,
            body,
          };
          return new commentActions.CommentCreateSuccess(payload);
        }
        throw new Error('Adding comment without a project or user');
      })
    )
  );

  createCommentThreadInDB$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType<commentActions.CommentThreadCreateSuccess>(
          commentActions.COMMENT_THREAD_CREATE_SUCCESS
        ),
        map(({ payload }) => this._databaseChangesService.createCommentThread(payload))
      ),
    { dispatch: false }
  );

  createCommentInDB$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType<commentActions.CommentCreateSuccess>(commentActions.COMMENT_CREATE_SUCCESS),
        map(({ payload }) => this._databaseChangesService.createComment(payload))
      ),
    { dispatch: false }
  );

  deleteCommentInDB$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType<commentActions.CommentDeleteSuccess>(commentActions.COMMENT_DELETE_SUCCESS),
        map(({ payload }) => this._databaseChangesService.deleteComment(payload))
      ),
    { dispatch: false }
  );

  deleteCommentThreadInDB$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType<commentActions.CommentThreadDelete>(commentActions.COMMENT_THREAD_DELETE),
        map(({ payload }) => this._databaseChangesService.deleteCommentThread(payload))
      ),
    { dispatch: false }
  );

  deleteThreadCheck$ = createEffect(() =>
    this.actions$.pipe(
      ofType<commentActions.CommentDelete>(commentActions.COMMENT_DELETE),
      withLatestFrom(this.projectStore.pipe(select(getCommentsState))),
      switchMap(([action, commentsState]) => {
        const { id } = action;
        const { comments, commentsMap } = commentsState;
        const comment = comments.entities[id];
        if (!comment) return [];

        const nextActions = [];
        const { threadId } = comment;
        const threadComments = commentsMap.get(threadId) || [];
        const orderedComments = sortComments(threadComments, commentsState);
        const isOldestComment = comment.id === orderedComments[0];
        const isLastRemainingComment = threadComments.length === 1;

        if (isOldestComment || isLastRemainingComment) {
          // If the comment is the first or only comment then delete the thread
          const commentThread = commentsState.commentThreads.entities[threadId];
          if (commentThread)
            nextActions.push(new commentActions.CommentThreadDelete(commentThread));
        }

        if (isOldestComment) {
          // Delete all comments
          for (const commentId of threadComments) {
            const threadComment = comments.entities[commentId];
            if (threadComment) {
              nextActions.push(new commentActions.CommentDeleteSuccess(threadComment));
            }
          }
        } else {
          // Delete just this comment
          nextActions.push(new commentActions.CommentDeleteSuccess(comment));
        }

        return nextActions;
      })
    )
  );

  updateCommentInDB$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType<commentActions.CommentUpdate>(commentActions.COMMENT_UPDATE),
        withLatestFrom(this.projectStore.pipe(select(getComments))),
        map(([action, comments]) => {
          const { id } = action;
          const commentDoc = comments.entities[id];
          if (!commentDoc) return;
          return this._databaseChangesService.updateComment(commentDoc);
        })
      ),
    { dispatch: false }
  );

  updateCommentThreadInDB$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType<commentActions.CommentThreadUpdate>(commentActions.COMMENT_THREAD_UPDATE),
        withLatestFrom(this.projectStore.pipe(select(getCommentThreads))),
        map(([action, commentThreads]) => {
          const { id } = action;
          const commentThreadDoc = commentThreads.entities[id];
          if (!commentThreadDoc) return;
          return this._databaseChangesService.updateCommentThread(commentThreadDoc);
        })
      ),
    { dispatch: false }
  );

  updateCommentCounts$ = createEffect(() =>
    this.actions$.pipe(
      ofType(
        commentActions.COMMENT_CREATE,
        commentActions.COMMENT_DELETE,
        commentActions.COMMENT_REMOTE_ADDED,
        commentActions.COMMENT_REMOTE_REMOVED,
        commentActions.COMMENT_THREAD_REMOTE_ADDED,
        commentActions.COMMENT_THREAD_REMOTE_REMOVED
      ),
      withLatestFrom(this.projectStore.pipe(select(getCommentsState))),
      map(([, commentsState]) => {
        const newCommentCounts = calculateCommentCounts(commentsState);
        return new commentActions.CommentSetCounts(newCommentCounts);
      })
    )
  );
}
