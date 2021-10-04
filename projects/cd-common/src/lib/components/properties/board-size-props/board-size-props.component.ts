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

import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter } from '@angular/core';
import { ILockingRect, ISelectItem, SelectItemType } from 'cd-interfaces';

export interface IBoardSizePreset {
  id: string;
  title: string;
  icon: string;
  width: number;
  height: number;
}

type PartialLock = Pick<ILockingRect, 'width' | 'height' | 'locked'>;
@Component({
  selector: 'cd-board-size-props',
  templateUrl: './board-size-props.component.html',
  styleUrls: ['./board-size-props.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BoardSizePropsComponent {
  private _sizeConfig: IBoardSizePreset[] = [];
  public frame: PartialLock = { width: 0, height: 0, locked: false };
  public sizeMenuData: ISelectItem[] = [];

  @Input()
  public set sizeConfig(value: IBoardSizePreset[]) {
    this._sizeConfig = value;
    this.updatePresetMenu(this.frame);
  }
  public get sizeConfig(): IBoardSizePreset[] {
    return this._sizeConfig;
  }

  @Input() minBoardSize = 0;
  @Input() maxBoardSize = 0;

  @Input()
  set size(value: ILockingRect) {
    const { x, y, ...frame } = value;
    this.frame = frame;
    this.updatePresetMenu(frame);
  }

  @Output() sizeChange = new EventEmitter<PartialLock>();

  updatePresetMenu(frame: PartialLock) {
    const { width, height } = frame;
    const { sizeConfig } = this;
    const type = SelectItemType.Icon;

    this.sizeMenuData = [...sizeConfig].map((item: IBoardSizePreset) => {
      const { width: w, height: h, title, id: value, icon } = item;
      const selected = (width === w && height === h) || (width === h && height === w);
      return { title, value, selected, icon, type };
    });
  }

  toggleLock() {
    const { locked } = this.frame;
    this.updateSize({ locked: !locked });
  }

  onSizeToggle() {
    const { width, height } = this.frame;
    this.updateDimensions(height, width);
  }

  updateSize(rect: Partial<PartialLock>) {
    const frame: PartialLock = { ...this.frame, ...rect };
    this.sizeChange.emit(frame);
  }

  updateDimensions(width: number, height: number) {
    this.updateSize({ width, height });
  }

  onWidthChange(value: string | number) {
    const { locked, height: h, width: w } = this.frame;

    const width = Number(value);
    const aspectRatio = w / h;
    const height = locked ? width / aspectRatio : h;

    this.updateDimensions(width, Math.round(height));
  }

  onHeightChange(value: string | number) {
    const { locked, width: w, height: h } = this.frame;
    const height = Number(value);
    const aspectRatio = h / w;
    const width = locked ? height / aspectRatio : w;
    this.updateDimensions(Math.round(width), height);
  }

  onSizePreset(preset: ISelectItem) {
    if (preset.index === undefined) return;
    const { frame, sizeConfig } = this;
    const { width, height } = sizeConfig[preset.index];
    const isCurrentLandscape = frame.width > frame.height;
    const isLandscape = width > height;
    const orientaion = isLandscape !== isCurrentLandscape;
    const w = orientaion ? height : width;
    const h = orientaion ? width : height;
    this.updateDimensions(w, h);
  }
}
