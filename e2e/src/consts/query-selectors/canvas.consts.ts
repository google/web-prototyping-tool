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

export const CANVAS = 'app-canvas';

export const OUTLET_FRAME = 'app-render-outlet-iframe';

export const CANVAS_IFRAME = (id: string) => `${OUTLET_FRAME}[ng-reflect-id="${id}"] iframe`;

export const GLASS = 'app-glass-layer';

export const INTERACTION_LAYER = '[app-interaction-layer]';

export const GLASS_OUTLET_FRAME_GROUP = `${GLASS} [cd-e2e-label="outlet-frame"]`;

export const GLASS_OUTLET_FRAME = (id: string) =>
  `${GLASS} ${INTERACTION_LAYER} rect[ng-reflect-outlet-frame-id="${id}"]`;

export const GLASS_ELEMENT = (id: string) =>
  `${GLASS} ${INTERACTION_LAYER} rect[ng-reflect-element-id="${id}"]`;

export const SYMBOL_ISOLATION_BOARD_HEADER = 'app-outlet-label .wrapper';
export const SYMBOL_ISOLATION_GLASS_OUTLET_FRAME = `${GLASS} ${INTERACTION_LAYER} rect`;
