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

import { ActivatedRouteSnapshot } from '@angular/router';

import {
  Route,
  PATH_DIVIDER,
  ISOLATED_SYMBOL_ID_QUERY_PARAM,
  SYMBOL_MODE_QUERY_PARAM,
} from '../configs/routes.config';

const constructPath = (...args: string[]): string => PATH_DIVIDER + args.join(PATH_DIVIDER);

const buildSymbolIsolationParams = (id?: string | null): string => {
  return id ? `?${SYMBOL_MODE_QUERY_PARAM}=true&${ISOLATED_SYMBOL_ID_QUERY_PARAM}=${id}` : '';
};

export const constructProjectPath = (
  projectId: string,
  symbolIsolationId?: string | null
): string => {
  const suffix = buildSymbolIsolationParams(symbolIsolationId);
  return constructPath(Route.Project, projectId) + suffix;
};

export const constructProjectPathToBoard = (projectId: string, boardId: string): string => {
  return constructPath(Route.Project, projectId) + `?id=${boardId}`;
};

export const constructCodeComponentPath = (projectId: string, codeComponentId: string): string => {
  return constructPath(Route.Project, projectId, Route.CodeComponent, codeComponentId);
};

export const constructPreviewPath = (projectId: string): string =>
  constructPath(Route.Project, projectId, Route.Preview);

export const getRouterParamValue = (
  routeSnapshot: ActivatedRouteSnapshot,
  paramName: string
): string | null => {
  return routeSnapshot.queryParamMap.get(paramName);
};
