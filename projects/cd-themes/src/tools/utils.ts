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

import { IDesignColor, ITypographyStyle, IFontFamily, IDesignVariable } from 'cd-interfaces';

type DesignObject = IDesignColor | ITypographyStyle | IFontFamily | IDesignVariable;

export const sortDesignSystemValues = (a: DesignObject, b: DesignObject): number => {
  const ax = a.index || 0;
  const bx = b.index || 0;
  if (ax < bx) return -1;
  if (ax > bx) return 1;

  const aName = (a as IDesignColor).name || (a as IFontFamily).family;
  const bName = (b as IDesignColor).name || (b as IFontFamily).family;
  return aName.localeCompare(bName);
};
