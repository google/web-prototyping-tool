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

import { PropertyModel } from './property-models';

export enum TemplateBuildMode {
  /** For an internally rendered template only. */
  Internal,
  /** For exporting to simple HTML for user copy/paste. */
  Simple,
  /** For exporting as a complete application. */
  Application,
}

export type TemplateFunction = (
  mode: TemplateBuildMode,
  props?: PropertyModel | any,
  content?: string
) => string;
