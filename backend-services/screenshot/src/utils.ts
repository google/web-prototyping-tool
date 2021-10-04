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

import * as cd from 'cd-interfaces';
import * as consts from 'cd-common/consts';

export const SERVER_PORT = process.env.PORT || 8080;

const constructPreviewURL = (projectId: string) => {
  return `http://localhost:${SERVER_PORT}/project/${projectId}/preview?`;
};

export const constructDestination = (boardId: string) => {
  return `${consts.SCREENSHOTS_PATH_PREFIX}/${boardId}/${consts.ORIGINAL_SCREENSHOT_FILENAME}`;
};

const constructQueryParams = (params: cd.IStringMap<any>): string => {
  return Object.entries(params)
    .reduce<string[]>((acc, param) => {
      const [key, value] = param;
      const parameter = `${key}=${value}`;
      acc.push(parameter);
      return acc;
    }, [])
    .join('&');
};

interface ITokenPreviewParams extends Pick<cd.IPreviewParams, 'id' | 'fullscreen' | 'comments'> {
  token: string;
}

export const constructScreenshotUrl = (task: cd.IScreenshotTask, token: string): string => {
  const { projectId, targetId: id } = task;
  const baseURL = constructPreviewURL(projectId);
  const previewParams: ITokenPreviewParams = {
    id,
    token,
    fullscreen: false,
    comments: false,
  };
  const parameters = constructQueryParams(previewParams);
  return baseURL + parameters;
};
