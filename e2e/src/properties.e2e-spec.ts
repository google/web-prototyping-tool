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

import { Page } from 'puppeteer';
import { IElementPosition } from './models/elements.interface';
import { IPropsChanges, IBorder, IShadow, IHexColor } from './models/props.interfaces';
import { cssBorder, cssShadow, hexColorToRGB } from './utils/styles.utils';
import { setupSuite } from './utils/tests.utils';
import { selectAndViewBoard } from './ui-utils/components/canvas.utils';
import {
  dragElementFromComponentToBoard,
  waitForGlassElement,
  getElementStyles,
  changeNewElementsProps,
} from './ui-utils/design-surface.utils';
import { elemPos } from './utils/elements';
import { toDecimal } from 'cd-utils/numeric';

describe('Properties', () => {
  let page: Page;

  const newTestPageCallback = (p: Page) => {
    page = p;
  };

  setupSuite(newTestPageCallback, beforeAll, afterAll, beforeEach, afterEach);

  it("should be able to change element's styles", async () => {
    const position: IElementPosition = elemPos(0, [0]);

    await selectAndViewBoard(page, 0);
    await dragElementFromComponentToBoard(page, 0);
    await waitForGlassElement(page, position);

    const propsChanges: IPropsChanges = {
      width: 300,
      height: 200,
      opacityPercentage: 90,
      radius: 10,
      backgrounds: [{ hex: '#ff0000', opacityPercentage: 40 }],
      borders: [
        {
          color: { hex: '#00ff00', opacityPercentage: 80 },
          width: 2,
          style: 'dashed',
        },
      ],
      shadows: [
        {
          color: { hex: '#0000ff', opacityPercentage: 30 },
          x: 1,
          y: 2,
          b: 3,
          s: 4,
        },
      ],
      innerShadows: [
        {
          color: { hex: '#ff00ff', opacityPercentage: 50 },
          x: 5,
          y: 6,
          b: 7,
          s: 8,
        },
      ],
    };

    await changeNewElementsProps(page, propsChanges, position);

    const renderedStyles = await getElementStyles(page, position, [
      'width',
      'height',
      'opacity',
      'borderRadius',
      'backgroundColor',
      'border',
      'boxShadow',
    ]);

    const { width, height, opacityPercentage, radius } = propsChanges;
    const background = (propsChanges.backgrounds as IHexColor[])[0];
    const border = (propsChanges.borders as IBorder[])[0];
    const shadow = (propsChanges.shadows as IShadow[])[0];
    const innerShadow = (propsChanges.innerShadows as IShadow[])[0];

    expect(renderedStyles).toEqual(
      {
        width: `${width}px`,
        height: `${height}px`,
        opacity: `${toDecimal(opacityPercentage)}`,
        borderRadius: `${radius}px`,
        backgroundColor: `${hexColorToRGB(background)}`,
        border: `${cssBorder(border)}`,
        boxShadow: `${cssShadow(true, innerShadow)}, ${cssShadow(false, shadow)}`,
      },
      'mismatching element styles'
    );
  });
});
