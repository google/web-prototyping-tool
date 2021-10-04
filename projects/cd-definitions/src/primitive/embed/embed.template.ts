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

import * as utils from 'cd-common/models';
import * as consts from 'cd-common/consts';
import * as cd from 'cd-interfaces';

// TODO: Remove once BindingType.URL is implemented ?

export default function (mode: cd.TemplateBuildMode, props: cd.IIFrameProperties): string {
  return new utils.TemplateFactory(mode, consts.IFRAME_TAG, props)
    .ifInternal((me) =>
      me
        .addDefaultAttributes()
        .addSafePropsBoundResourceAttribute(consts.SRC_ATTR)
        .addAttribute(consts.ALLOW_ATTR, consts.getIframeFeaturePolicy())
    )
    .ifExport((me) =>
      me
        .addAttribute(consts.SRC_ATTR, props.inputs.src)
        .addAttribute(consts.ALLOW_ATTR, consts.getIframeFeaturePolicy())
    )
    .build();
}
