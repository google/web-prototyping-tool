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

/*
 * Long-term:
 * - Command click open in another tab: anchor href vs routerLink
 * - Sort on modified date
 */

import {
  Component,
  Input,
  Output,
  EventEmitter,
  HostBinding,
  ChangeDetectionStrategy,
  ViewChild,
  ElementRef,
  OnDestroy,
  ChangeDetectorRef,
  OnChanges,
  SimpleChanges,
  OnInit,
} from '@angular/core';
import * as cd from 'cd-interfaces';
import { UNTITLED_PROJECT_NAME, ProjectAction } from 'cd-common/consts';
import { Observable, Subscription, fromEvent, ReplaySubject, merge } from 'rxjs';
import { PeopleService } from 'src/app/services/people/people.service';
import { takeUntil, map, filter } from 'rxjs/operators';
import { LAYERS_PANEL_FRAGMENT } from 'src/app/configs/routes.config';

@Component({
  selector: 'app-project-tile',
  templateUrl: './project-tile.component.html',
  styleUrls: ['./project-tile.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectTileComponent implements OnDestroy, OnChanges, OnInit {
  private readonly _destroyed = new ReplaySubject<void>(1);
  private _subscription = Subscription.EMPTY;
  private _loadSubscription = new Subscription();
  private _username = '';
  public thumbLoaded = new Set<string>();
  public user$?: Observable<Partial<cd.IUser> | undefined>;
  public UNTITLED_PROJECT_NAME = UNTITLED_PROJECT_NAME;
  public userIsEditor = false;

  @Input() userEmail = '';
  @Input() showAvatar = false;
  @Input() actionable?: boolean;
  @Input() editable?: boolean;
  @Input() updatedAt = '';
  @Input() starred = false;
  @Input() menuConfig: cd.IMenuConfig[][] = [];
  @Input() project!: cd.IProject;
  @Input() boardThumbnails: string[] = [];

  @Output() menuSelected = new EventEmitter<cd.IMenuConfig>();
  @Output() nameChange = new EventEmitter<string>();
  @Output() commentsClicked = new EventEmitter<void>();
  @Output() avatarClick = new EventEmitter<string>();
  @Output() starredClick = new EventEmitter<boolean>();

  @ViewChild('labelRef', { read: ElementRef, static: true }) labelRef!: ElementRef;
  @ViewChild('coverRef', { read: ElementRef, static: true }) coverRef!: ElementRef;

  @HostBinding('class.hover') hover = false;
  @HostBinding('class.active') active = false;

  constructor(
    private _peopleService: PeopleService,
    private _cdRef: ChangeDetectorRef,
    private _elemRef: ElementRef
  ) {}

  ngOnInit(): void {
    this._loadSubscription.add(
      fromEvent<Event>(this._elemRef.nativeElement, 'load', { capture: true })
        .pipe(
          map((e) => (e.target as HTMLImageElement).src),
          filter((url) => this.boardThumbnails.includes(url))
        )
        .subscribe(this.onImgLoad)
    );
  }

  onImgLoad = (url: string) => {
    this.thumbLoaded.add(url);
    this._cdRef.markForCheck();
  };

  get canShowAvatar() {
    return !this.userIsEditor && this.showAvatar;
  }

  /** If a project has more than 1 board, show the layers tree by default */
  get urlFragment() {
    return this.boardThumbnails.length > 1 ? LAYERS_PANEL_FRAGMENT : undefined;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.showAvatar || (changes.project && this.project)) {
      if (this.project) {
        this.loadOwnerDetails(this.project);
      }
    }
    if (changes.project || (changes.userEmail && this.project && this.userEmail)) {
      this.userIsEditor = this.project.editors?.includes(this.userEmail) || false;
    }
  }

  ngOnDestroy(): void {
    this._destroyed.next();
    this._destroyed.complete();
    this._subscription.unsubscribe();
    this._loadSubscription.unsubscribe();
  }

  get coverElem() {
    return this.coverRef.nativeElement;
  }

  private loadOwnerDetails(project: cd.IProject) {
    if (!this.showAvatar) return;
    const email = project.owner?.email || '';
    if (!email || this._username === email) return;
    this._username = email;
    this.user$ = this._peopleService
      .getUserDetailsForEmailAsObservable(email)
      .pipe(takeUntil(this._destroyed));
  }

  onOver() {
    if (this.hover === true) return;
    this.hover = true;

    const { coverElem } = this;
    this._subscription = new Subscription();
    this._subscription.add(
      merge(fromEvent(coverElem, 'mouseout'), fromEvent(coverElem, 'mouseleave'))
        .pipe(takeUntil(this._destroyed))
        .subscribe(this.onMouseOut)
    );

    this._subscription.add(
      merge(fromEvent(coverElem, 'mouseup'), fromEvent(coverElem, 'mousedown'))
        .pipe(takeUntil(this._destroyed))
        .subscribe(this.onMouseDown)
    );
  }

  cleanupSubscription() {
    this._subscription.unsubscribe();
  }

  onMouseOut = () => {
    this.hover = false;
    this.active = false;
    this.cleanupSubscription();
    this._cdRef.markForCheck();
  };

  onMouseDown = () => {
    if (this.active === true) return;
    this.active = true;
    this._cdRef.markForCheck();
  };

  onCommentsClicked(e: MouseEvent) {
    e.stopImmediatePropagation();
    e.preventDefault();
    this.commentsClicked.emit();
  }

  onInputFocus(e: FocusEvent) {
    const target = e.currentTarget as HTMLInputElement;
    target.setSelectionRange(0, target.value.length);
  }

  onMenuSelected(menuConfig: cd.IMenuConfig) {
    if (menuConfig.id === ProjectAction.Rename) {
      const inputElement = this.labelRef.nativeElement;
      inputElement.focus();
    } else {
      this.menuSelected.emit(menuConfig);
    }
  }

  onNameChange(e: Event) {
    const input = e.currentTarget as HTMLInputElement;
    this.nameChange.emit(input.value);
  }

  onAvatarClick(e: MouseEvent, email: string | null | undefined) {
    e.stopImmediatePropagation();
    e.preventDefault();
    if (!email) return;
    this.avatarClick.emit(email);
  }

  onStarredClick() {
    // Emit the new value
    this.starredClick.emit(!this.starred);
  }
}
