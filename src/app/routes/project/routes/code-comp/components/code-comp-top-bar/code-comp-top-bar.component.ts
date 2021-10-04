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
import { CC_BKG_MENU_ITEMS } from '../../code-comp.config';
import { IMenuConfig } from 'cd-interfaces';
import { PropertiesService } from 'src/app/routes/project/services/properties/properties.service';
import { constructProjectPath } from 'src/app/utils/route.utils';
import { GUIDE_URL } from 'src/app/routes/project/configs/custom-component.config';
import { openLinkInNewTab } from 'cd-utils/url';

@Component({
  selector: 'app-code-comp-top-bar',
  templateUrl: './code-comp-top-bar.component.html',
  styleUrls: ['./code-comp-top-bar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CodeCompTopBarComponent {
  public backgroundMenuItems = CC_BKG_MENU_ITEMS;

  @Input() title = '';
  @Input() selectedBackground?: string;
  @Input() projectId?: string;
  @Input() userCanEdit = false;
  @Input() isUserOwner = false;
  @Output() publish = new EventEmitter<void>();
  @Output() uploadBundle = new EventEmitter<void>();
  @Output() backgroundChange = new EventEmitter<string>();

  constructor(public propertiesService: PropertiesService) {}

  get projectUrl(): string | null {
    return this.projectId ? constructProjectPath(this.projectId) : null;
  }

  onPublish() {
    this.publish.emit();
  }

  onUploadBundle() {
    this.uploadBundle.emit();
  }

  onBackgroundColorChange(menuItem: IMenuConfig) {
    this.backgroundChange.emit(menuItem.value as string);
  }

  onViewGuide() {
    openLinkInNewTab(GUIDE_URL);
  }
}
