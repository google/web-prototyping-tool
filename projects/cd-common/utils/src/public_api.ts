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

export * from './properties.utils';

export { usingHiDPIAsset, getAssetUrl } from './assets.utils';

export {
  isDisplayGrid,
  isDisplayInline,
  isPositionFixedOrAbsolute,
  extractPositionFromStyle,
  displayValueWithoutInlinePrefix,
} from './css.model.utils';

export { styleFromWeight, applyDefaultUnits } from './css.transform.utils';

export * from './event.utils';

export {
  styleForKey,
  transformPropsToStyle,
  cssToString,
  generateComputedCSS,
  createProjectBindings,
  getPositionPropsFromStyles,
  lookupDesignSystemValue,
} from './css.utils';

export {
  toCssVarName,
  generateCSSVars,
  createOrReplaceCSSVars,
  cssVarStringFromValue,
  generateIconFontFamilyCSSVar,
} from './css.vars.utils';

export { isToday, convertTimestampToNumber, getTodayAsISOString } from './date.utils';
export * from './actions.utils';
export { frameForElement, closestChildIndexForEvent } from './element.utils';
export { loadFont, loadFontPreview, loadFontFamilies, fontURLFromDesignSystem } from './font.utils';
export { getAvatarUrl } from './google-image.utils';
export { constructElement, keyValueAttrsToString } from './html.utils';
export {
  isIValue,
  valueFromIValue,
  iValueFromAny,
  convertKeyValuesToMap,
  validCSSForKeyValue,
  validAttrForKeyValue,
} from './ivalue.utils';
export {
  generateKeywords,
  updateProjectKeywordsIfPartialContainsTitle,
  generateKeywordsForPublishEntry,
} from './keywords';

export {
  generateFrame,
  generateLockingFrame,
  removePtFromOutletFrame,
  trimRect,
  rectsIntersect,
} from './rect.utils';
export {
  menuFromDesignSystemAttributes,
  menuFromProjectAssets,
  menuFromEnum,
  menuFromProjectDatasets,
} from './menu.utils';
export {
  deepMerge,
  mergeInstanceOverrides,
  mergeUpdatesIntoElementProperties,
} from './merge.utils';

export { handleURLNavigationMessage } from './messaging.utils';

export {
  StyleManager,
  generateStyle,
  makeSelector,
  buildCSS,
  buildRule,
  classNameFromProps,
} from './stylesheet.utils';

export { parseUnits, getIValueSizeFromString, generateIValue } from './units.utils';

export { createScreenshotTaskDocumentId, createScreenshotTask } from './screenshot.utils';

export { sortElementsByName, sortElementIdsByName } from './sort.utils';

export * from './a11y.utils';

export {
  addCustomElementDefineOverrideToJsBlob,
  getCodeComponentScopedTagName,
  createCodeComponent,
  mergeInputUpdatesIntoCodeComponentInstance,
  getInstancesOfCodeComponent,
  validateTagname,
  validateInputOutputName,
  validateCssVarName,
  checkIfDuplicateInputOutputName,
  DEFAULT_CODE_COMPONENT_FRAME,
} from './code-component.utils';

export {
  CUSTOM_ELEMENTS_DEFINE_OVERRIDE,
  CODE_COMPONENTS_ERROR_OVERRIDE,
} from './code-component-bundle-wrapper';

export { prettyPrintFileSize } from './file.utils';

export * from './dataset.utils';

export {
  getElementBaseStyles,
  assignBaseStyles,
  baseStylesPartial,
  buildBaseStylePropsUpdate,
  hasPixelWidth,
  hasPercentageWidth,
  createPixelIValue,
} from './style.utils';

export { generateLinkTag } from './url.utils';

export { isIcon, isMaterialIcon, convertIconConfigToLookup } from './icon.utils';

export { findNewSelectedIndexForListControls } from './list.utils';

export * from './change.utils';

export * from './dot-notation.utils';
