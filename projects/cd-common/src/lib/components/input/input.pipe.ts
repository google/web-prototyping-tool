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
import type { IMenuConfig, IValue, InputValueType } from 'cd-interfaces';
import { UnitTypes } from 'cd-metadata/units';
import { valueFromIValue } from 'cd-common/utils';

const RESET_STATE: IMenuConfig = { title: 'Auto', value: '' };

@Pipe({ name: 'inputUnitPipe' })
export class InputUnitPipe implements PipeTransform {
  transform(list: UnitTypes[], checkedValue: IValue['units'] = UnitTypes.Pixels): IMenuConfig[] {
    const units = list.map((value) => {
      const checked = value === checkedValue;
      const title = value.toUpperCase();
      return { title, value, checked };
    });
    return [RESET_STATE, ...units];
  }
}

/**
 * inputs whose value is an iValue such as type="units" will need the value extracted
 * i.e value = "{ value:'200', units:'px' }" vs value = 200
 * */
@Pipe({ name: 'inputValuePipe' })
export class InputValuePipe implements PipeTransform {
  transform(value: InputValueType): string {
    return valueFromIValue(value) ?? value;
  }
}
