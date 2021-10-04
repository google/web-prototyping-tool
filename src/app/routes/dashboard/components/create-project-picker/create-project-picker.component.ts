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
  ViewChild,
  Output,
  EventEmitter,
  AfterViewInit,
  OnInit,
  HostListener,
  Input,
  ChangeDetectorRef,
  OnDestroy,
} from '@angular/core';
import {
  ScrollViewComponent,
  OverlayInitService,
  AbstractOverlayContentDirective,
} from 'cd-common';
import { Store } from '@ngrx/store';
import { ProjectCreate } from '../../store';
import * as cd from 'cd-interfaces';
import { KEYS } from 'cd-utils/keycodes';
import { AppGo } from 'src/app/store/actions';
import { constructProjectPath } from 'src/app/utils/route.utils';
import { Subscription } from 'rxjs';
import { AnalyticsService } from 'src/app/services/analytics/analytics.service';
import { BLANK_TEMPLATE } from '../../configs/built-in-templates.config';
import { AnalyticsEvent } from 'cd-common/analytics';
import { Theme } from 'cd-themes';
import { DatabaseChangesService } from 'src/app/database/changes/database-change.service';
import { LAYERS_PANEL_FRAGMENT } from 'src/app/configs/routes.config';

const ALL_MENU_ITEM_ID = '_all';
const ALL_MENU_ITEM_LABEL = 'All';

type ProjectPickerView = 'main' | 'details' | 'loading';

@Component({
  selector: 'app-create-project-picker',
  templateUrl: './create-project-picker.component.html',
  styleUrls: ['./create-project-picker.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateProjectPickerComponent
  extends AbstractOverlayContentDirective
  implements AfterViewInit, OnInit, OnDestroy
{
  private _subscriptions = new Subscription();
  private _selectedCategoryId = ALL_MENU_ITEM_ID;
  private _projectTemplates: cd.ProjectTemplate[] = [];
  private _loadedTemplates: cd.ILoadedTemplate[] = [];

  public currentTemplates: cd.ProjectTemplate[] = [];
  public templateCategories: string[] = [];
  public menuListItems: cd.IMenuListItem[] = [];
  public selectedTemplate: cd.ProjectTemplate = BLANK_TEMPLATE;

  public searchValue = '';

  public readonly MAIN_VIEW: ProjectPickerView = 'main';
  public readonly DETAILS_VIEW: ProjectPickerView = 'details';
  public readonly LOADING_VIEW: ProjectPickerView = 'loading';
  public currentView: ProjectPickerView = this.MAIN_VIEW;

  @Input() user?: cd.IUser;

  @Input()
  set projectTemplates(value: cd.ProjectTemplate[]) {
    this._loadedTemplates = value as cd.ILoadedTemplate[]; // TODO: cleanup
    this._projectTemplates = [BLANK_TEMPLATE, ...value];
    this._computeCategories();
    this.update();
  }
  get projectTemplates(): cd.ProjectTemplate[] {
    return this._projectTemplates;
  }

  @ViewChild('scrollView', { read: ScrollViewComponent, static: true })
  _scrollViewRef?: ScrollViewComponent;

  @Output() confirm: EventEmitter<string> = new EventEmitter<string>();

  constructor(
    _overlayInit: OverlayInitService,
    private _dashboardStore: Store<void>,
    private _databaseChangesService: DatabaseChangesService,
    private _cdRef: ChangeDetectorRef,
    private _analyticsService: AnalyticsService
  ) {
    super(_overlayInit);
  }

  onDetailsBackClick() {
    this.currentView = this.MAIN_VIEW;
  }

  onPreviewTemplateDetails(template: cd.ProjectTemplate) {
    this.selectedTemplate = template;
    this.currentView = this.DETAILS_VIEW;
  }

  get selectedCategoryId(): string {
    return this._selectedCategoryId;
  }

  set selectedCategoryId(id: string) {
    this._selectedCategoryId = id;
    this.update();
  }

  onSearchValue() {
    this.update();
  }

  ngOnInit(): void {
    this.update();
  }

  ngOnDestroy() {
    this._subscriptions.unsubscribe();
  }

  private update() {
    const filtered = this.filterTemplates(this.searchValue, this.projectTemplates);
    this.menuListItems = this._computeMenu(this.templateCategories, filtered);
    this.currentTemplates = this.filterTemplatesByCategory(this.selectedCategoryId, filtered);
    this.checkIfSelectedIsVisible();
    this.scrollToTop();
    this._cdRef.markForCheck();
  }

  private filterTemplatesByCategory(
    categoryId: string = '',
    templates: cd.ProjectTemplate[]
  ): cd.ProjectTemplate[] {
    if (categoryId === ALL_MENU_ITEM_ID) {
      return templates;
    }
    const categoryName = this._getMenuItemNameForId(categoryId);
    const loadedTemplates = this.filterToLoadedTempaltes(templates);
    return loadedTemplates.filter((t) => {
      const { tags } = t.publishEntry;
      return tags && tags.includes(categoryName);
    });
  }

  private filterTemplates(
    searchValue: string,
    templates: cd.ProjectTemplate[] = []
  ): cd.ProjectTemplate[] {
    return templates.filter((item: cd.ProjectTemplate) =>
      item.name.toLowerCase().includes(searchValue.toLowerCase())
    );
  }

  private filterToLoadedTempaltes = (templates: cd.ProjectTemplate[]): cd.ILoadedTemplate[] => {
    return templates.filter(
      (t) => !(t as cd.IBuiltInTemplate).builtInTemplate
    ) as cd.ILoadedTemplate[];
  };

  private _computeMenu(
    categories: string[] = [],
    templates: cd.ProjectTemplate[]
  ): cd.IMenuListItem[] {
    const allMenuItems: cd.IMenuListItem = {
      id: ALL_MENU_ITEM_ID,
      name: ALL_MENU_ITEM_LABEL,
      count: templates.length,
    };
    return categories.reduce(
      (acc, curr, idx) => {
        const count = this._countCategory(curr, templates);
        acc.push({ id: String(idx), name: curr, count });
        return acc;
      },
      [allMenuItems]
    );
  }

  private _getMenuItemNameForId = (id: string): string => {
    const item = this.menuListItems.find((i) => i.id === id);
    return item ? item.name : ALL_MENU_ITEM_LABEL;
  };

  private _countCategory = (category: string, templates: cd.ProjectTemplate[]): number => {
    return templates.reduce((acc, curr) => {
      if ((curr as cd.IBuiltInTemplate).builtInTemplate) return acc;
      const { publishEntry } = curr as cd.ILoadedTemplate;
      const { tags } = publishEntry;
      if (tags && tags.includes(category)) acc++;
      return acc;
    }, 0);
  };

  private _computeCategories() {
    const { _loadedTemplates } = this;
    const tags = _loadedTemplates.map((t) => t.publishEntry.tags || []);
    const unqiueTags = Array.from(new Set(tags.flat()));
    this.templateCategories = unqiueTags;
  }

  private checkIfSelectedIsVisible() {
    const { currentTemplates, selectedTemplate } = this;
    const selectedIsVisible = currentTemplates.some(
      (template) => template.id === selectedTemplate.id
    );
    if (!selectedIsVisible && currentTemplates.length > 0) {
      const [first] = currentTemplates;
      this.selectedTemplate = first;
    }
  }

  private scrollToTop() {
    if (!this._scrollViewRef) return;
    this._scrollViewRef.scrollToTop();
  }

  get confirmDisabled(): boolean {
    return !this.selectedTemplate;
  }

  onProjectTemplateSelect(template: cd.ProjectTemplate) {
    this.selectedTemplate = template;
  }

  onDismissClicked() {
    this.dismissOverlay.emit();
  }

  @HostListener('document:keydown', ['$event'])
  onkeydown(e: KeyboardEvent) {
    const { key } = e;
    if (key === KEYS.Escape) return this.onDismissClicked();
    if (key === KEYS.Enter) {
      e.preventDefault();
      return this.onConfirmClicked();
    }
  }

  onConfirmClicked(editTemplate = false) {
    const { selectedTemplate, user } = this;
    if (!selectedTemplate || !user) return;

    const isBuiltInTemplate = (selectedTemplate as cd.IBuiltInTemplate).builtInTemplate;
    if (isBuiltInTemplate) {
      const builtInTemplate = selectedTemplate as cd.IBuiltInTemplate;
      this._dashboardStore.dispatch(new ProjectCreate(builtInTemplate.themeId as Theme));
    } else {
      this.currentView = this.LOADING_VIEW;
      const loadedTemplate = selectedTemplate as cd.ILoadedTemplate;
      this._subscriptions.add(
        this._databaseChangesService
          .createProjectFromTemplate(loadedTemplate, user, editTemplate)
          .subscribe((newProjectId) => {
            if (!newProjectId) return; // TODO: show error message
            const params = { name: loadedTemplate.name };
            this._analyticsService.logEvent(AnalyticsEvent.ProjectCreateFromTemplate, params);
            const path = constructProjectPath(newProjectId);
            this._dashboardStore.dispatch(
              new AppGo({ path: [path], extras: { fragment: LAYERS_PANEL_FRAGMENT } })
            );
          })
      );
    }
  }

  onOpenClicked(template: cd.ProjectTemplate) {
    this.onProjectTemplateSelect(template);
    this.onConfirmClicked();
  }
}
