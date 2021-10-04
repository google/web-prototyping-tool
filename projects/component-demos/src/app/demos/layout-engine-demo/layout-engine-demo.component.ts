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

import { Component, ChangeDetectorRef, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { ILayoutEngineDemo } from './layout-engine.interface';
import { deepCopy } from 'cd-utils/object';
import { generateIDWithLength } from 'cd-utils/guid';
import { generateComputedCSS } from 'cd-common/utils';
import groundTruthData from './sample-data.json';
import * as cd from 'cd-interfaces';

@Component({
  selector: 'app-layout-engine-demo',
  template: `
    <div class="layouts">
      <app-layout-preview
        *ngFor="let layout of layouts; index as i"
        [layout]="layout"
        [active]="activeIndex === i"
        (click)="onLayoutClick(i)"
      ></app-layout-preview>
    </div>
    <aside class="sidebar">
      <h4 class="title">{{ this.activeLayout?.title }}</h4>
      <app-layout-props
        [model]="activeStyle"
        [childCount]="activeChildCount"
        [showAdvancedToggleBtn]="true"
        (modelChange)="onLayoutUpdate($event)"
        [(advancedMode)]="advancedMode"
      ></app-layout-props>

      <cd-property-group groupTitle="Legacy" collapsed type="collapse">
        <cd-inner-layout-props
          [model]="activeStyle"
          [childCount]="activeChildCount"
          (modelChange)="onLayoutUpdate($event)"
        ></cd-inner-layout-props>
      </cd-property-group>

      <cd-property-group groupTitle="JSON" collapsed type="collapse">
        <div class="code">
          <pre>{{ activeLayout?.styles | json }}</pre>
        </div>
      </cd-property-group>
      <cd-property-group groupTitle="CSS" type="collapse">
        <div class="code">
          <pre>
            <div *ngFor="let style of computedStyles; trackBy:styleTrackFn" class="css-line" >
              <span class="key">{{style[0]}}</span>:<span>{{style[1]}}</span>
            </div>
          </pre>
        </div>
      </cd-property-group>
    </aside>
  `,
  styleUrls: ['layout-engine-demo.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayoutEngineDemoComponent implements OnInit {
  public activeIndex = 0;
  public advancedMode = false;
  public computedStyles: [key: string, value: string][] = [];
  public layouts: ILayoutEngineDemo[] = groundTruthData.map((item) => ({
    ...item,
    id: generateIDWithLength(7),
  }));

  constructor(private _cdRef: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.updateComputedStyles();
  }

  styleTrackFn(_idx: number, item: [key: string, value: string]) {
    return item.join();
  }

  get activeLayout() {
    return this.layouts[this.activeIndex];
  }

  get activeChildCount() {
    return this.activeLayout?.children.count || 0;
  }

  get activeStyle() {
    return this.activeLayout?.styles;
  }

  updateComputedStyles() {
    const { activeStyle: style } = this;
    if (!style) return;
    this.computedStyles = generateComputedCSS({ base: { style } })[0].props;
  }

  onLayoutUpdate(styles: Partial<cd.IStyleDeclaration>) {
    const { activeIndex: idx } = this;
    const current = deepCopy(this.layouts[idx]);
    // This performs something similar to how the project store works
    const merged = Object.entries({ ...current.styles, ...styles }).reduce<cd.IStyleDeclaration>(
      (acc, curr) => {
        const [key, value] = curr;
        if (value === null) return acc; // Remove null values
        acc[key] = value;
        return acc;
      },
      {}
    );

    this.layouts[idx] = { ...current, styles: merged };
    this.updateComputedStyles();
    this._cdRef.markForCheck();
  }

  onLayoutClick(i: number) {
    this.activeIndex = i;
    this.updateComputedStyles();
  }
}
