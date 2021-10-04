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

// Max values from https://firebase.google.com/docs/functions/manage-functions#set_timeout_and_memory_allocation
export const runtimeOptions = {
  timeoutSeconds: 540,
  memory: '2GB' as '2GB', // "as 2GB" to make tsc happy; the associated @types isn't good enough
};
