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

import type { Units, IValue } from './index';

export interface IFontFamily {
  readonly family: string;
  readonly id?: string;
  readonly variants: string[];
  readonly category?: string;
  readonly files?: Record<string, string>;
  readonly kind?: string;
  readonly lastModified?: string;
  readonly subsets?: string[];
  readonly version?: string;
  readonly locked?: boolean;
  index?: number;
}

export interface ITypographyStyle {
  id?: string | null;
  name: string;
  fontId?: string;
  color: IValue;
  index?: number;
  letterSpacing?: number | 'auto';
  letterSpacingUnits?: Units;
  lineHeight?: number | 'normal';
  lineHeightUnits?: Units;
  size: number;
  sizeUnits?: Units;
  weight?: string;
}

export interface IWebFontList {
  kind: string;
  items: IFontFamily[];
}
