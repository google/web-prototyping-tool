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

import { SymbolScreenshotsService } from '../services/symbol-screenshots/symbol-screenshots.service';
import { Injectable, Renderer2, RendererFactory2 } from '@angular/core';
import { translate3d, assignGlobalCursor, CursorState, CursorStateType } from 'cd-utils/css';
import { AssetsService } from '../services/assets/assets.service';
import { DEFAULT_UNITS, DIV_TAG } from 'cd-common/consts';
import { getElementBaseStyles } from 'cd-common/utils';
import { DragItemType } from './dnd-utils';
import { IPoint } from 'cd-utils/geometry';
import * as cd from 'cd-interfaces';

// CSS defined in /src/styles/ghost.scss
const enum GhostCSSClass {
  Default = 'dnd-ghost',
  Surface = 'surface',
  Tree = 'tree',
  Image = 'image',
  Thumbnail = 'thumbnail',
  SymbolThumb = 'symbol-thumbnail',
}

const MAX_IMAGE_HEIGHT = 112;
const MAX_IMAGE_WIDTH = 240;
const MAX_SYMBOL_WIDTH = 110;
const MAX_SYMBOL_HEIGHT = 72;
const BORDER_RADIUS = 'var(--cd-border-radius-1)';
const OFFSCREEN_POSITION = -10000;
const DATA_LABEL = 'data-label';

/**
 * The DND Ghost service is responsible for visualizing the drag item
 */
@Injectable({ providedIn: 'root' })
export class DndGhostService {
  private _dragType: DragItemType = DragItemType.Default;
  protected _ghostIds: string[] = [];
  private _cursorState: CursorStateType = CursorState.Default;
  private _renderer: Renderer2;
  private _ghostElem?: HTMLElement;

  private _initalWidth = 0;
  private _initalHeight = 0;
  private _width = 0;
  private _height = 0;
  private _offsetX = 0;
  private _offsetY = 0;

  constructor(
    protected rendererFactory: RendererFactory2,
    private _imageAssetService: AssetsService,
    private _symScreenshotService: SymbolScreenshotsService
  ) {
    this._renderer = rendererFactory.createRenderer(null, null);
  }

  setSize(renderer: Renderer2, ghost: HTMLElement, width: number, height: number) {
    const w = Math.round(width);
    const h = Math.round(height);
    renderer.setStyle(ghost, 'width', w + DEFAULT_UNITS);
    renderer.setStyle(ghost, 'height', h + DEFAULT_UNITS);
    this._initalWidth = w;
    this._initalHeight = h;
  }

  assignGhostType(renderer: Renderer2, ghost: HTMLElement, dragType: DragItemType) {
    renderer.addClass(ghost, GhostCSSClass.Default);
    this._dragType = dragType;
    if (dragType === DragItemType.TreeNode) return renderer.addClass(ghost, GhostCSSClass.Tree);
  }

  setPosition(_renderer: Renderer2, ghost: HTMLElement, x: number, y: number) {
    ghost.style.transform = translate3d(x, y);
  }

  setRoundedCorners(renderer: Renderer2, ghost: HTMLElement) {
    renderer.setStyle(ghost, 'border-radius', BORDER_RADIUS);
  }

  createGhost(
    ids: string[],
    width: number,
    height: number,
    dragType: DragItemType,
    label = '',
    roundCorners = false
  ) {
    const { _renderer } = this;
    const ghost = _renderer.createElement(DIV_TAG);
    this.setSize(_renderer, ghost, width, height);
    if (label) _renderer.setAttribute(ghost, DATA_LABEL, label);
    this.setPosition(_renderer, ghost, OFFSCREEN_POSITION, OFFSCREEN_POSITION);
    this.assignGhostType(_renderer, ghost, dragType);
    if (roundCorners) this.setRoundedCorners(_renderer, ghost);
    _renderer.appendChild(document.body, ghost);
    this._ghostElem = ghost;
    this._ghostIds = ids;
  }

  set globalCursor(value: CursorStateType) {
    if (value === this._cursorState) return;
    this._cursorState = value;
    assignGlobalCursor(value);
  }

  urlForAsset(asset: cd.IProjectAsset, thumbnail: boolean): string | undefined {
    if (!asset?.urls) return;
    return thumbnail
      ? asset.urls[cd.AssetSizes.BigThumbnailXHDPI]
      : asset.urls[cd.AssetSizes.Original];
  }

  setImageForSymbol(id: string, thumbnail: boolean) {
    const { _renderer, _ghostElem } = this;
    if (!_ghostElem) return;
    const item = this._symScreenshotService.screenshotForId(id);
    const url = item && item.url;
    if (!url) return;
    if (thumbnail) {
      this.setSize(_renderer, _ghostElem, MAX_SYMBOL_WIDTH, MAX_SYMBOL_HEIGHT);
      _renderer.addClass(_ghostElem, GhostCSSClass.SymbolThumb);
    }

    this.assignImage(_renderer, _ghostElem, url);
  }

  setAsImageThumbnail(assetId: string) {
    const { _renderer, _ghostElem } = this;
    if (!_ghostElem) return;
    const asset = this._imageAssetService.getAssetForId(assetId);
    const url = this.urlForAsset(asset, true);
    if (!url) return;
    this.setSize(_renderer, _ghostElem, MAX_IMAGE_WIDTH, MAX_IMAGE_HEIGHT);
    _renderer.addClass(_ghostElem, GhostCSSClass.Thumbnail);
    this.assignImage(_renderer, _ghostElem, url);
  }

  setAssetPanelImage(assetId: string, element: cd.PropertyModel, width: number, height: number) {
    const backgroundSize = getElementBaseStyles(element)?.objectFit;
    this.setAsImage(assetId, width, height, backgroundSize);
  }

  setAsImage(assetId: string, width: number, height: number, backgroundSize = cd.ObjectFit.Cover) {
    const { _renderer, _ghostElem } = this;
    if (!_ghostElem) return;
    const asset = this._imageAssetService.getAssetForId(assetId);
    const url = this.urlForAsset(asset, false);

    if (width && height) {
      this.setSize(_renderer, _ghostElem, width, height);
      _renderer.setStyle(_ghostElem, 'background-size', backgroundSize);
    }

    if (!url) return;
    this.assignImage(_renderer, _ghostElem, url);
  }

  assignImage(renderer: Renderer2, ghost: HTMLElement, url: string) {
    renderer.setStyle(ghost, 'background-image', `url(${url})`);
    renderer.addClass(ghost, GhostCSSClass.Image);
  }

  moveGhost({ x, y }: IPoint) {
    if (!this._ghostElem) return;
    const { _offsetX, _offsetY } = this;
    this.setPosition(this._renderer, this._ghostElem, x + _offsetX, y + _offsetY);
  }

  updateGhostSize(bounds: cd.IRect | undefined, initalOffset: IPoint, _zoom?: number) {
    const { _ghostElem, _initalWidth, _dragType, _initalHeight } = this;
    if (!_ghostElem) return;
    if (!bounds || _dragType === DragItemType.TreeNode) return; // Ignore for tree nodes
    const { width, height } = bounds;
    if (width === this._width && height === this._height) return;
    _ghostElem.style.width = width + DEFAULT_UNITS;
    _ghostElem.style.height = height + DEFAULT_UNITS;
    _ghostElem.classList.remove(GhostCSSClass.Thumbnail);
    // Adjust the cursor position based on ratio from new dimensions
    if (_initalHeight !== height && _initalWidth !== width) {
      this._offsetX = initalOffset.x - (initalOffset.x * width) / _initalWidth;
      this._offsetY = initalOffset.y - (initalOffset.y * height) / _initalHeight;
    }

    this._width = width;
    this._height = height;
  }

  resetGhost() {
    this.globalCursor = CursorState.Default;
    if (!this._ghostElem) return;
    this._renderer.removeChild(document.body, this._ghostElem);
    this._ghostElem = undefined;
    this._ghostIds = [];
    this._offsetX = 0;
    this._offsetY = 0;
    this._initalWidth = 0;
    this._initalHeight = 0;
    this._width = 0;
    this._height = 0;
  }
}
