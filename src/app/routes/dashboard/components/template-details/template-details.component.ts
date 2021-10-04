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

import type { ILoadedTemplate, IProject } from 'cd-interfaces';
import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter } from '@angular/core';
import { AuthService } from 'src/app/services/auth/auth.service';
import { ScreenshotService } from 'src/app/services/screenshot-lookup/screenshot-lookup.service';
import type firebase from 'firebase/app';

@Component({
  selector: 'app-template-details',
  templateUrl: './template-details.component.html',
  styleUrls: ['./template-details.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TemplateDetailsComponent {
  public name = '';
  public desc?: string;
  public author?: string;
  public createdAt?: firebase.firestore.Timestamp;
  public updatedAt?: firebase.firestore.Timestamp;
  public version = 1;
  public images: string[] = [];

  private templateProject?: IProject;

  @Input() set template(template: ILoadedTemplate) {
    const { name, desc, owner, createdAt, updatedAt, versions } = template.publishEntry;
    const { project } = template;
    this.name = name;
    this.desc = desc;
    this.author = owner.email || undefined;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.version = versions.length;
    this.images = template.allBoardImageUrls || [];
    this.templateProject = project;
  }

  @Output() confirm = new EventEmitter<void>();
  @Output() dismiss = new EventEmitter<void>();
  @Output() back = new EventEmitter<void>();
  @Output() editTemplate = new EventEmitter<void>();

  constructor(public authService: AuthService, private _screenshotService: ScreenshotService) {}

  onConfirmClicked() {
    this.confirm.emit();
  }

  onDismissClicked() {
    this.dismiss.emit();
  }

  onBackClicked() {
    this.back.emit();
  }

  onEditTemplate() {
    this.editTemplate.emit();
  }

  onRegenerateScreenshots() {
    const { templateProject } = this;
    if (!templateProject) return;
    this._screenshotService.triggerCreateProjectScreenshots(templateProject);
  }
}
