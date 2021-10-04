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
import { AbstractPropContainerDirective } from '../abstract/abstract.prop.container';
import { menuFromEnum } from 'cd-common/utils';
import * as cd from 'cd-interfaces';

@Component({
  selector: 'cd-text-style-props',
  templateUrl: './text-style-props.component.html',
  styleUrls: ['./text-style-props.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TextStylePropsComponent extends AbstractPropContainerDirective {
  private _textTransform = cd.TextTransform.Default;
  private _textOverflow = cd.TextOverflow.Clip;
  public overflowMenu: cd.ISelectItem[] = menuFromEnum(cd.TextOverflow);
  public textTransformMenu: cd.ISelectItem[] = menuFromEnum(cd.TextTransform);

  @Input()
  set textOverflow(value: cd.TextOverflow | undefined) {
    this._textOverflow = value || cd.TextOverflow.Clip;
  }
  get textOverflow() {
    return this._textOverflow;
  }

  @Input()
  set textTransform(value: cd.TextTransform | undefined) {
    this._textTransform = value || cd.TextTransform.Default;
  }
  get textTransform() {
    return this._textTransform;
  }

  createOverflow(x = cd.Overflow.Visible, y = cd.Overflow.Visible): cd.IOverflowStyle {
    return { x, y };
  }

  textOverflowModelForState(textOverflow: string) {
    const isEllipsis = textOverflow === cd.TextOverflow.Ellipsis;
    const whiteSpace = isEllipsis ? cd.WhiteSpace.NoWrap : cd.WhiteSpace.Normal;
    const overflowX = isEllipsis ? cd.Overflow.Hidden : cd.Overflow.Visible;
    const overflow: cd.IOverflowStyle = this.createOverflow(overflowX);
    const model = { textOverflow, whiteSpace, overflow };
    return model;
  }

  onOverflowMenuChange(item: cd.SelectItemOutput) {
    const { value } = item as cd.ISelectItem;
    const model = this.textOverflowModelForState(value);
    this.modelChange.emit(model);
  }

  onTransformChange(item: cd.SelectItemOutput) {
    const { value } = item as cd.ISelectItem;
    const textTransform = value === cd.TextTransform.Default ? null : value;
    this.modelChange.emit({ textTransform });
  }
}
