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

import {
  AfterViewChecked,
  Component,
  ChangeDetectionStrategy,
  ElementRef,
  EventEmitter,
  Injector,
  Input,
  Output,
  SecurityContext,
  ViewChild,
  HostBinding,
} from '@angular/core';
import { areStringsEqual, stringSplice, stringMatchesRegex } from 'cd-utils/string';
import { CHIP_ELEMENT_NAME } from '../comments.consts';
import { executeCommand } from 'cd-utils/content-editable';
import { TagChipComponent } from '../tag-chip/tag-chip.component';
import { createCustomElement } from '@angular/elements';
import { DomSanitizer } from '@angular/platform-browser';
import * as cd from 'cd-interfaces';
import * as consts from 'cd-common/consts';
import * as keyUtils from 'cd-utils/keycodes';
import * as utils from './taggable-text-field.utils';

const TRIGGER_CHARACTER_PADDING = 1;

@Component({
  selector: 'app-taggable-text-field',
  templateUrl: './taggable-text-field.component.html',
  styleUrls: ['./taggable-text-field.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaggableTextFieldComponent implements AfterViewChecked {
  private _editing = false;
  private _backspaced = false;
  private _emptyTextField = true;
  private _listening = false;
  private _query = '';
  private _queryStartPosition = 0;
  private _textFieldNodes: Array<cd.ITaggableTextFieldNode> = [];
  private _tagWasAdded = false;
  private _newestTag?: cd.PartialUser;

  public copyData?: string;
  public queryResults: Array<string> = [];
  public showPlaceholder = true;

  @Input() placeholder = 'Add text';
  @Input() textFieldData: Array<cd.ITaggableTextFieldNode> = [];
  @Input() taggedItems: cd.IStringMap<cd.ITaggableTextFieldTagItem> = {};
  @Input() textFieldHtml = '';
  @Input() selectionListActive = false;

  @Output() textFieldChange = new EventEmitter<cd.ITaggableTextFieldHtmlWithData>();
  @Output() queryChange = new EventEmitter<string>();
  @Output() keydown = new EventEmitter<KeyboardEvent>();
  @Output() focus = new EventEmitter<FocusEvent>();
  @Output() blur = new EventEmitter<FocusEvent>();

  @ViewChild('taggableTextField', { read: ElementRef, static: true })
  taggableTextField!: ElementRef;

  @HostBinding('class.editing')
  @Input()
  set editing(value: boolean) {
    this._editing = value;
    if (!value) return;
    this._convertLinksToText();
  }
  get editing() {
    return this._editing;
  }

  @Input()
  set emptyTextField(empty: boolean) {
    this._emptyTextField = empty;
    this.showPlaceholder = empty;
    if (empty) this.taggableTextField.nativeElement.blur();
  }
  get emptyTextField(): boolean {
    return this._emptyTextField;
  }

  @Input()
  set newItem(item: cd.PartialUser) {
    this._tagWasAdded = true;
    this._newestTag = item;
    this._addTag(item);
  }

  get taggableTextFieldElem() {
    return this.taggableTextField.nativeElement;
  }

  get taggableChildNodes() {
    return this.taggableTextFieldElem.childNodes;
  }

  get innerHTML() {
    return this.taggableTextField.nativeElement.innerHTML;
  }

  constructor(injector: Injector, private _sanitizer: DomSanitizer) {
    const chipElement = createCustomElement(TagChipComponent, { injector });
    const chipElementConstructor = customElements.get(CHIP_ELEMENT_NAME);

    if (!chipElementConstructor) {
      customElements.define(CHIP_ELEMENT_NAME, chipElement);
    }
  }

  ngAfterViewChecked() {
    if (this._tagWasAdded) {
      this._checkIfRestoreFocus();
      this._tagWasAdded = false;
    }
  }

  onBlur(event: FocusEvent) {
    this.blur.emit(event);
  }

  onFocus(event: FocusEvent) {
    this.focus.emit(event);
  }

  onKeydown(event: KeyboardEvent) {
    this.keydown.emit(event);
    event.stopPropagation();

    const { key, code } = event;

    if (this.selectionListActive && keyUtils.keyCheck(key, keyUtils.KEYS.Enter)) {
      event.preventDefault();
    }

    if (this._listening && utils.isVerticalArrowKey(key)) {
      event.preventDefault();
    }

    if (utils.isTagTriggerKey(key)) {
      this._listening = true;
    }

    if (this.showPlaceholder && utils.keyIsPrintableCharacter(code)) {
      this.showPlaceholder = false;
      this.emptyTextField = false;
    }

    if (this._listening && keyUtils.keyCheck(key, keyUtils.KEYS.Escape)) {
      this._resetQuery();
    }

    this._backspaced = keyUtils.keyCheck(key, keyUtils.KEYS.Backspace);
  }

  onKeyup(event: KeyboardEvent) {
    const { key, code } = event;

    if (!this._listening) {
      const nodes = utils.htmlToNodes(this.innerHTML, this.taggedItems);
      this._emitTextFieldContents(nodes, this.textFieldHtml);
    }

    if (
      this._listening &&
      (utils.keyIsLetter(code) ||
        keyUtils.keyCheck(key, keyUtils.KEYS.Space, keyUtils.KEYS.Backspace))
    ) {
      this._updateQuery();
    }

    this.showPlaceholder = this.innerHTML.length === 0;
  }

  onPaste(event: ClipboardEvent) {
    event.preventDefault();

    const { clipboardData } = event;
    const plainText = clipboardData && clipboardData.getData('text/plain');
    const htmlText = clipboardData && clipboardData.getData('text/html');
    const isEqual = plainText && areStringsEqual(plainText, this.copyData || '');

    if (this._listening && plainText) {
      executeCommand(consts.ExecCommand.InsertText, plainText);
      this._updateQuery();
    }

    if (!this._listening && isEqual) {
      const html = this._sanitizer.sanitize(SecurityContext.HTML, htmlText);
      if (html) {
        executeCommand(consts.ExecCommand.InsertHTML, html);
        return;
      }
    }

    if (plainText) {
      executeCommand(consts.ExecCommand.InsertText, plainText);
    }
  }

  private _convertLinksToText() {
    const html = utils.stripLinkTags(this.textFieldHtml);
    const nodes = utils.convertLinkNodesToTextNodes(this.textFieldData);
    this._emitTextFieldContents(nodes, html);

    // Tried change detection markForCheck and detectChanges, and neither worked. SetTimeout
    // was required here to get the cursor to the end of the input after converting the nodes
    // to text nodes
    window.setTimeout(() => {
      this.taggableTextField.nativeElement.focus();
      utils.setCaretPositionAtEndOfElement(this.taggableTextFieldElem, true);
    });
  }

  private _addTag(tagItem: cd.PartialUser) {
    const email = tagItem?.email;
    if (!tagItem || !email) return;
    const { taggedItems } = this;
    taggedItems[email] = tagItem as cd.IUser;
    const { innerHTML } = this.taggableTextFieldElem;
    const idx = this._queryStartPosition - TRIGGER_CHARACTER_PADDING;
    const count = this._query.length + TRIGGER_CHARACTER_PADDING;
    const add = `${cd.TemplateTag.Opening}${tagItem.email}${cd.TemplateTag.Closing}`;
    const textFieldTemplate = stringSplice(innerHTML, idx, count, add);
    const textFieldHtml = utils.templateStringToHtml(textFieldTemplate, taggedItems);
    const textFieldNodes = utils.htmlToNodes(textFieldHtml, taggedItems);
    this._emitTextFieldContents(textFieldNodes, textFieldHtml);
    this._resetQuery();
  }

  private _removeTag(tagElement: HTMLElement) {
    tagElement.outerHTML = consts.ZERO_WIDTH_SPACE;
    this._textFieldNodes = utils.htmlToNodes(this.textFieldHtml, this.taggedItems);
  }

  /** Triggers on any mutation to the taggableTextField DIV element */
  onMutation = (mutations: Array<MutationRecord>) => {
    if (!this._backspaced) return;

    for (const mutation of mutations) {
      // if this mutation is for a chip element already being deleted, we should ignore
      // so that we don't recursively delete tags
      if (this._checkIfMutationIsDeletingAChip(mutation)) return;

      const prevEl = mutation.previousSibling as HTMLElement | undefined;
      if (prevEl?.localName !== CHIP_ELEMENT_NAME) continue;
      this._handleRemovingChip(prevEl);
    }
  };

  /** Checks removed nodes and assesses if any of them were removing a tagged user chip element */
  private _checkIfMutationIsDeletingAChip(mutation: MutationRecord) {
    const removedNodes = Array.from(mutation.removedNodes);
    return removedNodes.some(utils.nodeIsChipElement);
  }

  /** Handles removing the chip element once the character next to it is removed */
  private _handleRemovingChip(prevEl: HTMLElement) {
    // Hidden character next to Chip element has been deleted, remove the chip itself
    this._removeTag(prevEl);
    this._emitTextFieldContents(this._textFieldNodes, this.textFieldHtml);
    this._backspaced = false;
  }

  private _checkIfRestoreFocus() {
    const { _newestTag, taggableChildNodes } = this;
    if (!_newestTag) return;
    const tagIndex = utils.getTagIndexFromChildNodes(_newestTag, taggableChildNodes);
    utils.setCaretPositionAtEndOfElement(taggableChildNodes[tagIndex]);
  }

  private _emitTextFieldContents(data: any, html: any) {
    this.textFieldChange.emit({ data, html });
  }

  private _resetQuery() {
    this._query = '';
    this._listening = false;
    this.queryChange.emit(this._query);
  }

  private _updateQuery() {
    const { innerHTML } = this.taggableTextFieldElem;

    if (!stringMatchesRegex(innerHTML, utils.TRIGGER_KEY_REGEX)) {
      this._resetQuery();
      return;
    }

    const tagInitKeyIndex = utils.getTagTriggerKeyIndex(innerHTML);
    this._queryStartPosition = tagInitKeyIndex + 1;
    const substr = innerHTML.substr(tagInitKeyIndex);
    const matches = substr.match(utils.QUERY_REGEX);

    if (!matches) return;
    this._query = matches[0].replace(/\+|\@/, '');
    this.queryChange.emit(this._query);
  }
}
