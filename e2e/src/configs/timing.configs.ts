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

// Some interactions need additional time
export const LONG_INTERACTION_INTERVAL = 1500;

// Like a human
export const INTERACTION_INTERVAL = 650;

// TODO Instead of this, we should listen to render results.
export const LIBRARY_COMPILATION_TIME = 800;

// TODO: Should check panel width / visibility, instead of hardcoded delay
export const PANEL_TOGGLE_DELAY = 300;

// TODO: Look into this more:
//                We're wait for styles to be applied so we need a signal/trigger.
export const PREVIEW_LAUNCH_DELAY = 300;
