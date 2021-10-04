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
  Component,
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { queryTabbableElements } from './query.utils';

@Component({
  selector: 'app-focus-demo',
  templateUrl: 'focus-demo.component.html',
  styleUrls: ['focus-demo.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FocusDemoComponent implements AfterViewInit {
  public tabbableOutput?: string[];

  public buttons = [
    { title: 'Button' },
    { disabled: true, title: 'Button disabled' },
    { hidden: true, title: 'Button hidden attr' },
  ];

  public inputs = [
    { title: 'Input text', type: 'text' },
    { disabled: true, title: 'Input text disabled', type: 'text' },
    { hidden: true, title: 'Input text hidden attr', type: 'text' },
    { title: 'Input range', type: 'range' },
    { disabled: true, title: 'Input range disabled', type: 'range' },
    { title: 'Input hidden type', type: 'hidden' },
  ];

  public tabindexes = [
    { title: 'tabindex 0', value: 0 },
    { title: 'tabindex 1', value: 1 },
    { title: 'tabindex 2', value: 2 },
  ];

  constructor(private _cdRef: ChangeDetectorRef) {}

  ngAfterViewInit(): void {
    const demo = document.querySelector('app-focus-demo');
    const tabbable = queryTabbableElements(demo as Element);
    this.tabbableOutput = tabbable.map((ele: HTMLElement) => {
      ele.classList.add('focusable');
      return `<${ele.tagName}> tabindex=${ele.tabIndex}`;
    });
    this._cdRef.detectChanges();
  }
}
