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
  ChangeDetectionStrategy,
  HostBinding,
  Output,
  EventEmitter,
  Input,
} from '@angular/core';
import * as cd from 'cd-interfaces';

const isBuiltInTemplate = (template: cd.ProjectTemplate): template is cd.IBuiltInTemplate => {
  return (template as cd.IBuiltInTemplate).builtInTemplate !== undefined;
};

@Component({
  selector: 'app-template-tile',
  templateUrl: './template-tile.component.html',
  styleUrls: ['./template-tile.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TemplateTileComponent {
  private _template!: cd.ProjectTemplate;
  public showDetailsButton = false;
  public imagePosition?: string;
  public templateImageUrl?: string;

  @Input()
  set template(value: cd.ProjectTemplate) {
    this._template = value;
    if (isBuiltInTemplate(value)) {
      this.imagePosition = value.imagePosition;
      this.templateImageUrl = value.imageUrl;
      this.showDetailsButton = false;
    } else {
      this.templateImageUrl = value.homeBoardImageUrl;
      this.showDetailsButton = true;
    }
  }
  get template(): cd.ProjectTemplate {
    return this._template;
  }

  @Input()
  @HostBinding('class.selected')
  selected = false;

  @Output() selectAndOpen = new EventEmitter<void>();
  @Output() selectProject = new EventEmitter<void>();
  @Output() preview = new EventEmitter<void>();

  onClick() {
    this.selectProject.emit();
  }

  onDoubleClick() {
    this.selectAndOpen.emit();
  }

  onPreviewClicked() {
    this.preview.emit();
  }
}
