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

import * as cd from 'cd-interfaces';

export const generateTrackBy = (idx: number, input: cd.IPropertyGroup, prefix = '') => {
  return `${prefix}-${idx}${input.targetId || ''}${input.name || ''}`;
};

export const areSymbolInputsExposedForElement = (
  id: string,
  symbol?: cd.ISymbolProperties
): boolean => {
  if (symbol?.exposedInputs && id in symbol.exposedInputs) return symbol.exposedInputs[id];
  // Handle legacy scenarios that use symbolInputs
  const inputs = symbol?.symbolInputs?.[id];
  if (!inputs) return false;
  return inputs.length > 0;
};
