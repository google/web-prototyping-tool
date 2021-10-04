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

import { Pipe, PipeTransform } from '@angular/core';
import * as cd from 'cd-interfaces';
import { ZERO_WIDTH_SPACE_REGEX } from './taggable-text-field/taggable-text-field.utils';

@Pipe({ name: 'filterResolved' })
export class FilterResolvedPipe implements PipeTransform {
  transform(
    thread: ReadonlyArray<cd.ICommentThread>,
    showResolved: boolean
  ): ReadonlyArray<cd.ICommentThread> {
    return showResolved ? thread : thread.filter((item) => item.resolved === false);
  }
}

const unescapeHtml = (escapedHtml: string): string => {
  return escapedHtml
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'");
};

@Pipe({ name: 'textFieldUserContentPipe' })
export class TextFieldUserContentPipe implements PipeTransform {
  transform(content: cd.ITaggableTextFieldNode['content']): cd.IUser {
    return content as cd.IUser;
  }
}

@Pipe({ name: 'textFieldLinkContentPipe' })
export class TextFieldLinkContentPipe implements PipeTransform {
  transform(content: cd.ITaggableTextFieldNode['content']): string {
    const stringContent = content as string;
    return stringContent.replace(ZERO_WIDTH_SPACE_REGEX, '');
  }
}

@Pipe({ name: 'unescapeHtmlPipe' })
export class UnescapeHtmlPipe implements PipeTransform {
  transform(content: cd.ITaggableTextFieldNode['content']): string {
    return unescapeHtml(content as string);
  }
}
