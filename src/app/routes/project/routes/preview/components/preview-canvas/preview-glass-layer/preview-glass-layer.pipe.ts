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
import { IRect, ElementPropertiesMap } from 'cd-interfaces';
import { isA11yInfoModified } from 'cd-common/utils';
import { half } from 'cd-utils/numeric';
import { BUBBLE_SIZE } from '../preview-canvas.interface';

type RectPoint = Pick<IRect, 'x' | 'y'>;

@Pipe({ name: 'elementLabelTransformPipe' })
export class ElementLabelTransformPipe implements PipeTransform {
  transform(rect: IRect, scale: number, inverted: boolean = false): RectPoint {
    const x = rect.x * scale - 1;
    const y = inverted ? rect.y * scale : rect.y * scale - BUBBLE_SIZE;
    return { x, y };
  }
}

@Pipe({ name: 'bubbleLabelOffsetPipe' })
export class BubbleLabelOffsetPipe implements PipeTransform {
  transform(rect: IRect, scale: number, frame?: IRect, framePadding = 0): RectPoint {
    if (!frame) return rect;
    const labelX = rect.x * scale - 1;
    const labelY = rect.y * scale;

    const bubbleCenterOffset = half(BUBBLE_SIZE);
    const distanceFromLeft = labelX - bubbleCenterOffset + framePadding;
    const distanceFromTop = labelY - bubbleCenterOffset + framePadding;
    const distanceFromRight = frame.width + framePadding - (labelX + bubbleCenterOffset);
    const distanceFromBottom = frame.height + framePadding - (labelY + bubbleCenterOffset);

    const x = adjustBubble(labelX, distanceFromLeft, distanceFromRight);
    const y = adjustBubble(labelY, distanceFromTop, distanceFromBottom);
    return { x, y };
  }
}

const adjustBubble = (pos: number, minDist: number, maxDist: number) => {
  return minDist < 0 ? pos - minDist : maxDist < 0 ? pos + maxDist : pos;
};

@Pipe({ name: 'elementHasA11yPipe' })
export class ElementHasA11yPipe implements PipeTransform {
  transform(elemId: string, props: ElementPropertiesMap): boolean {
    if (!props) return false;
    const element = props[elemId];
    return isA11yInfoModified(element?.a11yInputs || {});
  }
}

@Pipe({ name: 'elementNamePipe' })
export class ElementNamePipe implements PipeTransform {
  transform(elemId: string, props: ElementPropertiesMap): string {
    if (!props) return '';
    const element = props[elemId];
    return element?.name || '';
  }
}

@Pipe({
  name: 'overlayMaskBackgroundPipe',
})
export class OverlayMaskBackgroundPipe implements PipeTransform {
  transform(frame?: IRect, padding: number = 0, scale = 1): IRect | undefined {
    if (!frame) return;
    const x = frame.x * scale - padding;
    const y = frame.y * scale - padding;
    const height = frame.height * scale + padding * 2;
    const width = frame.width * scale + padding * 2;
    return { x, y, width, height };
  }
}
