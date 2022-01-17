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
import { Injectable, OnDestroy } from '@angular/core';
import { Store, select } from '@ngrx/store';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { map, distinctUntilChanged } from 'rxjs/operators';
import { IProjectState } from '../../store/reducers';
import { getAssetsIds } from '../../store/selectors/project-data.selector';
import { RendererService } from '../../../../services/renderer/renderer.service';
import { ProjectDataUpdate } from '../../store/actions/project-data.action';
import { AssetsDeleted, AssetReplace, AssetsNameChanged } from '../../store/actions/assets.action';

@Injectable({
  providedIn: 'root',
})
export class AssetsService implements OnDestroy {
  public assetsStream$ = new BehaviorSubject<cd.IProjectAssets>({});
  private _orderedAssetsStream = new BehaviorSubject<cd.IOrderedProjectAssets>([]);
  private _subscriptions = new Subscription();
  private _orderedAssetsIds: string[] = [];
  private _orderedAssetsIds$: Observable<string[]>;

  public get assets$(): Observable<cd.IProjectAssets> {
    return this.assetsStream$.asObservable();
  }

  public get orderedAssets$(): Observable<cd.IOrderedProjectAssets> {
    return this._orderedAssetsStream.asObservable();
  }

  public getAssetForId(id: string): cd.IProjectAsset {
    const stream = this.assetsStream$.getValue();
    return stream[id];
  }

  public getAsset$ = (id: string): Observable<cd.IProjectAsset> => {
    return this.assetsStream$.pipe(
      map((assets) => assets[id]),
      distinctUntilChanged()
    );
  };

  constructor(
    private readonly _projectStore: Store<IProjectState>,
    private readonly _rendererService: RendererService
  ) {
    this._orderedAssetsIds$ = this._projectStore.pipe(select(getAssetsIds));
    this._subscriptions.add(this._orderedAssetsIds$.subscribe(this.onProjectAssetsIdsSubscription));
  }

  ngOnDestroy(): void {
    this._subscriptions.unsubscribe();
  }

  public onDisconnectProject = () => {
    this.assetsStream$.next({});
  };

  private onProjectAssetsIdsSubscription = (assetsIds: string[]) => {
    this._orderedAssetsIds = assetsIds;
    this.emitOrdered();
  };

  private emitOrdered = () => {
    const { _orderedAssetsIds, assetsStream$, _orderedAssetsStream } = this;
    if (!_orderedAssetsIds) return;
    const assets = assetsStream$.getValue();
    const ordered = _orderedAssetsIds.map((id) => assets[id]).filter((asset) => !!asset);
    _orderedAssetsStream.next(ordered);
  };

  private emit = (assets: cd.IProjectAssets) => {
    const { assetsStream$ } = this;
    assetsStream$.next(assets);
    this.emitOrdered();
  };

  private addOrUpdate = (id: string, asset: cd.IProjectAsset) => {
    const { assetsStream$, _rendererService } = this;
    const assets = assetsStream$.getValue();
    const newAssets = { ...assets, [id]: asset };
    _rendererService.updateProjectAsset(asset);
    this.emit(newAssets);
  };

  private delete = (id: string) => {
    const { assetsStream$, _rendererService } = this;
    const assets = assetsStream$.getValue();
    const newAssets = { ...assets };
    delete newAssets[id];
    _rendererService.deleteProjectAsset([id]);
    this.emit(newAssets);
  };

  public addAssetDocuments = (assets: cd.IProjectAsset[]) => {
    for (const newAsset of assets) {
      const { id } = newAsset;
      const currentAssets = this.assetsStream$.getValue();

      // Project load (only insert when urls are available. If urls are not
      // available, they will become available in the future (as processed
      // by cloud functions), and this method will accordingly be triggered again
      // with urls)
      if (!currentAssets.hasOwnProperty(id) && newAsset.urls) {
        this.addOrUpdate(id, newAsset);
      }
    }
  };

  public addMultipleUploadingAssets = (assets: cd.IProjectAsset[]) => {
    for (const asset of assets) {
      this.addUploadingAsset(asset);
    }
  };

  public addUploadingAsset = (asset: cd.IProjectAsset) => {
    const { id } = asset;
    const newOrderedIds = [id, ...this._orderedAssetsIds];
    this._projectStore.dispatch(new ProjectDataUpdate({ assetIds: newOrderedIds }, false));
    this.addOrUpdate(id, asset);
  };

  public onUrlChangedFromRemote = (id: string, urls: cd.ProjectAssetUrls) => {
    const asset = this.assetsStream$.getValue()[id];
    if (!asset) return;
    this.addOrUpdate(id, { ...asset, urls: { ...asset.urls, ...urls } });
  };

  public onNameChanged = (id: string, name: string) => {
    const asset = this.assetsStream$.getValue()[id];
    if (name === asset.name) return;
    this.addOrUpdate(id, { ...asset, name });
    this._projectStore.dispatch(new AssetsNameChanged(id, name));
  };

  public deleteAsset = (id: string) => {
    this.delete(id);
    const oldOrderedIds = this._orderedAssetsIds || [];
    const newOrderedIds = oldOrderedIds.filter((oldId) => oldId !== id);
    this._projectStore.dispatch(new ProjectDataUpdate({ assetIds: newOrderedIds }));
    this._projectStore.dispatch(new AssetsDeleted(id));
  };

  replaceAsset = (oldId: string, replacementId: string, replacementValue: string) => {
    this.delete(oldId);
    const oldOrderedIds = this._orderedAssetsIds || [];
    const newOrderedIds = oldOrderedIds.filter((id) => id !== oldId);
    this._projectStore.dispatch(new ProjectDataUpdate({ assetIds: newOrderedIds }));
    this._projectStore.dispatch(new AssetReplace(oldId, replacementId, replacementValue));
  };
}
