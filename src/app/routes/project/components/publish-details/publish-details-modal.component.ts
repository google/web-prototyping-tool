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
import { OverlayInitService, AbstractOverlayContentDirective } from 'cd-common';
import * as cd from 'cd-interfaces';

const PUBLISH_COMPONENT_TITLE = 'Publish Component';
const PUBLISH_TEMPLATE_TITLE = 'Publish Template';

@Component({
  selector: 'app-publish-details-modal',
  templateUrl: './publish-details-modal.component.html',
  styleUrls: ['./publish-details-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublishDetailsModalComponent extends AbstractOverlayContentDirective {
  @Input() id?: string;
  @Input() name = '';
  @Input() type?: cd.PublishType;
  @Input() publishEntry?: cd.IPublishEntry;
  @Input() currentPublishId?: cd.IPublishId;
  @Output() publish = new EventEmitter<cd.IPublishDetails>();

  constructor(_overlayInit: OverlayInitService) {
    super(_overlayInit);
  }

  get versionNumber(): number {
    return (this.publishEntry?.versions?.length || 0) + 1;
  }

  get title() {
    return this.type === cd.PublishType.Template ? PUBLISH_TEMPLATE_TITLE : PUBLISH_COMPONENT_TITLE;
  }

  get description() {
    return this.publishEntry?.desc || '';
  }

  get tags() {
    return this.publishEntry?.tags || [];
  }

  onDismissClicked() {
    this.dismissOverlay.emit();
  }

  onPublishClicked() {
    const { id, type, currentPublishId, name, description, tags } = this;
    if (!id || !type) return;
    this.publish.emit({ id, type, currentPublishId, name, description, tags });
  }
}
