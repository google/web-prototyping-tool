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

import { getElementBaseStyles, isDisplayGrid, removePtFromOutletFrame } from 'cd-common/utils';
import { GridVisualizer } from './gridvis';
import * as cd from 'cd-interfaces';

const adjustRectsToParentOFfset = (
  rects: ReadonlyArray<cd.IRect>,
  { x, y }: cd.IRect
): cd.IRect[] => {
  return rects.map((item) => {
    item.x += x;
    item.y += y;
    return item;
  });
};

export const rectsForGrid = (
  props: cd.PropertyModel,
  renderRects: cd.RenderRectMap,
  elementProperties: cd.ElementPropertiesMap,
  outletFrameInteracting: boolean
): ReadonlyArray<cd.IRect> => {
  const baseStyles = getElementBaseStyles(props);
  const hasGrid = baseStyles && isDisplayGrid(baseStyles.display);
  const renderRect = renderRects.get(props.id);
  if (!hasGrid || !renderRect || !baseStyles) return [];
  const { frame } = renderRect;
  const isOutletFrame = renderRect.id === renderRect.rootId;
  const parentRect = isOutletFrame ? removePtFromOutletFrame(frame) : frame;
  const rects = GridVisualizer.getInstance()
    .updateContainerStyles(baseStyles, frame)
    .removeChildren()
    .updateChildren(props, renderRects, elementProperties, parentRect)
    .calculateChildRects(outletFrameInteracting);

  return isOutletFrame ? rects : adjustRectsToParentOFfset(rects, frame);
};
