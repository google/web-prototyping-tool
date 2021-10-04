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

import { constructKebabCase } from 'cd-utils/string';
import { isDisplayInline } from 'cd-common/utils';
import { UnitTypes } from 'cd-metadata/units';
import * as consts from 'cd-common/consts';
import * as cd from 'cd-interfaces';

export const layoutAlignmentFromModel = (model: cd.IStyleDeclaration): consts.LayoutAlignment => {
  const { alignItems, justifyItems, justifyContent, alignContent } = model;
  const entries = Object.entries(consts.ALIGNMENT_TO_GRID_MAP);
  for (const item of entries) {
    const [key, value] = item;
    const [align, justify] = value;
    const alignment = align === alignItems || align === alignContent;
    const justification = justify === justifyItems || justify === justifyContent;
    if (!alignment || !justification) continue;
    return key as consts.LayoutAlignment;
  }

  return consts.LayoutAlignment.TopLeft;
};

export const defaultGridValueForUnit = (
  value: UnitTypes,
  data: cd.IValue[],
  increment = false
): Partial<cd.IValue> => {
  const len = data.length + (increment ? 1 : 0);
  if (value === UnitTypes.Auto) return { value: UnitTypes.Auto };
  if (value === UnitTypes.Percent) return { value: Math.round(100 / len) };
  return { value: 1 };
};

export const resetGridLayout = (displayMode: string): cd.IStyleDeclaration => {
  // Maintain display: inline when avaiable e.g inline-block, inline-grid

  const display = isDisplayInline(displayMode)
    ? constructKebabCase(consts.CSS_DISPLAY_INLINE, consts.CSS_DISPLAY_BLOCK)
    : consts.CSS_DISPLAY_BLOCK;

  return {
    display,
    alignItems: null,
    alignContent: null,
    justifyItems: null,
    justifyContent: null,
    gridTemplateColumns: null,
    gridTemplateRows: null,
    gridAutoRows: null,
    gridAutoColumns: null,
    gridAutoFlow: null,
    gridRowGap: null,
    gridColumnGap: null,
  };
};

export const autoFlowFromModel = (
  model: cd.IStyleDeclaration,
  layoutMode: cd.LayoutMode
): cd.GridAutoMode => {
  if (layoutMode === cd.LayoutMode.Cols) return model.gridAutoColumns || cd.GridAutoMode.Auto;
  if (layoutMode === cd.LayoutMode.Rows) return model.gridAutoRows || cd.GridAutoMode.Auto;
  return cd.GridAutoMode.Auto;
};

export interface IGridAlignment {
  alignItems: cd.GridAlign | null;
  alignContent: cd.GridAlign | null;
  justifyItems: cd.GridAlign | null;
  justifyContent: cd.GridAlign | null;
}

export const getAlignmentForGridMode = (
  gridAutoMode: cd.GridAutoMode,
  align: cd.GridAlign,
  justify: cd.GridAlign,
  layoutMode: cd.LayoutMode
): IGridAlignment => {
  if (gridAutoMode === cd.GridAutoMode.Auto) {
    return { alignItems: align, alignContent: null, justifyItems: justify, justifyContent: null };
  }

  if (layoutMode === cd.LayoutMode.Grid) {
    return { alignItems: align, alignContent: align, justifyItems: null, justifyContent: justify };
  }

  return { alignItems: align, alignContent: align, justifyItems: justify, justifyContent: justify };
};
