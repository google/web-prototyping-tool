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

const TRANSLATE = 'translate';

export const translate = (x: number, y: number): string => `${TRANSLATE}(${x}px,${y}px)`;

export const svgTranslate = (x: number, y: number): string => {
  return `${TRANSLATE}(${[x, y]})`;
};

export const translate3d = (x: number = 0, y: number = 0, z: number = 0): string => {
  return `${TRANSLATE}3d(${x}px,${y}px,${z}px)`;
};

export const matrix2d = (x: number, y: number, z: number): string => {
  return `matrix(${[z, 0, 0, z, x, y]})`;
};
