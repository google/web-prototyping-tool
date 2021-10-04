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
  HostBinding,
  EventEmitter,
  HostListener,
  ChangeDetectorRef,
  OnDestroy,
} from '@angular/core';
import * as cd from 'cd-interfaces';
import { PeopleService } from 'src/app/services/people/people.service';
import { Observable, Subscription } from 'rxjs';
import { SymbolScreenshotsService } from '../../services/symbol-screenshots/symbol-screenshots.service';
import { take } from 'rxjs/operators';
import { AuthService } from 'src/app/services/auth/auth.service';
import type firebase from 'firebase/app';

@Component({
  selector: 'app-publish-entry-tile',
  templateUrl: './publish-entry-tile.component.html',
  styleUrls: ['./publish-entry-tile.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublishEntryTileComponent implements OnDestroy {
  private _subscription = Subscription.EMPTY;
  private _publishEntry?: cd.IPublishEntry;
  public showDetails = false;
  public isCodeComponent = false;
  public imgSrc?: string;
  public name = '';
  public desc = '';
  public tags: string[] = [];
  public timestamp?: firebase.firestore.Timestamp;
  public userDetails$?: Observable<Partial<cd.IUser> | undefined>;

  @Output() selectEntry = new EventEmitter<cd.IPublishEntry>();
  @Output() userClick = new EventEmitter<cd.IUserIdentity>();
  @Output() tagClick = new EventEmitter<string>();

  @HostBinding('class.selected')
  @Input()
  selected?: boolean;

  @HostBinding('class.is-imported')
  @Input()
  isImported = false;

  @Input()
  set publishEntry(entry: cd.IPublishEntry) {
    const { name, desc, owner, tags } = entry;
    const latestVersion = entry.versions[0];
    const { createdAt } = latestVersion;

    this._publishEntry = entry;
    this.name = name;
    this.tags = tags || [];
    this.desc = desc || '';
    this.timestamp = createdAt;
    this.isCodeComponent = !!latestVersion.codeComponentId;
    this._getImage(latestVersion);

    if (!owner.email) return;
    this.userDetails$ = this._peopleService.getUserDetailsForEmailAsObservable(owner.email);
  }

  constructor(
    public authService: AuthService,
    private _symbolScreenshotsService: SymbolScreenshotsService,
    private _peopleService: PeopleService,
    private _cdRef: ChangeDetectorRef
  ) {}

  ngOnDestroy(): void {
    this._subscription.unsubscribe();
  }

  private _getImage = ({ symbolId, codeComponentId }: cd.IPublishVersion) => {
    const componentId = symbolId || codeComponentId;
    if (!componentId) return;

    this._subscription = this._symbolScreenshotsService
      .lookupSymbolScreenshot(componentId)
      .pipe(take(1))
      .subscribe(this.onScreenshot);
  };

  onScreenshot = (ref: cd.IScreenshotRef) => {
    this.imgSrc = ref.url;
    this._cdRef.markForCheck();
  };

  @HostListener('click')
  onClick() {
    this.selectEntry.emit(this._publishEntry);
  }

  onShowDetails(e: MouseEvent) {
    e.stopPropagation();
    this.showDetails = true;
  }

  onCloseDetails(e: MouseEvent) {
    e.stopPropagation();
    this.showDetails = false;
  }

  onAvatarClick(user: cd.IUserIdentity) {
    this.userClick.emit(user);
  }

  onTagClick(e: MouseEvent, tag: string) {
    e.preventDefault();
    e.stopPropagation();
    this.tagClick.emit(tag);
  }

  onRegenerateScreenshot(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const { _publishEntry } = this;
    if (!_publishEntry) return;
    const latestVersion = _publishEntry.versions[0];
    if (!latestVersion || !latestVersion.symbolId) return;
    const { symbolId, projectId } = latestVersion;
    this._symbolScreenshotsService.regenerateSymbolScreenshot(symbolId, projectId);
  }
}
