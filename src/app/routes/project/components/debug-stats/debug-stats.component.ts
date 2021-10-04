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
  OnDestroy,
  ChangeDetectorRef,
  OnInit,
} from '@angular/core';
import { IAppState, getDebugStats, getDebugCanvas, getDebugDragAndDrop } from 'src/app/store';
import { Store, select } from '@ngrx/store';
import { Subscription, Observable } from 'rxjs';
import { switchMap, takeWhile } from 'rxjs/operators';
import { isBoard, isSymbol, getModels } from 'cd-common/models';
import { CanvasService } from '../../services/canvas/canvas.service';
import { ICanvas } from 'cd-interfaces';
import { ProjectContentService } from 'src/app/database/changes/project-content.service';

@Component({
  selector: 'app-debug-stats',
  templateUrl: './debug-stats.component.html',
  styleUrls: ['./debug-stats.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DebugStatsComponent implements OnInit, OnDestroy {
  private _subscription = new Subscription();
  public elementCount = 0;
  public boardCount = 0;
  public symbolCount = 0;
  public canvas?: ICanvas;
  public debugStats$: Observable<boolean> = this._appStore.pipe(select(getDebugStats));
  public debugCanvas$: Observable<boolean> = this._appStore.pipe(select(getDebugCanvas));
  public debugDragAndDrop$: Observable<boolean> = this._appStore.pipe(select(getDebugDragAndDrop));
  public targetDndId = '';
  public prevDndId = '';

  constructor(
    private _cdRef: ChangeDetectorRef,
    private _canvasService: CanvasService,
    private _appStore: Store<IAppState>,
    private projectContentService: ProjectContentService
  ) {}

  ngOnInit() {
    this._subscription.add(
      this.debugStats$
        .pipe(
          switchMap((value) =>
            this.projectContentService.elementProperties$.pipe(takeWhile(() => value === true))
          )
        )
        .subscribe((items) => {
          const models = getModels(items);
          this.boardCount = models.filter((item) => isBoard(item)).length;
          this.symbolCount = models.filter((item) => isSymbol(item)).length;
          this.elementCount = models.length;
          this._cdRef.markForCheck();
        })
    );

    this._subscription.add(
      this.debugCanvas$
        .pipe(
          switchMap((value) => this._canvasService.canvas$.pipe(takeWhile(() => value === true)))
        )
        .subscribe((canvas) => {
          this.canvas = canvas;
          this._cdRef.markForCheck();
        })
    );
  }

  ngOnDestroy(): void {
    this._subscription.unsubscribe();
  }
}
