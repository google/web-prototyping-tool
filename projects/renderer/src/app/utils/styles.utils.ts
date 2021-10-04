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

import { OUTLET_ROOT_STYLES } from '../../styles/styles.consts';

export const addRootStylesToDocument = (doc: HTMLDocument) => {
  const { CSSStyleSheet } = doc.defaultView as any;

  const boardStyles = new CSSStyleSheet();
  boardStyles.replaceSync(OUTLET_ROOT_STYLES);

  const anyDoc = doc as any;
  anyDoc.adoptedStyleSheets = [...anyDoc.adoptedStyleSheets, boardStyles];
};

export const removeRootStylesFromDocument = (doc: HTMLDocument) => {
  const anyDoc = doc as any;
  anyDoc.adoptedStyleSheets = [];
};
