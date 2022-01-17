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

import { Pipe, PipeTransform } from '@angular/core';
import { IProject, IScreenshotRef } from 'cd-interfaces';
import { TILE_THUMBNAIL_LIMIT } from 'cd-common/consts';

@Pipe({ name: 'projectThumbnailPipe' })
export class ProjectThumbnailPipe implements PipeTransform {
  transform(project: IProject, thumbnails: Map<string, IScreenshotRef[]>): string[] {
    const thumbs = new Map(thumbnails.get(project.id)?.map((item) => [item.id, item.url]));
    return [...project.boardIds].slice(0, TILE_THUMBNAIL_LIMIT).map((id) => thumbs.get(id) || '');
  }
}
