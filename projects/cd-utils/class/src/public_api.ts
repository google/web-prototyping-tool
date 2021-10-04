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

import { isFunction } from 'cd-utils/object';

/**
 * Determines if the item is a class, by checking the property descriptor, since
 * a class is function with a non-writable/enumerable/configurable prototype.
 */
export const isClass = (item: any): boolean => {
  if (!isFunction(item)) return false;
  const desc = Object.getOwnPropertyDescriptor(item, 'prototype');
  if (!desc) return false;
  return desc.writable === false && desc.enumerable === false && desc.configurable === false;
};

/**
 * Determines if the item is of a specified class type, which is defined as
 * the class itself (item === typeClass) or is a subclass of the class.
 */
export const isOfClassType = (item: any, typeClass: any): boolean => {
  if (!item || !typeClass || !isClass(item) || !isClass(typeClass)) return false;
  let cls = item;
  while (cls && cls !== Object) {
    if (cls === typeClass) return true;
    cls = Object.getPrototypeOf(cls);
  }
  return false;
};
