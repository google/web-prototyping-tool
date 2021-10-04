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

import type { ThemePalette } from '@angular/material/core';
import {
  CdComponent,
  inputPropsBinding,
  TemplateFactory,
  wrapInCurlyBraces,
} from 'cd-common/models';
import { ColorType } from 'cd-themes';
import * as consts from 'cd-common/consts';
import * as cd from 'cd-interfaces';

//#region Consts

export const APPEARANCE_TAG = 'appearance';
export const DEFAULT_LABEL_POS = 'after' as cd.LabelPosition;
export const DEFAULT_THEME_COLOR = 'primary' as ThemePalette;
export const DEFAULT_LABEL_NAME = 'Label';
export const MAT_HINT_TAG = 'mat-hint';
export const MAT_HAS_HINT_CLASS = 'mat-has-hint';
export const MAT_HELPER_TEXT = 'Helper text';
export const MAT_SUFFIX_DIRECTIVE = 'matSuffix';
export const MAT_APPEARANCE_TAG = 'appearance';
export const MAT_ICON_TAG = 'mat-icon';
export const MAT_NATIVE_CONTROL = 'matNativeControl';
export const MAT_LABEL = 'mat-label';
export const MAT_FORM_FIELD_TAG = 'mat-form-field';
export const MAT_INPUT_DIRECTIVE = 'matInput';
export const MAT_CHIP_REMOVE_DIRECTIVE = 'matChipRemove';
export const MAT_CHIP_INPUT_FOR_DIRECTIVE = 'matChipInputFor';
export const MAT_CHIP_INPUT_SEPARATORS = 'matChipInputSeparatorKeyCodes';
export const MAT_CHIP_INPUT_ON_ADD_BLUR = 'matChipInputAddOnBlur';
export const ALIGN_ATTR = 'align';
export const ALIGN_VALUE_START = 'start';
export const DEFAULT_FORM_FIELD_WIDTH = 200;
const MAT_LABEL_FIX_DIRECTIVE = 'cdMatLabelFix';

export enum LabelPositionMode {
  Before = 'before',
  After = 'after',
}

export enum MaterialThemeColors {
  Primary = 'primary',
  Secondary = 'accent',
  Warn = 'warn',
}

export const buildMatLabelLookupBinding = () => {
  return inputPropsBinding(consts.LABEL_ATTR, true, cd.CoerceValue.String);
};

export const DEFAULT_MENU: cd.IGenericConfig[] = [
  { name: 'Option 1', value: '1' },
  { name: 'Option 2', value: '2' },
  { name: 'Option 3', value: '3' },
];

export const BEFORE_AFTER_TOGGLE_MENU = [
  { title: 'Before', value: LabelPositionMode.Before },
  { title: 'After', value: LabelPositionMode.After },
];
//#endregion

//#region Components

export abstract class MaterialComponent extends CdComponent {
  library = cd.ComponentLibrary.AngularMaterial;
  fitContent = true;
  childrenAllowed = false;
  preventResize = false;
  exportPropsAsAttrs = true;
}

export abstract class MaterialFormField extends MaterialComponent {
  tagName = MAT_FORM_FIELD_TAG;
  wrapperTag = consts.DIV_TAG;
  width = DEFAULT_FORM_FIELD_WIDTH;
}

export class MaterialLabel extends MaterialComponent {
  tagName = MAT_LABEL;
  properties: cd.IPropertyGroup[] = [
    {
      name: consts.LABEL_ATTR,
      bindingType: cd.BindingType.InnerText,
      dataBindable: true,
      coerceType: cd.CoerceValue.String,
    },
  ];
  isInnerChild = true;

  template = (mode: cd.TemplateBuildMode, props?: any): string => {
    if (mode === cd.TemplateBuildMode.Internal) {
      const lookup = buildMatLabelLookupBinding();
      // const withFallback = `(${lookup}) || ''`;
      const labelName = 'labelValue';
      return new TemplateFactory(mode, MAT_LABEL)
        .addDirective(MAT_LABEL_FIX_DIRECTIVE)
        .addBoundAttribute(consts.VALUE_ATTR, labelName) // used by matLabelFixDirective
        .add_ngIf_let(lookup, labelName)
        .addChild(wrapInCurlyBraces(labelName))
        .build();
    }
    // Handle template export
    return new TemplateFactory(mode, MAT_LABEL).addChild(props?.inputs?.label || '').build(true);
  };
}

/**
 * Light text shown below the label of form components.
 * <mat-hint align="start" *ngIf="props?.inputs?.hint">{{ props?.inputs?.hint }}</mat-hint>
 */
export class MaterialHint extends MaterialComponent {
  tagName = MAT_HINT_TAG;
  bindIf = consts.HINT_ATTR;
  attrs = { align: ALIGN_VALUE_START };
  properties: cd.IPropertyGroup[] = [
    {
      name: consts.HINT_ATTR,
      bindingType: cd.BindingType.InnerText,
      dataBindable: true,
      coerceType: cd.CoerceValue.String,
    },
  ];
  isInnerChild = true;
}

// <mat-icon matSuffix *ngIf="props?.inputs?.icon" [cdCoTooltip]="props?.inputs?.iconTooltipLabel">
//   {{ props?.inputs?.icon }}
// </mat-icon>
export class MaterialIconSuffix extends MaterialComponent {
  tagName = consts.ICON_ELEMENT_TAG;
  bindIf = consts.ICON_ATTR;
  attrs = { [MAT_SUFFIX_DIRECTIVE]: true };
  properties: cd.IPropertyGroup[] = [
    {
      name: consts.ICON_ATTR,
      bindingType: cd.BindingType.Property,
    },
    {
      name: consts.CD_CO_TOOLTIP,
      inputName: consts.ICON_TOOLTIP_LABEL_ATTR,
    },
  ];
  isInnerChild = true;
}

//#endregion

//#region Properties

export const MAT_REQUIRED_CHECKBOX: cd.IPropertyGroup = {
  name: consts.REQUIRED_ATTR,
  inputType: cd.PropertyInput.Checkbox,
  label: 'Required',
  dataBindable: true,
  coerceType: cd.CoerceValue.Boolean,
};

export const MAT_TEXT_VALUE: cd.IPropertyGroup = {
  name: consts.VALUE_ATTR,
  inputType: cd.PropertyInput.Text,
  dataBindable: true,
  coerceType: cd.CoerceValue.String,
  label: 'Value',
  placeholder: 'Value',
};

export const MAT_CHECKED: cd.IPropertyGroup = {
  name: consts.CHECKED_ATTR,
  inputType: cd.PropertyInput.Checkbox,
  label: 'Checked',
  dataBindable: true,
  coerceType: cd.CoerceValue.Boolean,
};

export const MAT_LABEL_TEXT: cd.IPropertyGroup = {
  name: consts.LABEL_ATTR,
  inputType: cd.PropertyInput.Text,
  bindingType: cd.BindingType.None,
  label: 'Label',
  dataBindable: true,
  coerceType: cd.CoerceValue.String,
};

export const MAT_LABEL_POSITION: cd.IPropertyGroup = {
  name: consts.LABEL_POSITION_ATTR,
  inputType: cd.PropertyInput.Toggle,
  label: 'Position',
  menuData: BEFORE_AFTER_TOGGLE_MENU,
};

export const MAT_HINT: cd.IPropertyGroup = {
  name: consts.HINT_ATTR,
  inputType: cd.PropertyInput.Text,
  bindingType: cd.BindingType.None,
  label: 'Hint',
  placeholder: 'Hint',
  dataBindable: true,
  coerceType: cd.CoerceValue.String,
};

export const MAT_PLACEHOLDER: cd.IPropertyGroup = {
  name: consts.PLACEHOLDER_ATTR,
  inputType: cd.PropertyInput.Text,
  label: 'Placeholder',
  placeholder: 'Placeholder',
  dataBindable: true,
  coerceType: cd.CoerceValue.String,
};

export const MAT_DISABLED_CHECKBOX: cd.IPropertyGroup = {
  name: consts.DISABLED_ATTR,
  inputType: cd.PropertyInput.Checkbox,
  label: 'Disabled',
  dataBindable: true,
  coerceType: cd.CoerceValue.Boolean,
};

export const MAT_ICON: cd.IPropertyGroup = {
  name: consts.ICON_NAME_VALUE,
  inputType: cd.PropertyInput.Icon,
  label: 'Icon',
};

export const MAT_COLOR_SELECT: cd.IPropertyGroup = {
  name: consts.COLOR_ATTR,
  inputType: cd.PropertyInput.Select,
  label: 'Color',
  resetState: 'None',
  placeholder: 'None',
  colorMenu: true,
  defaultValue: DEFAULT_THEME_COLOR,
  menuData: [
    {
      id: ColorType.Primary,
      title: 'Primary',
      value: 'primary',
    },
    {
      id: ColorType.Secondary,
      title: 'Secondary',
      value: 'accent',
    },
    {
      id: ColorType.Warning,
      title: 'Warn',
      value: 'warn',
    },
  ],
};

export const MAT_INPUT_VARIANT_SELECT: cd.IPropertyGroup = {
  children: [
    {
      name: APPEARANCE_TAG,
      inputType: cd.PropertyInput.Select,
      label: 'Variant',
      menuData: [
        {
          title: 'Outline',
          value: cd.MatInputAppearance.Outline,
        },
        {
          title: 'Standard',
          value: cd.MatInputAppearance.Standard,
        },
        {
          title: 'Fill',
          value: cd.MatInputAppearance.Fill,
        },
      ],
    },
  ],
};

//#endregion
