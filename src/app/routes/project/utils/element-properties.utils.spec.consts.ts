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

export const style = {
  overflow: { x: 'hidden', y: 'hidden' },
  display: 'grid',
  gridRowGap: 49,
  gridAutoFlow: 'row',
  width: { value: 171, units: 'px' },
  left: { value: 135, units: 'px' },
  height: { value: 325, units: 'px' },
  position: 'absolute',
  justifyContent: 'center',
  opacity: 1,
  background: [{ id: 'Primary', value: '#3367D6' }],
  gridAutoRows: 'min-content',
  margin: 'auto',
  justifyItems: 'center',
  padding: { top: 0, left: 0, bottom: 0, right: 0 },
  alignContent: 'center',
  top: { value: 32, units: 'px' },
  alignItems: 'center',
  borderRadius: { top: 73, left: 73, bottom: 73, right: 73 },
};

export const excludeKeys = [
  'border-bottom-color',
  'border-bottom-left-radius',
  'border-bottom-right-radius',
  'border-bottom-style',
  'border-bottom-width',
  'border-bottom',
  'border-collapse',
  'border-color',
  'border-image-outset',
  'border-image-repeat',
  'border-image-slice',
  'border-image-source',
  'border-image-width',
  'border-image',
  'border-left-color',
  'border-left-style',
  'border-left-width',
  'border-left',
  'border-radius',
  'border-right-color',
  'border-right-style',
  'border-right-width',
  'border-right',
  'border-spacing',
  'border-style',
  'border-top-color',
  'border-top-left-radius',
  'border-top-right-radius',
  'border-top-style',
  'border-top-width',
  'border-top',
  'border-width',
  'border',
  'box-shadow',
  'text-shadow',
  'width',
  'height',
  'position',
  'top',
  'right',
  'bottom',
  'left',
  'z-index',
];

export const excludeExpected = {
  overflow: { x: 'hidden', y: 'hidden' },
  display: 'grid',
  gridRowGap: 49,
  gridAutoFlow: 'row',
  justifyContent: 'center',
  opacity: 1,
  background: [{ id: 'Primary', value: '#3367D6' }],
  gridAutoRows: 'min-content',
  margin: 'auto',
  justifyItems: 'center',
  padding: { top: 0, left: 0, bottom: 0, right: 0 },
  alignContent: 'center',
  alignItems: 'center',
};

export const includeKeys = ['overflow-x', 'overflow-y', 'overflow', 'text-overflow', 'z-index'];

export const includeExpected = { overflow: { x: 'hidden', y: 'hidden' } };
