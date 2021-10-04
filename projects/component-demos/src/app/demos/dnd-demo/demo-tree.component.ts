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

import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { IElement } from './dnd-interfaces';

@Component({
  selector: 'ul[app-demo-tree]',
  template: `
    <li
      *ngFor="let item of data"
      [style.--indent]="item.level"
      [class.active]="active === item.id"
      [class.insert]="item.id === 'inserted'"
    >
      {{ item.id }}
    </li>
  `,
  styles: [
    `
      :host {
        list-style: none;
        padding: 0;
        margin: 0;
      }
      li {
        padding-left: calc(var(--indent) * 8px);
        opacity: 0.5;
      }
      li.active {
        color: var(--cd-primary-color);
        opacity: 1;
      }
      li.insert {
        color: red;
        opacity: 1;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DemoTreeComponent {
  @Input() active?: string;
  @Input() data: IElement[] = [];
}
