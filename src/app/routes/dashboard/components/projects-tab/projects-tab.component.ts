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

// prettier-ignore
import { Component, OnInit, ChangeDetectionStrategy, OnDestroy, ChangeDetectorRef, Input, HostListener, EventEmitter, Output, ElementRef, ComponentRef } from '@angular/core';
import {
  OverlayService,
  AbstractOverlayControllerDirective,
  ConfirmationDialogComponent,
} from 'cd-common';
import { AnalyticsService } from 'src/app/services/analytics/analytics.service';
import { AnalyticsEvent } from 'cd-common/analytics';
import { ShareDialogComponent } from 'src/app/components/share-dialog/share-dialog.component';
import { constructProjectPath, constructPreviewPath } from 'src/app/utils/route.utils';
import { CreateProjectPickerComponent } from '../create-project-picker/create-project-picker.component';
import { ScreenshotService } from 'src/app/services/screenshot-lookup/screenshot-lookup.service';
import { removeGlobal } from 'src/app/services/debug/debug.utils';
import { DuplicateService } from 'src/app/services/duplicate/duplicate.service';
import { ProjectDelete, ProjectUpdate } from '../../store/actions/project.action';
import { ProjectSearchService } from '../../services/search/search.service';
import { ProjectService, ProjectQueryState } from '../../services/project/project.service';
import { TemplateService } from '../../services/template/template.service';
import { PeopleService } from 'src/app/services/people/people.service';
import { environment } from 'src/environments/environment';
import { IAppState, getUser, AppGo, getUserStarredProjects, SettingsUpdate } from 'src/app/store';
import { Store, select } from '@ngrx/store';
import { Subscription, merge, Observable } from 'rxjs';
import { distinctUntilChanged, filter, skip } from 'rxjs/operators';
import { openLinkInNewTab } from 'cd-utils/url';
import { removeValueFromArrayAtIndex } from 'cd-utils/array';
import config from '../../configs/dashboard.config';
import * as consts from 'cd-common/consts';
import * as cd from 'cd-interfaces';

const GLOBAL_REMOVE_ALL_PROJECTS = 'removeAllProjects';
const GLOBAL_REMOVE_ALL_UNTITLED_PROJECTS = 'removeAllUntitledProjects';
const SCROLL_THRESHOLD = 0.95;

@Component({
  selector: 'app-projects-tab',
  templateUrl: './projects-tab.component.html',
  styleUrls: ['./projects-tab.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ProjectService, ProjectSearchService],
})
export class ProjectsTabComponent
  extends AbstractOverlayControllerDirective
  implements OnDestroy, OnInit
{
  private _subscriptions = new Subscription();
  private _searchString = '';
  private _user?: cd.IUser;
  private _projectTemplates: cd.ProjectTemplate[] = [];
  private _createProjectRef?: ComponentRef<CreateProjectPickerComponent>;

  public foundUsers$?: Observable<cd.PartialUser[]>;
  public admin = false;
  public scrollShadow = false;
  public boardThumbnails = new Map<string, cd.IScreenshotRef[]>();
  public projectMenuConfig: cd.IMenuConfig[][] = config.projectMenu;
  public nonOwnerProjectMenuconfig: cd.IMenuConfig[][] = config.nonOwnerProjectMenu;
  public projects: cd.IProject[] = [];
  public userSearchResults: cd.IProject[] = [];
  public otherSearchResults: cd.IProject[] = [];
  public loading = environment.e2e || !environment.databaseEnabled ? false : true;
  public userLoading = false;
  public starredProjects: Set<string> = new Set();
  public QueryState = ProjectQueryState;
  public init = false;

  @Input() user?: cd.IUser;

  @Input()
  set isAdminUser(admin: boolean) {
    this.admin = admin;
    this.projectMenuConfig = admin ? config.projectMenuAdmin : config.projectMenu;
    this.nonOwnerProjectMenuconfig = admin
      ? config.nonOwnerProjectMenuAdmin
      : config.nonOwnerProjectMenu;
  }

  @Input()
  set searchString(value: string) {
    this._searchString = value;
    this._elemRef.nativeElement.scrollTop = 0;
    this.performQuery();
  }
  get searchString() {
    return this._searchString;
  }

  get isSearching() {
    return !!this._searchString;
  }

  get hasProjects() {
    return this.projects.length > 0;
  }

  get canShowActionBar() {
    return this.init;
  }

  get showingStarredProjects() {
    return this.queryState === ProjectQueryState.Starred && !this.isSearching;
  }

  get canShowStarredZeroState() {
    return !this.loading && !this.hasProjects && this.showingStarredProjects;
  }

  get canShowProjectList() {
    return this.loading || this.hasProjects || this.showingStarredProjects;
  }

  get showEmptySearchResultsState() {
    const { isDataLoading, otherSearchResults, userSearchResults } = this;
    return !isDataLoading && otherSearchResults.length === 0 && userSearchResults.length === 0;
  }

  get isDataLoading() {
    return this.loading || this.userLoading;
  }

  get userId(): string | undefined {
    return this.user?.id;
  }

  get queryState() {
    return this._projectService.queryState;
  }

  @Output() search = new EventEmitter<string>();

  constructor(
    public overlayService: OverlayService,
    private _elemRef: ElementRef,
    private _cdRef: ChangeDetectorRef,
    private _appStore: Store<IAppState>,
    private _dashboardStore: Store<void>,
    private _duplicateService: DuplicateService,
    private _peopleService: PeopleService,
    private _projectService: ProjectService,
    private _searchService: ProjectSearchService,
    private _templateService: TemplateService,
    private _screenshotService: ScreenshotService,
    private _analyticsService: AnalyticsService
  ) {
    super(overlayService);
  }

  private _onUserSubscription = (user?: cd.IUser) => (this._user = user);

  private _onProjectTemplatesSubscription = (templates: cd.ProjectTemplate[]) => {
    this._projectTemplates = templates;
    const { _createProjectRef } = this;
    if (_createProjectRef) _createProjectRef.instance.projectTemplates = templates;
  };

  @HostListener('scroll', ['$event'])
  onScroll(e: Event) {
    const { scrollTop, scrollHeight, offsetHeight } = e.currentTarget as HTMLElement;
    const position = scrollHeight - offsetHeight;
    const delta = scrollTop / position;
    if (delta >= SCROLL_THRESHOLD) {
      this.performQuery();
    }
  }

  onQueryStateChange(newState: ProjectQueryState) {
    this._projectService.setQueryState(newState);
    this.loadMoreProjects();
  }

  loadSearchQuery() {
    const { user, _searchString } = this;
    this._searchService.searchForProjects(user, _searchString);
    this.foundUsers$ = this._peopleService.getListOfUsersAsObservable(_searchString);
  }

  loadMoreProjects() {
    this._projectService.loadAllSortedByDateWithLimit(this.user, [...this.starredProjects]);
  }

  performQuery() {
    if (environment.e2e) return;
    if (this._searchString) {
      this.loadSearchQuery();
    } else {
      this.loadMoreProjects();
    }
  }

  ngOnInit() {
    const user$ = this._appStore.pipe(select(getUser));
    const projectTemplates$ = this._templateService.getProjectTemplates();
    const otherProjects$ = this._searchService.otherProjects$;
    const userProjects$ = this._searchService.userProjects$;
    const projects$ = this._projectService.projects$;
    const favorites$ = this._appStore.pipe(select(getUserStarredProjects));
    const thumbs$ = merge(
      this._projectService.boardThumbnails$,
      this._searchService.boardThumbnails$
    );

    this._subscriptions.add(user$.subscribe(this._onUserSubscription));
    this._subscriptions.add(projectTemplates$.subscribe(this._onProjectTemplatesSubscription));
    // Skip inital value from behaviorSubject
    this._subscriptions.add(projects$.pipe(skip(1)).subscribe(this.onProjectSubscription));
    this._subscriptions.add(favorites$.subscribe(this.onFavoritesSubscription));
    this._subscriptions.add(thumbs$.subscribe(this.onBoardThumbnails));

    const load$ = merge(
      this._projectService.loading$.pipe(filter(() => !this.isSearching)), // ignore while searching
      this._searchService.loading$.pipe(filter(() => this.isSearching))
    ).pipe(distinctUntilChanged());

    this._subscriptions.add(load$.subscribe(this.onLoading));
    this._subscriptions.add(userProjects$.subscribe(this.onUserProjects));
    this._subscriptions.add(otherProjects$.subscribe(this.onOtherProjects));
    this._subscriptions.add(this._searchService.userLoading$.subscribe(this.userSearchLoading));
  }

  onProjectSubscription = (_projects: cd.IProject[]) => {
    this.init = true;
    this.projects = _projects;
    this._cdRef.markForCheck();
  };

  onOtherProjects = (projects: cd.IProject[]) => {
    this.otherSearchResults = projects;
    this._cdRef.markForCheck();
  };

  onUserProjects = (projects: cd.IProject[]) => {
    this.userSearchResults = projects;
    this._cdRef.markForCheck();
  };

  userSearchLoading = (loading: boolean) => {
    this.userLoading = loading;
    this._cdRef.markForCheck();
  };

  onFavoritesSubscription = (favorites: string[] | undefined) => {
    this.starredProjects = new Set(favorites);
    this._cdRef.markForCheck();
  };

  onLoading = (loading: boolean) => {
    if (this.loading === loading) return;
    this.loading = loading;
    this._cdRef.markForCheck();
  };

  onBoardThumbnails = (thumbs: Map<string, cd.IScreenshotRef[]>) => {
    this.boardThumbnails = new Map([...this.boardThumbnails, ...thumbs]);
    this._cdRef.markForCheck();
  };

  trackFn(_index: number, project: cd.IProject) {
    return project.id;
  }

  onCreateProjectClick() {
    const modalRef = this.showModal<CreateProjectPickerComponent>(CreateProjectPickerComponent);
    modalRef.instance.projectTemplates = this._projectTemplates;
    modalRef.instance.user = this._user;
    this._createProjectRef = modalRef;
  }

  onProjectOpen(project: cd.IProject) {
    this.openProject(project);
  }

  onOpenProjectComments({ id }: cd.IProject) {
    const previewPath = constructPreviewPath(id);
    const routerConfig = { path: [previewPath], query: { comments: true } };
    const gotoCommentsAction = new AppGo(routerConfig);
    this._appStore.dispatch(gotoCommentsAction);
  }

  onProjectNameChange(name: string, project: cd.IProject) {
    if (!project.id) return;
    this._dashboardStore.dispatch(new ProjectUpdate(project.id, { name }));
  }

  onProjectMenuSelected(menuConfig: cd.IMenuConfig, project: cd.IProject) {
    if (menuConfig.id === undefined) return;
    const lookup = menuConfig.id as number;
    const MENU_SELECTED: { [key: number]: Function } = {
      [consts.ProjectAction.Open]: this.openProject,
      [consts.ProjectAction.Duplicate]: this.duplicateProject,
      [consts.ProjectAction.Share]: this.shareProject,
      [consts.ProjectAction.Delete]: this.deleteProject,
      [consts.ProjectAction.RegenerateScreenshots]: this.regenerateProjectScreenshots,
    };
    MENU_SELECTED[lookup](project);
  }

  regenerateProjectScreenshots = (project: cd.IProject) => {
    this._screenshotService.triggerCreateProjectScreenshots(project);
  };

  deleteProject = (project: cd.IProject) => {
    const projectName = project.name || consts.UNTITLED_PROJECT_NAME;
    const cmpRef = this.showModal<ConfirmationDialogComponent>(ConfirmationDialogComponent);
    cmpRef.instance.title = 'Delete project?';
    cmpRef.instance.message = `"${projectName}" and all its contents will be permanently deleted.`;
    cmpRef.instance.confirm.subscribe(() => this.onDeleteProjectConfirm(project));
  };

  onDeleteProjectConfirm = (project: cd.IProject) => {
    const { id } = project;
    this._dashboardStore.dispatch(new ProjectDelete(project));
    this._projectService.removeProjectFromList(id);
    this._searchService.removeProjectFromList(id);
  };

  openProject = ({ id }: cd.IProject) => {
    const path = constructProjectPath(id);
    openLinkInNewTab(path);
  };

  duplicateProject = (project: cd.IProject) => {
    const { _user } = this;
    if (!_user) return;
    this._duplicateService.duplicateProjectAndNavigate(project, _user);
  };

  ngOnDestroy(): void {
    super.ngOnDestroy();
    this._subscriptions.unsubscribe();
    removeGlobal(GLOBAL_REMOVE_ALL_PROJECTS);
    removeGlobal(GLOBAL_REMOVE_ALL_UNTITLED_PROJECTS);
  }

  private shareProject = (project: cd.IProject) => {
    this.openShareDialog(project);
  };

  openShareDialog(project: cd.IProject) {
    const componentRef = this.showModal<ShareDialogComponent>(ShareDialogComponent);
    componentRef.instance.project = project;
    this._analyticsService.logEvent(AnalyticsEvent.ShareDialogOpenedFromDashboard);
  }

  onAvatarClick(email: string) {
    this.search.emit(`${consts.FirebaseField.Owner}:${email}`);
  }

  handleStarred(projectId: string) {
    const starredProjects = [...this.starredProjects, projectId];
    const action = new SettingsUpdate({ starredProjects });
    this._appStore.dispatch(action);
    this._analyticsService.logEvent(AnalyticsEvent.StarredProject, { name: projectId });
  }

  onStarredProjectClick(starred: boolean, projectId: string) {
    if (starred) return this.handleStarred(projectId);
    // Handle unstarring
    const starredProjectsArray = [...this.starredProjects];
    const idx = starredProjectsArray.indexOf(projectId);
    if (idx === -1) return;
    const starredProjects = removeValueFromArrayAtIndex(idx, starredProjectsArray);
    const action = new SettingsUpdate({ starredProjects });
    this._appStore.dispatch(action);
    // Remove project if unstarring w/ starred section shown
    if (!this.showingStarredProjects) return;
    this._projectService.removeProjectFromList(projectId);
  }
}
