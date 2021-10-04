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
import { TemplateFactory } from 'cd-common/models';
import {
  getIconElementExportTemplate,
  getIconElementTemplate,
} from '../../primitive/icon/icon.template';

const MAT_MENU = 'mat-menu';
const MAT_MENU_ITEM = 'mat-menu-item';
const BUTTON_TAG = 'button';
const MAT_MENU_CONTENT = 'matMenuContent';
export const MAT_MENU_TRIGGER_CLASS = 'co-mat-menu-trigger'; // see index.scss inside the renderer/src/styles
export const MAT_MENU_TRIGGER = 'matMenuTriggerFor';
export const MAT_MENU_TRIGGER_DATA = 'matMenuTriggerData';

export const buildMatMenu = (
  mode: cd.TemplateBuildMode,
  props: cd.IButtonProperties,
  menuRef: string,
  menuBinding: string
): string => {
  const menuTemplateRef = `#${menuRef}="matMenu"`;
  if (mode === cd.TemplateBuildMode.Internal) {
    return new TemplateFactory(mode, MAT_MENU)
      .addDirective(menuTemplateRef)
      .addChild(
        new TemplateFactory(mode, consts.NG_TEMPLATE)
          .addDirective(MAT_MENU_CONTENT)
          .addDirective('let-data')
          .addChild(
            new TemplateFactory(mode, BUTTON_TAG)
              .addDirective(MAT_MENU_ITEM)
              .addDirective('*ngFor="let item of data"')
              .addBoundAttribute(consts.DISABLED_ATTR, 'item.disabled')
              .addOutputEvent('click', 'item.value', menuBinding)
              .addChild(getIconElementTemplate('item.icon'))
              .addChild(
                new TemplateFactory(mode, consts.SPAN_TAG).addChild('{{ item.name }}').build()
              )
              .build()
          )
          .build()
      )
      .build();
  }
  // External
  return new TemplateFactory(mode, MAT_MENU)
    .addDirective(menuTemplateRef)
    .addChild(
      props.inputs.menu
        ?.map(({ icon, name }) => {
          const button = new TemplateFactory(mode, BUTTON_TAG).addDirective(MAT_MENU_ITEM);
          if (icon) button.addChild(getIconElementExportTemplate(icon));
          const buttonText = new TemplateFactory(mode, consts.SPAN_TAG).addChild(name).build();
          return button.addChild(buttonText).build();
        })
        .join('')
    )
    .build();
};
