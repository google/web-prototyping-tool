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

export const RENDERER_IFRAME_NAME = 'cdRendererIframe';
export const ALLOW_ATTR = 'allow';
export const SANDBOX_ATTR = 'sandbox';
export const ANIMATIONS_ENABLED_QUERY_PARAM = 'animationsEnabled';
export const ALLOW_TRANSPARENCY = 'allowtransparency';
export const CODE_COMPONENT_OUTLET_QUERY_PARAM = 'codeComponentPreviewOutlet';
export const IMAGE_FALLBACK_URL = '/assets/image-placeholder.svg';
export const IMAGE_FALLBACK_URL_EXPORT_MODE = '../image-placeholder.svg';
export const MARK_FOR_DELETE_GLOBAL = '_markForDelete';
// https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe#attr-sandbox
const RENDERER_SANDBOX_EDITOR = ['allow-scripts', 'allow-same-origin'];

const RENDERER_SANDBOX_PREVIEW = [
  ...RENDERER_SANDBOX_EDITOR,
  'allow-top-navigation-by-user-activation',
  'allow-modals',
  'allow-presentation',
  'allow-popups',
  'allow-forms',
];

// https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Feature-Policy
const IFRAME_ALLOWED_FEATURE_POLICY = [
  'autoplay',
  'accelerometer',
  'camera',
  'fullscreen',
  'geolocation',
  'gyroscope',
  'magnetometer',
  'microphone',
  'midi',
  'usb',
];

export const getIframeFeaturePolicy = () => {
  return IFRAME_ALLOWED_FEATURE_POLICY.join(';');
};

export const getIframeSandbox = (preview?: boolean): string => {
  const value = preview ? RENDERER_SANDBOX_PREVIEW : RENDERER_SANDBOX_EDITOR;
  return value.join(' ');
};
