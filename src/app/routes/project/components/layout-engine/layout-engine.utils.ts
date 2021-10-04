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

import { ALIGNMENT_TO_GRID_MAP, LayoutAlignment } from 'cd-common/consts';
import { isDisplayGrid, isDisplayInline } from 'cd-common/utils';
import { toSentenceCase } from 'cd-utils/string';
import { UnitTypes } from 'cd-metadata/units';
import { deepCopy } from 'cd-utils/object';
import * as consts from './layout-engine.consts';
import * as cd from 'cd-interfaces';

export const convertStrArrToSelect = (arr: string[]): cd.ISelectItem[] => {
  return arr.map((value) => ({ title: toSentenceCase(value), value }));
};

export const processDisplayStyle = (
  existing: cd.IStyleDeclaration,
  update: cd.IStyleDeclaration
): cd.Display => {
  const displayUpdate = update.display as cd.Display;
  const isInline = isDisplayInline(existing.display);
  if (!isInline) return displayUpdate;
  const processed = consts.INLINE_DISPLAY_REDUCER[displayUpdate];
  if (processed) return processed;
  return update.display;
};

const processGapStyle = (
  mode: cd.LayoutMode,
  existing: cd.IStyleDeclaration,
  _update: cd.IStyleDeclaration
): Partial<cd.IStyleDeclaration> => {
  if (mode === cd.LayoutMode.Auto) return {};
  const existingGap = existing.gap || 0;
  const existingRowGap = existing.rowGap || existing.gridRowGap || 0;
  const existingColumnGap = existing.columnGap || existing.gridColumnGap || 0;
  const gap = Math.max(existingGap, existingRowGap, existingColumnGap);
  const rowGap = existingRowGap || gap;
  const columnGap = existingColumnGap || gap;
  if (mode === cd.LayoutMode.Cols) return { columnGap };
  if (mode === cd.LayoutMode.Rows) return { rowGap };
  return { rowGap, columnGap }; // Grid
};

export const processGapChange = (
  gap: number = 0,
  isCol: boolean,
  existing: cd.IStyleDeclaration
): cd.IStyleDeclaration => {
  const update: cd.IStyleDeclaration = isCol ? { columnGap: gap } : { rowGap: gap };
  return nullifyPreviousStyleKeys(update, existing, consts.LEGACY_GAP_PROPS);
};

const processAlignment = (
  mode: cd.LayoutMode,
  existing: cd.IStyleDeclaration,
  layoutDefault: cd.IStyleDeclaration
): cd.IStyleDeclaration => {
  if (mode === cd.LayoutMode.Auto) return {};
  const { ALIGN_JUSTIFY_PROPS, ALIGN_ATTR } = consts;
  const horizontal = existing.justifyContent || existing.justifyItems;
  const vertical = existing.alignContent || existing.alignItems;
  const update = Object.entries(layoutDefault).reduce<cd.IStyleDeclaration>((acc, curr) => {
    const [key, value] = curr;
    const isPosProp = ALIGN_JUSTIFY_PROPS.includes(key);
    acc[key] = isPosProp ? (key.includes(ALIGN_ATTR) ? vertical : horizontal) ?? value : value;
    return acc;
  }, {});
  return nullifyPreviousStyleKeys(update, existing, ALIGN_JUSTIFY_PROPS);
};

const nullifyPreviousStyleKeys = (
  update: cd.IStyleDeclaration,
  existing: cd.IStyleDeclaration,
  props: string[],
  excludeKeys: string[] = []
): cd.IStyleDeclaration => {
  const excluded = new Set(excludeKeys);
  const existingKeys = props.filter((key) => key in existing && !excluded.has(key));
  for (const key of existingKeys) {
    if (key in update) continue;
    update[key] = null;
  }
  return update;
};

const DEFAULT_COUNT = 3;
const generateGridCell = (value = 1, units = UnitTypes.Fr): cd.IValue => {
  return { value, units } as cd.IValue;
};

export const generateGridArray = (count: number): cd.IValue[] => {
  const amt = count <= 1 ? DEFAULT_COUNT : count;
  return new Array(amt).fill(generateGridCell());
};

const generateColumnGrid = (count: number): cd.IStyleDeclaration => {
  const gridTemplateColumns = new Array(count).fill(generateGridCell());
  const gridTemplateRows = [generateGridCell()];
  return { gridTemplateColumns, gridTemplateRows };
};

const generateRowGrid = (count: number): cd.IStyleDeclaration => {
  const gridTemplateColumns = [generateGridCell()];
  const gridTemplateRows = new Array(count).fill(generateGridCell());
  return { gridTemplateColumns, gridTemplateRows };
};

const processGridStyle = (
  mode: cd.LayoutMode,
  existing: cd.IStyleDeclaration,
  count: number,
  update: cd.IStyleDeclaration
): cd.IStyleDeclaration => {
  if (mode !== cd.LayoutMode.Grid) return {};
  const currentMode = detectLayoutMode(existing);
  if (count > 1 && currentMode === cd.LayoutMode.Cols) return generateColumnGrid(count);
  if (count > 1 && currentMode === cd.LayoutMode.Rows) return generateRowGrid(count);
  const columnCount = Math.ceil(Math.sqrt(count)) || DEFAULT_COUNT;
  const rowCount = Math.ceil(count / columnCount);
  const existingCols = update.gridTemplateColumns || existing.gridTemplateColumns;
  const existingRows = update.gridTemplateRows || existing.gridTemplateRows;
  const gridTemplateColumns = existingCols || generateGridArray(columnCount);
  const gridTemplateRows = existingRows || generateGridArray(rowCount);
  return { gridTemplateColumns, gridTemplateRows };
};

const isColsOrRows = (mode: cd.LayoutMode): mode is consts.ColsRowsLayout => {
  return mode === cd.LayoutMode.Cols || mode === cd.LayoutMode.Rows;
};

const getDefaultLayout = (mode: cd.LayoutMode, gridMode: cd.GridAutoMode) => {
  if (isColsOrRows(mode) && gridMode === cd.GridAutoMode.Auto) {
    return deepCopy(consts.DEFAULT_LAYOUT_SPREAD_REDUCERR[mode]);
  }
  return deepCopy(consts.DEFAULT_LAYOUT_REDUCER[mode]);
};

export const generateGridLayout = (
  count: number,
  mode: cd.LayoutMode = cd.LayoutMode.Grid
): cd.IStyleDeclaration => {
  return processGridStyle(mode, {}, count, {});
};

export const convertToLayout = (
  mode: cd.LayoutMode,
  existing: cd.IStyleDeclaration,
  childCount: number = 0
): cd.IStyleDeclaration => {
  const gridMode = getGridAutoMode(existing, mode);
  const layout = getDefaultLayout(mode, gridMode);
  const display = processDisplayStyle(existing, layout);
  const gap = processGapStyle(mode, existing, layout);
  const grid = processGridStyle(mode, existing, childCount, layout);
  const alignment = processAlignment(mode, existing, layout);
  const update = { ...layout, ...gap, ...alignment, ...grid, display };
  return nullifyPreviousStyleKeys(update, existing, [...consts.LAYOUT_PROPS]);
};

const modelHasDisplay = (model: cd.IStyleDeclaration, display: cd.Display): boolean => {
  if (!model.display) return false;
  return model.display.includes(display);
};

export const isGridLayout = (styles: cd.IStyleDeclaration): boolean => {
  return detectLayoutMode(styles) === cd.LayoutMode.Grid;
};

export const detectLayoutMode = (model: cd.IStyleDeclaration): cd.LayoutMode => {
  const display = model.display;
  if (modelHasDisplay(model, cd.Display.Flex)) {
    const direction = model.flexDirection || '';
    // Flexbox is reversed
    return direction.includes(consts.FlexDirection.Row) ? cd.LayoutMode.Cols : cd.LayoutMode.Rows;
  }

  if (isDisplayGrid(display)) {
    const hasGridAutoColsOrRows = model.gridAutoColumns || model.gridAutoRows;
    if (!model.gridAutoFlow && !hasGridAutoColsOrRows) return cd.LayoutMode.Grid;
    const gridCol = model.gridAutoFlow === cd.GridAutoFlow.Column;
    return gridCol ? cd.LayoutMode.Cols : cd.LayoutMode.Rows;
  }

  return cd.LayoutMode.Auto;
};

export const alignmentFromModel = (model: cd.IStyleDeclaration): LayoutAlignment => {
  const { alignItems, justifyItems, justifyContent, alignContent } = model;
  const entries = Object.entries(ALIGNMENT_TO_GRID_MAP);
  for (const item of entries) {
    const [key, value] = item;
    const [align, justify] = value;
    const alignment = align === alignItems || align === alignContent;
    const justification = justify === justifyItems || justify === justifyContent;
    if (!alignment || !justification) continue;
    return key as LayoutAlignment;
  }

  return LayoutAlignment.TopLeft;
};

export const getGridAutoMode = (
  model: cd.IStyleDeclaration,
  layoutMode: cd.LayoutMode
): cd.GridAutoMode => {
  const autoMode = model.gridAutoColumns || model.gridAutoRows || cd.GridAutoMode.MinContent;
  if (layoutMode === cd.LayoutMode.Cols) return autoMode;
  if (layoutMode === cd.LayoutMode.Rows) return autoMode;
  return cd.GridAutoMode.Auto;
};

const isSpreadDistribution = (
  layoutMode: cd.LayoutMode,
  gridAutoMode: cd.GridAutoMode
): boolean => {
  return layoutMode === cd.LayoutMode.Grid || gridAutoMode === cd.GridAutoMode.Auto;
};

const getAlignmentForGridMode = (
  gridAutoMode: cd.GridAutoMode,
  alignItems: cd.GridAlign,
  justifyItems: cd.GridAlign,
  layoutMode: cd.LayoutMode
): cd.IStyleDeclaration => {
  if (isSpreadDistribution(layoutMode, gridAutoMode)) return { alignItems, justifyItems };
  const alignContent = alignItems;
  const justifyContent = justifyItems;
  return { alignItems, alignContent, justifyItems, justifyContent };
};

const buildGridAutoMode = (
  gridMode: cd.GridAutoMode,
  layoutMode: cd.LayoutMode
): cd.IStyleDeclaration => {
  const isRowMode = layoutMode === cd.LayoutMode.Rows;
  const gridAutoFlow = isRowMode ? cd.GridAutoFlow.Row : cd.GridAutoFlow.Column;
  if (isRowMode) return { gridAutoRows: gridMode, gridAutoFlow };
  return { gridAutoColumns: gridMode, gridAutoFlow };
};

const getAlignment = (
  layoutAlignment: LayoutAlignment,
  layoutMode: cd.LayoutMode,
  gridAutoMode: cd.GridAutoMode
) => {
  const [align, justify] = ALIGNMENT_TO_GRID_MAP[layoutAlignment];
  return getAlignmentForGridMode(gridAutoMode, align, justify, layoutMode);
};

export const processDistributionChange = (
  gridMode: cd.GridAutoMode,
  layoutMode: cd.LayoutMode,
  model: cd.IStyleDeclaration
): cd.IStyleDeclaration => {
  const distribution = buildGridAutoMode(gridMode, layoutMode);
  const layoutAlignment = alignmentFromModel(model);
  const alignment = getAlignment(layoutAlignment, layoutMode, gridMode);
  const update = { ...distribution, ...alignment };
  const keyCheck = [...consts.ALIGN_JUSTIFY_PROPS, ...consts.GRID_PROPS];
  return nullifyPreviousStyleKeys(update, model, keyCheck);
};

export const processAlignmentChange = (
  layoutAlignment: LayoutAlignment,
  layoutMode: cd.LayoutMode,
  model: cd.IStyleDeclaration
): cd.IStyleDeclaration => {
  const gridMode = getGridAutoMode(model, layoutMode);
  const update = getAlignment(layoutAlignment, layoutMode, gridMode);
  return nullifyPreviousStyleKeys(update, model, consts.ALIGN_JUSTIFY_PROPS);
};

export const processAdvancedDisplayModeChange = (
  disp: cd.Display,
  layoutMode: cd.LayoutMode,
  existing: cd.IStyleDeclaration
): cd.IStyleDeclaration => {
  const display = processDisplayStyle(existing, { display: disp });
  const update: cd.IStyleDeclaration = { display };
  const isFlexbox = modelHasDisplay(update, cd.Display.Flex);
  const isCols = layoutMode === cd.LayoutMode.Cols;
  if (isFlexbox) {
    update.flexDirection = isCols ? consts.FlexDirection.Row : consts.FlexDirection.Column;
  } else {
    const gridLayout = consts.DEFAULT_LAYOUT_REDUCER[layoutMode];
    update.gridAutoFlow = gridLayout.gridAutoFlow;
    update.gridAutoRows = gridLayout.gridAutoRows;
  }
  return nullifyPreviousStyleKeys(update, existing, [...consts.FLEX_PROPS, ...consts.GRID_PROPS]);
};

const createIValuePartial = (value: string | number): Partial<cd.IValue> => {
  return { value };
};

export const defaultGridValueForUnit = (
  value: cd.Units | undefined,
  data: cd.IValue[],
  increment = false
): Partial<cd.IValue> => {
  const len = data.length + (increment ? 1 : 0);
  if (value === UnitTypes.Auto) return createIValuePartial(UnitTypes.Auto);
  if (value === UnitTypes.Percent) return createIValuePartial(Math.round(100 / len));
  return createIValuePartial(1);
};

export const incrementGridItems = (items: cd.IValue[] = []) => {
  const clone = deepCopy(items);
  const lastItem = clone[clone.length - 1];
  const units = lastItem?.units ?? UnitTypes.Fr;
  const value = defaultGridValueForUnit(units, clone, true);
  const added = { units, ...value };
  return [...items, added];
};

export const processGridAutoModeChange = (value: string, isCol: boolean): cd.IStyleDeclaration => {
  if (isCol) return { gridAutoColumns: value };
  return { gridAutoRows: value };
};
