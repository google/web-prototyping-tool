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
  ViewChild,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
} from '@angular/core';
import { Store, select } from '@ngrx/store';
import { auditTime, distinctUntilChanged, map } from 'rxjs/operators';
import { Observable, Subject, Subscription } from 'rxjs';
import { IAppState, getUserSettings } from 'src/app/store';
import { ISelectionState } from '../../../store/reducers/selection.reducer';
import { IToggleElementsHidden, ILabelUpdate } from '../../../interfaces/layers.interface';
import { LayersTreeComponent } from '../../layers-tree/layers-tree.component';
import { buildPropertyUpdatePayload } from 'cd-common/utils';
import * as projectStoreModule from '../../../store';

const SEARCH_BUFFER = 100;

@Component({
  selector: 'app-layers-panel',
  templateUrl: './layers-panel.component.html',
  styleUrls: ['./layers-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayersPanelComponent implements OnInit, OnDestroy {
  private _subscription = new Subscription();
  private _searchValue$ = new Subject<string>();
  public selectionState$: Observable<ISelectionState>;

  public showLayersIndent = false;
  public searchValue = '';

  @Input() homeBoardId?: string;

  @ViewChild('layersTreeRef', { read: LayersTreeComponent, static: true })
  _layersTreeRef!: LayersTreeComponent;

  constructor(
    private _cdRef: ChangeDetectorRef,
    private readonly _appStore: Store<IAppState>,
    private readonly _projectStore: Store<projectStoreModule.IProjectState>
  ) {
    this.selectionState$ = _projectStore.pipe(select(projectStoreModule.getSelectionState));
  }

  ngOnDestroy(): void {
    this._subscription.unsubscribe();
  }

  ngOnInit(): void {
    const showLayersIndent$ = this._appStore.pipe(select(getUserSettings)).pipe(
      map((settings) => settings.showLayersIndent),
      distinctUntilChanged()
    );

    this._subscription.add(showLayersIndent$.subscribe(this.onShowLayersIndent));

    this._subscription.add(
      this._searchValue$.pipe(auditTime(SEARCH_BUFFER)).subscribe(this.onSearch)
    );
  }

  onShowLayersIndent = (show: boolean) => {
    this.showLayersIndent = show;
    this._cdRef.markForCheck();
  };

  onSearchValueChange(value: string) {
    this._searchValue$.next(value);
  }

  onSearch = (value: string) => {
    this.searchValue = value;
    this._cdRef.markForCheck();
  };

  onToggleHidden(e: IToggleElementsHidden) {
    const { _projectStore } = this;
    const { hidden, elementIds } = e;
    const updates = Array.from(elementIds).map((elementId) => {
      return buildPropertyUpdatePayload(elementId, { inputs: { hidden } });
    });
    _projectStore.dispatch(new projectStoreModule.ElementPropertiesUpdate(updates));
  }

  onLabelChange(e: ILabelUpdate) {
    const { _projectStore } = this;
    const { id: elementId, label: name } = e;
    const payload = { elementId, properties: { name } };
    _projectStore.dispatch(new projectStoreModule.ElementPropertiesUpdate([payload]));
  }

  onCollapseAll() {
    this._layersTreeRef.collapseAllNodes();
  }
}
