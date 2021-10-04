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
import * as consts from 'cd-common/consts';
import { inputPropsBinding, TemplateFactory, wrapInCurlyBraces } from 'cd-common/models';
import { isIcon } from 'cd-common/utils';

const PRIMITIVE_TEMPLATE_REF = 'primitiveIconRef';

export default function (mode: cd.TemplateBuildMode, props: cd.IIconProperties): string {
  if (mode === cd.TemplateBuildMode.Simple) {
    return getIconElementExportTemplate(props.inputs.iconName, false, props);
  }

  const iconValuePath = inputPropsBinding(consts.ICON_NAME_VALUE);
  return getIconElementTemplate(iconValuePath, true, false);
}

/** Resusable template function for anywhere an icon is used throughout 's components */
export const getIconElementTemplate = (
  iconValueLookupPath: string,
  addDefaultAttributes = false,
  wrapWithNgIf = true
): string => {
  const isCloudIconExpression = `${iconValueLookupPath} | ${consts.CLOUD_ICON_PIPE}`;
  const { Internal } = cd.TemplateBuildMode;

  const cloudIcon = new TemplateFactory(Internal, consts.ICON_ELEMENT_TAG)
    .add_ngIf_else_Attribute(isCloudIconExpression, PRIMITIVE_TEMPLATE_REF)
    .addBoundAttribute(consts.ICON_ATTR, iconValueLookupPath);

  const primitiveIcon = new TemplateFactory(Internal, consts.PRIMITIVE_ICON_TAG)
    .addCSSClass(consts.PRIMITIVE_ICON_CLASS)
    .addCSSClass(consts.MATERIAL_ICONS_CLASS)
    .addChild(wrapInCurlyBraces(iconValueLookupPath));

  if (addDefaultAttributes) {
    cloudIcon.addDefaultAttributes();
    primitiveIcon.addDefaultAttributes();
  }

  const primitiveTemplate = new TemplateFactory(Internal, consts.NG_TEMPLATE)
    .addAttribute(`#${PRIMITIVE_TEMPLATE_REF}`, undefined, true)
    .addChild(primitiveIcon.build());

  const iconTemplate = `${cloudIcon.build()}${primitiveTemplate.build()}`;

  // Wrap in <ng-container *ngIf="value">
  if (wrapWithNgIf) {
    const ngContainer = new TemplateFactory(Internal, consts.NG_CONTAINER)
      .add_ngIf_Attribute(`!!${iconValueLookupPath}`)
      .addChild(iconTemplate);

    return ngContainer.build();
  }

  return iconTemplate;
};

/**
 * Reusable template export function for anywhere an icon is used throughout 's components
 */
export const getIconElementExportTemplate = (
  iconValue: cd.SelectedIcon,
  useMatIcon = true,
  props?: cd.IIconProperties
): string => {
  if (isIcon(iconValue)) {
    const { name, iconset, size } = iconValue;
    return new TemplateFactory(cd.TemplateBuildMode.Simple, consts.ACE_ICON_TAG)
      .addAttribute(consts.ICON_ATTR, name)
      .addAttribute(consts.ACE_ICONSET_INPUT, iconset)
      .addAttribute(consts.ACE_SIZE_INPUT, size)
      .build();
  }

  const tagName = useMatIcon ? consts.MAT_ICON_TAG : consts.PRIMITIVE_ICON_TAG;
  const iconFactory = new TemplateFactory(cd.TemplateBuildMode.Simple, tagName, props).addChild(
    iconValue
  );

  // If exporting the primitive icon - add the material-icon CSS class to it
  if (!useMatIcon) iconFactory.addCSSClass(consts.MATERIAL_ICONS_CLASS);

  return iconFactory.build();
};
