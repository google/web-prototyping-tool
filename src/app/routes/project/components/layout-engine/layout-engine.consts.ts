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

export const ADVANCED_TOGGLE_LABEL = ['basic', 'advanced'];
export const COL_TITLE = 'Columns';
export const ROW_TITLE = 'Rows';

export enum FlexDirection {
  Row = 'row',
  RowReverse = 'row-reverse',
  Column = 'column',
  ColumnReverse = 'column-reverse',
}

export const ALIGN_ATTR = 'align';
export const ALIGN_JUSTIFY_PROPS = ['justifyItems', 'justifyContent', 'alignItems', 'alignContent'];
export const LEGACY_GAP_PROPS = ['gridRowGap', 'gridColumnGap'];
export const GAP_PROPS = ['gap', 'rowGap', 'columnGap', ...LEGACY_GAP_PROPS];
export const FLEX_PROPS = ['flexDirection', 'flexBasis', 'flexGrow', 'flexShrink', 'flexWrap'];

export const GRID_PROPS = [
  'gridTemplateColumns',
  'gridTemplateRows',
  'gridAutoFlow',
  'gridAutoRows',
  'gridAutoColumns',
];

export const LAYOUT_PROPS = [...ALIGN_JUSTIFY_PROPS, ...GAP_PROPS, ...GRID_PROPS, ...FLEX_PROPS];

export const ALIGN_ITEMS_PROPS: string[] = ['baseline', 'stretch', 'center', 'start', 'end'];
export const ALIGN_CONTENT_PROPS = [
  'baseline',
  'center',
  'end',
  'left',
  'normal',
  'right',
  'space-around',
  'space-between',
  'space-evenly',
  'start',
  'stretch',
];
export const JUSTIFY_ITEMS_PROPS: string[] = [
  'baseline',
  'center',
  'end',
  'left',
  'right',
  'self-end',
  'self-start',
  'start',
];
export const JUSTIFY_CONTENT_PROPS: string[] = [
  'center',
  'end',
  'left',
  'normal',
  'right',
  'space-around',
  'space-between',
  'space-evenly',
  'start',
  'stretch',
];

export const GRID_AUTO_PROPS_VALUES: string[] = ['auto', 'min-content', 'max-content'];

export type ColsRowsLayout = cd.LayoutMode.Cols | cd.LayoutMode.Rows;

export const DEFAULT_LAYOUT_SPREAD_REDUCERR: Record<ColsRowsLayout, Partial<cd.IStyleDeclaration>> =
  {
    [cd.LayoutMode.Cols]: {
      display: cd.Display.Grid,
      gridAutoFlow: cd.GridAutoFlow.Column,
      gridAutoColumns: cd.GridAutoMode.Auto,
      justifyItems: cd.GridAlign.Start,
      alignItems: cd.GridAlign.Start,
    },
    [cd.LayoutMode.Rows]: {
      display: cd.Display.Grid,
      gridAutoFlow: cd.GridAutoFlow.Row,
      gridAutoRows: cd.GridAutoMode.Auto,
      justifyItems: cd.GridAlign.Start,
      alignItems: cd.GridAlign.Start,
    },
  };

export const DEFAULT_LAYOUT_REDUCER: Record<cd.LayoutMode, Partial<cd.IStyleDeclaration>> = {
  [cd.LayoutMode.Auto]: { display: cd.Display.Block },
  [cd.LayoutMode.Cols]: {
    display: cd.Display.Grid,
    gridAutoFlow: cd.GridAutoFlow.Column,
    gridAutoColumns: cd.GridAutoMode.MinContent,
    justifyContent: cd.GridAlign.Start,
    justifyItems: cd.GridAlign.Start,
    alignContent: cd.GridAlign.Start,
    alignItems: cd.GridAlign.Start,
  },
  [cd.LayoutMode.Rows]: {
    display: cd.Display.Grid,
    gridAutoFlow: cd.GridAutoFlow.Row,
    gridAutoRows: cd.GridAutoMode.MinContent,
    justifyContent: cd.GridAlign.Start,
    justifyItems: cd.GridAlign.Start,
    alignContent: cd.GridAlign.Start,
    alignItems: cd.GridAlign.Start,
  },
  [cd.LayoutMode.Grid]: {
    display: cd.Display.Grid,
    justifyContent: cd.GridAlign.Start,
    justifyItems: cd.GridAlign.Start,
    alignContent: cd.GridAlign.Start,
    alignItems: cd.GridAlign.Start,
  },
};

export const INLINE_DISPLAY_REDUCER: Partial<Record<cd.Display, cd.Display>> = {
  [cd.Display.Block]: cd.Display.InlineBlock,
  [cd.Display.Grid]: cd.Display.InlineGrid,
  [cd.Display.Flex]: cd.Display.InlineFlex,
};
