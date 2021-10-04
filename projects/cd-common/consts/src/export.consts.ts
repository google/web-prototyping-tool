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

export const EXPORT_APP = 'cd-export';
export const EXPORT_APP_FILENAME = `${EXPORT_APP}.zip`;
export const ASSETS_DIR = 'assets';
export const EXPORT_APP_URL = `/${ASSETS_DIR}/${EXPORT_APP_FILENAME}`;
export const PROJECT_JSON_PATH = `${ASSETS_DIR}/exported-project.json`;
export const PROJECT_JSON_ZIP_FILEPATH = `${EXPORT_APP}/${PROJECT_JSON_PATH}`;
export const ASSET_MANIFEST_PATH = `${ASSETS_DIR}/asset-manifest.json`;
export const ASSET_MANIFEST_ZIP_FILEPATH = `${EXPORT_APP}/${ASSET_MANIFEST_PATH}`;
export const INDEX_HTML_FILEPATH = `${EXPORT_APP}/index.html`;
export const DEFAULT_EXPORT_PROJECT_TITLE = 'My Prototype';
export const DEFAULT_EXPORT_TITLE_HTML = `<title>${DEFAULT_EXPORT_PROJECT_TITLE}</title>`;
