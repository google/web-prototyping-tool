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

import { IPoint } from './models';

export * from './models';

/**
 * Return distance between 2 points. (Only account for 2 dimensions)
 * @param p1
 * @param p2
 */
export const distance = (p1: IPoint, p2: IPoint): number => {
  return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
};

/**
 * Fast approximate distance between 2 points.
 * @param p1
 * @param p2
 */
export const approxDist = (p1: IPoint, p2: IPoint) => Math.abs(p1.x - p2.x) + Math.abs(p1.y - p2.y);

export const createPoint = (x = 0, y = 0): IPoint => ({ x, y });
