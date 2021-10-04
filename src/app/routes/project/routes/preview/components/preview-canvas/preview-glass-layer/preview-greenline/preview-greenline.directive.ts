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

import { Directive, Input, HostBinding } from '@angular/core';
import { IGreenlineRenderResult, GreenlineType } from 'cd-interfaces';

@Directive({
  selector: '[appPreviewGreenline]',
})
export class PreviewGreenlineDirective {
  @Input() appPreviewGreenline: IGreenlineRenderResult | undefined;
  @Input() currentSelectedId = '';
  @Input() currentHighlightedId = '';
  @Input() currentHoveredId = '';
  @Input() masksActive = false;

  @HostBinding('attr.mask')
  get maskAttr() {
    return this.masksActive && this.appPreviewGreenline?.useMask ? 'url(#greenlinesMask)' : null;
  }

  @HostBinding('class.group-child')
  get groupChildClass() {
    return this.appPreviewGreenline?.type === GreenlineType.GroupChild;
  }

  @HostBinding('class.flow')
  get flowClass() {
    return this.appPreviewGreenline?.type === GreenlineType.Flow;
  }

  @HostBinding('class.landmark')
  get landmarkClass() {
    return this.appPreviewGreenline?.type === GreenlineType.Landmark;
  }

  @HostBinding('class.heading')
  get headingClass() {
    return this.appPreviewGreenline?.type === GreenlineType.Heading;
  }

  @HostBinding('class.focus')
  get focusClass() {
    return this.appPreviewGreenline?.type === GreenlineType.Focus;
  }

  @HostBinding('class.tabgroup')
  get tabgroupClass() {
    return (
      this.appPreviewGreenline?.type === GreenlineType.Flow && !this.appPreviewGreenline?.order
    );
  }

  @HostBinding('class.selected')
  get isSelected() {
    return this.currentSelectedId && this.currentSelectedId === this.appPreviewGreenline?.id;
  }

  @HostBinding('class.highlighted')
  get isHighlighted() {
    return this.currentHighlightedId && this.currentHighlightedId === this.appPreviewGreenline?.id;
  }

  @HostBinding('class.muted')
  get mutedClass() {
    const { currentHoveredId, appPreviewGreenline, isSelected } = this;
    const notCurrentlyHighlighted =
      currentHoveredId && currentHoveredId !== appPreviewGreenline?.id;
    return notCurrentlyHighlighted && isSelected;
  }
}
