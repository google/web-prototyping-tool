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

import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter } from '@angular/core';
import { copyToClipboard } from 'cd-utils/clipboard';
import { downloadJsonAsFile } from 'cd-utils/files';
import { ToastsService } from 'src/app/services/toasts/toasts.service';
import { menuFromDesignSystemAttributes } from 'cd-common/utils';
import * as cd from 'cd-interfaces';

const COPY_CONFIG_TOAST: Partial<cd.IToast> = {
  message: 'Successfully copied config',
  duration: 5000,
};

@Component({
  selector: 'app-test-panel',
  templateUrl: './test-panel.component.html',
  styleUrls: ['./test-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TestPanelComponent {
  public collapsed = false;
  public colorMenuData: cd.ISelectItem[] = [];
  private _designSystem?: cd.IDesignSystem;

  @Input() data?: {};
  @Input() fileName?: string;
  @Input() testInstance?: cd.ICodeComponentInstance;
  @Input() properties: cd.IPropertyGroup[] = [];
  @Input() datasetsMenuItems: cd.ISelectItem[] = [];

  @Input()
  get designSystem(): cd.IDesignSystem | undefined {
    return this._designSystem;
  }
  set designSystem(value: cd.IDesignSystem | undefined) {
    if (!value) return;
    this._designSystem = value;
    this._generateColorMenu(value); // TODO do this in a reusable pipe
  }

  @Output() testPropsChange = new EventEmitter<cd.ICodeComponentInstance>();
  @Output() resetProps = new EventEmitter<void>();

  constructor(private toastService: ToastsService) {}

  get showProperties() {
    return this.collapsed === false && this.testInstance;
  }

  toggleCollapsed() {
    this.collapsed = !this.collapsed;
  }

  copyConfig(obj: {}) {
    const configJsonString = JSON.stringify(obj, null, 2);
    copyToClipboard(configJsonString);
    this.toastService.addToast(COPY_CONFIG_TOAST);
  }

  downloadJson(obj: {}) {
    const { fileName } = this;
    if (!fileName) return;
    downloadJsonAsFile(obj, fileName);
  }

  onPropsChange(change: Partial<cd.IComponentInstance>) {
    this.testPropsChange.emit(change as cd.ICodeComponentInstance);
  }

  onResetClick() {
    this.resetProps.emit();
  }

  private _generateColorMenu(designSystem: cd.IDesignSystem) {
    this.colorMenuData = menuFromDesignSystemAttributes(
      designSystem.colors,
      cd.SelectItemType.Color
    );
  }
}
