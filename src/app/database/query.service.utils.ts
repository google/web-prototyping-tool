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

import type { IProject } from 'cd-interfaces';
import type { IPublishEntryQueryResult } from './query.service';

export const mergeProjects = (current: IProject[], updates: IProject[]): IProject[] => {
  return updates.reduce(
    (acc, proj) => {
      const idx = acc.findIndex((item: IProject) => item.id === proj.id);
      if (idx === -1) {
        acc.push(proj);
      } else {
        acc[idx] = proj;
      }
      return acc;
    },
    [...current]
  );
};

export const combineProjectsAndSortByDate = (projects: IProject[][]): IProject[] => {
  return projects
    .flat()
    .filter((proj) => proj !== undefined) // undefined which can come from orphaned stars
    .sort((a, b) => b.updatedAt.seconds - a.updatedAt.seconds);
};

export const mergePublishEntryData = (
  current: IPublishEntryQueryResult[],
  updates: IPublishEntryQueryResult[]
): IPublishEntryQueryResult[] =>
  updates.reduce(
    (acc, publishEntry) => {
      const idx = acc.findIndex((item) => item.data.id === publishEntry.data.id);
      if (idx === -1) {
        acc.push(publishEntry); // Add
      } else {
        acc[idx] = publishEntry; // Replace
      }
      return acc;
    },
    [...current]
  );
