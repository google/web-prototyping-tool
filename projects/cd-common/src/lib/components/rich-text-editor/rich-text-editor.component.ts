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

/* eslint-disable max-lines */

import {
  Component,
  ViewChild,
  EventEmitter,
  Output,
  ElementRef,
  ChangeDetectionStrategy,
  AfterViewInit,
  ChangeDetectorRef,
  OnDestroy,
  Input,
  SecurityContext,
  OnInit,
  Injector,
} from '@angular/core';
import { AbstractDataBoundInputDirective } from '../input/abstract/abstract.data-bound-input';
import { LinkOverlayDirective } from './link-overlay/link-overlay.directive';
import { DataPickerDirective } from '../data-picker/data-picker.directive';
import { createDataBoundValue, isDataBoundValue } from 'cd-common/utils';
import { IHyperlink } from './link-overlay/link-overlay.component';
import { DATASET_DELIMITER, DATA_CHIP_TAG, ExecCommand } from 'cd-common/consts';
import { coerceBooleanProperty } from '@angular/cdk/coercion';
import { RichTextModel, ExecState } from './rich-text.model';
import { executeCommand } from 'cd-utils/content-editable';
import { InputComponent } from '../input/input.component';
import DataChipElement from './cd-data-chip/data-chip';
import { DomSanitizer } from '@angular/platform-browser';
import { RichTextService } from './rich-text.service';
import { createMockText } from 'cd-utils/mock-data';
import { areStringsEqual } from 'cd-utils/string';
import textAreaStyles from './text-area.styles';
import { deepCopy } from 'cd-utils/object';
import { KEYS } from 'cd-utils/keycodes';
import { Subscription } from 'rxjs';
import * as utils from './rich-text-editor.utils';
import * as consts from './rich-text.consts';
import * as cd from 'cd-interfaces';

@Component({
  selector: 'cd-rich-text-editor',
  templateUrl: './rich-text-editor.component.html',
  styleUrls: ['./rich-text-editor.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RichTextEditorComponent
  extends AbstractDataBoundInputDirective
  implements OnInit, AfterViewInit, OnDestroy
{
  private _showingLinkOverlay = false;
  private _onlyRichText = false;
  private _focusSub: Subscription = Subscription.EMPTY;
  private _timer = 0;
  private _richText = false;
  private _value = '';
  private _plainText = '';
  private _rangeRef?: Range | null = null;
  public copyData?: string;
  public richTextFocused = false;
  public plainTextFocused = false;
  public highlightPath?: string;
  public textMode = consts.TextMode.Default;
  public TextModeEnum = consts.TextMode;
  public TextFormatEnum = consts.TextFormat;
  public model = new RichTextModel();
  public textAreaStyles = textAreaStyles;
  public mockTextMenuConfig: cd.MenuConfigList = utils.SAMPLE_TEXT_MENU;

  @Input()
  set onlyRichText(value) {
    this._onlyRichText = coerceBooleanProperty(value);
  }
  get onlyRichText() {
    return this._onlyRichText;
  }

  @Input() alignmentEnabled = true;
  @Input() mockTextEnabled = true;

  @Input()
  set value(value: string) {
    if (this._value === value) return;
    this._value = value;
    // Since text is updated in realtime in the renderer
    // instead of on blur, we ignore incoming data while input is focused
    if (!this.plainTextFocused) {
      this._plainText = value;
    }

    if (!this.richTextFocused) {
      this.setupRichText(value);
    }
  }
  get value() {
    return this._value;
  }

  @Input() label = 'Content';
  @Input() textAlign = consts.TextAlign.Left;
  @Input()
  set richText(value: boolean) {
    if (this._richText === value) return;
    this._richText = value;
    this.textMode = value ? consts.TextMode.RichText : consts.TextMode.Default;
    /// force creation of rich text editor //
    this._cdRef.detectChanges(); ////////////
    /////////////////////////////////////////
    if (!value) return;
    this.setupRichText(this._value);
  }
  get richText(): boolean {
    return this.textMode === consts.TextMode.RichText;
  }

  @Output() modelChange = new EventEmitter<cd.IStringMap<any>>();
  @Output() valueChange = new EventEmitter<Partial<cd.ITextInputs>>();

  @ViewChild('textArea', { read: ElementRef }) _textArea?: ElementRef;
  @ViewChild('plainTextInput', { read: InputComponent }) _plainTextInput?: InputComponent;
  @ViewChild(DataPickerDirective, { read: DataPickerDirective, static: false })
  dataPicker?: DataPickerDirective;

  @ViewChild(LinkOverlayDirective, { read: LinkOverlayDirective, static: false })
  linkOverlay?: LinkOverlayDirective;

  constructor(
    protected injector: Injector,
    private _elemRef: ElementRef,
    private _sanitizer: DomSanitizer,
    private _cdRef: ChangeDetectorRef,
    private _textService: RichTextService
  ) {
    super();
    const chipElementConstructor = customElements.get(DATA_CHIP_TAG);
    if (!chipElementConstructor) customElements.define(DATA_CHIP_TAG, DataChipElement);
  }

  get plainTextInput(): HTMLInputElement | undefined {
    return this._plainTextInput?.inputRefElem;
  }

  get textArea(): HTMLTextAreaElement {
    return this._textArea?.nativeElement;
  }

  /** Called when the element Id changes */
  updateActiveElement() {
    this.resetState();
    this.setupRichText(this._value);
  }

  ngOnInit(): void {
    this._focusSub = this._textService.focus$.subscribe(this.focusOnInput);
  }

  setupRichText(value: string) {
    if (!this._textArea) return;
    this.textArea.innerHTML = value;
  }

  focusOnInput = () => {
    if (this.richText) {
      const { textArea } = this;
      if (!textArea) return;
      this.focus();
      utils.selectElement(textArea);
    } else {
      const { plainTextInput } = this;
      if (!plainTextInput) return;
      plainTextInput.select();
    }
  };

  onPlainTextBindingChange(value: cd.IDataBoundValue) {
    this.valueChange.emit({ innerHTML: value });
  }

  onPlainTextInput(e: Event) {
    const innerHTML = (e.target as HTMLInputElement).value || '';
    this.valueChange.emit({ innerHTML });
    this._plainText = innerHTML;
  }

  switchToRichTextMode() {
    const model = deepCopy(consts.DEFAULT_RICH_TEXT_MODEL);
    const update = { richText: true };
    if (isDataBoundValue(this._value)) {
      // Remove plain text data chip
      const innerHTML = '';
      Object.assign(update, { innerHTML });
      this._value = innerHTML;
    }
    this.valueChange.emit(update);
    this.modelChange.emit(model);
    this._cdRef.detectChanges();
    this.setupRichText(this._value);
    this._cdRef.markForCheck();
  }

  /** Strip out all html details */
  switchToPlainTextMode() {
    const text = utils.removeHTMLTags(this._value);
    this._value = text;
    const model = deepCopy(consts.DEFAULT_PLAIN_TEXT_MODEL);
    const update = { richText: false, innerHTML: text };
    this.valueChange.emit(update);
    this.modelChange.emit(model);
    this._cdRef.detectChanges();
  }

  onTextModeChange(mode: consts.TextMode) {
    if (this.textMode === mode) return;
    const richText = mode === consts.TextMode.RichText;
    this.textMode = mode;
    if (richText) this.switchToRichTextMode();
    else this.switchToPlainTextMode();
    this.focus();
  }

  get selection() {
    return window.getSelection();
  }

  selectTextAreaIfSelectionIsEmpty(selectStart?: boolean) {
    if (!this._textArea) return;
    const isSelectionWithinTextArea = utils.isSelectionInsideElement(this.textArea);
    // If nothing is selected, select the entire container
    if (!isSelectionWithinTextArea || !this.richTextFocused) {
      utils.selectElement(this.textArea);
      const { selection } = this;
      if (selectStart && selection) selection.collapseToStart();
    }
  }

  wrapUpdate = (callback: Function) => {
    if (!this._textArea) return;
    this.computeState();
    this.selectTextAreaIfSelectionIsEmpty();
    this.clearTimer();
    callback();
    this.outputChanges();
    this.focus();
  };

  onToggle = (state: ExecState) => {
    this.wrapUpdate(() => state.toggle());
  };

  onPlainTextAlignment = (value: consts.TextAlign) => {
    this.modelChange.emit({ textAlign: value });
  };

  onRichTextAlignment = (value: consts.TextFormat) => {
    this.wrapUpdate(() => this.model.textAlignment.toggle(value));
  };

  onMockTextSelect(menuConfig: cd.IMenuConfig) {
    // Focus so text is inserted at last cursor position
    this.focus();
    const text = createMockText(menuConfig.value as number);
    this.wrapUpdate(() => this.model.insertText(text));
  }

  computeState() {
    if (!this._textArea) return;
    this.model.compute();
    this.model.computeHyperlink(this.textArea);
    this._cdRef.detectChanges();
  }

  clearTimer() {
    if (this.richTextFocused === false) return;
    clearTimeout(this._timer);
  }

  resetSelection() {
    this.clearTimer();
  }

  ngOnDestroy(): void {
    this.clearTimer();
    this._focusSub.unsubscribe();
  }

  onKeyUp() {
    this.outputChanges();
  }

  onKeyDown(e: KeyboardEvent) {
    const { key, shiftKey, metaKey } = e;
    // Show create link overlay on CMD + k just like docs / slides
    if (metaKey && key === utils.LINK_KEYBOARD_SHORTCUT) {
      return this.onHyperlink();
    }

    const { selection } = this;

    if (key === KEYS.Tab) {
      e.preventDefault();
      e.stopPropagation();

      if (utils.selectHasIndent(selection)) {
        const command = shiftKey ? consts.TextFormat.Outdent : consts.TextFormat.Indent;
        executeCommand(command);
      } else {
        executeCommand(ExecCommand.InsertText, '  ');
      }

      this.outputChanges();
    }
  }

  onCutOrCopy() {
    // Save a copy of a the current selection to compare against the pasted data
    // to determine if it came from an external source
    const { selection } = this;
    if (selection) this.copyData = selection.toString();
  }

  onPaste(e: ClipboardEvent) {
    e.preventDefault();
    const { clipboardData } = e;
    const plainText = clipboardData?.getData(consts.ContentType.Text);
    const isEqual = plainText && areStringsEqual(plainText, this.copyData || '');
    if (isEqual) {
      const htmlText = clipboardData && clipboardData.getData(consts.ContentType.Html);
      const html = this._sanitizer.sanitize(SecurityContext.HTML, htmlText);
      if (html) {
        executeCommand(ExecCommand.InsertHTML, html);
        this.outputChanges();
        return;
      }
    }
    if (plainText) {
      executeCommand(ExecCommand.InsertText, plainText);
    }
  }

  ngAfterViewInit(): void {
    // This line is needed to force change detection
    // on the toggle button group
    this._cdRef.markForCheck();
  }

  /** Mutation observer on richtext contentediable */
  onContentChange = (records: MutationRecord[]) => {
    if (!this.richTextFocused) return;
    utils.detectAndRemoveFontTags(records);
    this.computeState();
  };

  resetState = () => {
    if (this._showingLinkOverlay) return;
    this.clearTimer();
    this.model.reset();
    this.richTextFocused = false;
    this._cdRef.markForCheck();
  };

  outputChanges() {
    // Angular strips style tags
    // https://github.com/angular/angular/issues/19645
    // const html = this._sanitizer.sanitize(SecurityContext.HTML, innerHTML);
    if (!this._textArea) return;
    const innerHTML = utils.cleanStyles(this.textArea);
    if (this._value === innerHTML) return;
    this._value = innerHTML;
    this.valueChange.emit({ innerHTML });
  }

  onChange() {
    this.outputChanges();
  }

  focus() {
    if (this.textMode === consts.TextMode.RichText) {
      this.textArea?.focus();
    } else if (this.plainTextInput) {
      this.plainTextInput?.focus();
    }
  }

  get plainTextValue() {
    return this.plainTextFocused ? this._plainText : this.value;
  }

  onPlainTextFocus(focused: boolean) {
    this.plainTextFocused = focused;
    this._plainText = this.value;
  }

  onRichTextFocus() {
    this.clearTimer();
    this.richTextFocused = true;
  }

  onRichTextBlur() {
    this.clearTimer();
    this._timer = window.setTimeout(this.resetState, utils.BLUR_TIMEOUT);
  }

  onHyperlink() {
    this.selectTextAreaIfSelectionIsEmpty(true);
    this.createLinkOverlay();
  }

  ////////////////////////////
  // DATA CHIP ///////////////
  ////////////////////////////

  onTextAreaClick(e: MouseEvent) {
    const chip = (e.target as HTMLElement).closest(DATA_CHIP_TAG) as DataChipElement;
    if (chip) {
      this.selectChip(chip);
      if (chip.didClickCloseBtn(e.clientX, e.clientY)) {
        return this.removeChipInRange();
      }
      chip.highlight(true);
      return this.onDataInsert(chip);
    }
  }

  onOpenDataPicker() {
    if (this._rangeRef) return;
    this.selectTextAreaIfSelectionIsEmpty(true);
    this._rangeRef = this.selection?.getRangeAt(0);
  }

  onCloseDataPicker() {
    const chips = Array.from<DataChipElement>(this.textArea.querySelectorAll(DATA_CHIP_TAG));
    for (const chip of chips) {
      if (chip.highlighted) {
        const range = new Range();
        range.setStartAfter(chip);
        this.selection?.removeAllRanges();
        this.selection?.addRange(range);
      }
      chip.highlight(false);
    }
    this._rangeRef = null;
  }

  onDataInsert(chip?: DataChipElement) {
    if (!chip) this.selectTextAreaIfSelectionIsEmpty(true);
    const binding = chip && createDataBoundValue(chip.source, chip.lookup);
    this.dataPicker?.createDataPickerWithOffsetX(binding, -10);
  }

  removeChipInRange() {
    this.selection?.deleteFromDocument();
    this.outputChanges();
  }

  selectChip(chip?: DataChipElement) {
    if (!chip) return;
    const { selection } = this;
    if (!selection) return;
    const range = new Range();
    range.selectNode(chip);
    selection.removeAllRanges();
    selection.addRange(range);
    this._rangeRef = range;
  }

  onDataBinding(value?: cd.IDataBoundValue) {
    if (!value) return this.removeChipInRange();
    const source = value?._$coDatasetId;
    const lookup = value?.lookupPath;

    const { selection, _rangeRef } = this;

    if (_rangeRef) {
      selection?.removeAllRanges();
      selection?.addRange(_rangeRef);
      this.model.createChip(source, lookup);
      const chip = utils.locateClosestChip(_rangeRef, this.textArea);
      if (chip) {
        this.selectChip(chip as DataChipElement);
        // unfortunately needed for setting web component state
        setTimeout(() => chip.highlight(true));
      }
    }
    this.outputChanges();
  }

  onLinkChange = (link: IHyperlink) => {
    const { text, url, range, openInTab } = link;
    if (!range) return;
    this._showingLinkOverlay = false;
    this.highlightPath = '';
    utils.selectLink(this.selection, range, text);

    if (url) {
      const selectedText = window.getSelection.toString();
      const didTextChange = areStringsEqual(text, selectedText);
      this.model.createLink(url, openInTab, text, didTextChange);
    } else {
      this.model.unlink(text);
    }
    this.outputChanges();
  };

  onLinkCancel = () => {
    this.highlightPath = '';
    this._showingLinkOverlay = false;
  };

  onRemoveLink = (range: Range) => {
    utils.selectLink(this.selection, range);
    this.model.unlink();
    this.outputChanges();
  };

  createLinkOverlay() {
    if (!this._textArea) return;
    this.clearTimer();
    const { selection } = this;
    if (!selection) return;

    const urlValue = utils.expandSelectionAndReturnURL();
    const url = urlValue?.url || '';
    const openInTab = !!urlValue?.openInTab;
    const text = selection.toString();
    const range = selection.getRangeAt(0);
    const linkData = { text, url, range, openInTab };
    const rects = Array.from(range.getClientRects());
    this.linkOverlay?.create(linkData);
    // Simulate selection using an SVG path while the overlay is open
    const bounds = this._elemRef.nativeElement.getBoundingClientRect();
    this.highlightPath = utils.generateSelectionPath(bounds, rects);
  }

  /**
   * Used to highlight the elements on the design surface
   * when hovering over a chip or data picker contents
   * */
  onElementHighlight(value: string) {
    const id = value ? value.split(DATASET_DELIMITER)?.[0] : '';
    this.activeValue.emit(id);
  }

  get isFocused() {
    return this.richTextFocused || this.dataPicker?.pickerActive;
  }
}
