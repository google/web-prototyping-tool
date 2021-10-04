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
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  OnDestroy,
  OnInit,
  Output,
  SecurityContext,
  Optional,
  ChangeDetectorRef,
} from '@angular/core';
import { BehaviorSubject, Observable, Subscription, animationFrameScheduler } from 'rxjs';
import { AbstractOverlayContentDirective, OverlayInitService } from 'cd-common';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer } from '@angular/platform-browser';
import { auditTime, take, retry } from 'rxjs/operators';
import { buildAssetSections } from './asset-importer.utils';
import { select, Store } from '@ngrx/store';
import * as appStoreModule from 'src/app/store';
import * as cd from 'cd-interfaces';

const DEBOUNCE_BUFFER = 16;
const ASSET_SRC_URL = '/assets/assets-gallery/cloud-catalog/cloud-assets.json';

enum PreviewBackground {
  Dark = 'dark-preview',
  Light = 'light-preview',
}

@Component({
  selector: 'app-assets-importer',
  templateUrl: './assets-importer.component.html',
  styleUrls: ['./assets-importer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AssetsImporterComponent
  extends AbstractOverlayContentDirective
  implements OnInit, AfterViewInit, OnDestroy
{
  private _subscriptions = new Subscription();
  private _slider$ = new BehaviorSubject(1);

  public selectedAssets = new Set<string>();
  public sliderValue$: Observable<number>;
  public assets: cd.IAssetsImporterItem[] = [];
  public darkPreview = false;
  public init = false;
  public query = '';
  public selectedSection = '';
  public sections: string[] = [];

  @Output() addSelectedFiles = new EventEmitter<string[]>();

  constructor(
    @Optional() private _httpClient: HttpClient,
    private _sanitizer: DomSanitizer,
    private _appStore: Store<appStoreModule.IAppState>,
    private _cdRef: ChangeDetectorRef,
    _overlayInit: OverlayInitService
  ) {
    super(_overlayInit);
    this.sliderValue$ = this._slider$.pipe(auditTime(DEBOUNCE_BUFFER, animationFrameScheduler));
  }

  get previewBackground() {
    return this.darkPreview ? PreviewBackground.Dark : PreviewBackground.Light;
  }

  ngAfterViewInit() {
    super.ngAfterViewInit();
    this.init = true;
  }

  ngOnDestroy(): void {
    this._subscriptions.unsubscribe();
  }

  ngOnInit() {
    const darkTheme$ = this._appStore.pipe(select(appStoreModule.getDarkTheme));
    this._subscriptions.add(darkTheme$.subscribe(this.onDarkTheme));
    this.loadAssetsData();
  }

  loadAssetsData() {
    this._subscriptions.add(
      this._httpClient
        .get<cd.IAssetsImporterItem[]>(this.assetURL, {
          responseType: 'json',
          withCredentials: true,
        })
        .pipe(retry(3), take(1))
        .subscribe(this.onAssetsLoaded)
    );
  }

  onDarkTheme = (darkTheme: boolean) => {
    this.darkPreview = darkTheme;
  };

  get assetURL() {
    const url = this._sanitizer.bypassSecurityTrustResourceUrl(ASSET_SRC_URL);
    return this._sanitizer.sanitize(SecurityContext.RESOURCE_URL, url) || '';
  }

  onAssetsLoaded = (assets: cd.IAssetsImporterItem[]) => {
    this.assets = assets;
    const sections = buildAssetSections(assets);
    this.sections = sections;
    this.selectedSection = sections[0];
    this._cdRef.markForCheck();
  };

  onAddSelected() {
    this.addSelectedFiles.emit([...this.selectedAssets]);
    this.dismissOverlay.emit();
  }

  onCancel() {
    this.dismissOverlay.emit();
  }

  onClearSelection() {
    this.selectedAssets = new Set();
    this._cdRef.markForCheck();
  }

  onDarkPreviewToggle() {
    this.darkPreview = !this.darkPreview;
  }

  onSearchValueChange(value: string) {
    this.query = value;
  }

  onSectionClick(section: string) {
    this.selectedSection = section;
    this.query = '';
  }

  onSizeSliderChange = (event: number) => {
    this._slider$.next(event);
  };

  onVariantSelectionAdd(variantSrc: string) {
    const selected = new Set(this.selectedAssets);
    selected.add(variantSrc);
    this.selectedAssets = selected;
    this._cdRef.markForCheck();
  }

  onVariantSelectionRemove(variantSrc: string) {
    const selected = new Set(this.selectedAssets);
    selected.delete(variantSrc);
    this.selectedAssets = selected;
    this._cdRef.markForCheck();
  }

  onVariantSelectionRemoveAll(variantSources: string[]) {
    const selected = new Set(this.selectedAssets);
    for (const src of variantSources) {
      selected.delete(src);
    }

    this.selectedAssets = selected;
    this._cdRef.markForCheck();
  }

  trackByAssetFn(_index: number, asset: cd.IAssetsImporterItem) {
    return _index + asset.dir + asset.name;
  }
}
