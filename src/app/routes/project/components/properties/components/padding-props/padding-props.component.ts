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
import { IEdgeStyle } from 'cd-interfaces';
import { AbstractPropContainerDirective } from 'cd-common';

@Component({
  selector: 'app-padding-props',
  templateUrl: './padding-props.component.html',
  styleUrls: ['./padding-props.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaddingPropsComponent extends AbstractPropContainerDirective {
  @Input() max = 0;
  @Input() id = '';
  onPaddingChange(padding: IEdgeStyle) {
    this.modelChange.emit({ padding });
  }
}
