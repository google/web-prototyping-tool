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

import * as html from './html.consts';
import { CDK_OVERLAY_PANE } from './material.consts';

export const CD_OUTLET_TAGNAME = 'cd-outlet';
export const CD_OUTLET_MODAL_TAGNAME = 'cd-outlet-modal';
export const CD_OUTLET_DRAWER_TAGNAME = 'cd-outlet-drawer';
export const CD_OUTLET_OVERLAY_TAGNAME = 'cd-outlet-overlay';
export const CD_MODAL_CONTENT_SELECTOR = `${CD_OUTLET_MODAL_TAGNAME} .modal-content`;
export const CD_DRAWER_CONTENT_SELECTOR = `${CD_OUTLET_DRAWER_TAGNAME} .content`;

// @Input properties for OutletComponentDirective
export const OUTLET_CMP_INPUT_IS_ROOT = 'outletRoot';
export const OUTLET_CMP_INPUT_ADD_MARKER = 'addMarkerToInnerRoot';
export const OUTLET_CMP_INPUT_TYPE = 'outletType';
export const OUTLET_CMP_INPUT_RENDER_ID = 'renderId';
export const OUTLET_CMP_INPUT_ASSETS = 'assets';
export const OUTLET_CMP_INPUT_DESIGN_SYSTEM = 'designSystem';
export const OUTLET_CMP_INPUT_INSTANCE_ID = 'instanceId';
export const OUTLET_CMP_INPUT_INSTANCE_PROPS = 'instanceProps';
export const OUTLET_CMP_INPUT_PROPERTIES_MAP = 'propertiesMap';
export const OUTLET_CMP_INPUT_STYLES_MAP = 'styleMap';
export const OUTLET_CMP_INPUT_ELEMENT_CLASS_PREFIX = 'elementClassPrefix';
export const OUTLET_CMP_INPUT_DATASETS = 'datasets';
export const OUTLET_CMP_INPUT_LOADED_DATA = 'loadedData';
export const OUTLET_CMP_INPUT_ANCESTORS = 'ancestors';

export const OUTLET_CMP_GETTER_IMAGE_FALLBACK_URL = 'imageFallbackUrl';
export const OUTLET_CMP_ANCESTORS_ATTR = 'ancestors';
export const CIRCULAR_GAURD_PIPE = 'circularGuardPipe';
export const FULL_ID_PATH_PIPE = 'fullIdPathPipe';
export const CLOUD_ICON_PIPE = 'isCloudIconPipe';

export const NG_SWITCH = 'ngSwitch';
export const NG_CONTAINER = 'ng-container';
export const NG_TEMPLATE = 'ng-template';
export const NG_TEMPLATE_OUTLET = 'ngTemplateOutlet';
export const NG_TEMPLATE_OUTLET_CONTEXT = 'ngTemplateOutletContext';

export const CD_STYLE_DIRECTIVE = 'cdStyle';
export const CD_STYLE_CLASS_PREFIX_ATTR = 'classPrefix';
export const CD_HIDDEN_DIRECTIVE = 'cdHidden';
export const CD_CO_TOOLTIP = 'cdCoTooltip';
export const CD_CO_TOOLTIP_POSITION = 'cdCoTooltipPosition';
export const CD_TEXT_INJECT_DIRECTIVE = 'cdTextInject';
export const CD_ATTRS_DIRECTIVE = 'cdAttrs';
export const CD_A11Y_ATTRS_DIRECTIVE = 'cdA11yAttrs';

export const RENDER_RECT_MARKER_CLASS = 'cd-render-rect-marker';
export const RENDERED_ELEMENT_CLASS = 'cd-rendered-element';
export const FIT_CONTENT_CLASS = 'cd-fit-content';

export const OUTLET_ROOT_CLASS = 'outlet-root';
export const INNER_ROOT_CLASS = 'inner-root';
export const TEMPLATE_PREVIEW_STYLES_CLASS = 'cd-preview-styles';
export const PORTAL_WRAPPER_CLASS = 'cd-portal-wrapper';

export const TEMPLATE_ID_ATTR = 'data-id';
export const TEMPLATE_FULL_ID_PATH_ATTR = 'data-full-id-path';
export const TEMPLATE_INSTANCE_ATTR = 'data-instance';
export const OVERLAY_INSTANCE_INDEX = 'data-overlay-idx';
export const DATASET_ID_PROP = 'id';

export const CLASS_ATTR = 'class';
export const STYLE_ATTR = 'style';
export const COLOR_ATTR = 'color';
export const MODE_ATTR = 'mode';
export const VALUE_ATTR = 'value';
export const TYPE_ATTR = 'type';
export const OPTIONS_ATTR = 'options';
export const HIDDEN_ATTR = 'hidden';
export const CHECKED_ATTR = 'checked';
export const INDETERMINATE_ATTR = 'indeterminate';
export const CHANGE_OUTPUT_BINDING = 'change';
export const BLUR_OUTPUT_BINDING = 'blur';
export const FOCUS_OUTPUT_BINDING = 'focus';
export const CURRENT_TARGET_BINDING = 'currentTarget';
export const INPUT_BINDING = 'input';
export const LABEL_POSITION_ATTR = 'labelPosition';
export const DISABLED_ATTR = 'disabled';
export const REQUIRED_ATTR = 'required';
export const SELECTED_ATTR = 'selected';
export const SELECTED_INDEX_ATTR = 'selectedIndex';
export const SRC_ATTR = 'src';
export const URL_SAFE_PIPE = 'safeURL';
export const RESOURCE_URL_SAFE_PIPE = 'safeResourceURL';
export const DETAIL_PROP = 'detail';
export const VARIANT_ATTR = 'variant';
export const PREVIEW_MODE_ATTR = 'previewMode';
export const CONVERT_VALUE_CHIPS_PIPE = 'commaStringToArrayPipe';

export const ICON_ATTR = 'icon';
export const RICH_TEXT_ATTR = 'richText';
export const LABEL_ATTR = 'label';
export const STATE_ATTR = 'state';
export const HINT_ATTR = 'hint';
export const PLACEHOLDER_ATTR = 'placeholder';
export const NAME_ATTR = 'name';
export const FOR_ATTR = 'for';
export const HREF_ATTR = 'href';
export const REL_ATTR = 'rel';
export const TARGET_ATTR = 'target';
export const CONTROLS_ATTR = 'controls';
export const TABINDEX_ATTR = 'tabindex';
export const EDIT_CONTENT_ATTR = 'contenteditable';
export const META_CONTENT_ATTR = 'content';

export const TOOLTIP_LABEL_ATTR = 'tooltipLabel';
export const ICON_TOOLTIP_LABEL_ATTR = 'iconTooltipLabel';
export const TOOLTIP_POSITION_ATTR = 'tooltipPosition';
export const MAT_RIPPLE_ATTR = 'matRipple';
export const MAT_RIPPLE_CENTERED_ATTR = 'matRippleCentered';

export const PREVENT_CLICK_ACTIONS_ATTR = 'cdPreventClickActions';

export const SHOW_PREVIEW_STYLES = 'showPreviewStyles';
export const INNER_HTML = 'innerHTML';
export const INNER_TEXT = 'innerText';
export const ATTRS = 'attrs';
export const A11Y_INPUTS = 'a11yInputs';
export const REFERENCE_ID = 'referenceId';
export const SLOT = 'slot';
export const DATA = 'data';

export const TEMPLATE_ELEMENT_SELECTOR = `.${RENDER_RECT_MARKER_CLASS}`;
export const PREVIEW_MODE_ELEMENT_SELECTOR = `[${TEMPLATE_FULL_ID_PATH_ATTR}]`;
/**
 * Used as a sentinel value to indicate that an output the emits void or None.
 * This is used in action.utils.ts to determine whether or not to filter out the output.
 * For outputs that have OutputPropertyType.None, this is stored as a fixed value for the output.
 */
export const OUTPUT_NONE_VALUE = '__CD_OUTPUT_NONE';
/**
 * Elements that do not have a closing tag
 * https://www.w3.org/TR/html5/syntax.html#void-elements
 */
export const VOID_ELEMENTS = [
  'area',
  'base',
  'br',
  'col',
  'command',
  'embed',
  'hr',
  'img',
  'input',
  'keygen',
  'link',
  'meta',
  'param',
  'source',
  'track',
  'wbr',
];

export const RADIO_INPUT_CHECKED = `${html.RADIO_INPUT}:${CHECKED_ATTR}`;

export enum ColorSchemeType {
  Light = 'light',
  Dark = 'dark',
}
export const COLOR_SCHEME_META_VAL = 'color-scheme';

/* Focusable selectors that can be disabled via disabled attr */
export const DISABLEABLE_FOCUS_TAGS = [
  html.BUTTON_TAG,
  html.INPUT_TAG,
  html.SELECT_TAG,
  html.TEXT_AREA_TAG,
  html.OBJECT_TAG,
];

/* Valid HTML selectors that are focusable by default */
export const CORE_FOCUS_SELECTORS = [
  ...DISABLEABLE_FOCUS_TAGS,
  `${html.ANCHOR_TAG}[${HREF_ATTR}]`, // a[href] - valid link
  `${html.MAP_TAG}[${NAME_ATTR}] ${html.AREA_TAG}[${HREF_ATTR}]`, // 'map[name] area[href]' - valid owned map area
  `${html.AUDIO_TAG}[${CONTROLS_ATTR}]`, // 'audio[controls]'  -has controls
  `${html.VIDEO_TAG}[${CONTROLS_ATTR}]`, // 'video[controls]' - has controls
  `${html.IFRAME_TAG}[${SRC_ATTR}]`, // iframe[src] - valid iframe
  `[${TABINDEX_ATTR}]`,
  `[${EDIT_CONTENT_ATTR}]`,
];

export const NOT_SELECTOR = ':not';
export const EMPTY_SELECTOR = ':empty';
export const SCOPE_SELECTOR = ':scope';
export const FIRST_TYPE_SELECTOR = ':first-of-type';
export const SHADOW_ROOT_CLASS = 'has-shadow-root';
export const SHADOW_ROOT_SELECTOR = `.${SHADOW_ROOT_CLASS}`;
export const SHADOW_CHILD_SELECTOR = `${SHADOW_ROOT_SELECTOR} *`;

export const OVERLAY_SELECTORS = [
  CDK_OVERLAY_PANE,
  CD_MODAL_CONTENT_SELECTOR,
  CD_DRAWER_CONTENT_SELECTOR,
];
