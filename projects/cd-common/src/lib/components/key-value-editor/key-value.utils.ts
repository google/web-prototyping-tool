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

import * as cd from 'cd-interfaces';
import { cssColorProps, cssPropertyMap } from 'cd-metadata/css';
import {
  lookupDesignSystemValue,
  menuFromDesignSystemAttributes,
  validAttrForKeyValue,
  validCSSForKeyValue,
} from 'cd-common/utils';
import { sortDesignSystemValues } from 'cd-themes';
import { InputValidationMode } from 'cd-common/consts';

export const createKeyValue = (name = '', value = ''): cd.IKeyValue => {
  return { name, value };
};

export const checkInputValidity = (
  item: cd.IKeyValue,
  inputMode: InputValidationMode
): cd.IKeyValue => {
  const clone = { ...item };
  const isCSSMode = inputMode === InputValidationMode.CSS;
  const isAttrMode = inputMode === InputValidationMode.HTML_ATTR;
  const itemIsInvalid = isCSSMode
    ? !validCSSForKeyValue(clone)
    : isAttrMode
    ? !validAttrForKeyValue(clone)
    : false;

  if (itemIsInvalid) {
    clone.invalid = true;
  } else {
    delete clone.invalid;
  }
  return clone;
};

export const buildMenuForName = (
  name: string,
  valueMap: cd.IStringMap<string[]>
): cd.ISelectItem[] => {
  const props: string[] = valueMap[name] || [];
  const items = props.map((item) => ({
    title: item,
    value: item,
  }));
  return items;
};

const VAR_ICON = 'label';

const generateVariableMenu = (designSystem: cd.IDesignSystem): cd.ISelectItem[] => {
  return Object.entries(designSystem.variables || {})
    .map(([id, value]) => ({ ...value, id }))
    .sort(sortDesignSystemValues)
    .map((item) => {
      const { name, value, units, id } = item;
      const val = `${value}${units}`;
      const title = `${name} - ${val}`;
      return { id, title, value: val, icon: VAR_ICON };
    });
};

export const buildCssMenuForName = (
  name: string,
  designSystem: cd.IDesignSystem,
  skipCSSPropsForName?: boolean
): cd.ISelectItem[] => {
  const variableMenu = generateVariableMenu(designSystem);
  const colorMenu = menuFromDesignSystemAttributes(designSystem.colors, cd.SelectItemType.Color);
  const props: string[] = (cssPropertyMap as cd.IStringMap<string[]>)[name] || [];
  const items = skipCSSPropsForName
    ? []
    : props.map((item, idx, arr) => {
        const divider = idx === arr.length - 1;
        return { title: item, value: item, divider };
      });
  const showColor = cssColorProps.indexOf(name) !== -1;
  const secondaryMenu = showColor ? colorMenu : variableMenu;
  return [...items, ...secondaryMenu];
};

export const fallbackToDesignSystemValue = (
  id: cd.IKeyValue['id'],
  designSystem?: cd.IDesignSystem
): string => {
  const ref = id && designSystem && (lookupDesignSystemValue(id, designSystem) as cd.IValue);
  if (!ref) return '';
  const value = ref.value || '';
  const units = ref.units || '';
  return `${value}${units}`;
};

export const isElementFocused = (elem?: HTMLElement): boolean => {
  return document.activeElement === elem;
};
