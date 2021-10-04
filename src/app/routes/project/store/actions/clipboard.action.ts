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

import { ConfigAction } from '../../interfaces/action.interface';
import { Action } from '@ngrx/store';
import { IImageFileMetadata } from 'cd-utils/files';

export const CLIPBOARD = '[Clipboard]';
export const CLIPBOARD_CUT = `${CLIPBOARD} cut`;
export const CLIPBOARD_COPY = `${CLIPBOARD} copy`;
export const CLIPBOARD_COPY_HTML = `${CLIPBOARD} copy html`;
export const CLIPBOARD_COPY_HTML_CSS = `${CLIPBOARD} copy html + css`;
export const CLIPBOARD_COPY_CSS = `${CLIPBOARD} copy css`;
export const CLIPBOARD_COPY_JSON = `${CLIPBOARD} copy json`;
export const CLIPBOARD_PASTE = `${CLIPBOARD} paste`;
export const CLIPBOARD_PASTE_IMAGE = `${CLIPBOARD} paste image`;

export class ClipboardCut extends ConfigAction {
  readonly type = CLIPBOARD_CUT;
}

export class ClipboardCopy extends ConfigAction {
  readonly type = CLIPBOARD_COPY;
}

export class ClipboardCopyHtml extends ConfigAction {
  readonly type = CLIPBOARD_COPY_HTML;
}

export class ClipboardCopyCss extends ConfigAction {
  readonly type = CLIPBOARD_COPY_CSS;
}

export class ClipboardCopyJSON extends ConfigAction {
  readonly type = CLIPBOARD_COPY_JSON;
}

export class ClipboardPaste extends ConfigAction {
  readonly type = CLIPBOARD_PASTE;
}

export class ClipboardPasteImage implements Action {
  readonly type = CLIPBOARD_PASTE_IMAGE;
  constructor(public assetId: string, public metadata: IImageFileMetadata) {}
}

export type ClipboardAction =
  | ClipboardCut
  | ClipboardCopy
  | ClipboardCopyHtml
  | ClipboardCopyCss
  | ClipboardCopyJSON
  | ClipboardPaste;
