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

export const transformEntity = (entity: cd.PropertyModel): cd.PropertyModel | undefined => {
  if (entity.type !== cd.EntityType.Element) return;
  if (entity.elementType !== cd.ElementEntitySubType.Symbol) return;
  delete entity.styles.base?.style?.width;
  delete entity.styles.base?.style?.height;
  return entity;
};

export const verifyEntity = (entity: cd.PropertyModel): boolean => {
  if (entity.type !== cd.EntityType.Element) return true;
  if (entity.elementType !== cd.ElementEntitySubType.Symbol) return true;
  const widthIsUndefined = entity.styles.base?.style?.width === undefined;
  const heightIsUndefined = entity.styles.base?.style?.height === undefined;
  return widthIsUndefined && heightIsUndefined;
};
