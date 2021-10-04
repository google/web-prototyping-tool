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

import type { IProject, IPublishEntry } from 'cd-interfaces';

const REGEX_SPACES = /\s+/g;
const REGEX_DASH_TO_SPACE = /-+/g;
const REGEX_UNDERSCORE_TO_SPACE = /_+/g;
const REGEX_AZ_09 = /([a-z0-9])([A-Z])/g;
const REGEX_SPECIAL_CHARS = /[^\w\s]/gi;
const SPACE = ' ';

const normalizeText = (text: string): string => {
  return text
    .replace(REGEX_SPECIAL_CHARS, '')
    .replace(REGEX_AZ_09, '$1-$2')
    .replace(REGEX_SPACES, SPACE) // Remove spaces gaps
    .replace(REGEX_DASH_TO_SPACE, SPACE) // Turn dashes into spaces
    .replace(REGEX_UNDERSCORE_TO_SPACE, SPACE) // Turn dashes into spaces
    .toLowerCase();
};

export const generateKeywords = (text?: string): string[] => {
  if (!text) return [];
  const fulltext = text.replace(REGEX_SPACES, SPACE).toLowerCase();
  const tags = normalizeText(text).split(SPACE);
  const keywords = [fulltext, ...tags];
  return Array.from(new Set(keywords));
};

/** Generate keywords if the project partial contains 'name' change*/
export const updateProjectKeywordsIfPartialContainsTitle = (
  project: Partial<IProject>
): Partial<IProject> => {
  // Generate array of keywords if title provided, or empty array if empty string
  if (project.name !== undefined) project.keywords = generateKeywords(project.name);
  return project;
};

export const generateKeywordsForPublishEntry = (publishEntry: IPublishEntry): string[] => {
  const tags = publishEntry.tags || [];
  const joinedTags = tags.join(' ');
  const nameKeywords = generateKeywords(publishEntry.name);
  const tagKeywords = generateKeywords(joinedTags);
  const allKeywords = [...tags, ...nameKeywords, ...tagKeywords];
  return Array.from(new Set(allKeywords));
};
