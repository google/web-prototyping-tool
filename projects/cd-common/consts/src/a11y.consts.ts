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

import * as html from './html.consts';
import { IA11yModeState } from 'cd-interfaces';

export const ARIA_ATTR_PREFIX = 'aria-';
export const ARIA_LABEL_ATTR = `aria-label`;
export const ARIA_ROLE_ATTR = 'role';
export const ARIA_LEVEL_ATTR = 'aria-level';
export const ARIA_DISABLED_ATTR = 'aria-disabled';
export const ARIA_CHECKED_ATTR = 'aria-checked';

export const HEADING_ROLE = 'heading';
export const HEADING_TAGS = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
export const LANDMARK_ROLES = [
  'banner',
  'complementary',
  'contentinfo',
  'form',
  'main',
  'navigation',
  'region',
  'search',
];

export const LANDMARK_TAGS = [
  html.HEADER_TAG,
  html.ASIDE_TAG,
  html.FOOTER_TAG,
  html.FORM_TAG,
  html.MAIN_TAG,
  html.NAV_TAG,
  html.SECTION_TAG,
];

// Native elements that have negative tabindex but are still focusable.
// Note: this list is not comprehensive, will add to as needed.
export const NEGATIVE_TABINDEX_ELEMENTS = [html.VIDEO_TAG, html.AUDIO_TAG];

export const DEFAULT_A11Y_MODE_STATE: IA11yModeState = {
  panel: false,
  flow: false,
  landmarks: false,
  headings: false,
};
