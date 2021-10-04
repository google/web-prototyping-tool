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

// We're intentionally uncoupling interface definitions from what's
// defined in the app/cd-common/... code base:
//
// (1) We want to model closely what's seen in the UI, as we're doing e2e UI testing
// (2) If something breaks there in the code base, we want to be able to catch the
//     discrepancy.
// (3) If the change in the code base does not affect UI testing, we should be
//     oblivious about such change.)
//
// Modelling UI is also why opacity is opacityPercentage here.

// TODO: How do we do a more elaborate color-picker test?
export interface IHexColor {
  hex: string; // '#rrggbb (7 chars in total)
  opacityPercentage?: number;
}

export interface IBorder {
  color: IHexColor;
  width: number;
  style: 'solid' | 'dashed' | 'dotted';
}

export interface IShadow {
  color: IHexColor;
  x: number;
  y: number;
  b: number;
  s: number;
}

export interface ICSSValues {
  [prop: string]: string;
}

export type ColorPropType = IHexColor | string; // string = design system identifier

export interface IPropsChanges {
  width: number;
  height: number;
  opacityPercentage: number;
  radius: number;
  backgrounds: ColorPropType[];
  borders: IBorder[];
  shadows: IShadow[];
  innerShadows: IShadow[];
  color?: ColorPropType;
}
