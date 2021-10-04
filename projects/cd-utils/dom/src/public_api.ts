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

const LOAD_EVENT = 'load';
const SCRIPT_TAG = 'script';

/**
 * `scrollIntoViewIfNeeded` is not defined by typescript but supported by major browsers except Firefox
 * providing better performance than `getBoundingClient` rect  which causes CSS reflow.
 */
export const scrollElementIntoViewIfNeeded = (element: HTMLElement | undefined, center = true) => {
  (element as any)?.scrollIntoViewIfNeeded(center);
};

export const loadScript = (src: string, doc?: HTMLDocument, typeModule = false): Promise<void> => {
  return new Promise((resolve) => {
    const scriptTag = document.createElement(SCRIPT_TAG) as HTMLScriptElement;
    (doc || document).body.appendChild(scriptTag);
    const onload = () => {
      scriptTag.removeEventListener(LOAD_EVENT, onload);
      resolve();
    };
    scriptTag.addEventListener(LOAD_EVENT, onload);
    if (typeModule) scriptTag.setAttribute('type', 'module');
    scriptTag.src = src;
  });
};
