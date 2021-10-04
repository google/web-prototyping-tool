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

import { executeCommand } from 'cd-utils/content-editable';
import {
  queryState,
  isSelectionInsideElement,
  getSelectedNode,
  buildChipTag,
} from './rich-text-editor.utils';
import { TextFormat, ANCHOR_TAG } from './rich-text.consts';
import { ExecCommand } from 'cd-common/consts';
import { generateLinkTag } from 'cd-common/utils';

export class ExecState {
  private _state?: string;
  constructor(private _stateList: string[]) {}

  get state() {
    return this._state;
  }

  check() {
    for (const state of this._stateList) {
      if (queryState(state)) {
        this._state = state;
        return;
      }
    }
    this.clear();
  }

  toggle(value?: string) {
    const state = value || this._stateList[0];
    executeCommand(state);
    this.check();
  }

  clear() {
    this._state = undefined;
  }
}

export class RichTextModel {
  hyperlink = false;
  readonly bold = new ExecState([TextFormat.Bold]);
  readonly italic = new ExecState([TextFormat.Italic]);
  readonly underline = new ExecState([TextFormat.Underline]);
  readonly unorderedList = new ExecState([TextFormat.UnorderedList]);
  readonly textAlignment = new ExecState([
    TextFormat.JustifyLeft,
    TextFormat.JustifyCenter,
    TextFormat.JustifyRight,
    TextFormat.JustifyFull,
  ]);

  reset() {
    this.hyperlink = false;
    this.bold.clear();
    this.italic.clear();
    this.underline.clear();
    this.unorderedList.clear();
    this.textAlignment.clear();
  }

  computeHyperlink(nativeElement: HTMLElement) {
    const elem = getSelectedNode() as HTMLLinkElement;
    const isElemInsideSelection = isSelectionInsideElement(nativeElement);
    this.hyperlink = isElemInsideSelection && elem.tagName === ANCHOR_TAG;
  }

  compute() {
    this.bold.check();
    this.italic.check();
    this.underline.check();
    this.unorderedList.check();
    this.textAlignment.check();
  }

  get underlineState() {
    return !this.hyperlink && this.underline.state;
  }

  createChip(source: string | undefined, lookup: string | undefined) {
    const chip = buildChipTag(source, lookup);
    executeCommand(ExecCommand.InsertHTML, chip);
  }

  createLink(url: string, openInTab: boolean | undefined, text: string, changed: boolean) {
    // When a user modifies the text, we need to replace the current selection with a new anchor tag
    if (changed) {
      executeCommand(ExecCommand.InsertHTML, generateLinkTag(text, url, openInTab));
    } else {
      executeCommand(ExecCommand.CreateLink, url);
    }
  }

  insertText(text: string) {
    executeCommand(ExecCommand.InsertText, text);
  }

  unlink(text?: string) {
    executeCommand(ExecCommand.Unlink);
    if (text) executeCommand(ExecCommand.InsertText, text);
  }
}
