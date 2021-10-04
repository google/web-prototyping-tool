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

import { ElementHandle, Page, Frame } from 'puppeteer';
import { IPoint } from 'cd-utils/geometry';
import { ICSSValues } from '../../models/props.interfaces';
import { KEYS } from '../../utils/cd-utils-keycodes.utils';

export const getPartialStyles = async (
  context: Page | Frame,
  elem: ElementHandle<Element>,
  props: string[]
): Promise<ICSSValues> => {
  const inContextScript = (ctxElem: Element, ctxProps: string[]) => {
    const styles = window.getComputedStyle(ctxElem);
    return ctxProps.reduce(
      (prevStyles, currProp) => ({
        ...prevStyles,
        [currProp]: (styles as any)[currProp],
      }),
      {}
    );
  };

  return await context.evaluate(inContextScript, elem, props);
};

/**
 * Enter something to the input (including hitting ENTER)
 *
 * @param input
 * @param text
 */
export const enterTextInput = async (input: ElementHandle<Element>, text: string) => {
  await input.focus();
  await input.click({ clickCount: 3 }); // clear all, just like what i'd do with my hands
  await input.type(text);
  await input.press(KEYS.Enter);
};

/**
 * Get the center point of an element bounding box
 *
 * @param input
 * @param text
 */
export const getElemCenterPoint = async (elem: ElementHandle<Element>): Promise<IPoint> => {
  const box = await elem.boundingBox();
  if (!box) throw new Error(`Bounding box not found, ${elem}`);

  const { x, y, width, height } = box;

  return {
    x: x + width / 2,
    y: y + height / 2,
  };
};

export const getElementCssClasses = async (elem: ElementHandle<Element>): Promise<string[]> => {
  const classListHandle = await elem.getProperty('classList');
  const classListJson = (await classListHandle.jsonValue()) as Record<string, string>;
  const cssClasses = Object.values(classListJson);
  return cssClasses as string[];
};
