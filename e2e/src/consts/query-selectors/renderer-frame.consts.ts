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

export const IFRAME_ROOT_ELEMENT = '.cd-root-element';

export const RENDERER_ELEMENT_CLASS = '.cd-render-rect-marker';

export const getRenderedElementSelector = (id: string, className = RENDERER_ELEMENT_CLASS) =>
  `${className}[data-id="${id}"]`;

// an element inside of symbol instance does not have .cd-render-rect-marker class applied
export const getDataIdSelector = (id: string) => `[data-id="${id}"]`;

// inside symbol
export const SYMBOL_ELEMENT_SELECTOR = `.inner-root ${RENDERER_ELEMENT_CLASS}`;
