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

import { SymbolScreenshotsService } from 'src/app/routes/project/services/symbol-screenshots/symbol-screenshots.service';
import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter } from '@angular/core';
import * as config from '../../../../configs/custom-component.config';
import * as cd from 'cd-interfaces';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-component-tile',
  templateUrl: './component-tile.component.html',
  styleUrls: ['./component-tile.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ComponentTileComponent {
  private _id?: string;
  public imgLoaded = false;
  public img?: Observable<string | undefined>;

  @Input()
  set id(id: string | undefined) {
    if (this._id === id) return;
    this._id = id;
    if (!id) return;
    this.img = this._symbolScreenshotsService.subscribeToSymbolScreenshot(id);
  }
  get id() {
    return this._id;
  }

  @Input() name?: string;
  @Input() projectId?: string;
  @Input() screenshot?: cd.IScreenshotLookup;
  @Input() isAdmin = false;

  @Output() edit = new EventEmitter<void>();
  @Output() delete = new EventEmitter<void>();
  @Output() viewDetails = new EventEmitter<void>();

  constructor(private _symbolScreenshotsService: SymbolScreenshotsService) {}

  get menuConfig(): cd.IMenuConfig[][] {
    return this.isAdmin ? config.customCmpTileMenuConfigAdmin : config.customCmpTileMenuConfig;
  }

  get title(): string {
    return this.name || config.UNTITLED_CUSTOM_COMPONENT_NAME;
  }

  onImgLoad() {
    this.imgLoaded = true;
  }

  showDetails(e?: MouseEvent) {
    if (e) {
      e.stopImmediatePropagation();
      e.preventDefault();
    }
    this.viewDetails.emit();
  }

  onMenuSelect({ id }: cd.IMenuConfig) {
    if (id === config.CustomComponentTileAction.Edit) this.edit.emit();
    if (id === config.CustomComponentTileAction.ViewDetails) this.showDetails();
    if (id === config.CustomComponentTileAction.Delete) this.delete.emit();
    if (id === config.CustomComponentTileAction.RegenerateScreenshot) return this.regenScreenshot();
  }

  regenScreenshot() {
    const { id, projectId } = this;
    if (!id || !projectId) return;
    this._symbolScreenshotsService.regenerateSymbolScreenshot(id, projectId);
  }
}
