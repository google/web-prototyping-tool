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

export const CursorState = {
  Default: 'default',
  Pointer: 'pointer',
  Grab: 'grab',
  Grabbing: 'grabbing',
  ColResize: 'col-resize',
  Crosshair: 'crosshair',
  RowResize: 'row-resize',
  EWResize: 'ew-resize',
  NESWResize: 'nesw-resize',
  NSResize: 'ns-resize',
  NWSEResize: 'nwse-resize',
  NotAllowed: 'not-allowed',
} as const;

export type CursorStateType = typeof CursorState[keyof typeof CursorState];

/**
 * Sets the Mouse cursor globally for resize manipulation on elements
 * @param state Cursor params
 * @param disablePointerEvents Prevent the user other elements while cursor is set
 */

export const assignGlobalCursor = (cursor: CursorStateType = CursorState.Default): void => {
  document.documentElement.style.cursor = cursor;
};
