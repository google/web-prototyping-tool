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

import data from './group.utils.spec.json';
import * as cd from 'cd-interfaces';
import * as utils from './group.absolute.utils';

const ungroupTest = (elementId: string, obj: any) => {
  const rectMap: cd.RenderRectMap = new Map(obj.renderRects as [string, any][]);
  const elementToUngroup = obj.elementProps[elementId] as cd.PropertyModel;
  const childStyles = utils.ungroupAbsolutePositionChildren(
    elementToUngroup,
    obj.elementProps as cd.ElementPropertiesMap,
    rectMap
  );

  expect(childStyles).toEqual(obj.expectedChildStyles as any);
};

const groupTest = (
  elements: string[],
  topChildParentId: string,
  expectedBounds: cd.IRect,
  obj: any
) => {
  const rectMap: cd.RenderRectMap = new Map(obj.renderRects as [string, any][]);
  const groupedElements = elements.map(
    (id) => (obj.elementProps as any)[id]
  ) as cd.ReadOnlyPropertyModelList;
  const hasAbsolutePosition = utils.elementsHaveAbsolutePosition(groupedElements);
  const bounds = utils.generateBoundingBox(topChildParentId, groupedElements, rectMap);
  const childStyles = utils.adjustAbsolutePositionForChildren(bounds, groupedElements, rectMap);
  expect(hasAbsolutePosition).toBeTrue();
  expect(bounds).toEqual(expectedBounds);
  expect(childStyles).toEqual(obj.expectedChildStyles as any);
};

describe('GroupUtils', () => {
  it('didGroupAbsoluteElements', () => {
    const expectedBounds = { height: 325, width: 541, x: 133, y: 102 };
    const topChildParentId = '1HX7eb57MR6L8KCtzoyu';
    const elements = [
      'mBwDKu4liML8vQOCUyMx',
      'WYgNuaNRFfXvXP3fYAOm',
      'GFy4bWI6LR64U4Ermt4B',
      'RJ2wvql3qVuqusmuUTbY',
      'PLxf413M0lqkO6EwkiFQ',
      'vx6TcioeOn085GEraIC9',
    ];
    groupTest(elements, topChildParentId, expectedBounds, data.group);
  });

  it('didGroupAbsoluteElementsInsideGroup', () => {
    const expectedBounds = { height: 211, width: 134, x: 196, y: 42 };
    const topChildParentId = 'VtkN1CxzEwkKiD1lnUU7';
    const elements = ['vx6TcioeOn085GEraIC9', 'PLxf413M0lqkO6EwkiFQ'];
    groupTest(elements, topChildParentId, expectedBounds, data.groupInsideGroup);
  });

  it('didUngroupAbsoluteElements', () => {
    ungroupTest('1us9fTYvLO3SIw9sRfxV', data.ungroup);
  });

  it('didUngroupAbsoluteElementsInsideGroup', () => {
    ungroupTest('Y1M9QPSS2elmSTIsA18Z', data.ungroupInsideGroup);
  });
});
