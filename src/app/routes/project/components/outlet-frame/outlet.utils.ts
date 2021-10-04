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

import type { IRect, ElementEntitySubType, RenderRectMap, RootElement } from 'cd-interfaces';
import { matrix2d } from 'cd-utils/css';
import { isSymbol } from 'cd-common/models';

export interface IBoard {
  id: string;
  name: string;
  frame: IRect;
  symbol: boolean;
  zOrder: number;
  position: string;
  elementType: ElementEntitySubType;
}

/** Generates a format used to display boards with aggregated order and render rects  */
export const buildBoard = (
  rectMap: RenderRectMap,
  outletFrames: ReadonlyArray<RootElement>,
  order: ReadonlyArray<string>
): ReadonlyArray<IBoard> => {
  return outletFrames.map((board) => {
    const { id, name, frame: outletFrame, elementType } = board;
    const frame = rectMap.get(id)?.frame || outletFrame;
    const zOrder = order.indexOf(id);
    const symbol = isSymbol(board);
    const position = matrix2d(frame.x, frame.y, 1);
    return { id, name, frame, symbol, position, elementType, zOrder };
  });
};
