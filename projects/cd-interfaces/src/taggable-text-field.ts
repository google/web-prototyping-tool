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

import { IUser } from './index';

export enum TextFieldElementType {
  Break = 'break',
  Chip = 'chip',
  Link = 'link',
  Text = 'text',
}

export enum TemplateTag {
  Opening = '[*[',
  Closing = ']*]',
}

// Continue adding to the type alias when you need new types
// for Taggable Text Field
export type ITaggableTextFieldTagItem = IUser;

export interface ITaggableTextFieldNode {
  type: TextFieldElementType;
  content: string | IUser;
}

export interface ITaggableTextFieldHtmlWithData {
  data: Array<ITaggableTextFieldNode>;
  html: string;
}
