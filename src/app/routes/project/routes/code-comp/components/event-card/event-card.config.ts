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

import { IRichTooltip } from 'cd-interfaces';

export const UNBOUND_EVENT_NAME = 'Unnamed';

export const INPUT_BINDING_HELP_TEXT: IRichTooltip = {
  text: 'Corresponding input for this output event. This will enable  to stay in sync with the internal state of your component.',
  link: '',
  linkText: 'Learn more',
};

export const TYPE_HELP_TEXT: IRichTooltip = {
  text: 'The type of data that this event outputs',
  link: '',
  linkText: 'Learn more',
};
