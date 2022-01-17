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

import { loadScript } from 'cd-utils/dom';
declare const userfeedback: any | undefined;

// View documenation at:
const feedbackConfiguration = {
  productId: '',
  locale: '',
};
let hasloaded = false;
const FEEDBACK_API = '';
export const startFeedback = () => {
  if (hasloaded) return sendFeedback();
  loadScript(FEEDBACK_API).then(() => {
    hasloaded = true;
    sendFeedback();
  });
};

const sendFeedback = () => {
  userfeedback.api.startFeedback(feedbackConfiguration);
};
