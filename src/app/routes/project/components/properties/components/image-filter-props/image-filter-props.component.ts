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
import { ISelectItem, IStringMap, MixBlendMode, SelectItemOutput, SVGFilter } from 'cd-interfaces';
import { UnitTypes } from 'cd-metadata/units';
import { AbstractPropContainerDirective } from 'cd-common';

const TITLE_REGEX = /^.*(?=(\())/g;
const VALUE_REGEX = /\d+(\.\d{1,2})?/g;

interface ISVGFilter {
  default: number;
  value: number;
  units?: string;
}

const filterName = (name: string, value: number, unit: string = '%'): string => {
  return `${name}(${value}${unit})`;
};

@Component({
  selector: 'app-image-filter-props',
  templateUrl: './image-filter-props.component.html',
  styleUrls: ['./image-filter-props.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImageFilterPropsComponent extends AbstractPropContainerDirective {
  public SVGFilter = SVGFilter;
  public blendModeMenu: ISelectItem[] = menuFromEnum(MixBlendMode);
  public canReset = false;
  public filters: Record<string, ISVGFilter> = {
    [SVGFilter.Grayscale]: { default: 0, value: 0 },
    [SVGFilter.Brightness]: { default: 100, value: 100 },
    [SVGFilter.Contrast]: { default: 100, value: 100 },
    [SVGFilter.HueRotate]: { default: 0, value: 0, units: 'deg' },
    [SVGFilter.Invert]: { default: 0, value: 0 },
    [SVGFilter.Blur]: { default: 0, value: 0, units: UnitTypes.Pixels },
  };

  parseModel(_model: IStringMap<any> | undefined) {
    const filter = _model && _model.filter;
    this.canReset = this.assignFilters(filter);
  }

  assignFilters(filter: string): boolean {
    if (!filter) return false;
    const list = filter.split(' ');
    let canReset = false;
    const { filters } = this;
    for (const item of list) {
      const titleMatch = item.match(TITLE_REGEX);
      const title = titleMatch && titleMatch[0];
      if (title) {
        const ref = filters[title];
        const stringMatch = item.match(VALUE_REGEX);
        const value = Number(stringMatch && stringMatch[0]);
        if (!isNaN(value)) {
          if (value !== ref.value) {
            filters[title].value = value;
          }

          if (value !== ref.default) {
            canReset = true;
          }
        }
      }
    }

    return canReset;
  }

  onBlendModeChange(item: SelectItemOutput) {
    const { value } = item as ISelectItem;
    const mixBlendMode = value ?? null;
    this.modelChange.emit({ mixBlendMode });
  }

  buildFilterModel() {
    return Object.entries(this.filters)
      .reduce<string[]>((acc, curr) => {
        const [name, item] = curr;
        if (item.value !== item.default) {
          const val = filterName(name, item.value, item.units);
          acc.push(val);
        }
        return acc;
      }, [])
      .join(' ');
  }

  onSliderChange() {
    const filter = this.buildFilterModel();
    this.modelChange.emit({ filter });
  }

  onReset() {
    this.modelChange.emit({ filter: null });
    this.filters = Object.entries(this.filters).reduce<Record<string, ISVGFilter>>((acc, curr) => {
      const [key, item] = curr;
      const clone = { ...item, value: item.default };
      acc[key] = clone;
      return acc;
    }, {});
  }
}
