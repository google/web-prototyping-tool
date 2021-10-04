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

import {
  CODE_COMPONENTS_ERROR_OVERRIDE,
  CUSTOM_ELEMENTS_DEFINE_OVERRIDE,
  getCodeComponentScopedTagName,
} from 'cd-common/utils';
import type { IRendererWindow } from 'cd-interfaces';
import { isFunction } from 'cd-utils/object';

declare type TrustedHTML = Object;

const ASYNC_FN = 'AsyncFunction';
/**
 * Helper function to prevent repeating code for overriding innerHTML and outerHTML
 */
const addElementGetterSetterOverride = (attributeName: string, tagNameMap: Map<string, string>) => {
  const { getOwnPropertyDescriptor, defineProperty } = Object;
  const originalGet = (getOwnPropertyDescriptor(Element.prototype, attributeName) as any).get;
  const originalSet = (getOwnPropertyDescriptor(Element.prototype, attributeName) as any).set;

  defineProperty(Element.prototype, attributeName, {
    get: function () {
      return originalGet.call(this);
    },
    set: function (value) {
      const updatedValue = insertScopedTagNamesIntoHTML(value, tagNameMap);
      return originalSet.call(this, updatedValue);
    },
  });
};

/**
 * Tests to see if a function is async
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/AsyncFunction
 */
const isAsyncFunction = (func: Function): boolean => func.constructor.name === ASYNC_FN;

/**
 * Wraps call to original function in a try/catch block
 */
const getTryCatchFunctionOverride = (origFunction: Function, errorCallback: Function) => {
  const isAsync = isAsyncFunction(origFunction);

  if (isAsync) {
    return async function (...args: any[]) {
      try {
        return await origFunction.apply(this, args);
      } catch (e) {
        errorCallback(e);
      }
    };
  }

  return function (...args: any[]) {
    try {
      return origFunction.apply(this, args);
    } catch (e) {
      errorCallback(e);
    }
  };
};

/**
 * Given a class, this function will iterate over all functions stored on the prototype.
 * It will create a try/catch version of the function and redefine it on the class.
 *
 * Handles normal functions and getters/setters.
 *
 * Note: This approach cannot handle arrow functions set as properties on the class. It is not
 * possible to access/inspect those without creating an instance of the class.
 *
 * For example:
 *
 * class Foo {
 *    bar = () => {}
 * }
 *
 * The bar function will not be replaced with a try/catch override
 */
const addTryCatchesToClassFunctions = (elementClass: any, errorCallback: Function): any => {
  const prototypeDescriptors = Object.getOwnPropertyDescriptors(elementClass.prototype);
  const descriptorsList = Object.values(prototypeDescriptors);

  // Override class functions
  for (const descriptor of descriptorsList) {
    const { get: origGet, set: origSet, value: origValue } = descriptor;
    const newDescriptor = { ...descriptor };
    let name;

    if (origGet && isFunction(origGet)) {
      // Name of a getter function is 'get [NAME]'. Removing 'get ' to just get root name
      name = origGet.name.replace('get ', '');
      newDescriptor.get = getTryCatchFunctionOverride(origGet, errorCallback);
    }

    if (origSet && isFunction(origSet)) {
      // Name of a setter function is 'set [NAME]'. Removing 'set ' to just get root name
      name = origSet.name.replace('set ', '');
      newDescriptor.set = getTryCatchFunctionOverride(origSet, errorCallback);
    }

    if (origValue && isFunction(origValue)) {
      name = origValue.name;
      newDescriptor.value = getTryCatchFunctionOverride(origValue, errorCallback);
    }

    if (name) {
      Object.defineProperty(elementClass.prototype, name, newDescriptor);
    }
  }

  return elementClass;
};

/**
 * Given a string of HTML that is set via innerHTML, outerHTML, or insertAdjacentHTML
 * replace any instances of any custom element tag names with the scoped tagnames that we created
 */
export const insertScopedTagNamesIntoHTML = (
  html: string | TrustedHTML,
  tagNameMap: Map<string, string>
): string => {
  const tagNameEntires = Array.from(tagNameMap.entries());
  let htmlStr = html.toString();
  for (const [tagName, scopedTagname] of tagNameEntires) {
    /**
     * Replace any instances of opening or closing tags
     * Regex matches (in order):
     *  1. Opening or closing tag bracket (< or </)
     *  2. tagName
     *  3. space or closing bracket (>)
     */
    const tagNameRegex = new RegExp(`(<\/?\\s*)(${tagName})(\\s|>)`, 'gi');

    // Keep first and last match parts (the brackets) and replace the middle part (the tagname)
    const replacement = `$1${scopedTagname}$3`;

    htmlStr = htmlStr.replace(tagNameRegex, replacement);
  }
  return htmlStr;
};

export const setupDomOverrides = (
  win: Window,
  doc: HTMLDocument,
  rendererFrame: void | IRendererWindow
) => {
  const windowAny = win as any;
  const tagNameMap = new Map<string, string>();
  const codeComponentErrorHandler = (codeComponentId: string, error: any) => {
    if (rendererFrame) rendererFrame.handleCodeComponentError(codeComponentId, error);
  };

  /**
   * Add global function to window for handling errors caught from code components.
   *
   * This function gets called by the try/catch block wrapped around the entire code component
   * bundle in /projects/cd-common/utils/src/code-component.utils.ts
   */
  windowAny[CODE_COMPONENTS_ERROR_OVERRIDE] = codeComponentErrorHandler;

  /**
   * Define our custom function for defining custom elements that our injected code will call to scope
   * tagnames for code components. See projects/cd-common/utils/src/code-component.utils.ts
   */
  windowAny[CUSTOM_ELEMENTS_DEFINE_OVERRIDE] = (
    name: string,
    ctor: any,
    options: any,
    codeComponentId: string
  ) => {
    const scopedTagname = getCodeComponentScopedTagName(codeComponentId, name);
    const errorCallback = (err: any) => codeComponentErrorHandler(codeComponentId, err);
    const tryCatchCtor = addTryCatchesToClassFunctions(ctor, errorCallback);
    win.customElements.define(scopedTagname, tryCatchCtor, options);
    tagNameMap.set(name, scopedTagname);
  };

  /**
   * Override document.createElement
   */
  doc.createElement = (function (createElement) {
    return function () {
      const updatedArgs = [...arguments];
      const scopedTagname = tagNameMap.get(updatedArgs[0]);
      if (scopedTagname) updatedArgs[0] = scopedTagname;
      return createElement.apply(this, updatedArgs as any);
    };
  })(doc.createElement);

  /**
   * Override insertAdjacentHTML
   */
  Element.prototype.insertAdjacentHTML = (function (insertAdjacentHTML) {
    return function () {
      const [position, text] = arguments;
      const updatedText = insertScopedTagNamesIntoHTML(text, tagNameMap);
      return insertAdjacentHTML.apply(this, [position, updatedText]);
    };
  })(Element.prototype.insertAdjacentHTML);

  /**
   * Override innerHTML and outerHTML
   */
  addElementGetterSetterOverride('innerHTML', tagNameMap);
  addElementGetterSetterOverride('outerHTML', tagNameMap);
};
