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

import { IKeyValue } from 'cd-interfaces';

export const buildAttributes = (attrs: string[][] = []): string => {
  return attrs.map(([key, value]) => ` ${key}="${value}"`).join('');
};

export const constructElement = (
  tagName: string,
  className = '',
  innerContent = '',
  attrs: string[][] = []
) => {
  const classes = className ? ` class="${className}"` : '';
  const attributes = buildAttributes(attrs);
  return `<${tagName}${attributes}${classes}>${innerContent}</${tagName}>`;
};

export const keyValueAttrsToString = (attrs: IKeyValue[]) => {
  const converted = attrs.map(({ name, value }) => [name, value]) as string[][];
  return buildAttributes(converted);
};
