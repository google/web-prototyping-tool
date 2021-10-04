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

import { IStyleDeclaration, Display, PositionType } from 'cd-interfaces';

const PIPE = '|';

export const isDisplayGrid = (display?: string): boolean => {
  return !!(display && display.includes(Display.Grid));
};

export const isDisplayInline = (display?: string): boolean => {
  return !!(display && display.includes(Display.Inline));
};

export const isPositionFixedOrAbsolute = (style?: IStyleDeclaration): boolean => {
  const position = style && style.position;
  return [PositionType.Fixed, PositionType.Absolute].includes(position);
};

export const displayValueWithoutInlinePrefix = (value?: string): string => {
  const modes = [Display.Block, Display.Flex, Display.Grid].join(PIPE);
  const match = value && value.match(modes);
  if (match) return match[0];
  return Display.Block;
};

/** Used by Symbol instances to extract position values from the symbol root */
export const extractPositionFromStyle = (
  style: IStyleDeclaration | undefined
): IStyleDeclaration => {
  const { top, left, right, bottom, position, float, verticalAlign, margin } = style || {};
  const extracted = { top, left, right, bottom, position, float, margin, verticalAlign };
  return Object.entries(extracted).reduce<IStyleDeclaration>((acc, curr) => {
    const [key, value] = curr;
    if (value !== undefined) acc[key] = value;
    return acc;
  }, {});
};
