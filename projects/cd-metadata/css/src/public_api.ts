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

export { default as cssProperties } from './properties';
export { default as cssPropertyMap } from './property-map';
export { default as cssPseudoSelectors } from './pseudo-selectors';
export { default as cssDistanceProps } from './distance';
export { default as cssColorProps } from './color-props';

export const CSSSelector = {
  Base: 'base',
  Hover: ':hover',
  Focus: ':focus',
  FocusWithin: ':focus-within',
  Active: ':active',
  Before: ':before',
  After: ':after',
} as const;

export type CSSSelectorType = typeof CSSSelector[keyof typeof CSSSelector];
