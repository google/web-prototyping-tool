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
import * as utils from 'cd-common/models';
import * as consts from 'cd-common/consts';

export default function (mode: cd.TemplateBuildMode, props: cd.IBoardPortalProperties) {
  // Export
  if (mode !== cd.TemplateBuildMode.Internal) {
    return utils.generateTemplateContent([props.inputs.referenceId as string]);
  }

  // Internal
  const referenceIdLookup = utils.inputPropsBinding(consts.REFERENCE_ID);
  const portalFactory = utils
    .generatePortal(false, referenceIdLookup)
    .addDefaultAttributes()
    .addFitContentClass();
  const portalZeroState = utils.generatePortalZeroState(referenceIdLookup);
  const isValidPortal = utils.circularOutletGuard(referenceIdLookup);
  portalFactory.add_ngIf_else_Attribute(isValidPortal, utils.PORTAL_ERROR_TEMPLATE_REF);

  return [portalFactory.build(), portalZeroState].join('');
}
