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
import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject, Subscription } from 'rxjs';
import { PropertiesService } from '../properties/properties.service';
import { ProjectContentService } from '../../../../database/changes/project-content.service';
import { distinctUntilChanged, filter } from 'rxjs/operators';
import { areObjectsEqual } from 'cd-utils/object';
import { ILayersNode } from '../../interfaces/layers.interface';
import {
  generateLayersTreeNodes,
  haveIdsOrNamesChanged,
} from '../../components/layers-tree/layers-tree.utils';

@Injectable({
  providedIn: 'root',
})
export class LayersTreeService {
  private _subscriptions = new Subscription();
  private _currentHomeBoardId?: string;
  private _currentOutletFrameIds: string[] = [];

  public treeNodes$ = new BehaviorSubject<ILayersNode[]>([]);

  constructor(
    private _propertiesService: PropertiesService,
    private _projectContentService: ProjectContentService,
    private _zone: NgZone
  ) {
    const homeBoardId$ = this._projectContentService.homeBoardId$;

    const outletFrames$ = this._propertiesService.currentOutletFrames$.pipe(
      distinctUntilChanged((x, y) => haveIdsOrNamesChanged(x, y)),
      filter((values) => values.length > 0)
    );

    this._subscriptions.add(homeBoardId$.subscribe(this._onHomeBoardId));
    this._subscriptions.add(outletFrames$.subscribe(this._onOutletFrames));
  }

  get treeNodes() {
    return this.treeNodes$.getValue();
  }

  set treeNodes(update) {
    if (areObjectsEqual(this.treeNodes, update)) return;
    this._zone.run(() => {
      this.treeNodes$.next(update);
    });
  }

  public updateTreeNodes() {
    this._zone.runOutsideAngular(() => {
      const { _currentOutletFrameIds, _currentHomeBoardId } = this;
      const { records } = this._projectContentService.elementContent$.value;
      const nodes = generateLayersTreeNodes(_currentOutletFrameIds, records, _currentHomeBoardId);
      this.treeNodes = nodes;
    });
  }

  private _onOutletFrames = (outletFrames: cd.RootElement[]) => {
    this._currentOutletFrameIds = outletFrames.map((f) => f.id);
    this.updateTreeNodes();
  };

  private _onHomeBoardId = (homeBoardId: string | undefined) => {
    this._currentHomeBoardId = homeBoardId;
    this.updateTreeNodes();
  };
}
