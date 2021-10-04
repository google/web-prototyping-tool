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

import { validateTagname } from 'cd-common/utils';
import { IRichTooltip } from 'cd-interfaces';
import {
  getInvalidTagNameErrorText,
  NO_TAG_NAME_ERROR_TEXT,
} from '../configs/custom-component.config';

export const tagNameValidator = (
  tagNameUpdate: string | undefined,
  currentTagName?: string
): [valid: boolean, errorText: IRichTooltip | undefined] => {
  // Skip validation if setting name back to initial value
  if (currentTagName === tagNameUpdate) return [true, undefined];
  // Check if name is defined
  if (!tagNameUpdate) return [false, NO_TAG_NAME_ERROR_TEXT];
  // Check if name is a valid pattern
  if (!validateTagname(tagNameUpdate)) {
    const error = getInvalidTagNameErrorText(tagNameUpdate);
    return [false, error];
  }
  // Else remove error state from input
  return [true, undefined];
};
