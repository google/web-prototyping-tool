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
  OnDestroy,
  OnInit,
  ChangeDetectorRef,
} from '@angular/core';
import { ICommentsState } from 'src/app/routes/project/store/reducers/comment-threads.reducer';
import { PreviewInteractionService } from '../../services/preview-interaction.service';
import { getCommentRectLabels } from '../preview-canvas/preview-canvas.utils';
import { Store } from '@ngrx/store';
import * as utils from './comments.utils';
import * as projectStoreModule from '../../../../store';
import * as cd from 'cd-interfaces';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-preview-comments',
  templateUrl: './preview-comments.component.html',
  styleUrls: ['./preview-comments.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PreviewCommentsComponent implements OnInit, OnDestroy {
  private _subscription = Subscription.EMPTY;
  private _commentState?: ICommentsState;
  private _currentBoardId?: string;
  public commentThreads: cd.ICommentThread[] = [];
  /** When an element is attached to a comment, this is a map which shows the assigned number value */
  public taggedElementLabelMap = new Map<string, number>();
  public resolvedThreadCount = 0;
  public selectionActive = false;

  @Input() user?: cd.IUser;
  @Input() currentlySelectedElement = '';
  @Input()
  set currentBoardId(value: string | undefined) {
    this._currentBoardId = value;
    this.updateCommentThreads();
  }
  get currentBoardId(): string | undefined {
    return this._currentBoardId;
  }

  @Input()
  set commentState(value: ICommentsState) {
    this._commentState = value;
    this.updateCommentThreads();
  }

  constructor(
    private _cdRef: ChangeDetectorRef,
    private _projectStore: Store<projectStoreModule.IProjectState>,
    private _interactionService: PreviewInteractionService
  ) {}

  ngOnDestroy() {
    this._subscription.unsubscribe();
  }

  ngOnInit() {
    const { selectionActive$ } = this._interactionService;
    this._subscription = selectionActive$.subscribe(this.onSelectionActive);
  }

  onSelectionActive = (active: boolean) => {
    this.selectionActive = active;
    this._cdRef.markForCheck();
  };

  private _reopenThread(id: string) {
    const commentThreadDocument: Partial<cd.ICommentThreadDocument> = { resolved: false };
    const action = new projectStoreModule.CommentThreadUpdate(id, commentThreadDocument);
    this._projectStore.dispatch(action);
  }

  updateCommentThreads() {
    const { _commentState, currentBoardId } = this;
    if (!currentBoardId || !_commentState) return;
    const filteredAndSortedThreads = utils.filterCommentThreadsByBoardId(
      currentBoardId,
      _commentState
    );
    const { commentsMap, comments } = _commentState;
    this.commentThreads = filteredAndSortedThreads;
    this.taggedElementLabelMap = getCommentRectLabels(
      filteredAndSortedThreads,
      commentsMap,
      comments
    );
    this.resolvedThreadCount = utils.getNumberOfResolvedThreads(this.commentThreads);
  }

  onCreateComment({ body, threadId }: Partial<cd.IComment>) {
    if (!body || !threadId) return;

    this._projectStore.dispatch(new projectStoreModule.CommentCreate(body, threadId));
    this._reopenThread(threadId);
  }

  onCreateCommentThread(thread: cd.INewCommentThread) {
    // Add firebase timestamp
    const { currentBoardId } = this;
    if (!currentBoardId) return;
    const { id, body } = thread;
    const action = new projectStoreModule.CommentThreadCreate(body, currentBoardId, id);
    this._projectStore.dispatch(action);
    this._interactionService.setSelectionActive(false);
  }

  onDeleteComment(id: string) {
    if (!id) return;
    this._projectStore.dispatch(new projectStoreModule.CommentDelete(id));
  }

  onResolveThread(id: string) {
    const commentThreadDocument: Partial<cd.ICommentThreadDocument> = { resolved: true };
    const action = new projectStoreModule.CommentThreadUpdate(id, commentThreadDocument);
    this._projectStore.dispatch(action);
    this._interactionService.clearHoveredCommentThreadId();
  }

  onReopenThread(id: string) {
    this._reopenThread(id);
  }

  onUpdateComment(comment: Partial<cd.IComment>) {
    if (!comment.id) return;
    this._projectStore.dispatch(new projectStoreModule.CommentUpdate(comment.id, comment));
  }
}
