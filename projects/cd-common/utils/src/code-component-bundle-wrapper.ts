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

/**
 * Wrapper code for all code component bundles.
 *
 * Temp workaround: exporting as a string to prevent buildOptimizer from renaming and due to lack
 * of support for raw-loader by ng-packgr
 */
export const CUSTOM_ELEMENTS_DEFINE_OVERRIDE = '_cdCustomElementsDefineOverride';
export const CODE_COMPONENTS_ERROR_OVERRIDE = '_cdHandleCodeComponentError';

export const wrapCodeComponentCode = (codeComponentId: string, code: string): string => {
  return `
    (function (origWindow) {
      var __CD_CODE_COMPONENT_ID__ = '${codeComponentId}';

      try {
        const __cdCustomElementsDefineOverride = (name, ctor, options) => {
          origWindow['${CUSTOM_ELEMENTS_DEFINE_OVERRIDE}'](name, ctor, options, __CD_CODE_COMPONENT_ID__);
        };

        var customElements = new Proxy(
          {},
          {
            get: (_target, key) => {
              if (key === 'define') return __cdCustomElementsDefineOverride;
              const origValue = origWindow.customElements[key];
              if (typeof origValue === 'function') return origValue.bind(origWindow.customElements);
              return origValue;
            },
            set: (_target, key, value) => {
              return (origWindow.customElements[key] = value);
            },
            deleteProperty: (_target, key) => {
              return delete origWindow.customElements[key];
            },
            enumerate: (_target) => {
              return Object.keys(origWindow.customElements);
            },
            ownKeys: (_target) => {
              return Object.keys(origWindow.customElements);
            },
            has: (_target, key) => {
              return key in origWindow.customElements;
            },
            defineProperty: (_target, key, oDesc) => {
              return Object.defineProperty(origWindow.customElements, key, oDesc);
            },
            getOwnPropertyDescriptor: (_target, key) => {
              return Object.getOwnPropertyDescriptor(origWindow.customElements, key);
            },
          }
        );

        var window = new Proxy(
          {},
          {
            get: (_target, key) => {
              if (key === 'customElements') return customElements;
              const origValue = origWindow[key];
              if (typeof origValue === 'function') return origValue.bind(origWindow);
              return origValue;
            },
            set: (_target, key, value) => {
              return (origWindow[key] = value);
            },
            deleteProperty: (_target, key) => {
              return delete origWindow[key];
            },
            enumerate: (_target) => {
              return Object.keys(origWindow);
            },
            ownKeys: (_target) => {
              return Object.keys(origWindow);
            },
            has: (_target, key) => {
              return key in origWindow;
            },
            defineProperty: (_target, key, oDesc) => {
              return Object.defineProperty(origWindow, key, oDesc);
            },
            getOwnPropertyDescriptor: (_target, key) => {
              return Object.getOwnPropertyDescriptor(origWindow, key);
            },
          }
        );

        ${code}

      } catch (e) {
        origWindow['${CODE_COMPONENTS_ERROR_OVERRIDE}'](__CD_CODE_COMPONENT_ID__, e);
      }
    })(window);
  `;
};
