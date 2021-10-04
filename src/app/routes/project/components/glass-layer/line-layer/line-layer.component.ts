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
  OnInit,
  OnDestroy,
} from '@angular/core';
import { InteractionService } from '../../../services/interaction/interaction.service';
import { ILine } from 'cd-interfaces';
import { Subscription } from 'rxjs';

@Component({
  selector: 'g[app-line-layer]',
  templateUrl: './line-layer.component.html',
  styleUrls: ['./line-layer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LineLayerComponent implements OnInit, OnDestroy {
  private _subscription = Subscription.EMPTY;
  public lines: ILine[] = [];

  constructor(private _interactionService: InteractionService, private _cdRef: ChangeDetectorRef) {}

  ngOnDestroy(): void {
    this._subscription.unsubscribe();
  }

  ngOnInit(): void {
    this._cdRef.detach();
    this._subscription = this._interactionService.linePoints$.subscribe(this._onLinePoints);
  }

  private _onLinePoints = (lines: ILine[]) => {
    if (this.lines.length === 0 && lines.length === 0) return;
    this.lines = lines;
    this._cdRef.detectChanges();
  };
}
