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
import { TemplateFactory, inputPropsBinding } from 'cd-common/models';

const GENERIC_ELEMENT_CLASS = 'cd-generic-div';
const RIPPLE_INPUT = inputPropsBinding(consts.MAT_RIPPLE_ATTR);

const buildInternal = (withMatRipple: boolean) => {
  const matRippleCondition = withMatRipple ? RIPPLE_INPUT : `!${RIPPLE_INPUT}`;
  const divElement = new TemplateFactory(cd.TemplateBuildMode.Internal, consts.DIV_TAG)
    .add_ngIf_Attribute(matRippleCondition)
    .addDefaultAttributes()
    .addFitContentClass()
    .addCSSClass(GENERIC_ELEMENT_CLASS)
    .allowChildren();

  if (withMatRipple) {
    divElement
      .addDirective(consts.MAT_RIPPLE_ATTR)
      .addPropsBoundInputAttribute(consts.MAT_RIPPLE_CENTERED_ATTR);
  }

  return divElement.build();
};

export default function (
  mode: cd.TemplateBuildMode,
  props: cd.IGenericProperties,
  content?: string
): string {
  if (mode === cd.TemplateBuildMode.Internal) {
    const defaultElement = buildInternal(false);
    const rippleElement = buildInternal(true);
    return new TemplateFactory(mode, consts.NG_CONTAINER)
      .addChild(defaultElement + rippleElement)
      .build();
  }

  return new TemplateFactory(mode, consts.DIV_TAG, props).addChild(content).build();
}
