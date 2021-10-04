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

import { Component, ChangeDetectionStrategy, Input, HostBinding } from '@angular/core';
import { coerceBooleanProperty } from '@angular/cdk/coercion';
import { zoomLevelPercent } from '../glass.utils';

const FONT_SPACING = 6.8;
const TEXT_OFFSET_X = 8;
const TEXT_OFFSET_Y = 16;
const CORNER_RADIUS = 4;
const RECT_BKD_HEIGHT = 24;

@Component({
  selector: 'g[app-info-text]',
  templateUrl: './info-text.component.html',
  styleUrls: ['./info-text.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InfoTextComponent {
  public static BKD_HEIGHT = RECT_BKD_HEIGHT;
  public static FONT_SPACING = FONT_SPACING;
  public static TEXT_OFFSET_X = TEXT_OFFSET_X;

  private _defaultTextOffsetY = TEXT_OFFSET_Y;
  private _defaultBkdHeight = RECT_BKD_HEIGHT;
  private _defaultRadius = CORNER_RADIUS;
  private _zoom = 1;
  private _text = '';
  public bkdWidth = 0;
  public bkdHeight = 0;
  public fontSize = '';
  public cornerRadius = 0;
  public textX = TEXT_OFFSET_X;
  public textY = TEXT_OFFSET_Y;

  @HostBinding('class.label') labelMode = false;

  @Input()
  public set labelStyle(value: string | boolean) {
    const isLabelMode = coerceBooleanProperty(value);
    this.labelMode = isLabelMode;
    this._defaultRadius = isLabelMode ? 0 : CORNER_RADIUS;
    this._defaultBkdHeight = isLabelMode ? 20 : RECT_BKD_HEIGHT;
    this._defaultTextOffsetY = isLabelMode ? 13 : TEXT_OFFSET_Y;
  }

  @Input()
  public set text(value: string) {
    this._text = value;
    this.updateBkdWidth();
  }
  public get text() {
    return this._text;
  }

  updateBkdWidth() {
    this.bkdWidth = (this.text.length * FONT_SPACING + TEXT_OFFSET_X * 2) / this._zoom;
  }

  @Input() set zoom(zoom: number) {
    this.fontSize = zoomLevelPercent(zoom);
    this.bkdHeight = this._defaultBkdHeight / zoom;
    this.textX = TEXT_OFFSET_X / zoom;
    this.textY = this._defaultTextOffsetY / zoom;
    this.cornerRadius = Math.round(this._defaultRadius / zoom);
    this._zoom = zoom;
    this.updateBkdWidth();
  }

  get zoom() {
    return this._zoom;
  }
}
