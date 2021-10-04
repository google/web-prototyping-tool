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
import { Component, ChangeDetectionStrategy, Output, EventEmitter, ViewChild, AfterViewInit, Input, OnInit, OnDestroy, ChangeDetectorRef, } from '@angular/core';
// prettier-ignore
import { ScrollViewComponent, OverlayInitService, AbstractOverlayContentDirective, } from 'cd-common';
import { Subscription } from 'rxjs';
import { ComponentQueryService } from 'src/app/database/component-query.service';
import { ComponentSearchService } from 'src/app/database/component-search.service';
import { Store, select } from '@ngrx/store';
import { IProjectState, selectPublishEntries } from '../../store';
import { IPublishEntryQueryResult } from 'src/app/database/query.service';
import { Dictionary } from '@ngrx/entity';
import * as cd from 'cd-interfaces';

const ALL_ID = 'all';
const MINE_ID = 'mine';
const SCROLL_THRESHOLD = 0.95;

@Component({
  selector: 'app-component-import-picker',
  templateUrl: './component-import-picker.component.html',
  styleUrls: ['./component-import-picker.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ComponentQueryService, ComponentSearchService],
})
export class ComponentImportPickerComponent
  extends AbstractOverlayContentDirective
  implements OnInit, AfterViewInit, OnDestroy
{
  private _subscriptions = new Subscription();

  public searchString = '';
  public selectedEntries = new Map<string, cd.IPublishEntry>();
  public publishedComponents: cd.IPublishEntry[] = [];
  public userSearchResults: cd.IPublishEntry[] = [];
  public otherSearchResults: cd.IPublishEntry[] = [];
  public init = false;
  public loading = false;
  public userLoading = false;
  public importedEntryIds = new Set<string>();
  public MINE_ID = MINE_ID;
  public selectedMenuItemId = ALL_ID;
  public menuListItems: cd.IMenuListItem[] = [
    { id: ALL_ID, name: 'All' },
    { id: MINE_ID, name: 'Mine' },
  ];

  @Input() user?: cd.IUserIdentity;
  @Output() confirm = new EventEmitter<cd.IPublishEntry[]>();

  @ViewChild('scrollView', { read: ScrollViewComponent, static: true })
  _scrollViewRef!: ScrollViewComponent;

  constructor(
    _overlayInit: OverlayInitService,
    private _componentQueryService: ComponentQueryService,
    private _searchService: ComponentSearchService,
    private _cdRef: ChangeDetectorRef,
    private readonly _projectStore: Store<IProjectState>
  ) {
    super(_overlayInit);
  }

  loadSearchQuery() {
    const { user, searchString } = this;
    this._searchService.searchForPublishedComponents(user, searchString);
  }

  loadMoreComponents() {
    this._componentQueryService.loadAllSortedByDateWithLimit();
  }

  performQuery() {
    if (this.searchString) {
      this.loadSearchQuery();
    } else {
      this.loadMoreComponents();
    }
  }

  trackFn(_index: number, publishEntry: cd.IPublishEntry) {
    return publishEntry.id;
  }

  ngOnInit() {
    // load publishEntries currently in project
    const publishEntries$ = this._projectStore.pipe(select(selectPublishEntries));
    this._subscriptions.add(publishEntries$.subscribe(this._onPublishEntries));

    const { _componentQueryService, _searchService } = this;
    const { publishedComponents$, loading$ } = _componentQueryService;
    this._subscriptions.add(publishedComponents$.subscribe(this.onPublishedComponents));
    this._subscriptions.add(loading$.subscribe(this.onLoading));
    this._subscriptions.add(_searchService.userComponents$.subscribe(this.onUserComponents));
    this._subscriptions.add(_searchService.otherComponents$.subscribe(this.onOthersComponents));
    this._subscriptions.add(_searchService.userLoading$.subscribe(this.userSearchLoading));
    this.performQuery();
  }

  get hasNoResults() {
    return (
      !this.loading &&
      !this.userLoading &&
      this.otherSearchResults.length === 0 &&
      this.userSearchResults.length === 0
    );
  }

  ngOnDestroy() {
    this._subscriptions.unsubscribe();
  }

  ngAfterViewInit() {
    super.ngAfterViewInit();
    this.init = true;
    // TEMP Fix for showing scrollview shadow
    setTimeout(this._scrollViewRef.onScroll, 0);
  }

  private _onPublishEntries = (publishEntries: Dictionary<cd.IPublishEntry>) => {
    this.importedEntryIds = new Set(Object.keys(publishEntries));
  };

  onOthersComponents = (symbols: IPublishEntryQueryResult[]) => {
    this.otherSearchResults = symbols.map((s) => s.data);
    this._cdRef.markForCheck();
  };

  onUserComponents = (symbols: IPublishEntryQueryResult[]) => {
    this.userSearchResults = symbols.map((s) => s.data);
    this._cdRef.markForCheck();
  };

  userSearchLoading = (loading: boolean) => {
    this.userLoading = loading;
    this._cdRef.markForCheck();
  };

  onLoading = (loading: boolean) => {
    this.loading = loading;
    this._cdRef.markForCheck();
  };

  onPublishedComponents = (publishedComponents: IPublishEntryQueryResult[]) => {
    this.publishedComponents = publishedComponents.map((s) => s.data);
    this._cdRef.markForCheck();
  };

  onEntrySelected(entry: cd.IPublishEntry) {
    const isSelected = this.selectedEntries.has(entry.id);

    if (isSelected) {
      this.selectedEntries.delete(entry.id);
    } else {
      this.selectedEntries.set(entry.id, entry);
    }
  }

  onDismissClicked() {
    this.dismissOverlay.emit();
  }

  onConfirmClicked() {
    const selectedEntries = Array.from(this.selectedEntries.values());
    this.confirm.emit(selectedEntries);
    this.onDismissClicked();
  }

  onClearSelected() {
    this.selectedEntries.clear();
  }

  // Clear the search when user hits the X
  onSearchValueChange(value: string) {
    if (value !== '') return;
    this.onSearchUpdate('');
  }

  onSearchChange(e: Event) {
    const value = (e.target as HTMLInputElement).value;
    this.onSearchUpdate(value);
  }

  onSearchUpdate(value: string) {
    this.searchString = value;
    this.performQuery();
    this.updateMenuFromSearch();
  }

  onTagClick(tag: string) {
    this.onSearchUpdate(tag);
  }

  onMenuItemSelected(menuItemId: string) {
    const { user } = this;
    if (!user) return;
    if (menuItemId === ALL_ID) {
      this.searchQuery = '';
    } else if (menuItemId === MINE_ID) {
      this.searchForUser(user.email);
    }
  }

  set searchQuery(value: string) {
    this.searchString = value;
    this.performQuery();
    this._cdRef.markForCheck();
  }

  searchForUser(email: string | null) {
    this.searchQuery = `owner:${email}`;
  }

  onScroll(scrollDetails: [number, number, number]) {
    const [scrollTop, scrollHeight, offsetHeight] = scrollDetails;
    const position = scrollHeight - offsetHeight;
    const delta = scrollTop / position;
    if (delta >= SCROLL_THRESHOLD) {
      this.performQuery();
    }
  }

  onUserClick(user: cd.IUserIdentity) {
    this.searchForUser(user.email);
  }

  private updateMenuFromSearch() {
    const { user } = this;
    const username = this._searchService.usernameFromQuery(this.searchString);
    const mine = user && username && username === user.email;
    this.selectedMenuItemId = mine ? MINE_ID : ALL_ID;
    this._cdRef.markForCheck();
  }
}
