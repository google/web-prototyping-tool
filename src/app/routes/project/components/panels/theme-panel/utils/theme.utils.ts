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

import { incrementedName } from 'cd-utils/string';
import { IStringMap, IDesignVariable, IDesignColor, ITypographyStyle } from 'cd-interfaces';

export const incrementNameForDesignSystemCategory = (
  defaultName: string,
  category: IStringMap<IDesignVariable | IDesignColor | ITypographyStyle> | undefined
) => {
  if (!category) return defaultName;
  const vars = category;
  const names = Object.values(vars).map((item) => item.name);
  return incrementedName(defaultName, names);
};
