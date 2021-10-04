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

const GRADIENT_TYPE_REGEX = /(linear-gradient|radial-gradient|conic-gradient)?/g;
const INNER_GRADIENT_REGEX = /\((.*)\)/g;
const REGEX_COMMA_PARENS = /,+(?![^(]*\))/g;
const REGEX_TRIM_START = /^\s+/;
const DEGREES_SUFFIX = 'deg';
const FROM_VALUE = 'from';
const PERCENT = '%';

export enum GradientMode {
  Linear = 'linear-gradient',
  Radial = 'radial-gradient',
  Conic = 'conic-gradient',
}

export interface IGradientStop {
  color: string;
  stop: number;
}

export interface IGradient {
  stops: IGradientStop[];
  mode: GradientMode;
  angle: number;
}

export const isGradient = (color: string): boolean => {
  if (!color) return false;
  const modes: string[] = Object.values(GradientMode);
  return modes.some((item) => color.includes(item));
};

const parseDegrees = (value: string): number => {
  return parseInt(value.replace(DEGREES_SUFFIX, '').replace(FROM_VALUE, ''), 10);
};

export const parseGradient = (color: string): IGradient => {
  const colorMode = color.match(GRADIENT_TYPE_REGEX);
  const mode = ((colorMode && colorMode[0]) as GradientMode) || GradientMode.Linear;
  const innerGradient = color.match(INNER_GRADIENT_REGEX);
  const stopString = (innerGradient && innerGradient[0]) || '';
  const parsedStops = stopString.substring(1, stopString.length - 1);
  const splitStops = parsedStops
    .split(REGEX_COMMA_PARENS)
    .map((item) => item.replace(REGEX_TRIM_START, ''));
  const [first] = splitStops;
  const hasAngle = first.includes(DEGREES_SUFFIX);
  const angle = hasAngle ? parseDegrees(first) : 0;
  const stops = splitStops.reduce<IGradientStop[]>((acc, curr, idx) => {
    if (idx === 0 && hasAngle) return acc;
    const [colorValue, percent] = curr.split(' ');
    if (!colorValue || !percent) return acc;
    const stop = parseInt(percent.replace(PERCENT, ''), 10);
    acc.push(generateStop(colorValue, stop));
    return acc;
  }, []);
  return { mode, angle, stops };
};

export const generateStop = (color: string, stop: number): IGradientStop => {
  return { color, stop };
};

export const generateStopsForColor = (color: string, stops: number[]): IGradientStop[] => {
  return stops.map((stop) => generateStop(color, stop));
};
