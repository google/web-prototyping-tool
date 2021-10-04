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
  selector: 'cd-advanced-text-props',
  templateUrl: './advanced-text-props.component.html',
  styleUrls: ['./advanced-text-props.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdvancedTextPropsComponent extends AbstractPropContainerDirective {
  private _hyphens: cd.Hyphens = cd.Hyphens.None;
  private _wordBreak: cd.WordBreak = cd.WordBreak.Normal;
  private _whiteSpace: cd.WhiteSpace = cd.WhiteSpace.Normal;
  public wordBreakMenu: cd.ISelectItem[] = menuFromEnum(cd.WordBreak);
  public hyphensMenu: cd.ISelectItem[] = menuFromEnum(cd.Hyphens);
  public whiteSpaceMenu: cd.ISelectItem[] = menuFromEnum(cd.WhiteSpace);

  @Input()
  public set hyphens(value: cd.Hyphens) {
    this._hyphens = value || cd.Hyphens.None;
  }
  public get hyphens(): cd.Hyphens {
    return this._hyphens;
  }

  @Input()
  public set wordBreak(value: cd.WordBreak) {
    this._wordBreak = value || cd.WordBreak.Normal;
  }
  public get wordBreak(): cd.WordBreak {
    return this._wordBreak;
  }

  @Input()
  public get whiteSpace(): cd.WhiteSpace {
    return this._whiteSpace;
  }
  public set whiteSpace(value: cd.WhiteSpace) {
    this._whiteSpace = value || cd.WhiteSpace.Normal;
  }

  onWordBreakChange(item: cd.SelectItemOutput) {
    const { value: wordBreak } = item as cd.ISelectItem;
    this.modelChange.emit({ hyphens: null, wordBreak });
  }

  onHyphensChange(item: cd.SelectItemOutput) {
    const { value: hyphens } = item as cd.ISelectItem;
    this.modelChange.emit({ hyphens });
  }

  onWhiteSpaceChange(item: cd.SelectItemOutput) {
    const { value: whiteSpace } = item as cd.ISelectItem;
    this.modelChange.emit({ whiteSpace });
  }
}
