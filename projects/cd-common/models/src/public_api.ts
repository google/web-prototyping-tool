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

import { CdComponent } from './component';
import { CdComponentFactory, BASE_ELEMENT_INPUTS } from './component-factory';

export * from './properties.styles.utils';
export * from './properties.utils';
export {
  duplicateModelsAndChildren,
  removeMismatchedRecordedInputs,
  duplicateComponentInstanceGroup,
  migrateRecordedActions,
  duplicateBoardGroup,
  migrateActions,
} from './duplicate.utils';
export { DEFAULT_BOARD_STYLES, ADVANCED_CONFIG, HIDDEN_CONFIG } from './properties.consts';
export { RenderSwitchModule } from './render-switch-directive/render-switch.module';
export {
  CHILD_PORTALS_INPUT,
  PORTAL_ERROR_TEMPLATE_REF,
  generatePortal,
  generatePortalZeroState,
  buildChildPortal,
} from './portal.utils';

export { CdComponent, CdComponentFactory, BASE_ELEMENT_INPUTS };

export {
  componentQueryCache,
  getComponents,
  clearRegistry,
  iconForComponent,
  registerComponent,
  unRegisterCodeComponent,
  registerCodeComponent,
  getComponent,
  register,
  generateTemplateContent,
  componentsWithPortalSlots,
} from './registry';

export {
  ELEMENT_ID,
  PROPS,
  INDEX_VAR,
  INPUTS,
  circularOutletGuard,
  wrapInParenthesis,
  wrapInCurlyBraces,
  wrapInSingleQuotes,
  wrapInBrackets,
  getAttributeDataIdFromElement,
  buildNgFor,
  generateCallback,
  isVoidTag,
  mergeKeyValue,
  convertAttrsToString,
  generateClosingTag,
  lookupPropAtPath,
  inputProp,
  propsBinding,
  inputPropsBindingWithPipe,
  TemplateFactory,
  inputPropsBinding,
} from './template.utils';

export {
  assembleAllTemplates,
  assembleTemplatesForExport,
  assembleTemplatesWithCSSForExport,
} from './template.manager';
export * from './instance.utils';
export {
  DROP_GUTTER_WIDTH,
  LAYERS_NODE_DROP_GUTTER_WIDTH,
  insertElements,
} from './properties.insert.utils';
