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
import { lookupOutput, getMenuForPropertyType } from './action-panel.utils';
import { MarkSelection } from 'cd-common/pipes';
import { PropertiesService } from '../../../services/properties/properties.service';
import { LayoutAlignment } from 'cd-common/consts';
import { convertToLayoutAlignment } from './position.utils';
import { isBoard } from 'cd-common/models';
import * as cd from 'cd-interfaces';
import * as config from './action-panel.config';

/** Only show "Hover" trigger for the Record State Action */
const filterHoverTrigger = (
  modelType: cd.ActionType,
  defaults: cd.ISelectItem[]
): cd.ISelectItem[] => {
  return modelType !== cd.ActionType.RecordState && modelType !== cd.ActionType.PresentOverlay
    ? defaults.filter((item) => item.value !== cd.EventTrigger.Hover)
    : defaults;
};

@Pipe({ name: 'mergeEventsTriggers' })
export class MergeEventsTriggersPipe implements PipeTransform {
  transform(
    outputsConfig: ReadonlyArray<cd.IOutputProperty>,
    defaults: cd.ISelectItem[],
    modelType: cd.ActionType
  ): cd.ISelectItem[] {
    const filteredDefaults = filterHoverTrigger(modelType, defaults);
    const filteredOutputs = outputsConfig.filter((o) => !o.disableAsActionTrigger);
    if (filteredOutputs.length === 0) return filteredDefaults;
    const events: cd.ISelectItem[] = filteredOutputs.map((item, i) => {
      const { label: title, binding: value, icon } = item;
      const divider = i === outputsConfig.length - 1;
      return { title, value, icon, divider } as cd.ISelectItem;
    });

    return [...events, ...filteredDefaults];
  }
}

@Pipe({ name: 'menuForPropertyType' })
export class MenuForPropertyTypePipe implements PipeTransform {
  transform(
    binding: string | undefined,
    outputEvents: ReadonlyArray<cd.IOutputProperty>,
    inputs: cd.IStringMap<any>
  ): cd.ISelectItem[] {
    if (!binding) return [];
    const prop = lookupOutput(binding, outputEvents);
    return prop ? getMenuForPropertyType(prop, inputs) : [];
  }
}

@Pipe({ name: 'titleForActionPipe' })
export class TitleForActionPipe implements PipeTransform {
  transform(type: cd.ActionType, defaults: cd.ISelectItem[]): string {
    return defaults.find((item) => item.value === type)?.title ?? '';
  }
}

/**
 * All mouse events support toggle but only Boolean OutputEvents support toggle
 * So checkbox and switch but not select and radio buttons....
 * Additionally, When event trigger = "hover" we hide this
 */
@Pipe({ name: 'eventSupportsTogglePipe' })
export class EventSupportsTogglePipe implements PipeTransform {
  transform(
    event: cd.EventTriggerType | string,
    outputsConfig: ReadonlyArray<cd.IOutputProperty> = []
  ): boolean {
    if (event === cd.EventTrigger.Hover) return false;
    const output = outputsConfig.find((item) => item.binding === event);
    if (!output) return true;
    return output.type === cd.OutputPropertyType.Boolean;
  }
}

@Pipe({ name: 'outputTypePipe' })
export class OutputTypePipe implements PipeTransform {
  transform(
    outputBinding: string | undefined,
    outputEvents: ReadonlyArray<cd.IOutputProperty>
  ): cd.OutputPropertyType | undefined {
    if (!outputBinding) return;
    const prop = lookupOutput(outputBinding, outputEvents);
    return prop?.type;
  }
}

@Pipe({ name: 'inputTypeForOutputTypePipe' })
export class InputTypeForOutputTypePipe implements PipeTransform {
  transform(outputType: cd.OutputPropertyType): string {
    return outputType === cd.OutputPropertyType.Numeric ? cd.InputType.Number : cd.InputType.Text;
  }
}

@Pipe({ name: 'canShowOutputConditionValuePipe' })
export class CanShowOutputConditionValuePipe implements PipeTransform {
  transform(condition?: cd.OutputConditionType): boolean {
    return condition !== cd.OutputCondition.None;
  }
}

@Pipe({ name: 'menuForOutputConditionPipe' })
export class MenuForOutputConditionPipe implements PipeTransform {
  /** Default values is provided for legacy purposes */
  transform(condition: cd.OutputConditionType = cd.OutputCondition.Equals): cd.ISelectItem[] {
    return new MarkSelection().transform(config.OUTPUT_CONDITIONS_MENU, condition);
  }
}

@Pipe({ name: 'alignChildValuesPipe' })
export class AlignChildValuesPipe implements PipeTransform {
  transform(alignment: ReadonlyArray<config.IOverlayAlignToggle>): cd.ActionOverlayPosition[] {
    return alignment.map((item) => item.value);
  }
}

@Pipe({ name: 'overlayAnchorIsBoardPipe' })
export class OverlayAnchorIsBoardPipe implements PipeTransform {
  constructor(private _props: PropertiesService) {}
  transform(anchor?: string): boolean {
    const elem = anchor && this._props.getPropertiesForId(anchor);
    if (!elem) return false;
    return isBoard(elem);
  }
}

@Pipe({ name: 'overlayAlignMenuPipe' })
export class OverlayAlignMenuPipe implements PipeTransform {
  transform(position: cd.ActionOverlayPosition): cd.ISelectItem[] {
    if (position === cd.ActionOverlayPosition.Top || position === cd.ActionOverlayPosition.Bottom) {
      return config.OVERLAY_HORIZONTAL;
    }
    if (position === cd.ActionOverlayPosition.Left || position === cd.ActionOverlayPosition.Right) {
      return config.OVERLAY_VERTICAL;
    }
    return [];
  }
}

@Pipe({ name: 'overlayAlignPropsPipe' })
export class OverlayAlignPropsPipe implements PipeTransform {
  transform(
    position: cd.ActionOverlayPosition,
    alignment: cd.ActionOverlayPosition
  ): LayoutAlignment {
    return convertToLayoutAlignment(position, alignment);
  }
}
