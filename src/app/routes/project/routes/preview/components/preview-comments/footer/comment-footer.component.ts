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
  AfterViewInit,
  Component,
  ChangeDetectorRef,
  ChangeDetectionStrategy,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  ViewChild,
} from '@angular/core';
import { UserPickerDirective } from '../../../../../components/user-list/user-picker.directive';
import { getTaggedItems } from '../comment.component.utils';
import { KEYS, keyCheck } from 'cd-utils/keycodes';
import * as cd from 'cd-interfaces';

@Component({
  selector: 'app-comment-footer',
  templateUrl: './comment-footer.component.html',
  styleUrls: ['./comment-footer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommentFooterComponent implements AfterViewInit {
  private _textFieldValue = '';
  private _taggedItems: cd.IStringMap<cd.IUser> = {};
  public filteredUsers: string[] = [];
  public editedCommentBodyData: Array<cd.ITaggableTextFieldNode> = [];
  public emptyTextField = true;
  public newItem?: cd.PartialUser;
  public userSearch = '';

  @Input() autoFocus = false;
  @Input() editing = false;
  @Input() newThread = false;
  @Input() placeholder = 'Reply';
  @Input() resolved = false;
  @Input() commentBodyData: Array<cd.ITaggableTextFieldNode> = [];
  @Input() set taggedItems(items: cd.IStringMap<cd.IUser>) {
    this._taggedItems = items;
    this.filteredUsers = Object.values(items).reduce<string[]>((acc, curr) => {
      const email = curr.email;
      if (email) acc.push(email);
      return acc;
    }, []);
  }
  get taggedItems() {
    return this._taggedItems;
  }

  @Output() cancelEdit = new EventEmitter();
  @Output() createComment = new EventEmitter<Array<cd.ITaggableTextFieldNode>>();
  @Output() taggedItemsChange = new EventEmitter<cd.IStringMap<cd.IUser>>();

  @ViewChild('taggableTextField', { read: ElementRef, static: true })
  taggableTextField!: ElementRef;

  @ViewChild(UserPickerDirective, { read: UserPickerDirective, static: true })
  userPicker?: UserPickerDirective;

  get textFieldValue(): string {
    return this._textFieldValue;
  }

  @Input()
  set textFieldValue(html: string) {
    this._textFieldValue = html;
    this.emptyTextField = false;
  }

  constructor(private _cdRef: ChangeDetectorRef) {}

  get userListActive() {
    return this.userPicker?.active;
  }

  ngAfterViewInit() {
    if (!this.autoFocus) return;
    this.editing = true;
    this._cdRef.detectChanges();
  }

  onFocus() {
    this.editing = true;
  }

  onCancel() {
    this.cancelEdit.emit();
    this._resetTextField();
  }

  handleKeyUp() {
    if (!this.userListActive) return;
    this.userPicker?.prevIndex();
  }

  handleKeyDown() {
    if (!this.userListActive) return;
    this.userPicker?.nextIndex();
  }

  handleEnterKey(e: KeyboardEvent) {
    if (!this.userListActive) return;
    e.preventDefault();
    this.userPicker?.selectActiveIndex();
  }

  handleEscKey() {
    this.userPicker?.close();
  }

  onKeydown(e: KeyboardEvent) {
    const { key, metaKey } = e;
    if (this.userListActive) {
      if (keyCheck(key, KEYS.Escape)) this.handleEscKey();
      if (keyCheck(key, KEYS.ArrowUp)) this.handleKeyUp();
      if (keyCheck(key, KEYS.ArrowDown)) this.handleKeyDown();
      if (keyCheck(key, KEYS.Enter)) this.handleEnterKey(e);
    } else {
      if (metaKey && keyCheck(key, KEYS.Enter) && this.editedCommentBodyData.length > 0) {
        this.onSave();
      }
    }
  }

  onQuery(q: string) {
    this.userSearch = q;
    if (q === '') return this.userPicker?.close();
    if (!this.userListActive) this._createUserListOverlay();
    this.userPicker?.updateOverlayPosition();
    this._cdRef.markForCheck();
  }

  onSave() {
    this.createComment.emit(this.editedCommentBodyData);
    this._resetTextField();
  }

  onTextFieldChange(textFieldData: cd.ITaggableTextFieldHtmlWithData) {
    const { data, html } = textFieldData;

    this.editedCommentBodyData = data;
    this.textFieldValue = html;

    const taggedItems = getTaggedItems(this.editedCommentBodyData);
    this.taggedItemsChange.emit(taggedItems);

    if (this.editedCommentBodyData.length > 0) {
      this.emptyTextField = false;
    }
  }

  onUserSelection = (user: cd.PartialUser) => {
    this.newItem = user;
    this._cdRef.detectChanges();
  };

  private _createUserListOverlay() {
    this.userPicker?.createPicker();
  }

  private _resetTextField() {
    this.commentBodyData = [];
    this.editedCommentBodyData = [];
    this.textFieldValue = '&nbsp;';
    this._cdRef.detectChanges();
    this.textFieldValue = '';
    this.editing = false;
    this.taggedItemsChange.emit({});
    this._cdRef.detectChanges();
    this.emptyTextField = true;
  }
}
