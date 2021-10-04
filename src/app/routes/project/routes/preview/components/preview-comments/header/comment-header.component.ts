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

import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { PeopleService } from 'src/app/services/people/people.service';
import { CommentThreadAction, COMMENT_MENU_DATA } from '../comments.config';
import { Observable } from 'rxjs';
import * as cd from 'cd-interfaces';

@Component({
  selector: 'app-comment-header',
  templateUrl: './comment-header.component.html',
  styleUrls: ['./comment-header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommentHeaderComponent {
  private _user?: cd.IUserIdentity;
  public user$?: Observable<Partial<cd.IUser> | undefined>;
  public menuData: cd.IMenuConfig[][] = COMMENT_MENU_DATA;

  @Input() editing = false;
  @Input() canModify = false;
  @Input() firstComment = false;
  @Input() firstCommentInThreadHeader = false;
  @Input() resolved = false;
  @Input() updatedAt = -1;
  @Input() commentId?: string;
  @Input() threadId?: string;
  @Input() highlightLabel?: number;
  @Input() selectionActive = false;

  @Output() setEditComment = new EventEmitter<boolean>();
  @Output() deleteComment = new EventEmitter<string>();
  @Output() reopenThread = new EventEmitter<string>();
  @Output() resolveThread = new EventEmitter<string>();
  @Output() toggleSelectingElement = new EventEmitter<boolean>();

  @Input()
  set user(user: cd.IUserIdentity | undefined) {
    this._user = user;
    if (!user?.email) return;
    this.user$ = this._peopleService.getUserDetailsForEmailAsObservable(user.email);
  }
  get user() {
    return this._user;
  }

  constructor(private _peopleService: PeopleService) {}

  get avatarBadgeLabel(): string | undefined {
    if (!this.firstComment || this.highlightLabel === undefined) return undefined;
    return String(this.highlightLabel);
  }

  get canShowResolveThread(): boolean {
    return this.firstComment && !this.resolved && !this.editing;
  }

  get canShowCommentActionsMenu(): boolean {
    return this.canModify && !this.resolved && !this.editing;
  }

  get canShowReopenAction(): boolean {
    return this.firstComment && this.resolved && !this.editing;
  }

  onMenuSelect({ id }: cd.IMenuConfig) {
    if (id === CommentThreadAction.Delete) return this.deleteComment.emit(this.commentId);
    if (id === CommentThreadAction.Edit) return this.setEditComment.emit(true);
  }

  onReopenThread() {
    this.reopenThread.emit(this.threadId);
  }

  onResolveThread() {
    this.resolveThread.emit(this.threadId);
  }

  onSelectingElementClick() {
    const newValue = !this.selectionActive;
    this.toggleSelectingElement.emit(newValue);
  }
}
