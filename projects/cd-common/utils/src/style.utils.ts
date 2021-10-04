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

import { UnitTypes } from 'cd-metadata/units';
import * as cd from 'cd-interfaces';

export const getElementBaseStyles = (
  element: cd.PropertyModel
): cd.IStyleDeclaration | undefined => {
  return element?.styles?.base?.style;
};

export const assignBaseStyles = (element: cd.PropertyModel, style: cd.IStyleDeclaration) => {
  Object.assign(element.styles.base.style, style);
};

export const baseStylesPartial = (style: cd.IStyleDeclaration) => {
  return { styles: { base: { style } } } as Partial<cd.PropertyModel>;
};

export const buildBaseStylePropsUpdate = (
  elementId: string,
  style: cd.IStyleDeclaration
): cd.IPropertiesUpdatePayload => {
  const properties: cd.UpdatePayloadProperties = baseStylesPartial(style);
  return { elementId, properties };
};

const widthMatchesUnits = (element: cd.PropertyModel, units: UnitTypes): boolean => {
  const widthStyle = getElementBaseStyles(element)?.width;
  return (widthStyle as cd.IValue)?.units === units;
};

export const hasPixelWidth = (element: cd.PropertyModel): boolean => {
  return widthMatchesUnits(element, UnitTypes.Pixels);
};

export const hasPercentageWidth = (element: cd.PropertyModel): boolean => {
  return widthMatchesUnits(element, UnitTypes.Percent);
};

export const createPixelIValue = (value: number): cd.IValue => {
  return { value, units: UnitTypes.Pixels };
};
