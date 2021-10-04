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

import { TemplateFactory, inputPropsBinding } from 'cd-common/models';
import * as menuUtils from '../menu/menu.template';
import * as consts from 'cd-common/consts';
import * as cd from 'cd-interfaces';
import {
  getIconElementExportTemplate,
  getIconElementTemplate,
} from '../../primitive/icon/icon.template';

export const BUTTON_TAG = 'button';

export const SMALL_ATTR = 'small';
export const ICON_RIGHT_SIDE_ATTR = 'iconRightSide';
const CD_MAT_BUTTON_CLASS = 'cd-mat-button';
const SMALL_BUTTON_CLASS = 'cd-small-button';
const RIGHT_ICON_CLASS = 'cd-right-icon';
const MAT_BUTTON_MENU_REF = 'buttonMenu';
const MENU_INPUT = 'menu';

export const SPLIT_ATTR = 'split';
export const SPLIT_ICON = 'splitIcon';
export const SPLIT_BUTTON_MENU_CLASS = 'cd-split-button-menu';
export const CAPTURE_MENU_DIRECTIVE = 'cdCaptureMatMenu';
// TODO: move to button group component when added
export const BUTTON_GROUP_CLASS = 'cd-mat-button-group';
export const BUTTON_GROUP_DISABLED = 'cd-mat-button-group-disabled';

export const VARIANT_MAP = {
  [cd.ButtonVariant.Basic]: 'mat-button',
  [cd.ButtonVariant.Fab]: 'mat-fab',
  [cd.ButtonVariant.Flat]: 'mat-flat-button',
  [cd.ButtonVariant.Icon]: 'mat-icon-button',
  [cd.ButtonVariant.Raised]: 'mat-raised-button',
  [cd.ButtonVariant.Stroked]: 'mat-stroked-button',
};

const ICON_ONLY_BUTTON_VARIANTS = [cd.ButtonVariant.Fab, cd.ButtonVariant.Icon];

const SPLIT_BUTTON_VARIANTS = [
  cd.ButtonVariant.Basic,
  cd.ButtonVariant.Flat,
  cd.ButtonVariant.Raised,
  cd.ButtonVariant.Stroked,
];

export default function (mode: cd.TemplateBuildMode, props: cd.IButtonProperties): string {
  // Internal
  const matMenu = menuUtils.buildMatMenu(mode, props, MAT_BUTTON_MENU_REF, MENU_INPUT);

  if (mode === cd.TemplateBuildMode.Internal) {
    const switchContent = buildInternalSwitchContent();
    return new TemplateFactory(mode, consts.NG_CONTAINER)
      .addPropsBoundInputAttribute(consts.NG_SWITCH, consts.VARIANT_ATTR)
      .addChild(switchContent + matMenu)
      .build();
  }

  // Export
  return buildExportCode(mode, props);
}

const buildInternalSwitchContent = (): string => {
  const fabBtn = generateInternalButton(cd.ButtonVariant.Fab);
  const iconBtn = generateInternalButton(cd.ButtonVariant.Icon);
  const raisedBtn = generateInternalButton(cd.ButtonVariant.Raised);
  const flatBtn = generateInternalButton(cd.ButtonVariant.Flat);
  const strokedBtn = generateInternalButton(cd.ButtonVariant.Stroked);
  const basic = generateInternalButton(cd.ButtonVariant.Basic, true);

  return [fabBtn, iconBtn, raisedBtn, flatBtn, strokedBtn, basic]
    .map((item) => item.build())
    .join('');
};

const generateInternalButton = (
  variant: cd.ButtonVariant,
  defaultSwitchCondition = false
): TemplateFactory => {
  const canBeSplitButton = SPLIT_BUTTON_VARIANTS.includes(variant);
  const buttonVariantSwitchCondition = `'${variant}'`;

  // base/fallback button for any variant
  const baseButton = generateBaseButton(variant).addChild(generateMenuTrigger());

  // do not bother with split template options if split not allowed
  if (!canBeSplitButton) {
    if (defaultSwitchCondition) return baseButton.addSwitchDefault();
    return baseButton.addSwitchCase(buttonVariantSwitchCondition);
  }

  const splitMainButton = generateBaseButton(variant, false);
  const splitMenuTriggerBtn = generateSplitMenuTrigger(variant);
  const splitButtonWrapper = generateSplitButtonWrapper(variant)
    .addChild(splitMainButton.build())
    .addChild(splitMenuTriggerBtn.build());

  // build container to replace <button> as top level element with default props / data id
  const isSplitCondition = inputPropsBinding(SPLIT_ATTR);
  const defaultButtonTemplateName = `${variant}Button`;
  const buttonContainer = new TemplateFactory(cd.TemplateBuildMode.Internal, consts.DIV_TAG)
    .addDefaultAttributes()
    .addFitContentClass()
    .add_ngIf_else_Attribute(isSplitCondition, defaultButtonTemplateName)
    .addChild(splitButtonWrapper.build());

  // default button fallback/else condition
  const defaultButtonTemplate = new TemplateFactory(
    cd.TemplateBuildMode.Internal,
    consts.NG_TEMPLATE
  )
    .addDirective(`#${defaultButtonTemplateName}`) // TODO: util for adding ng-template names?
    .addChild(baseButton.build());

  const splitBtnSwitchConditionContainer = new TemplateFactory(
    cd.TemplateBuildMode.Internal,
    consts.NG_CONTAINER
  )
    .addChild(buttonContainer.build())
    .addChild(defaultButtonTemplate.build());

  if (defaultSwitchCondition) return splitBtnSwitchConditionContainer.addSwitchDefault();
  return splitBtnSwitchConditionContainer.addSwitchCase(buttonVariantSwitchCondition);
};

const generateBaseButton = (variant: cd.ButtonVariant, topLevelElement = true): TemplateFactory => {
  const iconValuePath = inputPropsBinding(consts.ICON_NAME_VALUE);
  const button = new TemplateFactory(cd.TemplateBuildMode.Internal, BUTTON_TAG);

  if (topLevelElement) {
    button.addDefaultAttributes();
  }
  button
    .addCSSClass(CD_MAT_BUTTON_CLASS)
    /**
     * input.small applies the class 'cd-small-button' which increases density
     * This gives Google Cloud density to non-cloud material buttons
     * */
    .addClassPropsBinding(SMALL_BUTTON_CLASS, SMALL_ATTR, true, true, cd.CoerceValue.Boolean)
    .addClassPropsBinding(RIGHT_ICON_CLASS, ICON_RIGHT_SIDE_ATTR, true)
    .addPropsBoundInputAttribute(consts.COLOR_ATTR)
    .addPropsBoundInputAttribute(consts.DISABLED_ATTR, undefined, true, cd.CoerceValue.Boolean)
    .addDirective(VARIANT_MAP[variant])
    .addChild(getIconElementTemplate(iconValuePath));
  if (!isIconButton(variant)) {
    button.addInnerTextBinding(consts.LABEL_ATTR, true, true, cd.CoerceValue.String);
  }

  return button;
};

/** Conditionally added mat-menu trigger */
const generateMenuTrigger = () => {
  const hasMenuData = `${inputPropsBinding(MENU_INPUT)}?.length`;
  const menuDataContext = `{ $implicit:${inputPropsBinding(MENU_INPUT)} }`;

  return new TemplateFactory(cd.TemplateBuildMode.Internal, consts.NG_CONTAINER)
    .add_ngIf_Attribute(hasMenuData)
    .addChild(
      new TemplateFactory(cd.TemplateBuildMode.Internal, consts.DIV_TAG)
        .addCSSClass(menuUtils.MAT_MENU_TRIGGER_CLASS)
        .addBoundAttribute(menuUtils.MAT_MENU_TRIGGER, MAT_BUTTON_MENU_REF)
        .addBoundAttribute(menuUtils.MAT_MENU_TRIGGER_DATA, menuDataContext)
        .build()
    )
    .build();
};

const generateSplitMenuTrigger = (variant: cd.ButtonVariant) => {
  const splitIconValuePath = inputPropsBinding(SPLIT_ICON);
  const menuDataContext = `{ $implicit:${inputPropsBinding(MENU_INPUT)} }`;

  return new TemplateFactory(cd.TemplateBuildMode.Internal, BUTTON_TAG)
    .addDirective(VARIANT_MAP[variant])
    .addCSSClass(SPLIT_BUTTON_MENU_CLASS)
    .addCSSClass(CD_MAT_BUTTON_CLASS)
    .addClassPropsBinding(SMALL_BUTTON_CLASS, SMALL_ATTR, true, true, cd.CoerceValue.Boolean)
    .addPropsBoundInputAttribute(consts.COLOR_ATTR)
    .addPropsBoundInputAttribute(consts.DISABLED_ATTR, undefined, true, cd.CoerceValue.Boolean)
    .addDirective(CAPTURE_MENU_DIRECTIVE)
    .addBoundAttribute(menuUtils.MAT_MENU_TRIGGER, MAT_BUTTON_MENU_REF)
    .addBoundAttribute(menuUtils.MAT_MENU_TRIGGER_DATA, menuDataContext)
    .addChild(getIconElementTemplate(splitIconValuePath));
};

const generateSplitButtonWrapper = (variant: cd.ButtonVariant) => {
  return new TemplateFactory(cd.TemplateBuildMode.Internal, consts.SPAN_TAG)
    .addCSSClass(BUTTON_GROUP_CLASS)
    .addCSSClass(`${VARIANT_MAP[variant]}-wrapper`)
    .addClassPropsBinding(
      BUTTON_GROUP_DISABLED,
      consts.DISABLED_ATTR,
      true,
      true,
      cd.CoerceValue.Boolean
    );
};

const buildExportCode = (mode: cd.TemplateBuildMode, props: cd.IButtonProperties) => {
  const matMenu = menuUtils.buildMatMenu(mode, props, MAT_BUTTON_MENU_REF, MENU_INPUT);
  const variantAttr = VARIANT_MAP[props.inputs.variant];

  const baseButton = new TemplateFactory(mode, BUTTON_TAG, props)
    .addAttribute(variantAttr, undefined, true)
    .addAttribute(consts.COLOR_ATTR, props.inputs.color)
    .addAttribute(consts.DISABLED_ATTR, props.inputs.disabled, false)
    .addChild(buildExportContent(props));
  if (props.inputs.small) baseButton.addCSSClass(SMALL_BUTTON_CLASS);

  if (!props.inputs.split) {
    if (!props.inputs.menu?.length) return baseButton.build();
    baseButton.addBoundAttribute(menuUtils.MAT_MENU_TRIGGER, MAT_BUTTON_MENU_REF);
    return baseButton.build() + matMenu;
  }

  // else, split button
  const menuTriggerBtn = new TemplateFactory(mode, BUTTON_TAG, props)
    .addCSSClass(SPLIT_BUTTON_MENU_CLASS)
    .addAttribute(variantAttr, undefined, true)
    .addAttribute(consts.COLOR_ATTR, props.inputs.color)
    .addAttribute(consts.DISABLED_ATTR, props.inputs.disabled, false);
  if (props.inputs.small) menuTriggerBtn.addCSSClass(SMALL_BUTTON_CLASS);
  if (props.inputs.menu?.length)
    menuTriggerBtn.addBoundAttribute(menuUtils.MAT_MENU_TRIGGER, MAT_BUTTON_MENU_REF);
  if (props.inputs.splitIcon)
    menuTriggerBtn.addChild(getIconElementExportTemplate(props.inputs.splitIcon));

  const splitWrapper = new TemplateFactory(mode, consts.SPAN_TAG, props)
    .addCSSClass(BUTTON_GROUP_CLASS)
    .addCSSClass(`${variantAttr}-wrapper`)
    .addChild(baseButton.build())
    .addChild(menuTriggerBtn.build())
    .build();

  if (!props.inputs.menu?.length) return splitWrapper;
  return splitWrapper + matMenu;
};

const buildExportContent = (model: cd.IButtonProperties): string => {
  const { variant, iconName } = model.inputs;
  const iconOnlyButton = isIconButton(variant);
  const label = iconOnlyButton ? '' : model.inputs.label || '';

  if (iconName) {
    const matIcon = getIconElementExportTemplate(iconName);
    return `${matIcon}${label}`;
  }

  return label;
};

const isIconButton = (variant?: cd.ButtonVariant): boolean => {
  if (!variant) return false;
  return ICON_ONLY_BUTTON_VARIANTS.includes(variant);
};
