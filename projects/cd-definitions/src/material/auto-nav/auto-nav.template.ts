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

import { TemplateFactory } from 'cd-common/models';
import * as consts from 'cd-common/consts';
import * as cd from 'cd-interfaces';

// Main model bindings
export const NAV_ITEMS_BINDING = 'items';
export const NAV_SMALL_ICONS = 'smallIcons';
export const AUTO_NAV_TAG_NAME = 'cdr-auto-nav';
export const NAV_ITEM_SELECT_EVENT = '(selectNavItem)';
export const NAV_ITEM_SELECT = 'onAutoNavItemClick($event, props?.inputs)';
const NAV_INDEX_CHANGE_EVENT = 'selectedIndexChange';

export default function (mode: cd.TemplateBuildMode, props: cd.IAutoNavProperties): string {
  return new TemplateFactory(mode, AUTO_NAV_TAG_NAME, props)
    .addDefaultAttributes()
    .addFitContentClass()
    .addPropsBoundInputAttribute(NAV_ITEMS_BINDING)
    .addPropsBoundInputAttribute(NAV_SMALL_ICONS)
    .addPropsBoundInputAttribute(consts.TARGET_ATTR)
    .addPropsBoundInputAttribute(consts.SELECTED_INDEX_ATTR)
    .addOutputBinding(NAV_INDEX_CHANGE_EVENT, consts.SELECTED_INDEX_ATTR)
    .addAttribute(NAV_ITEM_SELECT_EVENT, NAV_ITEM_SELECT)
    .build();
}
