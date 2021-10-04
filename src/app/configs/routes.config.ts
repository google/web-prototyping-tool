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

/**
 * Note: This may appear like a duplicate but Angular's Router requires string literals
 */
export const enum RoutePath {
  CloudAssets = '/cloud-assets',
  Dashboard = '/dashboard',
  Project = '/project',
  ProjectNotFound = '/project-not-found',
  MaintenanceMode = '/maintenance-mode',
  CodeComponent = '/code-component',
  SignIn = '/sign-in',
  Preview = '/preview',
}

export const enum Route {
  Default = '',
  Admin = 'admin',
  CloudAssets = 'cloud-assets',
  Dashboard = 'dashboard',
  Project = 'project',
  ProjectNotFound = 'project-not-found',
  SignIn = 'sign-in',
  Preview = 'preview',
  Embed = 'embed',
  CodeComponent = 'code-component',
  MaintenanceMode = 'maintenance-mode',
  Audit = 'audit',
  VisualRegression = 'visual-regression-test',
  WildCard = '**',
}

export const COMPONENTS_TAB_FRAGMENT = 'components';
export const LAYERS_PANEL_FRAGMENT = 'layers';
export const PROJECT_ID_ROUTE_PARAM = 'projectId';
export const CODE_COMPONENT_ID_ROUTE_PARAM = 'codeComponentId';
export const PATH_DIVIDER = '/';
export const EXPORT_TYPE_QUERY_PARAM = 'type';

export const SYMBOL_MODE_QUERY_PARAM = 'componentMode';
export const ISOLATED_SYMBOL_ID_QUERY_PARAM = 'cid';

export const AUTH_TOKEN_QUERY_PARAM = 'token';
export const EMBED_MODE_QUERY_PARAM = 'embedMode';
