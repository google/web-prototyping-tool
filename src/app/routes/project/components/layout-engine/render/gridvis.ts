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
  getElementBaseStyles,
  transformPropsToStyle,
  isPositionFixedOrAbsolute,
  createPixelIValue,
} from 'cd-common/utils';
import { AUTO_VALUE, DEFAULT_UNITS, DIV_TAG } from 'cd-common/consts';
import { LAYOUT_PROPS } from '../layout-engine.consts';
import * as cd from 'cd-interfaces';

const ONE_HUNDRED_PERCENT = '100%';
const GRID_VIS_CLASS = 'co-grid-vis';

let _gridVisualizer: GridVisualizer;

export class GridVisualizer {
  private _container: HTMLDivElement;
  private _columnCount = 0;
  private _rowCount = 0;

  static getInstance(): GridVisualizer {
    if (!_gridVisualizer) _gridVisualizer = new GridVisualizer();
    return _gridVisualizer;
  }

  constructor() {
    const container = document.createElement(DIV_TAG);
    container.className = GRID_VIS_CLASS;
    this._container = container;
    document.body.appendChild(container);
  }

  get container() {
    return this._container;
  }

  applyStylesToElement = (element: HTMLElement, styles: cd.IStyleDeclaration): void => {
    Object.assign(element.style, styles);
  };

  applyUnit(value?: string | number, unit = DEFAULT_UNITS): string | null {
    if (value === undefined) return null;
    if (unit === AUTO_VALUE) unit = '';
    return `${value}${unit}`;
  }

  updateContainerStyles(styles: cd.IStyleDeclaration, frame: cd.IRect) {
    const { gridTemplateColumns: columns = [], gridTemplateRows: rows = [] } = styles;
    const layoutStyles = Object.entries(styles).reduce<cd.IStyleDeclaration>((acc, item) => {
      const [key, value] = item;
      if (!LAYOUT_PROPS.includes(key)) return acc;
      acc[key] = value;
      return acc;
    }, {});

    const width = createPixelIValue(frame.width);
    const height = createPixelIValue(frame.height);
    const layout = { ...layoutStyles, padding: styles.padding, width, height };
    const style = transformPropsToStyle({ style: layout });
    const converted = Object.entries(style)
      .map(([key, value]) => [key, value].join(':'))
      .join(';');

    this.container.style.cssText = converted;
    this._columnCount = columns.length;
    this._rowCount = rows.length;
    return this;
  }

  removeChildren() {
    const { container } = this;
    let len = container.childNodes.length;
    while (len--) {
      if (container.lastChild) container.removeChild(container.lastChild);
    }
    return this;
  }

  updateChildren(
    prop: cd.PropertyModel,
    renderRects: cd.RenderRectMap,
    elementProperties: cd.ElementPropertiesMap,
    _parentRect: cd.IRect
  ) {
    let len = this._columnCount * this._rowCount;

    const { container } = this;

    const fragment = document.createDocumentFragment();
    const child = document.createElement(DIV_TAG);
    const width = ONE_HUNDRED_PERCENT;
    const height = ONE_HUNDRED_PERCENT;

    this.applyStylesToElement(child, { width, height });

    const children = prop.childIds.reduce<cd.PropertyModel[]>((acc, childId) => {
      const childProps = elementProperties[childId];
      if (childProps) {
        const style = getElementBaseStyles(childProps);
        const childHidden = childProps.inputs?.hidden;
        const ignoreInGrid = childHidden || isPositionFixedOrAbsolute(style);
        if (!ignoreInGrid) acc.push(childProps);
      }
      return acc;
    }, []);

    if (len === 0) len = children.length;

    for (let i = 0; i < len; i++) {
      const childItem = children[i];
      const clone = child.cloneNode(true) as HTMLElement;
      const lookup = childItem && renderRects.get(childItem.id);
      if (lookup) {
        const { width: frameWidth, height: frameHeight } = lookup.frame;
        const minWidth = this.applyUnit(frameWidth);
        const minHeight = this.applyUnit(frameHeight);
        this.applyStylesToElement(clone, { minWidth, minHeight });
      }

      fragment.appendChild(clone);
    }

    container.appendChild(fragment);
    return this;
  }

  calculateChildRects(_interacting: boolean): ReadonlyArray<cd.IRect> {
    const { children } = this.container;
    const length = children.length;
    return Array.from({ length }, (_item, i) => {
      const elem = children[i] as HTMLElement;
      const { top: y, left: x, width, height } = elem.getBoundingClientRect();
      return { x, y, width, height };
    });
  }
}
