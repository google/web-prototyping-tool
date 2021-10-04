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

import type firebase from 'firebase/app';
import { ScreenshotSizes } from './public_api';
import { DimensionToArgs } from './image';

export interface IScreenshotRef {
  id: string;
  url?: string;
}

export interface IScreenshotLookup extends IScreenshotRef {
  timestamp: firebase.firestore.Timestamp;
}

export enum TaskType {
  Element = 'element',
  Project = 'project',
}

export interface IScreenshotTask {
  projectId: string;
  targetId: string;
  createdAt: number;
  type: TaskType;
  retryCount?: number;
}

export type ScreenshotConversionArgsConfig = Record<
  Exclude<ScreenshotSizes, ScreenshotSizes.Original>,
  DimensionToArgs
>;
