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

import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import * as cd from 'cd-interfaces';
import { keyValueAttrsToString, isA11yAttrDisabled } from 'cd-common/utils';
import { copyToClipboard } from 'cd-utils/clipboard';

const HELPTEXT =
  'Preview of final aria attributes for HTML code.<br /><br /> <em>Unmodified role defaults or incomplete attributes will not be shown.</em>';

@Component({
  selector: 'app-aria-output',
  templateUrl: './aria-output.component.html',
  styleUrls: ['./aria-output.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AriaOutputComponent {
  public visibleAttrs: cd.IA11yAttr[] = [];
  public helpText = {
    text: HELPTEXT,
  };

  @Input()
  set attrs(attrs: cd.IA11yAttr[]) {
    const ariaAttrs = attrs || [];
    this.visibleAttrs = ariaAttrs.filter((attr: cd.IA11yAttr) => !isA11yAttrDisabled(attr));
  }

  get isEmptyState(): boolean {
    return this.visibleAttrs.length === 0;
  }

  onCopy() {
    const content = keyValueAttrsToString(this.visibleAttrs);
    copyToClipboard(content);

    // TODO: add a snackbar to confirm successful copy?
  }
}
