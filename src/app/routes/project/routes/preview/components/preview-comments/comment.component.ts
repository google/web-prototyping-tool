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

import { Component, Input, ChangeDetectionStrategy, EventEmitter, Output } from '@angular/core';
import { commentBodyToHtml, getTaggedItems } from './comments.utils';
import { areObjectsEqual } from 'cd-utils/object';
import * as cd from 'cd-interfaces';

@Component({
  selector: 'app-comment',
  templateUrl: './comment.component.html',
  styleUrls: ['./comment.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommentComponent {
  private _comment?: cd.ICommentDocument;
  private _editingComment = false;

  public commentHtml = '';
  public deleteConfirmationActive = false;

  @Input() selectingElement = false;
  @Input() taggedItems: cd.IStringMap<cd.IUser> = {};
  @Input() resolved = false;
  @Input() firstComment = false;
  @Input() newThreadComment = false;
  /** This label is the number that shows up beside comments attached to elements on the design surface */
  @Input() highlightLabel?: number;
  @Input() user?: cd.IUser;

  @Output() deleteComment = new EventEmitter<string>();
  @Output() reopenThread = new EventEmitter<string>();
  @Output() resolveThread = new EventEmitter<string>();
  @Output() editComment = new EventEmitter<boolean>();
  @Output() updateComment = new EventEmitter<cd.ITaggableTextFieldNode[]>();

  @Input()
  get comment(): cd.ICommentDocument | undefined {
    return this._comment;
  }
  set comment(comment: cd.ICommentDocument | undefined) {
    if (areObjectsEqual(this._comment, comment)) return;
    this._comment = comment;
    const bodyText = comment && comment.body;
    if (!bodyText) return;
    this.commentHtml = commentBodyToHtml(bodyText);
    this.taggedItems = getTaggedItems(bodyText);
  }

  @Input()
  get editingComment(): boolean {
    return this._editingComment;
  }
  set editingComment(editingComment: boolean) {
    this._editingComment = editingComment;
  }

  get promptText(): string {
    const firstCommentString = this.firstComment ? ' and will delete the entire thread' : '';
    return `Are you sure? This cannot be undone${firstCommentString}.`;
  }

  onTaggedItemsChange(items: cd.IStringMap<cd.IUser>) {
    this.taggedItems = items;
  }

  onEditComment(nodes: cd.ITaggableTextFieldNode[]) {
    this.updateComment.emit(nodes);
    this.editingComment = false;
  }

  onCancelDelete() {
    this.deleteConfirmationActive = false;
  }

  onCancelEdit() {
    this.editingComment = false;
  }

  onConfirmDelete() {
    if (!this.comment) return;
    this.deleteComment.emit(this.comment.id);
  }

  onDeleteComment(_commentId: string) {
    this.deleteConfirmationActive = true;
  }

  onReopenThread(threadId: string) {
    this.reopenThread.emit(threadId);
  }

  onResolveThread(threadId: string) {
    this.resolveThread.emit(threadId);
  }

  onSetEditComment(editing: boolean) {
    this.editingComment = editing;
    this.editComment.emit(editing);
  }
}
