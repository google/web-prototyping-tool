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

import type * as cd from 'cd-interfaces';
import { classToObject } from 'cd-utils/object';

export class StyleFactory implements Pick<cd.IStyleAttributes, 'base'> {
  public base: cd.IStyleGroup = {
    style: {},
    overrides: [],
  };

  get baseStyle() {
    return this.base.style;
  }

  deleteOverrides() {
    this.base = { style: { ...this.baseStyle } };
    return this;
  }

  addBaseStyle(style: Partial<cd.IStyleDeclaration>) {
    this.base.style = { ...this.baseStyle, ...style };
    return this;
  }

  addBaseOverrides(overrides: cd.IKeyValue[] = []) {
    this.base.overrides = overrides.map((keyValue) => ({ ...keyValue }));
    return this;
  }

  build(): cd.IStyleAttributes {
    return classToObject(this);
  }
}
