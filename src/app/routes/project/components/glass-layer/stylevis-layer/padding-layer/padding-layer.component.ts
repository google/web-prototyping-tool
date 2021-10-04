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

import { Component, ChangeDetectionStrategy } from '@angular/core';
import { IPaddingPath, generatePathRect, hasValidPadding } from './padding.utils';
import { AbstractStyleVisDirective } from '../utils/abstract.vis';
import { getElementBaseStyles } from 'cd-common/utils';

@Component({
  selector: 'g[app-padding-layer]',
  templateUrl: './padding-layer.component.html',
  styleUrls: ['./padding-layer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaddingLayerComponent extends AbstractStyleVisDirective {
  public padding: ReadonlyArray<IPaddingPath> = [];

  constructor() {
    super();
  }

  update() {
    const { props, rootId } = this;
    if (!rootId || this.props.length === 0) {
      this.padding = [];
      return;
    }

    this.padding = props.reduce<IPaddingPath[]>((acc, prop) => {
      const style = getElementBaseStyles(prop);
      const padding = style && style.padding;
      const isValid = hasValidPadding(padding);
      const { id } = prop;
      if (isValid === true) {
        const renderRect = this.getRectForId(id);
        if (renderRect !== undefined) {
          const { x, y, width, height } = renderRect.frame;
          const isOutletFrame = rootId === id;
          const xp = isOutletFrame ? 0 : x;
          const yp = isOutletFrame ? 0 : y;
          const outterRect = generatePathRect(xp, yp, width, height);
          const innerRect = generatePathRect(xp, yp, width, height, padding);
          const path = outterRect + innerRect;
          acc.push({ id, path });
        }
      }
      return acc;
    }, []);
  }

  trackFn(index: number, item: IPaddingPath): string {
    return `${index}${item.id}`;
  }
}
