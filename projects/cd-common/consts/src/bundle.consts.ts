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

export const CONFIG_FILE_NAME = 'app.config.json';
export const CATALOG_FILE_NAME = 'library.catalog.json';
export const JS_FILE_NAME = 'library.umd.js';
export const CSS_FILE_NAME = 'library.css';
export const ICON_FILE_NAME = 'library.png'; // TODO: support other image types
export const BUNDLE_EXTENSION = '.library.zip';
export const BUNDLE_FILES = [CATALOG_FILE_NAME, JS_FILE_NAME, CSS_FILE_NAME, ICON_FILE_NAME];
