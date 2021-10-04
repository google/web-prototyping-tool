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
  Output,
  EventEmitter,
  ViewChild,
  OnDestroy,
  ChangeDetectorRef,
} from '@angular/core';
import { UserPickerDirective } from '../../../user-list/user-picker.directive';
import { PeopleService } from 'src/app/services/people/people.service';
import { removeValueFromArrayAtIndex } from 'cd-utils/array';
import { Observable, Subscription } from 'rxjs';
import * as utils from 'src/app/utils/user.utils';
import * as cd from 'cd-interfaces';

const ADD_EDITOR_TOOLTIP = ['Only editors can add', 'Add editor'];

const EDITOR_MENU: ReadonlyArray<cd.IMenuConfig> = [
  { title: 'Remove', value: utils.UserMenuEvents.Remove, icon: 'remove_circle', divider: true },
  ...utils.USER_ACTIONS_MENU,
];

@Component({
  selector: 'app-project-editors',
  templateUrl: './project-editors.component.html',
  styleUrls: ['./project-editors.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectEditorsComponent implements OnDestroy {
  private _subscription = Subscription.EMPTY;
  private _editors: string[] = [];

  public showingPicker = false;
  public editorDetails: ReadonlyArray<cd.PartialUser> = [];
  public owner$?: Observable<cd.PartialUser | undefined>;
  public ownerMenu: ReadonlyArray<cd.IMenuConfig> = utils.USER_ACTIONS_MENU;

  @ViewChild(UserPickerDirective, { read: UserPickerDirective, static: false })
  userPicker?: UserPickerDirective;

  @Input() currentUser?: cd.IUser;
  @Input() ownerEmail = '';

  @Input() set editors(editors: string[] | undefined) {
    const list = editors ?? [];
    this._editors = list;
    this._subscription = this._peopleService
      .getDetailsForEmailsAsObservable(list)
      .subscribe(this.onUserDetails);
  }

  @Output() update = new EventEmitter<string[]>();

  constructor(private _peopleService: PeopleService, private _cdRef: ChangeDetectorRef) {}

  get editorMenu(): ReadonlyArray<cd.IMenuConfig> {
    return this.canEdit ? EDITOR_MENU : utils.USER_ACTIONS_MENU;
  }

  get editors() {
    return this._editors;
  }

  get addEditorTooltip(): string {
    return ADD_EDITOR_TOOLTIP[Number(this.canEdit)];
  }

  get canEdit(): boolean {
    const currentUser = this.currentUser?.email || '';
    return Boolean(this.ownerEmail === currentUser || this.editors?.includes(currentUser));
  }

  onUserDetails = (details: cd.PartialUser[]) => {
    this.editorDetails = details;
    this._cdRef.markForCheck();
  };

  ngOnDestroy(): void {
    this._subscription.unsubscribe();
  }

  trackByFn(idx: number, editor: cd.PartialUser) {
    return idx + (editor?.email || '');
  }

  onOpenEditorPicker() {
    this.userPicker?.createPicker();
  }

  onAddEditor(user: cd.PartialUser) {
    const email = user?.email;
    if (!email) return;
    this.update.emit([...this._editors, email]);
  }

  removeEditor(email: string) {
    const idx = this._editors.indexOf(email);
    const update = removeValueFromArrayAtIndex(idx, this._editors);
    this.update.emit(update);
  }

  onMenuSelect(item: cd.IMenuConfig, editor: cd.PartialUser) {
    const email = editor?.email;
    if (!email) return;
    if (item.value === utils.UserMenuEvents.Remove) return this.removeEditor(email);
    if (item.value === utils.UserMenuEvents.Projects) utils.openUserProjects(email);
    if (item.value === utils.UserMenuEvents.Teams) utils.openUserTeamsPage(email);
  }
}
