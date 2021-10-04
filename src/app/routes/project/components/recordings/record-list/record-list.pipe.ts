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
import { isDataBoundValue } from 'cd-common/utils';
import { isObject } from 'cd-utils/object';
import { PropertiesService } from '../../../services/properties/properties.service';
import { stripHTMLTags, truncateText, isString, camelCaseToSpaces } from 'cd-utils/string';
import { getComponent, isBoardPortal } from 'cd-common/models';
import { INNER_HTML, REFERENCE_ID, VALUE_ATTR } from 'cd-common/consts';
import * as utils from './record-list.utils';
import * as cd from 'cd-interfaces';

const MAX_STRING_LEN = 18;
const MULTIPLE_LABEL = '(multiple)';
const DATA_BOUND_LABEL = '(data bound)';
const CSS_LABEL = '(CSS Override)';
const MISSING_LABEL = 'Missing';
const PORTAL_TO_LABEL = 'Portal to';

@Pipe({ name: 'recordedTitlePipe' })
export class RecordedTitlePipe implements PipeTransform {
  constructor(private _propsService: PropertiesService) {}
  transform(elementId?: string): string {
    const element = elementId && this._propsService.getPropertiesForId(elementId);
    return (element && element?.name) || MISSING_LABEL;
  }
}

@Pipe({ name: 'recordTimingApplied' })
export class RecordedTimingAppliedPipe implements PipeTransform {
  transform(state: cd.IActionStateChange): boolean {
    return utils.hasTimingApplied(state);
  }
}

@Pipe({ name: 'recordTimingTooltip' })
export class RecordTimingTooltipPipe implements PipeTransform {
  transform(state: cd.IActionStateChange): string {
    const [delay, duration] = utils.timingFromStateChange(state);
    const easing = state.animation?.easing ?? cd.ActionEasing.Linear;
    const durationLabel = utils.labelForTime(duration, true);
    const delayLabel = utils.labelForTime(delay);
    return [durationLabel, easing, delayLabel].join(' ');
  }
}

@Pipe({ name: 'recordedLabelPipe' })
export class RecordedLabelPipe implements PipeTransform {
  constructor(private _propsService: PropertiesService) {}

  transform(state: cd.IActionStateChange): string {
    // Special case to prevent confusion with text input
    if (state.key === INNER_HTML) return VALUE_ATTR;
    // Special case to handle Board portal label
    if (state.key === REFERENCE_ID) {
      const element = state.elementId && this._propsService.getPropertiesForId(state.elementId);
      if (element && isBoardPortal(element)) return PORTAL_TO_LABEL;
    }
    // Everything else
    return camelCaseToSpaces(state.key).toLocaleLowerCase();
  }
}

@Pipe({ name: 'recordedOutputPipe' })
export class RecordeOutputPipe implements PipeTransform {
  constructor(private _propsService: PropertiesService) {}

  getProps(id: string | undefined): cd.PropertyModel | undefined {
    return id ? this._propsService.getPropertiesForId(id) : undefined;
  }

  transform(state: cd.IActionStateChange, designSystem: cd.IDesignSystem | undefined): string {
    if (!designSystem) return '';
    const { key, value, type } = state;
    if (type === cd.ActionStateType.StyleOverride) return CSS_LABEL;
    if (type === cd.ActionStateType.Style)
      return utils.outputLabelForStyle(key, value, designSystem);
    const element = this.getProps(state.elementId);

    // If this element is a portal, display the name of the board instead of the id
    if (element && isBoardPortal(element) && state.key === REFERENCE_ID) {
      const portal = this._propsService.getPropertiesForId(value);
      return portal?.name ?? MISSING_LABEL;
    }

    const dropdownLabel = utils.processDropdownLookupLabel(element, key, value);
    if (dropdownLabel) return dropdownLabel;
    // Change is an Input
    if (isDataBoundValue(value)) return DATA_BOUND_LABEL;
    if (isObject(value)) return MULTIPLE_LABEL;
    // Remove any HTML Tags (like with rich text) and limit string length
    if (value && isString(value)) {
      return truncateText(stripHTMLTags(value), MAX_STRING_LEN).toLocaleLowerCase();
    }

    return value;
  }
}

@Pipe({ name: 'recordDurationPipe' })
export class RecordedDurationPipe implements PipeTransform {
  transform(state: cd.IActionStateChange, total: number): number {
    const [, duration] = utils.timingFromStateChange(state);
    return (duration / total) * 100;
  }
}

@Pipe({ name: 'recordDelayPipe' })
export class RecordedDelayPipe implements PipeTransform {
  transform(state: cd.IActionStateChange, total: number): number {
    const [delay] = utils.timingFromStateChange(state);
    return (delay / total) * 100;
  }
}

@Pipe({ name: 'recordInputType' })
export class RecordedInputTypePipe implements PipeTransform {
  constructor(private _propsService: PropertiesService) {}

  transform(
    elementId: string | undefined,
    key: string,
    value: any,
    _type: cd.ActionStateType
  ): [recordInput: utils.RecordedInputType, props: cd.IPropertyGroup | undefined] {
    const element = elementId && this._propsService.getPropertiesForId(elementId);
    if (!element) return [utils.RecordedInputType.None, undefined];
    const cmp = getComponent(element.elementType);
    const toMap = utils.generateInputMap(cmp, element);
    const prop = toMap.get(key);
    const type = utils.recordInputTypeFromPropertyInputType(prop, value);
    return [type, prop];
  }
}

@Pipe({ name: 'recordInputMenuPipe' })
export class RecordedInputMenuPipe implements PipeTransform {
  constructor(private _propsService: PropertiesService) {}

  transform(props: cd.IPropertyGroup | undefined, elementId: string | undefined): cd.ISelectItem[] {
    if (!props) return [];
    if (props.menuData) return props.menuData;
    // The following handles scenarios such as radio buttons and select
    // See generateInputMap above for more details
    const element = elementId && this._propsService.getPropertiesForId(elementId);
    const key = props.name;
    if (!element || !key) return [];
    const items = (element?.inputs as any)?.[key];
    if (!Array.isArray(items)) throw new Error(`Invalid record menu for ${elementId} - ${key}`);
    return items.map(({ name: title, value }) => ({ title, value }));
  }
}
