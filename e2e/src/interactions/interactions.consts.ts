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

import { BehaviorType } from '../consts/tests.interface';

export const MODAL_ELEMENT = 'cd-outlet-modal';

export const MODAL_ELEMENT_ROOT = `${MODAL_ELEMENT} div.inner-root`;

export const GOTO_PREVIEW = {
  type: BehaviorType.GoToPreview,
};

export const ACTION_PANEL_SELECTOR = 'app-actions-panel';
