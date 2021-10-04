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
  ChangeDetectorRef,
  ElementRef,
  OnDestroy,
  OnInit,
} from '@angular/core';
import * as cd from 'cd-interfaces';
import { RecordActionService } from '../../services/record-action/record-action.service';
import { ProjectContentService } from 'src/app/database/changes/project-content.service';
import { Subscription, Observable, fromEvent } from 'rxjs';
import { take } from 'rxjs/operators';
import { sortElementsByName } from 'cd-common/utils';

const MAX_HEIGHT = 'var(--max-record-height)';
const MIN_HEIGHT = 'var(--min-record-height)';
const COLLAPSE_EXPAND_ANI_CONFIG = { duration: 250, fill: 'forwards', easing: 'ease-in-out' };

@Component({
  selector: 'app-recordings',
  templateUrl: './recordings.component.html',
  styleUrls: ['./recordings.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecordingsComponent implements OnDestroy, OnInit {
  private _contentAnimation?: Animation;
  private _subscriptions = Subscription.EMPTY;
  private _aniSubscription = Subscription.EMPTY;
  public collapsed = false;
  public animating = false;
  public stateChanges: cd.IActionStateChange[] = [];
  public designSystem$: Observable<cd.IDesignSystem | undefined>;
  public boards: cd.IBoardProperties[] = [];

  constructor(
    private _cdRef: ChangeDetectorRef,
    private _elemRef: ElementRef,
    private _recordActionService: RecordActionService,
    private _projectContentService: ProjectContentService
  ) {
    this.designSystem$ = this._projectContentService.designSystem$;
  }

  get element() {
    return this._elemRef.nativeElement;
  }

  onSnapshot() {
    // SNAPSHOT CURRENTLY SELEECTED ELEMENT
  }

  ngOnInit(): void {
    this._subscriptions = this._recordActionService.stateChanges$.subscribe(this.onListUpdate);
    const boards$ = this._projectContentService.boardsArray$;
    this._subscriptions.add(boards$.subscribe(this.onBoardUpdate));
  }

  onBoardUpdate = (boards: cd.IBoardProperties[]) => {
    this.boards = sortElementsByName<cd.IBoardProperties>(boards);
  };

  onListUpdate = (changes: cd.IActionStateChange[]) => {
    this.stateChanges = changes;
    this._cdRef.markForCheck();
  };

  onDeleteMultipleRecords(indexes: number[]) {
    this._recordActionService.deleteMultipleIndexes(indexes);
  }

  onDeleteRecord(index: number) {
    this._recordActionService.deleteRecordAtIndex(index);
  }

  onUpdateRecord(evt: [number, cd.IActionStateChange]) {
    this._recordActionService.updateRecordAtIndex(...evt);
  }

  cancelAnimation() {
    if (this._contentAnimation) this._contentAnimation.cancel();
  }

  ngOnDestroy(): void {
    this._subscriptions.unsubscribe();
    this._aniSubscription.unsubscribe();
    this.cancelAnimation();
  }

  animateContentHeight(collapse: boolean) {
    const from = collapse ? MAX_HEIGHT : MIN_HEIGHT;
    const to = collapse ? MIN_HEIGHT : MAX_HEIGHT;
    const content = this.element;
    const transition = [{ height: from }, { height: to }];

    this.cancelAnimation();
    const animation = content.animate(transition, COLLAPSE_EXPAND_ANI_CONFIG);
    this.animating = true;

    this._aniSubscription = fromEvent(animation, 'finish')
      .pipe(take(1))
      .subscribe(this.animationFinish);

    this._contentAnimation = animation;
  }

  animationFinish = () => {
    this.animating = false;
    this._cdRef.markForCheck();
  };

  onCollapseClick() {
    this.collapsed = !this.collapsed;
    this.animateContentHeight(this.collapsed);
    this._cdRef.markForCheck();
  }
}
