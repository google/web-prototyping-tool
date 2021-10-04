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

import { Component, ChangeDetectionStrategy, Output, EventEmitter, Input } from '@angular/core';
import { IProjectState, LayoutApplyPresetToSelection } from 'src/app/routes/project/store';
import { Store } from '@ngrx/store';
import * as cd from 'cd-interfaces';

@Component({
  selector: 'app-layout-picker-context',
  template: `
    <app-layout-picker-content
      [showBackBtn]="true"
      (selectLayout)="onSelectLayout($event)"
      (exit)="onExit()"
    ></app-layout-picker-content>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayoutPickerContextComponent {
  @Input() selectedElementId = '';
  @Output() exit = new EventEmitter<void>();

  constructor(private readonly _projectStore: Store<IProjectState>) {}

  onSelectLayout(preset: cd.ILayoutDefinition) {
    const selected = [this.selectedElementId];
    this._projectStore.dispatch(new LayoutApplyPresetToSelection(selected, preset));
  }

  onExit() {
    this.exit.emit();
  }
}
