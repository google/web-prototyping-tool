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
import { generateIDWithLength } from 'cd-utils/guid';

enum OldActionTypes {
  // These are slightly different from new ActionType
  NavigateToBoard = 'NavigateToBoard',
  NavigateToUrl = 'NavigateToUrl',
}

type ConvertedAction = cd.ActionType.NavigateToBoard | cd.ActionType.NavigateToUrl;

const typeTransformer = (value: string): ConvertedAction => {
  if (value === OldActionTypes.NavigateToBoard) return cd.ActionType.NavigateToBoard;
  return cd.ActionType.NavigateToUrl;
};

export const transformEntity = (entity: cd.PropertyModel): cd.PropertyModel | undefined => {
  if (entity.type !== cd.EntityType.Element) return;
  if (!entity.actions || entity.actions.length === 0) return;

  const actions = entity.actions.map((item) => {
    const action = (item as any).action;
    if (!action) return item;
    const target = (action as any)?.destination || '';
    const id = generateIDWithLength(7);
    const type = typeTransformer(action.type);
    const trigger = cd.EventTrigger.Click;
    return { id, target, type, trigger };
  });

  Object.assign(entity, { actions });
  return entity;
};

export const verifyEntity = (entity: cd.PropertyModel): boolean => {
  if (entity.type !== cd.EntityType.Element) return true; // not an element, ignore
  if (!entity.actions || entity.actions.length === 0) return true; // no actions ignore
  return entity.actions.every((item) => {
    const subAction = (item as any).action;
    return subAction === undefined;
  });
};
