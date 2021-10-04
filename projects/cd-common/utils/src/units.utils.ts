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

import { UnitTypes } from 'cd-metadata/units';
import type { Units, IValue } from 'cd-interfaces';
import { isIValue } from './ivalue.utils';

const UNIT_REGEX = /[\d.\-\+]*\s*(.*)/;

const getValueFromInit = (
  value: string | undefined,
  acceptedUnitTypes = [UnitTypes.Percent, UnitTypes.Pixels]
): Units => {
  if (!value) return UnitTypes.None;
  const match = acceptedUnitTypes.find((item) => item === value);
  return match ? (match as Units) : UnitTypes.None;
};

export const parseUnits = (
  str: string | number,
  acceptedUnitTypes?: UnitTypes[]
): [number | undefined, Units] => {
  const value = String(str);
  const num = parseFloat(value);

  const parsedUnit = value.match(UNIT_REGEX);
  const unit = (parsedUnit && parsedUnit[1].toLowerCase()) || undefined;
  const unitValue = getValueFromInit(unit, acceptedUnitTypes);
  return [num, unitValue];
};

export const getIValueSizeFromString = (val: IValue | string | undefined): IValue | undefined => {
  if (!val) return generateIValue();
  if (isIValue(val)) return val as IValue;
  const [value, unit] = parseUnits(val);
  return generateIValue(value, unit);
};

export const generateIValue = (val: number | string = '', units = ''): IValue => {
  const value = isNaN(Number(val)) ? '' : val;
  return { value, units } as IValue;
};
