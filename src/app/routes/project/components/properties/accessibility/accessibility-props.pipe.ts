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
import { IA11yAttr, ISelectItem, PropertyInput, IRichTooltip, IStringMap } from 'cd-interfaces';
import { isA11yAttrDisabled, getA11yAttrLabel } from 'cd-common/utils';
import { ariaAttributes, ariaAttrTypes, ariaAttrHelp } from 'cd-metadata/aria';
import { A11Y_DOCS_URL } from 'cd-common/consts';
import { capitalizeFirst } from 'cd-utils/string';

const buildA11yMenuForName = (name: string, valueMap: IStringMap<string[]>): ISelectItem[] => {
  const props: string[] = valueMap[name] || [];
  const items = props.reduce((list: ISelectItem[], value) => {
    if (value) {
      const title = capitalizeFirst(value);
      list.push({ title, value });
    }
    return list;
  }, []);
  return items;
};

@Pipe({ name: 'disabledAttrPipe' })
export class DisabledAttrPipe implements PipeTransform {
  transform(attr: IA11yAttr): boolean {
    return isA11yAttrDisabled(attr);
  }
}

@Pipe({ name: 'someAttrsDisabledPipe' })
export class SomeAttrsDisabledPipe implements PipeTransform {
  transform(allAriaAttrs: IA11yAttr[]): boolean {
    return allAriaAttrs.some((attr: IA11yAttr) => isA11yAttrDisabled(attr));
  }
}

@Pipe({ name: 'attrMenuDataPipe' })
export class AttrMenuDataPipe implements PipeTransform {
  transform(attr: IA11yAttr): ISelectItem[] {
    return buildA11yMenuForName(attr.name, ariaAttributes);
  }
}

@Pipe({ name: 'attrValueTypePipe' })
export class AttrValueTypePipe implements PipeTransform {
  transform(attr: IA11yAttr): PropertyInput {
    return attr.type || ariaAttrTypes[attr.name];
  }
}

@Pipe({ name: 'isNumberTypeInputPipe' })
export class IsNumberTypeInputPipe implements PipeTransform {
  transform(attrName: string): boolean {
    const type = ariaAttrTypes[attrName];
    return type === PropertyInput.Number || type === PropertyInput.Integer;
  }
}

@Pipe({ name: 'showHiddenAttrPipe' })
export class ShowHiddenAttrPipe implements PipeTransform {
  transform(attr: IA11yAttr, showHidden: boolean): boolean {
    return showHidden || !isA11yAttrDisabled(attr);
  }
}

@Pipe({ name: 'getSelectResetState' })
export class GetSelectResetState implements PipeTransform {
  transform(attr: IA11yAttr): string | undefined {
    const emptySelectionAllowed = ariaAttributes[attr.name] && ariaAttributes[attr.name][0] === '';
    return emptySelectionAllowed ? (attr.name === 'role' ? 'No role' : 'None') : '';
  }
}

@Pipe({ name: 'menuForAttrKeyPipe' })
export class MenuForAttrKeyPipe implements PipeTransform {
  transform(menuData: string[]): ISelectItem[] {
    return menuData.map((attr) => {
      const title = getA11yAttrLabel(attr);
      return { title, value: attr, subtitle: attr };
    });
  }
}

const ARIA_REF_URL = 'https://www.w3.org/TR/wai-aria';

@Pipe({ name: 'attrHelpTooltipPipe' })
export class AttrHelpTooltipPipe implements PipeTransform {
  transform(attr: IA11yAttr): IRichTooltip | undefined {
    const helpText = ariaAttrHelp[attr.name];
    if (!helpText) return undefined;
    const text = `<strong>${attr.name}</strong><br />${helpText}`;
    const linkText = 'WCAG documentation';
    const link = `${ARIA_REF_URL}/#${attr.name}`;
    return { text, linkText, link };
  }
}

@Pipe({ name: 'defaultsHelpTooltipPipe' })
export class DefaultsHelpTooltipPipe implements PipeTransform {
  transform(selectedRole: string): IRichTooltip {
    return {
      text: `Default ARIA attributes and values for the ${selectedRole} role.`,
      link: A11Y_DOCS_URL + selectedRole,
      linkText: 'Learn more',
    };
  }
}
