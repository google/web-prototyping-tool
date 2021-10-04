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
import { generateFrame } from 'cd-common/utils';
import { IUserCursor, IRect, ICanvas } from 'cd-interfaces';

/**
 * Translate the coordinates of a marquee rect from the source canvas position to this canvas position
 */
@Pipe({
  name: 'peerMarqueeRectPositionPipe',
})
export class PeerMarqueeRectPositionPipe implements PipeTransform {
  transform(cursor: IUserCursor, zoom: number, canvas?: ICanvas): IRect {
    const { marqueeRect, canvas: sourceCanvas } = cursor;
    if (!marqueeRect || !canvas) return generateFrame();
    const { x, y, width, height } = marqueeRect;
    const { position } = canvas;
    const { position: sourcePosition } = sourceCanvas;
    const zoomRatio = zoom / sourcePosition.z;
    const scaledWidth = width * zoomRatio;
    const scaledHeight = height * zoomRatio;
    const absoluteX = (x - sourcePosition.x) / sourcePosition.z;
    const absoluteY = (y - sourcePosition.y) / sourcePosition.z;
    const translatedX = absoluteX * zoom + position.x;
    const translatedY = absoluteY * zoom + position.y;
    const frame = generateFrame(translatedX, translatedY, scaledWidth, scaledHeight);
    return frame;
  }
}
