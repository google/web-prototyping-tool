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

import { getActiveStyleFromProperty, StyleFactory } from 'cd-common/models';
import { deepCopy } from 'cd-utils/object';
import * as consts from 'cd-common/consts';
import * as defs from 'cd-definitions';
import * as cd from 'cd-interfaces';

export type InstanceInputLookup = { inputs?: string[]; styles?: string[] };

export type DefaultSymbolInputOverrides =
  | cd.ElementEntitySubType.BoardPortal
  | cd.ElementEntitySubType.Button
  | cd.ElementEntitySubType.Checkbox
  | cd.ElementEntitySubType.Icon
  | cd.ElementEntitySubType.Image
  | cd.ElementEntitySubType.Input
  | cd.ElementEntitySubType.ProgressBar
  | cd.ElementEntitySubType.Select
  | cd.ElementEntitySubType.Slider
  | cd.ElementEntitySubType.Switch
  | cd.ElementEntitySubType.Text
  | cd.ElementEntitySubType.TextInput;

const createGroupItem = (
  base: cd.IPropertyGroup,
  targetId: string,
  dataBindable = true,
  type = cd.PropertyType.AttributeGeneric
): cd.IPropertyGroup => {
  return { ...base, targetId, dataBindable, type };
};

const generateConfig = (type: cd.PropertyType, targetId: string): cd.IPropertyGroup[] => {
  return [{ type, targetId }];
};

const generateMatButtonInputConfig = (targetId: string): cd.IPropertyGroup[] => {
  return [
    createGroupItem(defs.MAT_COLOR_SELECT, targetId),
    createGroupItem(defs.MAT_LABEL_TEXT, targetId),
    createGroupItem(defs.MAT_ICON, targetId),
  ];
};

const generatePrimitiveTextConfig = (targetId: string): cd.IPropertyGroup[] => {
  return [
    createGroupItem(defs.TEXT_PRIMITIVE_INPUT_VALUE, targetId),
    createGroupItem(defs.TEXT_PRIMITIVE_PLACEHOLDER, targetId),
  ];
};

const generateMatProgressBarConfig = (targetId: string): cd.IPropertyGroup[] => {
  return [
    createGroupItem(defs.MAT_COLOR_SELECT, targetId),
    createGroupItem(defs.MAT_PROGRESS_BAR_VALUE, targetId),
  ];
};

const generateMatInputConfig = (targetId: string): cd.IPropertyGroup[] => {
  return [
    createGroupItem(defs.MAT_LABEL_TEXT, targetId),
    createGroupItem(defs.MAT_TEXT_VALUE, targetId),
    createGroupItem(defs.MAT_PLACEHOLDER, targetId),
    createGroupItem(defs.MAT_HINT, targetId),
  ];
};

const generateSelectConfig = (targetId: string): cd.IPropertyGroup[] => {
  return [createGroupItem(defs.MAT_LABEL_TEXT, targetId), createGroupItem(defs.MAT_HINT, targetId)];
};

const generateSliderConfig = (targetId: string): cd.IPropertyGroup[] => {
  return [createGroupItem(defs.MAT_SLIDER_VALUE, targetId)];
};

/** For checkboxes & switches */
const generateSwitchOverride = (targetId: string): cd.IPropertyGroup[] => {
  return [
    createGroupItem(defs.MAT_LABEL_TEXT, targetId),
    createGroupItem(defs.MAT_CHECKED, targetId),
  ];
};

export const instanceInputsForType = (
  prop: cd.PropertyModel | undefined,
  targetId: string
): cd.IPropertyGroup[] | undefined => {
  if (!prop) return;
  const { elementType } = prop;
  // prettier-ignore
  switch (elementType){
    case  cd.ElementEntitySubType.BoardPortal:  return generateConfig(cd.PropertyType.BoardPortal, targetId);
    case  cd.ElementEntitySubType.Button:       return generateMatButtonInputConfig(targetId)
    case  cd.ElementEntitySubType.Checkbox:     return generateSwitchOverride(targetId)
    case  cd.ElementEntitySubType.Icon:         return generateConfig(cd.PropertyType.IconInput, targetId);
    case  cd.ElementEntitySubType.Image:        return generateConfig(cd.PropertyType.ImageSource, targetId);
    case  cd.ElementEntitySubType.Input:        return generateMatInputConfig(targetId);
    case  cd.ElementEntitySubType.ProgressBar:  return generateMatProgressBarConfig(targetId);
    case  cd.ElementEntitySubType.Select:       return generateSelectConfig(targetId);
    case  cd.ElementEntitySubType.Slider:       return generateSliderConfig(targetId);
    case  cd.ElementEntitySubType.Switch:       return generateSwitchOverride(targetId)
    case  cd.ElementEntitySubType.Text:         return generateConfig(cd.PropertyType.TextInput, targetId);
    case  cd.ElementEntitySubType.TextInput:    return generatePrimitiveTextConfig(targetId);
    default: return [];
  }
};

const INSTANCE_INPUT_REDUCER: Record<DefaultSymbolInputOverrides, InstanceInputLookup> = {
  [cd.ElementEntitySubType.Image]: {
    inputs: <Array<keyof cd.IImageInputs>>[consts.SRC_ATTR],
  },
  [cd.ElementEntitySubType.Text]: {
    inputs: <Array<keyof cd.ITextInputs>>[consts.RICH_TEXT_ATTR, consts.INNER_HTML],
    styles: ['textAlign', 'overflow', 'textOverflow', 'whiteSpace'],
  },
  [cd.ElementEntitySubType.Icon]: {
    inputs: <Array<keyof cd.IIconInputs>>[consts.ICON_NAME_VALUE],
    styles: [consts.COLOR_ATTR],
  },
  [cd.ElementEntitySubType.BoardPortal]: {
    inputs: <Array<keyof cd.IRootInstanceInputs>>[consts.REFERENCE_ID],
  },
  [cd.ElementEntitySubType.Button]: {
    inputs: <Array<keyof cd.IButtonInputs>>[consts.LABEL_ATTR, consts.ICON_NAME_VALUE],
    styles: [consts.COLOR_ATTR],
  },
  [cd.ElementEntitySubType.Input]: {
    inputs: <Array<keyof cd.IInputElementInputs>>[
      consts.LABEL_ATTR,
      consts.PLACEHOLDER_ATTR,
      consts.VALUE_ATTR,
      consts.HINT_ATTR,
    ],
  },
  [cd.ElementEntitySubType.Checkbox]: {
    inputs: <Array<keyof cd.ICheckboxInputs>>[consts.LABEL_ATTR, consts.CHECKED_ATTR],
  },
  [cd.ElementEntitySubType.Switch]: {
    inputs: <Array<keyof cd.ISwitchInputs>>[consts.LABEL_ATTR, consts.CHECKED_ATTR],
  },
  [cd.ElementEntitySubType.Slider]: {
    inputs: <Array<keyof cd.ISliderInputs>>[consts.VALUE_ATTR],
  },
  [cd.ElementEntitySubType.Select]: {
    inputs: <Array<keyof cd.ISelectInputs>>[consts.LABEL_ATTR, consts.HINT_ATTR],
  },
  [cd.ElementEntitySubType.TextInput]: {
    inputs: <Array<keyof cd.ISelectInputs>>[
      consts.VALUE_ATTR,
      consts.PLACEHOLDER_ATTR,
      consts.TYPE_ATTR,
    ],
  },
  [cd.ElementEntitySubType.ProgressBar]: {
    inputs: <Array<keyof cd.IProgressBarInputs>>[consts.COLOR_ATTR, consts.VALUE_ATTR],
  },
};

const DEFAULT_SYMBOL_OVERRIDES: DefaultSymbolInputOverrides[] = [
  cd.ElementEntitySubType.BoardPortal,
  cd.ElementEntitySubType.Button,
  cd.ElementEntitySubType.Checkbox,
  cd.ElementEntitySubType.Icon,
  cd.ElementEntitySubType.Image,
  cd.ElementEntitySubType.Text,
];

export const hasDefaultSymbolInputOverrides = (element: cd.PropertyModel): boolean => {
  return DEFAULT_SYMBOL_OVERRIDES.includes(element.elementType as DefaultSymbolInputOverrides);
};

export const generateSymbolInstanceDefaults = (
  symbolChildren: cd.PropertyModel[]
): cd.SymbolInstanceInputs => {
  const instanceInputs: cd.SymbolInstanceInputs = {};

  for (const prop of symbolChildren) {
    const value = INSTANCE_INPUT_REDUCER[prop.elementType as DefaultSymbolInputOverrides];
    const payload: { inputs?: {}; styles?: {} } = {};
    const styleList = new StyleFactory().deleteOverrides();
    const styleMap = getActiveStyleFromProperty(prop);

    if (value?.styles) {
      for (const styleName of value.styles) {
        const currentValue = styleMap?.[styleName];
        if (!currentValue) continue;
        styleList.addBaseStyle({ [styleName]: currentValue });
      }
      payload.styles = styleList.build();
    }
    if (value?.inputs) {
      const inputs = {};
      for (const inputName of value.inputs) {
        const inputValue = (prop.inputs as any)[inputName];
        if (!inputValue) continue;
        (inputs as any)[inputName] = deepCopy(inputValue);
      }
      payload.inputs = inputs;
    }

    instanceInputs[prop.id] = payload;
  }

  return instanceInputs;
};
