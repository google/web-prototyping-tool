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
import {
  Component,
  ChangeDetectionStrategy,
  Input,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
} from '@angular/core';
import { select, Store } from '@ngrx/store';
import { IAppState, AppGoToPreview, getUser } from 'src/app/store';
import { Observable, Subscription } from 'rxjs';
import { AuthService } from 'src/app/services/auth/auth.service';
import { ProjectExportService } from '../../../services/project-export/project-export.service';
import { IProjectState, ProjectDataUpdate } from '../../../store';
import { DuplicateService } from 'src/app/services/duplicate/duplicate.service';
import { ProjectContentService } from 'src/app/database/changes/project-content.service';

const DOWNLOAD_ZIP_MENU_ITEM_ID = 'Download project zip';

const enum ProjectMenu {
  Clone = 'clone',
  DownloadZip = 'zip',
}

const ELLIPSIS_MENU_DATA: cd.IMenuConfig[] = [
  {
    id: ProjectMenu.Clone,
    title: 'Clone project',
    icon: 'file_copy',
  },
  {
    id: ProjectMenu.DownloadZip,
    title: DOWNLOAD_ZIP_MENU_ITEM_ID,
    icon: 'get_app',
  },
];

@Component({
  selector: 'app-project-properties',
  templateUrl: './project-properties.component.html',
  styleUrls: ['./project-properties.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectPropertiesComponent implements OnInit, OnDestroy {
  private _projectData: cd.IProject | undefined;
  private _subscriptions = new Subscription();

  public isAdmin = false;
  public isUserProjectOwner$: Observable<boolean>;
  public publishEntry?: cd.IPublishEntry;
  public ellipsisMenuItems = ELLIPSIS_MENU_DATA;
  public PublishType = cd.PublishType;
  public currentUser?: cd.IUser;

  @Input()
  set projectData(project: cd.IProject | undefined) {
    this._projectData = project;
  }
  get projectData(): cd.IProject | undefined {
    return this._projectData;
  }

  constructor(
    public exportService: ProjectExportService,
    private authService: AuthService,
    private _duplicateService: DuplicateService,
    private _projectStore: Store<IProjectState>,
    private _cdRef: ChangeDetectorRef,
    private _appStore: Store<IAppState>,
    private _projectContentService: ProjectContentService
  ) {
    this.isUserProjectOwner$ = this._projectContentService.currentUserIsProjectOwner$;
  }

  ngOnInit(): void {
    const user$ = this._projectStore.pipe(select(getUser));
    this._subscriptions.add(user$.subscribe(this.onUser));
    this._subscriptions.add(this.authService.isAdminUser$.subscribe(this.onUserRole));
  }

  onUser = (user?: cd.IUser) => {
    this.currentUser = user;
    this._cdRef.markForCheck();
  };

  // TODO: remove this check once we're sure it is not needed anymore
  get showEditors() {
    return true;
    // return this.isAdmin || environment?.showEditors === true;
  }

  onUserRole = (isAdmin: boolean) => {
    this.isAdmin = isAdmin;
    this._cdRef.markForCheck();
  };

  ngOnDestroy() {
    this._subscriptions.unsubscribe();
  }

  onCommentsClick() {
    this._appStore.dispatch(new AppGoToPreview('', true));
  }

  cloneProject() {
    const { _projectData, currentUser } = this;
    if (!_projectData || !currentUser) return;
    this._duplicateService.duplicateProjectAndNavigate(_projectData, currentUser);
  }

  onEllipsisMenuSelect = ({ id }: cd.IMenuListItem): void => {
    if (id === ProjectMenu.DownloadZip) this.exportService.exportProjectAsZip();
    if (id === ProjectMenu.Clone) this.cloneProject();
  };

  onEditorsUpdate(editors: string[]) {
    this._projectStore.dispatch(new ProjectDataUpdate({ editors }));
  }
}
