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

import { Component, Input, ChangeDetectionStrategy, Output, EventEmitter } from '@angular/core';
import { PreviewInteractionService } from '../../services/preview-interaction.service';
import { AnalyticsService } from 'src/app/services/analytics/analytics.service';
import { AnalyticsEvent } from 'cd-common/analytics';
import * as cd from 'cd-interfaces';

@Component({
  selector: 'app-comments-panel',
  templateUrl: './comments-panel.component.html',
  styleUrls: ['./comments-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommentsPanelComponent {
  public showResolved = false;
  public taggedItems: cd.IStringMap<cd.IUser> = {};

  @Input() commentThreads: cd.ICommentThread[] = [];
  @Input() taggedElementLabelMap = new Map<string, number>();
  @Input() currentBoardId: string | undefined;
  @Input() resolvedThreadCount = 0;
  @Input() user?: cd.IUser;
  @Input() currentlySelectedElement = '';
  @Input() selectionActive = false;

  @Output() createComment = new EventEmitter<Partial<cd.IComment>>();
  @Output() createCommentThread = new EventEmitter<cd.INewCommentThread>();
  @Output() deleteComment = new EventEmitter<string>();
  @Output() reopenThread = new EventEmitter<string>();
  @Output() resolveThread = new EventEmitter<string>();
  @Output() updateComment = new EventEmitter<Partial<cd.IComment>>();

  constructor(
    private _analyticsService: AnalyticsService,
    private _interactionService: PreviewInteractionService
  ) {}

  private _createCommentThread(body: Array<cd.ITaggableTextFieldNode>) {
    const commentThread: cd.INewCommentThread = { body };
    const { currentlySelectedElement } = this;
    if (currentlySelectedElement) {
      commentThread.id = currentlySelectedElement;
      // Clear selected element from URL params & state
      this._interactionService.setSelectedElementId();
    }
    return commentThread;
  }

  trackFn(_index: number, commentThread: cd.ICommentThread) {
    return commentThread.id;
  }

  onCreateComment(commentDocument: Partial<cd.ICommentDocument>): void {
    this.createComment.emit(commentDocument);
  }

  onCreateCommentThread(commentBody: Array<cd.ITaggableTextFieldNode>): void {
    const commentThread = this._createCommentThread(commentBody);
    const itemsList = Object.values(this.taggedItems);

    for (const tag of itemsList) {
      this._analyticsService.logEvent(AnalyticsEvent.CommentTag, { items: [tag] });
    }

    this.createCommentThread.emit(commentThread);
  }

  onDeleteComment(id: string): void {
    this.deleteComment.emit(id);
  }

  onShowResolvedChange(showResolved: boolean) {
    this.showResolved = showResolved;
  }

  onUpdateComment(comment: Partial<cd.IComment>): void {
    this.updateComment.emit(comment);
  }

  onReopenThread(id: string): void {
    this.reopenThread.emit(id);
  }

  onResolveThread(id: string): void {
    this.resolveThread.emit(id);
  }

  onTaggedItemsChange(event: cd.IStringMap<cd.IUser>) {
    this.taggedItems = event;
  }

  onToggleElementSelectionMode(selectingElement: boolean) {
    this._interactionService.setSelectionActive(selectingElement);
  }
}
