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

import { IDesignSystem } from 'cd-interfaces';
import {
  META_CONTENT_ATTR,
  META_TAG,
  NAME_ATTR,
  COLOR_SCHEME_META_VAL,
  ColorSchemeType,
} from 'cd-common/consts';

/* Update color scheme meta on document (<meta name="color-scheme" content="dark || light">) */
export const updateDocumentThemeMeta = (doc: HTMLDocument, designSystem?: IDesignSystem) => {
  const colorScheme = designSystem?.isDarkTheme ? ColorSchemeType.Dark : ColorSchemeType.Light;
  const meta = doc.head.querySelector('meta[name="color-scheme"]') || addThemeMetaToDocument(doc);
  meta.setAttribute(META_CONTENT_ATTR, colorScheme);
};

export const addThemeMetaToDocument = (doc: HTMLDocument): HTMLMetaElement => {
  const meta = doc.createElement(META_TAG);
  meta.setAttribute(NAME_ATTR, COLOR_SCHEME_META_VAL);
  doc.head.appendChild(meta);
  return meta;
};
