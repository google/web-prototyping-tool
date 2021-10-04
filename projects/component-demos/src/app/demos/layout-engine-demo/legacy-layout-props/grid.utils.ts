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
import { UnitTypes } from 'cd-metadata/units';
import { CSS_GRID_ROW } from 'cd-common/consts';
import { isDisplayGrid } from 'cd-common/utils';

const DEFAULT_COUNT = 3;

export const layoutModeFromModel = (model: cd.IStyleDeclaration): cd.LayoutMode => {
  const isGrid = isDisplayGrid(model.display);
  if (!isGrid) return cd.LayoutMode.Auto;
  if (!model.gridAutoFlow) return cd.LayoutMode.Grid;
  const autoRows = model.gridAutoFlow === CSS_GRID_ROW;
  return autoRows ? cd.LayoutMode.Rows : cd.LayoutMode.Cols;
};

const generateGridCell = (value = 1, units = UnitTypes.Fr): cd.IValue =>
  ({ value, units } as cd.IValue);

export const generateGridArray = (count: number): cd.IValue[] => {
  const amt = count <= 1 ? DEFAULT_COUNT : count;
  return new Array(amt).fill(generateGridCell());
};

export const generateColumnGrid = (count: number): cd.IStyleDeclaration => {
  const gridTemplateColumns = new Array(count).fill(generateGridCell());
  const gridTemplateRows = [generateGridCell()];

  return { gridTemplateColumns, gridTemplateRows };
};

export const generateRowGrid = (count: number): cd.IStyleDeclaration => {
  const gridTemplateColumns = [generateGridCell()];
  const gridTemplateRows = new Array(count).fill(generateGridCell());
  return { gridTemplateColumns, gridTemplateRows };
};

export const generateGridLayout = (
  count: number,
  mode: cd.LayoutMode = cd.LayoutMode.Auto
): cd.IStyleDeclaration => {
  if (count > 1 && mode === cd.LayoutMode.Cols) return generateColumnGrid(count);
  if (count > 1 && mode === cd.LayoutMode.Rows) return generateRowGrid(count);
  const columnCount = Math.ceil(Math.sqrt(count)) || DEFAULT_COUNT;
  const rowCount = Math.ceil(count / columnCount);
  const gridTemplateColumns = generateGridArray(columnCount);
  const gridTemplateRows = generateGridArray(rowCount);
  return { gridTemplateColumns, gridTemplateRows };
};
