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

import { CSSSelectorType } from 'cd-metadata/css';
import { toKebabCase } from 'cd-utils/string';
import * as cd from 'cd-interfaces';

const COLON = ':';
export const processPseudoClass = (value?: string): string | undefined => {
  if (!value) return;
  const valueWithCol = value.startsWith(COLON) ? value : COLON + value;
  return toKebabCase(valueWithCol);
};

export interface ICSSSelector {
  title: string;
  selector: CSSSelectorType;
  autoValues?: cd.IKeyValue[];
  removable?: boolean;
}

export const isSelectorValid = (selector: string, selectors: ICSSSelector[]): boolean => {
  const hasSelector = selectors.find((item) => item.selector === selector) !== undefined;
  return !hasSelector && CSS.supports(`selector(${selector})`);
};

export const generateRemovableSelector = (selector: string): ICSSSelector => {
  return { title: selector, selector: selector as CSSSelectorType, removable: true };
};
