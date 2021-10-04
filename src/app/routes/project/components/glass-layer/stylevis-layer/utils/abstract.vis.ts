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

import { PropertyModel, RenderRectMap, IRenderResult } from 'cd-interfaces';
import { Input, OnChanges, SimpleChanges, Directive } from '@angular/core';
import { rectFromOutletOrRenderRects } from '../../glass.utils';

@Directive()
export class AbstractStyleVisDirective implements OnChanges {
  @Input() interacting = false;
  @Input() rootId = '';
  @Input() zoom = 1;
  @Input() props: PropertyModel[] = [];
  @Input() renderRects: RenderRectMap = new Map();
  @Input() outletFrame?: IRenderResult;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.props || changes.rootId || changes.renderRects || changes.outletFrame) {
      this.update();
    }
  }

  getRectForId(id: string) {
    return rectFromOutletOrRenderRects(id, this.renderRects, this.outletFrame);
  }

  get mergedRects() {
    const { outletFrame } = this;
    if (outletFrame) {
      const rectsClone = new Map([...this.renderRects]);
      rectsClone.set(outletFrame.id, { ...outletFrame });
      return rectsClone;
    }
    return this.renderRects;
  }

  update() {}
}
