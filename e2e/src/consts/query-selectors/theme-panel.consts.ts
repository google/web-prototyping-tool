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

export const THEME_PANEL = 'app-theme-panel';
export const THEME_PANEL_COLORS = `${THEME_PANEL} app-theme-color`;
export const THEME_PANEL_COLORS_SWATCH = (name: string) =>
  `${THEME_PANEL_COLORS} li[cd-e2e-label="${name}"] .swatch`;
export const THEME_PANEL_COLORS_MENU_BUTTON = (name: string) =>
  `${THEME_PANEL_COLORS} li[cd-e2e-label="${name}"] .menu-button`;
