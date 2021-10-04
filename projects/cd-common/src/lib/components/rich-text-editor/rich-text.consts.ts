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

export interface ITextFormatOption {
  iconName: string;
  format: TextFormat | TextAlign;
}

export const ANCHOR_TAG = 'A';

export enum TextFormat {
  JustifyLeft = 'justifyLeft',
  JustifyCenter = 'justifyCenter',
  JustifyRight = 'justifyRight',
  JustifyFull = 'justifyFull',
  Bold = 'bold',
  Italic = 'italic',
  Underline = 'underline',
  UnorderedList = 'insertUnorderedList',
  OrderedList = 'insertOrderedList',
  Indent = 'indent',
  Outdent = 'outdent',
}

export enum TextMode {
  Default = 'default',
  RichText = 'rich',
}

export enum ContentType {
  Text = 'text/plain',
  Html = 'text/html',
}

export enum TextAlign {
  Left = 'left',
  Center = 'center',
  Right = 'right',
  Justify = 'justify',
}

export const DEFAULT_RICH_TEXT_MODEL = {
  textAlign: null,
  overflow: { x: cd.Overflow.Auto, y: cd.Overflow.Auto },
  textOverflow: null,
  whiteSpace: null,
};

export const DEFAULT_PLAIN_TEXT_MODEL = {
  textAlign: null,
  whiteSpace: cd.WhiteSpace.NoWrap,
  textOverflow: cd.TextOverflow.Ellipsis,
  overflow: { x: cd.Overflow.Hidden, y: cd.Overflow.Auto },
};
