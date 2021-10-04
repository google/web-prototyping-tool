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

import { ISelectItem } from 'cd-interfaces';

export const FIGMA_BASE = 'figma.com';
export const IFRAME_SRC_REGEX = /(?<=src=").*?(?=[\*"])/g;
export const FIGMA_PROJECT_ID_REGEX = /(?!(file|proto)\/)([0-9a-zA-Z]{22,128})/g;
export const FIGMA_EMBED_URL = `${FIGMA_BASE}/embed`;
export const FIGMA_PROTO_URL = `${FIGMA_BASE}/proto`;
export const FIGMA_FILE_URL = `${FIGMA_BASE}/file`;
export const FIGMA_EMBED_HOST = 'embed_host=google';
export const DEFAULT_NODE_ID = '1:2';
const DEFAULT_PROJECT_ID = 'YrUBXRj57FIqT9vlg4PPNK';
const DEFAULT_PARAMS = 'node-id=1%3A2&scaling=min-zoom&hide-ui=1';

export enum FigmaParams {
  Scaling = 'scaling',
  HideUI = 'hide-ui',
  NodeId = 'node-id',
  HotSpots = 'hotspot-hints',
  URL = 'url',
}

export enum FigmaScaling {
  Default = 'scale-down',
  MinZoom = 'min-zoom',
  Fill = 'contain',
  Width = 'width',
}

export const buildDefaultFigmaProject = () => {
  return buildFigmaProjectURL(DEFAULT_PROJECT_ID, DEFAULT_PARAMS);
};

export const buildFigmaProjectURL = (projectId: string, params: string) => {
  const url = encodeURIComponent(`https://www.${FIGMA_PROTO_URL}/${projectId}?${params}`);
  return `https://${FIGMA_EMBED_URL}?${FIGMA_EMBED_HOST}&${FigmaParams.URL}=${url}`;
};

export const FIGMA_SCALING_MENU: ISelectItem[] = [
  { title: 'Fit - Default', value: FigmaScaling.Default },
  { title: 'Full Size - 100%', value: FigmaScaling.MinZoom },
  { title: 'Fill', value: FigmaScaling.Fill },
  { title: 'Width', value: FigmaScaling.Width },
];
