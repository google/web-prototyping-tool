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

import { ComponentSize } from 'cd-interfaces';

export const SVG_SUFFIX = '.svg';
const CURRENT_COLOR = 'currentColor';
const HEIGHT_ATTR = 'height';
const WIDTH_ATTR = 'width';
const FILL_ATTR = 'fill';
const STROKE_ATTR = 'stroke';

export const ICON_DIMENSIONS: Record<string, number> = {
  [ComponentSize.Small]: 16,
  [ComponentSize.Medium]: 20,
  [ComponentSize.Large]: 24,
};

const parser = new DOMParser();

const setAttribute = (element: HTMLElement, attribute: string, value: string): void => {
  const attributeValue = element.getAttribute(attribute);
  if (!attributeValue || attributeValue === 'none') return;
  element.setAttribute(attribute, value);
};

const replaceAttributeIfAvailable = (element: HTMLElement, attr: string) => {
  const attribute = element.getAttribute(attr);
  if (!attribute) return;
  const value = attribute.includes('var(') ? attribute : CURRENT_COLOR;
  setAttribute(element, attr, value);
};

const replaceColors = (element: HTMLElement): void => {
  for (let i = 0; i < element.children.length; i++) {
    const child = element.children[i] as HTMLElement;
    replaceAttributeIfAvailable(child, STROKE_ATTR);
    replaceAttributeIfAvailable(child, FILL_ATTR);
    if (child.children) replaceColors(child);
  }
};

const setSvgSize = (el: HTMLElement, width: number, height: number): HTMLElement => {
  const originalWidth = el.getAttribute(WIDTH_ATTR);
  const originalHeight = el.getAttribute(HEIGHT_ATTR);
  el.setAttribute('viewBox', `0 0 ${originalWidth} ${originalHeight}`);
  el.setAttribute(WIDTH_ATTR, String(width));
  el.setAttribute(HEIGHT_ATTR, String(height));
  el.removeAttribute('xmlns');

  Object.assign(el.style, {
    width: '100%',
    height: '100%',
  });
  return el;
};

export const stringToSvg = (
  text: string,
  overWriteSize: boolean,
  width: number,
  height: number
): Promise<HTMLOrSVGElement> =>
  new Promise((resolve) => {
    const parsed = parser.parseFromString(text, 'image/svg+xml');
    let dom: HTMLElement = parsed.documentElement as HTMLElement;

    if (overWriteSize) {
      dom = setSvgSize(dom, width, height);
    }

    replaceColors(dom);
    resolve(dom);
  });
