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
import { measureTextWidth } from 'cd-common';
import { IUserCursor, IUserPresence } from 'cd-interfaces';

const TEXT_FONT = '700 11px Roboto';
const TEXT_HORZ_PADDING = 10;
const CURSOR_X_ADJUSTMENT = -1;
const CURSOR_Y_ADJUSMENT = -2;

@Pipe({
  name: 'cursorPositionPipe',
})
export class CursorPositionPipe implements PipeTransform {
  transform(cursor: IUserCursor, zoom: number): string {
    const { x, y, canvas } = cursor;
    const absoluteX = x - canvas.position.x + CURSOR_X_ADJUSTMENT;
    const absoluteY = y - canvas.position.y + CURSOR_Y_ADJUSMENT;
    const scaledX = absoluteX / canvas.position.z;
    const scaledY = absoluteY / canvas.position.z;
    const scaleFactor = 1 / zoom;
    return `translate(${scaledX} ${scaledY}) scale(${scaleFactor} ${scaleFactor})`;
  }
}

@Pipe({
  name: 'sessionIdToNamePipe',
})
export class SessionIdToNamePipe implements PipeTransform {
  transform(sessionId: string, othersPresentMap?: Map<string, IUserPresence> | null): string {
    if (!othersPresentMap) return '';
    return othersPresentMap.get(sessionId)?.user.name || '';
  }
}

@Pipe({
  name: 'sessionIdToNameWidthPipe',
})
export class SessionIdToNameWidthPipe implements PipeTransform {
  transform(sessionId: string, othersPresentMap?: Map<string, IUserPresence> | null): number {
    if (!othersPresentMap) return 0;
    const name = othersPresentMap.get(sessionId)?.user.name;
    if (!name) return 0;
    return measureTextWidth(name, TEXT_FONT) + TEXT_HORZ_PADDING;
  }
}
