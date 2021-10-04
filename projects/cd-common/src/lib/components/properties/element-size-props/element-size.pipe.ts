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

import { Pipe, PipeTransform } from '@angular/core';
import { LinePropType, WIDTH_PROP } from './element-size.consts';
import { UnitTypes } from 'cd-metadata/units';
import { IValue } from 'cd-interfaces';

const hasUnit = (
  prop: LinePropType,
  width: IValue | undefined,
  height: IValue | undefined,
  unit: UnitTypes
): boolean => {
  if (prop === WIDTH_PROP) return !!width && width.units === unit;
  return !!height && height.units === unit;
};

@Pipe({ name: 'hasPercentPipe' })
export class HasPercentPipe implements PipeTransform {
  transform(prop: LinePropType, width: IValue | undefined, height: IValue | undefined): boolean {
    return hasUnit(prop, width, height, UnitTypes.Percent);
  }
}

@Pipe({ name: 'hasPixelsPipe' })
export class HasPixelsPipe implements PipeTransform {
  transform(prop: LinePropType, width: IValue | undefined, height: IValue | undefined): boolean {
    return hasUnit(prop, width, height, UnitTypes.Pixels);
  }
}
