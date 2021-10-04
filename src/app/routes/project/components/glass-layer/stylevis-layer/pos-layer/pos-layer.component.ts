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

import { Component, ChangeDetectionStrategy, OnChanges, SimpleChanges } from '@angular/core';
import { AbstractStyleVisDirective } from '../utils/abstract.vis';
import { ElementEntitySubType, PropertyModel } from 'cd-interfaces';
import { getElementBaseStyles } from 'cd-common/utils';
import { toDecimal } from 'cd-utils/numeric';

const DEFAULT_RADIUS = 6;
const VALUE_REGEX = /[0-9]+(px|\%)/g;
const UNIT_REGEX = /(%|px)/g;

@Component({
  selector: 'g[app-pos-layer]',
  templateUrl: './pos-layer.component.html',
  styleUrls: ['./pos-layer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PosLayerComponent extends AbstractStyleVisDirective implements OnChanges {
  public circRadius = DEFAULT_RADIUS;
  public show = false;
  public x = 0;
  public y = 0;

  ngOnChanges(changes: SimpleChanges): void {
    super.ngOnChanges(changes);
    if (changes.zoom) {
      this.circRadius = DEFAULT_RADIUS / this.zoom;
    }
  }

  constructAnchorPoint(prop: PropertyModel): boolean {
    const isImage = prop && prop.elementType === ElementEntitySubType.Image;
    if (!isImage) return false;
    const position = getElementBaseStyles(prop)?.objectPosition;
    if (!position) return false;
    const renderRect = this.renderRects.get(prop.id);
    if (!renderRect) return false;
    const { width, height, x, y } = renderRect.frame;
    const [h, v] = position && position.match(VALUE_REGEX);
    const horz = Number(h.replace(UNIT_REGEX, ''));
    const vert = Number(v.replace(UNIT_REGEX, ''));
    this.x = x + width * toDecimal(horz);
    this.y = y + height * toDecimal(vert);
    return true;
  }

  update() {
    const [first] = this.props;
    this.show = this.constructAnchorPoint(first);
  }
}
