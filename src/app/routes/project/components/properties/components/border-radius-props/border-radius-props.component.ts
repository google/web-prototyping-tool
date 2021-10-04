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
import { isIValue } from 'cd-common/utils';
import { IEdgeStyle, IEdgeItem, ISelectItem, IValue } from 'cd-interfaces';
import { isObject } from 'cd-utils/object';
import { AbstractPropContainerDirective } from 'cd-common';

const generateEdgeStyle = (top = 0, left = 0, right = 0, bottom = 0): IEdgeStyle => {
  return { top, left, right, bottom };
};
@Component({
  selector: 'app-border-radius-props',
  templateUrl: './border-radius-props.component.html',
  styleUrls: ['./border-radius-props.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BorderRadiusPropsComponent extends AbstractPropContainerDirective {
  public borderRadius: IEdgeStyle = generateEdgeStyle();
  public edgeLabels: IEdgeItem[] = [
    { label: 'TL', tooltip: 'Top left' },
    { label: 'TR', tooltip: 'Top right' },
    { label: 'BR', tooltip: 'Bottom right' },
    { label: 'BL', tooltip: 'Bottom left' },
  ];

  @Input() id = '';
  @Input() autocompleteMenu: ISelectItem[] = [];
  @Input() max = 0;

  parseModel(radius: IEdgeStyle | IValue | string | any) {
    if (!isObject(radius)) {
      this.borderRadius = generateEdgeStyle();
    } else if (isIValue(radius)) {
      const val = Number(radius.value);
      const edgeRadius = { top: val, left: val, right: val, bottom: val };
      this.borderRadius = edgeRadius;
    } else {
      this.borderRadius = radius as IEdgeStyle;
    }
  }

  onBorderRadiusChange(radius: IEdgeStyle) {
    const borderRadius = { ...radius, value: null };
    this.modelChange.emit({ borderRadius });
  }
}
