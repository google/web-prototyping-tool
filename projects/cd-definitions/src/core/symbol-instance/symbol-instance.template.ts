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

export default function (mode: cd.TemplateBuildMode, props: cd.ISymbolInstanceProperties): string {
  // Export
  if (mode !== cd.TemplateBuildMode.Internal) {
    // factory now has access to the entire properties map
    // const mergedProperties = getMergedInstanceProps(instance, elementProperties);
    return utils.generateTemplateContent([props.inputs.referenceId as string]);
  }
  const referenceIdLookup = utils.inputPropsBinding(consts.REFERENCE_ID);
  const isValidInstance = utils.circularOutletGuard(referenceIdLookup);
  // Internal
  return (
    new utils.TemplateFactory(cd.TemplateBuildMode.Internal, consts.CD_OUTLET_TAGNAME)
      .add_ngIf_Attribute(isValidInstance)
      .addPropsBoundInputAttribute(consts.OUTLET_CMP_INPUT_RENDER_ID, consts.REFERENCE_ID)
      .addAttribute(consts.OUTLET_CMP_INPUT_TYPE, cd.OutletType.SymbolInstance)
      .addBoundAttribute(consts.OUTLET_CMP_INPUT_INSTANCE_PROPS, utils.PROPS)
      .addBoundAttribute(consts.OUTLET_CMP_INPUT_INSTANCE_ID, utils.ELEMENT_ID)
      .addElementClassPrefixBinding()
      .addBoundAttribute(consts.OUTLET_CMP_INPUT_PROPERTIES_MAP)
      .addBoundAttribute(consts.OUTLET_CMP_INPUT_STYLES_MAP)
      .addBoundAttribute(consts.OUTLET_CMP_INPUT_ASSETS)
      .addBoundAttribute(consts.OUTLET_CMP_INPUT_DESIGN_SYSTEM)
      .addBoundAttribute(consts.OUTLET_CMP_ANCESTORS_ATTR)
      .addBoundAttribute(consts.OUTLET_CMP_INPUT_DATASETS)
      .addBoundAttribute(consts.OUTLET_CMP_INPUT_LOADED_DATA)
      // this binding will add the render rect marker to the inner root element of the symbol instance
      // if (and only if) the symbol instance is a direct child of the outlet root.
      .addBoundAttribute(consts.OUTLET_CMP_INPUT_ADD_MARKER, consts.OUTLET_CMP_INPUT_IS_ROOT)
      .addPropsBoundAttribute(consts.CD_ATTRS_DIRECTIVE, consts.ATTRS)
      .addPropsBoundAttribute(consts.CD_A11Y_ATTRS_DIRECTIVE, consts.A11Y_INPUTS)
      .addPropsBoundInputAttribute(
        consts.CD_HIDDEN_DIRECTIVE,
        consts.HIDDEN_ATTR,
        true,
        cd.CoerceValue.Boolean
      )
      .build()
  );
}
