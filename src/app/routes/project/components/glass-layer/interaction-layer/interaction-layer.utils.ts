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

import { PropertyModel, ElementPropertiesMap, RenderRectMap } from 'cd-interfaces';
import { getActiveStyleFromProperty, buildPositionMapForElements } from 'cd-common/models';
import { IPoint } from 'cd-utils/geometry';

export type ILayerHover = [remove: boolean, id: string | undefined, outletFrameId: string];

export const generateRegions = (
  props: PropertyModel[],
  metaKey: boolean,
  outletFrameId: string,
  activeParent: Set<string>,
  elementProps: ElementPropertiesMap
) => {
  const hitRegions = [];
  const zIndexMap = new Map();
  const weightMap = new Map();

  const positionMap = buildPositionMapForElements(props, elementProps);

  for (const prop of props) {
    const { parentId, id } = prop;
    const styles = getActiveStyleFromProperty(prop);
    const zindex = Number(styles && styles.zIndex) || 0;
    const parentZIndex = zIndexMap.get(parentId) || 0;
    const startingWeight = parentZIndex + zindex;

    zIndexMap.set(id, startingWeight);
    if (metaKey || (parentId && activeParent.has(parentId)) || parentId === outletFrameId) {
      const position = positionMap.get(id) || [];
      const weight = position.reduce((total, curr) => (total += curr + 1), position.length);
      weightMap.set(id, weight);
      hitRegions.push(id);
    }
  }

  return hitRegions.sort((a, b) => {
    const aWeight = weightMap.get(a);
    const bWeight = weightMap.get(b);
    const aZIndex = zIndexMap.get(a);
    const bZIndex = zIndexMap.get(b);
    if (bZIndex > aZIndex) return -1;
    return aWeight > bWeight ? 1 : -1;
  });
};

export const isOnlyOutletFrameSelected = (
  value: string[] | undefined,
  size: number,
  id: string
): boolean => {
  return !!(size > 1 && value && value.length === 1 && value.indexOf(id) !== -1);
};

export const idFromTarget = (e: MouseEvent): string | undefined => {
  return (e.target as SVGRectElement).dataset.id;
};

export const getElementUnderCursor = (
  pt: IPoint,
  zoom: number,
  childIds: ReadonlyArray<string>,
  renderRects: RenderRectMap,
  element: HTMLElement
): string | undefined => {
  const bounds = element.getBoundingClientRect();
  const xp = Math.round((pt.x - bounds.x) / zoom);
  const yp = Math.round((pt.y - bounds.y) / zoom);

  for (const childId of childIds) {
    const item = renderRects.get(childId);
    if (!item) continue;
    const { x, y, width, height } = item.frame;
    if (xp >= x && xp <= x + width && yp >= y && yp <= y + height) {
      return childId;
    }
  }
  return undefined;
};
