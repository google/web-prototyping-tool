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
/**
 * Helper to construct a relation object
 * this is used to determine placement before | after | prepend | append
 * and sent to the dnd director
 * */
export const buildInsertLocation = (
  elementId: string,
  relation: cd.InsertRelation
): cd.IInsertLocation => ({ elementId, relation });

export const buildPropertyUpdatePayload = (
  elementId: string,
  properties: cd.RecursivePartial<cd.PropertyModel>
): cd.IPropertiesUpdatePayload => {
  return { elementId, properties };
};

export const getPropertiesForId = (
  id: string,
  props: cd.ElementPropertiesMap
): cd.PropertyModel | undefined => {
  return props[id];
};

export const getElementUpdatePayloadForId = (
  elementId: string,
  props: cd.ElementPropertiesMap
): cd.IPropertiesUpdatePayload[] => {
  const properties = getPropertiesForId(elementId, props);
  if (!properties) return [];
  return [{ elementId, properties }];
};

export const getElementAndChildrenUpdatePayloadForId = (
  elementId: string,
  props: cd.ElementPropertiesMap,
  currentIds = new Set<string>(), // Guard against infinite recursion
  payload: cd.IPropertiesUpdatePayload[] = []
): cd.IPropertiesUpdatePayload[] => {
  const properties = getPropertiesForId(elementId, props);
  if (!properties || currentIds.has(elementId)) {
    console.warn('Element already exists or is missing from elementProps');
    return payload;
  }
  currentIds.add(elementId);
  payload.push({ elementId, properties });
  const childIds = properties.childIds || [];
  const children = childIds.flatMap((id) =>
    getElementAndChildrenUpdatePayloadForId(id, props, currentIds)
  );
  if (children.length) payload = [...payload, ...children];
  return payload;
};
