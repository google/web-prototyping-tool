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

import { trimStart, stringMatchesRegex } from 'cd-utils/string';

const HTTP_REGEX = /^http(s)?:(\/\/)+/g;
const HTTPS_PREFIX = 'https://';
const HTTP_PREFIX = 'http://';

const SHORT_LINK_REGEX = /^(go|cl|who|f|b|cs|g|omg|p)\//;
const SUPPORTED_SHORT_LINKS = ['go', 'cl', 'who', 'f', 'b', 'cs', 'g', 'omg', 'p'];
const LINK_REGEX_SHORT_LINKS_JOINED = SUPPORTED_SHORT_LINKS.join('\\/|');
const MATCH_LINKS = `\\b(?:(?:https?):\\/\\/|${LINK_REGEX_SHORT_LINKS_JOINED}\\/|www.)[^\\s]+|(?:[^\\s]+\\.[a-z]+)`;
export const LINK_REGEX = new RegExp(MATCH_LINKS, 'g');

const addURLPrefix = (prefix: string, url: string): string => {
  return prefix + trimStart('/', url);
};

/** Auto-prefix incomplete URL's and go links with http(s) prefixes. */
export const prefixUrlWithHTTPS = (url: string): string => {
  // If supported short-form link, add http://
  if (stringMatchesRegex(url, SHORT_LINK_REGEX)) return addURLPrefix(HTTP_PREFIX, url);
  // If URL doesn't have http(s):// prefix, default to https://
  if (!stringMatchesRegex(url, HTTP_REGEX)) return addURLPrefix(HTTPS_PREFIX, url);
  return url;
};

export const openLinkInNewTab = (url: string) => {
  const win = window.open(url, '_blank');
  if (win) win.focus();
};

export const queryParamsFromPropertiesMap = (
  props: Record<string, string | number | boolean>
): string => {
  return new URLSearchParams(props as any).toString();
};
