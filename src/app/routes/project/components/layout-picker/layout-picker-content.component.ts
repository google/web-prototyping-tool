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
  Optional,
  ChangeDetectorRef,
  Output,
  EventEmitter,
  Input,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { take } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import * as cd from 'cd-interfaces';

const LAYOUT_BASE_URL = '/assets/layouts';
const IMG_PREVIEW_PATH = 'previews';
const DEF_SRC_PATH = 'defs';
const REGISTRY_URL = `${LAYOUT_BASE_URL}/registry.json`;
const JSON_EXT = '.json';
const SVG_EXT = '.svg';

interface ILayoutRegistryItem {
  id: string;
  label: string;
  src: string;
  preview: string;
}

@Component({
  selector: 'app-layout-picker-content',
  templateUrl: './layout-picker-content.component.html',
  styleUrls: ['./layout-picker-content.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayoutPickerContentComponent implements OnInit, OnDestroy {
  private _subscription = new Subscription();
  public layouts: ILayoutRegistryItem[] = [];
  public loading = true;

  @Input() showBackBtn = false;
  @Output() selectLayout = new EventEmitter<cd.ILayoutDefinition>();
  @Output() exit = new EventEmitter<void>();

  constructor(@Optional() private _httpClient: HttpClient, private _cdRef: ChangeDetectorRef) {}

  ngOnDestroy(): void {
    this._subscription.unsubscribe();
  }

  ngOnInit(): void {
    this.loadLayouts();
  }

  onBackBtnClick() {
    this.exit.emit();
  }

  loadLayouts() {
    const req$ = this.request<ILayoutRegistryItem[]>(REGISTRY_URL);
    this._subscription.add(req$.subscribe(this.onLayoutLoad));
  }

  onLayoutLoaded = (layout: cd.ILayoutDefinition) => {
    this.selectLayout.emit(layout);
    this._cdRef.markForCheck();
  };

  getLayoutURL(id: string, path: string, ext: string): string {
    return `${LAYOUT_BASE_URL}/${path}/${id}${ext}`;
  }

  request<T>(url: string) {
    return this._httpClient.get<T>(url, { withCredentials: true }).pipe(take(1));
  }

  onLayoutClick(id: string) {
    const src = this.getLayoutURL(id, DEF_SRC_PATH, JSON_EXT);
    this.loading = true;
    this._subscription.add(this.request<cd.ILayoutDefinition>(src).subscribe(this.onLayoutLoaded));
  }

  trackByFn(_idx: number, item: ILayoutRegistryItem) {
    return item.id;
  }

  onLayoutLoad = (layouts: ILayoutRegistryItem[]) => {
    this.loading = false;
    this.layouts = layouts.map((item) => {
      const url = this.getLayoutURL(item.id, IMG_PREVIEW_PATH, SVG_EXT);
      const preview = `url("${url}")`;
      return { ...item, preview };
    });
    this._cdRef.markForCheck();
  };
}
