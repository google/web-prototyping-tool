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

import { IStringMap, Units, IValue, IKeyValue } from './index';
import { IStyleDeclaration } from './style-declaration';

export type OverflowStyle = 'auto' | 'scroll' | 'hidden' | 'visible';
export type BackgroundSize = 'auto' | 'cover' | 'contain';
export type LineStyle = 'solid' | 'dashed' | 'dotted';

export enum PointerEvents {
  None = 'none',
  Auto = 'auto',
}

export enum BoxSizing {
  BorderBox = 'border-box',
  ContentBox = 'content-box',
}

export enum Visibility {
  Visible = 'visible',
  Hidden = 'hidden',
}

export enum Overflow {
  Visible = 'visible',
  Auto = 'auto',
  Scroll = 'scroll',
  Hidden = 'hidden',
}

export enum State {
  Default = 'base',
  Focus = 'focus',
  Active = 'active',
  Hover = 'hover',
  Before = 'before',
  After = 'after',
}

export enum Hyphens {
  None = 'none',
  Auto = 'auto',
}

export enum PositionType {
  Relative = 'relative',
  Absolute = 'absolute',
  Static = 'static',
  Sticky = 'sticky',
  Fixed = 'fixed',
}

export enum DisplayMode {
  Block,
  Inline,
  FloatLeft,
  FloatRight,
}

export enum Float {
  Left = 'left',
  Right = 'right',
}

export enum VerticalAlign {
  Baseline = 'baseline',
  Bottom = 'bottom',
  Middle = 'middle',
  Top = 'top',
}

export enum Display {
  Block = 'block',
  InlineBlock = 'inline-block',
  Flex = 'flex',
  InlineFlex = 'inline-flex',
  Grid = 'grid',
  InlineGrid = 'inline-grid',
  Inline = 'inline',
}

export enum LayoutMode {
  Auto,
  Cols,
  Rows,
  Grid,
}

export enum ObjectFit {
  Contain = 'contain',
  Cover = 'cover',
  Fill = 'fill',
}

export enum ObjectPosition {
  Top = 'top',
  Center = 'center',
  Bottom = 'bottom',
  Right = 'right',
  Left = 'left',
}

export enum SVGFilter {
  Grayscale = 'grayscale',
  Brightness = 'brightness',
  Contrast = 'contrast',
  HueRotate = 'hue-rotate',
  Invert = 'invert',
  Blur = 'blur',
}

export enum MixBlendMode {
  Multiply = 'multiply',
  Screen = 'screen',
  Overlay = 'overlay',
  Darken = 'darken',
  Lighten = 'lighten',
  ColorDodge = 'color-dodge',
  ColorBurn = 'color-burn',
  HardLight = 'hard-light',
  Soft = 'soft-light',
  Difference = 'difference',
  Exclusion = 'exclusion',
  Hue = 'hue',
  Saturation = 'saturation',
  Color = 'color',
  Luminosity = 'luminosity',
}

export enum GridAutoMode {
  Auto = 'auto',
  MinContent = 'min-content',
  MaxContent = 'max-content',
}

export enum GridAlign {
  Start = 'start',
  Center = 'center',
  End = 'end',
}

export enum GridAutoFlow {
  Column = 'column',
  Row = 'row',
}

export enum TextOverflow {
  Clip = 'clip',
  Ellipsis = 'ellipsis',
}

export enum WhiteSpace {
  Normal = 'normal',
  NoWrap = 'nowrap',
  Pre = 'pre',
}

export enum WordBreak {
  Normal = 'normal',
  BreakAll = 'break-all',
  KeepAll = 'keep-all',
}

export enum TextTransform {
  Default = 'none',
  Capitalize = 'capitalize',
  Uppercase = 'uppercase',
  Lowercase = 'lowercase',
}

export interface IEdgeStyle {
  top: number;
  left: number;
  bottom: number;
  right: number;
}
// export interface ISize extends IValue {
//   units: Units;
// }
export interface IShadowStyle {
  id?: string;
  inset?: boolean;
  offsetX: number;
  offsetY: number;
  blurRadius: number;
  spreadRadius?: number;
  color: IValue;
  units: Units;
}

export interface IStyles {
  default?: IStringMap<string>;
  [propName: string]: IStringMap<string> | undefined;
}

export interface IBorderStyle {
  id?: string;
  borderWidth: number;
  lineStyle: string;
  borderColor: IValue;
  units: Units;
}

export interface IOverflowStyle {
  x: OverflowStyle;
  y: OverflowStyle;
}

export interface IStyleGroup {
  style?: IStyleDeclaration;
  overrides?: IKeyValue[];
}
export interface IStyleAttributes {
  base: IStyleGroup;
  [propName: string]: IStyleGroup | undefined;
}

export interface IStyleList {
  name: string;
  props: [string, string][];
}

export type PositionProps = Partial<
  Pick<IStyleDeclaration, 'position' | 'left' | 'right' | 'bottom' | 'top' | 'margin' | 'float'>
>;
