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

@Component({
  selector: 'app-button-demo',
  template: `
    <h4>cd-button</h4>
    <div class="group">
      <ng-container *ngFor="let item of groups">
        <button
          cd-button
          [size]="item.size"
          [disabled]="item.disabled"
          [iconSize]="item.iconSize"
          [iconName]="item.icon"
          [text]="item.title"
        ></button>
      </ng-container>
    </div>

    <h4>cd-outlined-button</h4>
    <div class="group">
      <button
        cd-outlined-button
        *ngFor="let item of groups"
        [size]="item.size"
        [disabled]="item.disabled"
        [iconSize]="item.iconSize"
        [iconName]="item.icon"
        [text]="item.title"
      ></button>
    </div>

    <h4>cd-dashed-button</h4>
    <div class="group">
      <button
        cd-dashed-button
        *ngFor="let item of groups"
        [size]="item.size"
        [disabled]="item.disabled"
        [iconSize]="item.iconSize"
        [iconName]="item.icon"
        [text]="item.title"
      ></button>
    </div>

    <h4>cd-unelevated-button</h4>
    <div class="group">
      <button
        cd-unelevated-button
        *ngFor="let item of groups"
        [size]="item.size"
        [disabled]="item.disabled"
        [iconSize]="item.iconSize"
        [iconName]="item.icon"
        [text]="item.title"
      ></button>
    </div>

    <h4>cd-shaped-button</h4>
    <div class="group">
      <button
        cd-shaped-button
        *ngFor="let item of groups"
        [size]="item.size"
        [disabled]="item.disabled"
        [iconSize]="item.iconSize"
        [iconName]="item.icon"
        [text]="item.title"
      ></button>
    </div>

    <h4>cd-inverted-button</h4>
    <div class="group inverted">
      <button
        cd-inverted-button
        *ngFor="let item of groups"
        [size]="item.size"
        [disabled]="item.disabled"
        [iconSize]="item.iconSize"
        [iconName]="item.icon"
        [text]="item.title"
      ></button>
    </div>

    <h4>Fab style</h4>
    <div class="group">
      <button
        cd-unelevated-button
        fabStyle
        cd-unelevated-button
        cd-shaped-button
        size="large"
        iconSize="large"
        iconName="add"
      >
        New Project
      </button>
    </div>
  `,
  styles: [
    `
      .group {
        display: grid;
        margin-bottom: 10px;
        grid-auto-flow: column;
        justify-content: flex-start;
        align-items: center;
        gap: 10px;
        padding: 10px;
      }
      .row {
        grid-auto-flow: row;
        justify-items: baseline;
      }
      .inverted {
        background: var(--cd-modal-background-color-inverted);
      }
      h4 {
        font-size: 13px;
        margin-bottom: 10px;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ButtonDemoComponent {
  public groups = [
    { size: 'small', iconSize: 'small', title: 'Button' },
    { size: 'small', iconSize: 'small', title: 'Button', icon: 'favorite' },
    { size: 'small', iconSize: 'small', title: 'Button', icon: '/assets/icons/youtube.svg' },
    { size: 'small', iconSize: 'small', icon: 'favorite' },
    { size: 'small', iconSize: 'small', disabled: true, title: 'Button' },
    { size: 'medium', iconSize: 'medium', title: 'Button' },
    { size: 'medium', iconSize: 'medium', title: 'Button', icon: 'favorite' },
    { size: 'medium', iconSize: 'medium', title: 'Button', icon: '/assets/icons/youtube.svg' },
    { size: 'medium', iconSize: 'medium', icon: 'favorite' },
    { size: 'medium', iconSize: 'medium', disabled: true, title: 'Button' },
    { size: 'large', iconSize: 'large', title: 'Button' },
    { size: 'large', iconSize: 'large', title: 'Button', icon: 'favorite' },
    { size: 'large', iconSize: 'large', title: 'Button', icon: '/assets/icons/youtube.svg' },
    { size: 'large', iconSize: 'large', icon: 'favorite' },
    { size: 'large', iconSize: 'large', disabled: true, title: 'Button' },
  ];
  constructor() {}
}
