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

import {
  Directive,
  EmbeddedViewRef,
  Input,
  OnChanges,
  SimpleChanges,
  TemplateRef,
  ViewContainerRef,
} from '@angular/core';
import type { PropertyModel } from 'cd-interfaces';

/**
 * This structural directive is used in the renderer
 * as a drop in replacement which combines ngSwitch and ngTemplateOutlet
 */
@Directive({ selector: '[cdRenderSwitch]' })
export class RenderSwitchDirective {
  @Input() templateRefs: ReadonlyArray<TemplateRef<any>> = [];
  @Input() cases: ReadonlyArray<string> = [];
}

@Directive({ selector: '[cdRenderChild]' })
export class RenderChildDirective implements OnChanges {
  private _entityType?: string;
  private _viewRef: EmbeddedViewRef<any> | null = null;

  @Input() childId?: string;
  @Input() props: Record<string, PropertyModel> = {};

  constructor(private _host: RenderSwitchDirective, private _viewContainerRef: ViewContainerRef) {}

  assignEntityType(entityType: string, childId: string) {
    const { _viewContainerRef } = this;
    const { templateRefs, cases } = this._host;
    const idx = cases.indexOf(entityType);
    const template = templateRefs[idx];
    if (idx === -1) return;
    if (this._viewRef) _viewContainerRef.remove(_viewContainerRef.indexOf(this._viewRef));
    this._viewContainerRef.createEmbeddedView(template, { $implicit: childId });
    this._entityType = entityType;
  }

  ngOnChanges(changes: SimpleChanges) {
    if (this._entityType !== undefined) return;
    const { childId, props } = this;
    if (childId === undefined) return;
    if (changes.childId || changes.props) {
      const element = childId in props ? props[childId] : undefined;
      if (!element) return;
      this.assignEntityType(element.elementType, childId);
    }
  }
}
