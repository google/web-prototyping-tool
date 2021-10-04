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

import { Component, ChangeDetectionStrategy, Input, HostBinding } from '@angular/core';
import { ILayoutEngineDemo } from './layout-engine.interface';
import { IStyleDeclaration } from 'cd-interfaces';
import { transformPropsToStyle } from 'cd-common/utils';

interface ILayoutChild {
  width: number;
  height: number;
}

@Component({
  selector: 'app-layout-preview',
  template: `
    <div class="layout" [style]="styles">
      <div
        *ngFor="let child of children; let i = index"
        class="child"
        [style.width.px]="child.width"
        [style.height.px]="child.height"
      ></div>
    </div>
    <footer>{{ title }}</footer>
  `,
  styleUrls: ['layout-preview.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayoutPreviewComponent {
  private _layout?: ILayoutEngineDemo;
  public children: ILayoutChild[] = [];
  public styles?: IStyleDeclaration;

  @Input()
  @HostBinding('class.active')
  active = false;

  @Input()
  set layout(layout: ILayoutEngineDemo | undefined) {
    this._layout = layout;
    const length = layout?.children?.count || 0;
    const size = layout?.children?.size || 0;
    this.styles = this.processStyles(layout?.styles);
    this.children = Array.from({ length }, () => ({ width: size, height: size }));
  }
  get layout() {
    return this._layout;
  }

  get identifier() {
    return this.layout?.id;
  }

  get title() {
    const { layout } = this;
    const title = layout?.title || '';
    const suffix = layout?.legacy ? ' - Legacy' : '';
    return `${title}${suffix}`;
  }

  processStyles(style?: IStyleDeclaration) {
    return style && transformPropsToStyle({ style });
  }

  constructor() {}
}
