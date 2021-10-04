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
import * as utils from 'cd-common/models';

/**
 * The template defined here is the starting point for the OutletComponentDirective.
 * Therefore, the bindings setup here will need to work for Boards, Symbols,
 * Portals, and Symbol Instances.
 */
export default function (
  mode: cd.TemplateBuildMode,
  props: cd.IBoardProperties,
  content?: string
): string {
  // Export only
  if (mode !== cd.TemplateBuildMode.Internal) {
    return new utils.TemplateFactory(mode, consts.DIV_TAG, props).addChild(content).build();
  }

  // If this is the inner-root of a symbol instance or portal instance, use their ids
  // Otherwise use the board/symbol id
  const innerRootDataId = `(${consts.OUTLET_CMP_INPUT_INSTANCE_ID} || ${utils.ELEMENT_ID})`;

  return (
    new utils.TemplateFactory(mode, consts.DIV_TAG, props)
      .addDefaultAttributes(false, consts.OUTLET_CMP_INPUT_ADD_MARKER)
      .addDataIdAttribute(innerRootDataId)
      .addFullIdPathAttribute(innerRootDataId)
      // Ensure that the cdStyle updates when boardId changes
      .addStyleDirectiveId(innerRootDataId)
      .allowChildren()
      .addCSSClass(consts.INNER_ROOT_CLASS)
      // if this OutletComponentDirective is being used as a portal or symbol instance
      // bind attr.data-instance to instanceId input, so that the instance id can be retrieved
      // from interaction events.
      .addAttrBoundAttribute(consts.TEMPLATE_INSTANCE_ATTR, consts.OUTLET_CMP_INPUT_INSTANCE_ID)
      .build()
  );
}
