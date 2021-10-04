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
  OnInit,
  ChangeDetectionStrategy,
  OnDestroy,
  ChangeDetectorRef,
} from '@angular/core';
import { RendererService } from 'src/app/services/renderer/renderer.service';
import { ActivatedRoute, Params } from '@angular/router';
import * as cd from 'cd-interfaces';
import { Subscription } from 'rxjs';
import { IOutlets, createProp, IOutletList } from './embed-view.utils';
import { ProjectContentService } from 'src/app/database/changes/project-content.service';

@Component({
  selector: 'app-embed-view',
  templateUrl: './embed-view.component.html',
  styleUrls: ['./embed-view.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmbedViewComponent implements OnInit, OnDestroy {
  private _subscription = new Subscription();
  public outletMap = new Map<string, IOutlets>();
  public init = false;
  public id = '';

  constructor(
    private _projectContentService: ProjectContentService,
    private _activatedRoute: ActivatedRoute,
    private _cdRef: ChangeDetectorRef,
    public _renderer: RendererService
  ) {}

  get active() {
    return this.outletMap.get(this.id);
  }

  ngOnInit() {
    const outlets$ = this._projectContentService.outletFrames$;
    const codeComps$ = this._projectContentService.codeCmpArray$;
    const params$ = this._activatedRoute.queryParams;
    this._subscription.add(codeComps$.subscribe(this._onCodeComponentsSubscription));
    this._subscription.add(outlets$.subscribe(this._onOutletsSubscription));
    this._subscription.add(params$.subscribe(this._onQueryParams));
  }

  private _onQueryParams = (params: Params) => {
    this.id = params?.id ?? '';
    this._cdRef.markForCheck();
  };

  private _processOutlets = (items: IOutletList, isCodeComp: boolean) => {
    for (const comp of items) {
      this.outletMap.set(comp.id, createProp(comp.id, comp.frame, isCodeComp));
    }
  };

  private _onCodeComponentsSubscription = (codeComponents: cd.ICodeComponentDocument[]) => {
    this._processOutlets(codeComponents, true);
    this._cdRef.markForCheck();
  };

  private _onOutletsSubscription = ({ symbols, boards }: cd.IOutletFrameSubscription) => {
    this._processOutlets([...symbols, ...boards], false);
    this._cdRef.markForCheck();
  };

  ngOnDestroy() {
    this._subscription.unsubscribe();
  }
}
