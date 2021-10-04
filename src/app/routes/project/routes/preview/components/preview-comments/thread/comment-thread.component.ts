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
  Input,
  ChangeDetectionStrategy,
  EventEmitter,
  Output,
  HostListener,
  OnDestroy,
} from '@angular/core';
import { AnalyticsService } from 'src/app/services/analytics/analytics.service';
import { PreviewInteractionService } from '../../../services/preview-interaction.service';
import { AnalyticsEvent } from 'cd-common/analytics';
import * as cd from 'cd-interfaces';

@Component({
  selector: 'app-comment-thread',
  templateUrl: './comment-thread.component.html',
  styleUrls: ['./comment-thread.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommentThreadComponent implements OnDestroy {
  public taggedItems: cd.IStringMap<cd.IUser> = {};

  @Input() comments?: cd.IComment[];
  @Input() highlightLabel?: number;
  @Input() newThreadComment = false;
  @Input() resolved = false;
  @Input() selectingElement = false;
  @Input() threadId?: string;
  @Input() user?: cd.IUser;

  @Output() createComment = new EventEmitter<Partial<cd.IComment>>();
  @Output() createCommentThread = new EventEmitter<cd.INewCommentThread>();
  @Output() deleteComment = new EventEmitter<string>();
  @Output() editComment = new EventEmitter<boolean>();
  @Output() reopenThread = new EventEmitter<string>();
  @Output() resolveThread = new EventEmitter<string>();
  @Output() updateComment = new EventEmitter<Partial<cd.IComment>>();

  @HostListener('mouseenter')
  onMouseEnter() {
    if (!this.threadId || this.highlightLabel === undefined) return;
    this._interactionService.setHoveredCommentThreadId(this.threadId);
  }

  @HostListener('mouseleave')
  onMouseLeave() {
    this._interactionService.clearHoveredCommentThreadId();
  }

  constructor(
    private _analyticsService: AnalyticsService,
    private _interactionService: PreviewInteractionService
  ) {}

  ngOnDestroy() {
    this._interactionService.clearHoveredCommentThreadId();
  }

  onTaggedItemsChange(event: cd.IStringMap<cd.IUser>) {
    this.taggedItems = event;
  }

  trackFn(_index: number, comment: cd.IComment) {
    return comment.id;
  }

  editableComment(id: string): boolean {
    return (this.user && id === this.user.id) || false;
  }

  onDeleteComment(id: string) {
    this.deleteComment.emit(id);
  }

  onCreateComment(body: Array<cd.ITaggableTextFieldNode>): void {
    const { threadId, comments } = this;
    const comment: Partial<cd.IComment> = { body, threadId };
    const itemsList = Object.values(this.taggedItems);

    for (const tag of itemsList) {
      this._analyticsService.logEvent(AnalyticsEvent.CommentTag, { items: [tag] });
    }

    if (comments && comments.length > 1) {
      this._analyticsService.logEvent(AnalyticsEvent.CommentReply);
    }

    this.createComment.emit(comment);
  }

  onReopenThread() {
    this.reopenThread.emit(this.threadId);
  }

  onResolveThread() {
    this.resolveThread.emit(this.threadId);
  }

  onUpdateComment(body: Array<cd.ITaggableTextFieldNode>, id: string): void {
    const comment: Partial<cd.IComment> = { body, id };
    this.updateComment.emit(comment);
  }

  onEditComment(editing: boolean) {
    this.editComment.emit(editing);
  }
}
