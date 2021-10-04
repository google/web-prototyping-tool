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

import { Component, ChangeDetectionStrategy } from '@angular/core';
import { menuFromEnum } from 'cd-common/utils';
import { ISelectItem, IStyleDeclaration, ObjectFit, SelectItemOutput } from 'cd-interfaces';
import { AbstractPropContainerDirective } from 'cd-common';

const VALUE_REGEX = /[0-9]+(px|\%)/g;
const UNIT_REGEX = /(%|px)/g;
const DEFAULT_POS = 50;

@Component({
  selector: 'app-image-crop-props',
  templateUrl: './image-crop-props.component.html',
  styleUrls: ['./image-crop-props.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImageCropPropsComponent extends AbstractPropContainerDirective {
  public fitMenu: ISelectItem[] = menuFromEnum(ObjectFit);
  public showAnchor = false;
  public vertPosition = DEFAULT_POS;
  public horzPosition = DEFAULT_POS;
  public rangeAutocomplete = [
    { title: '0%', value: 0 },
    { title: '50%', value: 50 },
    { title: '100%', value: 100 },
  ];

  evalUnit(value: string | undefined): number {
    if (!value) return DEFAULT_POS;
    return Number(value.replace(UNIT_REGEX, ''));
  }

  parseModel(_model: IStyleDeclaration | undefined) {
    const fit = _model && _model.objectFit;
    const position = _model && _model.objectPosition;
    this.assignPosition(position);
    this.showAnchor = this.canShowAnchor(fit);
  }

  assignPosition(position: string | undefined) {
    if (position) {
      const res = position.match(VALUE_REGEX);
      const horz = res ? res[0] : undefined;
      const vert = res ? res[1] : undefined;
      this.horzPosition = this.evalUnit(horz);
      this.vertPosition = this.evalUnit(vert);
    } else {
      this.horzPosition = DEFAULT_POS;
      this.horzPosition = DEFAULT_POS;
    }
  }

  canShowAnchor(fit: ObjectFit | undefined): boolean {
    return fit === ObjectFit.Contain || fit === ObjectFit.Cover;
  }

  buildPosition(horz: number, vert: number): string {
    return `${vert}% ${horz}%`;
  }

  onVertChange(value: number) {
    const { horzPosition } = this;
    const objectPosition = this.buildPosition(value, horzPosition);
    this.modelChange.emit({ objectPosition });
  }

  onHorzChange(value: number) {
    const { vertPosition } = this;
    const objectPosition = this.buildPosition(vertPosition, value);
    this.modelChange.emit({ objectPosition });
  }

  onFitMenuChange(item: SelectItemOutput) {
    const { value: objectFit } = item as ISelectItem;
    const payload = { objectFit };
    if (objectFit === ObjectFit.Fill) {
      Object.assign(payload, { objectPosition: null });
    }
    this.modelChange.emit(payload);
  }
}
