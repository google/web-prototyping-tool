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
  DATA_CHIP_TAG,
  DATA_CHIP_SOURCE_ATTR,
  DATA_CHIP_LOOKUP_ATTR,
  STYLE_TAG,
  HREF_ATTR,
  TARGET_ATTR,
  WindowTarget,
  FONT_TAG,
  LIST_ITEM_TAG,
  BLOCKQUOTE_TAG,
} from 'cd-common/consts';
import { HTML_TAG_REGEX, NON_BREAKING_SPACE_REGEX } from 'cd-utils/string';
import { IHyperlink } from './link-overlay/link-overlay.component';
import { MockTextType } from 'cd-utils/mock-data';
import { ANCHOR_TAG } from './rich-text.consts';
import { removeAllRanges, selectElementContents } from 'cd-utils/selection';
import type DataChipElement from './cd-data-chip/data-chip';
import { wrapInBrackets } from 'cd-common/models';
import { generateSVGPath } from 'cd-utils/svg';
import * as cd from 'cd-interfaces';
/**
 * Document.execCommand() documentation
 * https://developer.mozilla.org/en-US/docs/Web/API/Document/execCommand#Commands
 */

const SPACE_BETWEEN_WORDS_REGEX = /\s\s+/g;
const REMOVE_LAST_BREAK_REGEX = /(<br[^>]*>)(?!([\s\S]*<br[^>]*>))/g;
const DATA_CHIP_REGEX = new RegExp(`/<${DATA_CHIP_TAG}[^>]*>([\s\S]*?)<\/${DATA_CHIP_TAG}[^>]*>/g`);

export const BLUR_TIMEOUT = 200;
export const LINK_KEYBOARD_SHORTCUT = 'k';

export const SAMPLE_TEXT_MENU: cd.MenuConfigList = [
  { title: 'Title', value: MockTextType.Title },
  { title: 'Phrase', value: MockTextType.Phrase },
  { title: 'Sentence', value: MockTextType.Sentence },
  { title: 'Paragraph', value: MockTextType.Sentence },
];

export const removeHTMLTags = (text: string): string => {
  return String(text)
    .replace(DATA_CHIP_REGEX, '')
    .replace(HTML_TAG_REGEX, ' ')
    .replace(SPACE_BETWEEN_WORDS_REGEX, ' ')
    .replace(NON_BREAKING_SPACE_REGEX, ' ');
};

const TEXT_ALIGN_REGEX = /text-align:\s*(?:left|right|center|justify)/g;

export const buildChipTag = (source: string | undefined, lookup: string | undefined): string => {
  const attrs = [`${DATA_CHIP_SOURCE_ATTR}="${source}"`, `${DATA_CHIP_LOOKUP_ATTR}="${lookup}"`];
  return `<${DATA_CHIP_TAG} ${attrs.join(' ')}></${DATA_CHIP_TAG}>`;
};

export const queryState = (state: string): boolean => document.queryCommandState(state);

const cleanCSSText = (cssText: string): string | null => {
  const txt = cssText.match(TEXT_ALIGN_REGEX);
  return txt && String(txt);
};

export const cleanStyles = (element: HTMLElement): string => {
  const selector = wrapInBrackets(STYLE_TAG);
  const nodes = Array.from(element.querySelectorAll(selector));

  for (const node of nodes) {
    const styleNode = node as HTMLElement;
    const text = cleanCSSText(styleNode.style.cssText);
    if (text) {
      styleNode.style.cssText = text;
    } else {
      styleNode.removeAttribute(STYLE_TAG);
    }
  }

  return element.innerHTML.replace(REMOVE_LAST_BREAK_REGEX, '');
};

export const getSelectedNode = (): HTMLElement | undefined => {
  // const selection = window.getSelection();
  // return selection.anchorNode.parentNode as HTMLElement;
  const selection = window.getSelection();
  if (!selection) return;
  const selectedRange = selection.rangeCount !== 0 && selection.getRangeAt(0);
  const firstItem = selectedRange && selectedRange.startContainer.parentNode;
  return firstItem ? (firstItem as HTMLElement) : undefined;
};

export const isSelectionInsideElement = (element: HTMLElement): boolean => {
  const selection = window.getSelection();
  if (!selection) return false;
  const parentNode =
    selection.rangeCount > 0 && selection.anchorNode && selection.anchorNode.parentNode;
  return !!parentNode && element.contains(parentNode);
};

export const selectElement = (element: HTMLElement): void => {
  const selection = window.getSelection();
  if (!selection) return;
  const range = document.createRange();
  range.selectNodeContents(element);
  selection.removeAllRanges();
  selection.addRange(range);
};

const getHTMLAttributes = (
  start: HTMLElement,
  end: HTMLElement,
  attribute: string
): string | null => {
  return start.getAttribute(attribute) || end.getAttribute(attribute);
};

type DomTagRange = [start: HTMLElement, end: HTMLElement] | undefined;

/** Given the current selection and tagName expand to select the entire tag */
const selectDomTagInRange = (tagName: string): DomTagRange => {
  const selection = window.getSelection();
  if (!selection) return;
  const selectedRange = selection.rangeCount !== 0 && selection.getRangeAt(0);
  if (!selectedRange) return;
  const start = selectedRange.startContainer.parentNode as HTMLElement;
  const end = selectedRange.endContainer.parentNode as HTMLElement;
  if (end.tagName === tagName) selectedRange.setEndAfter(end);
  if (start.tagName === tagName) selectedRange.setStartBefore(start);
  return [start, end];
};

export const expandSelectionAndReturnURL = (): Omit<IHyperlink, 'range' | 'text'> | undefined => {
  const tags = selectDomTagInRange(ANCHOR_TAG);
  if (!tags) return;
  const [start, end] = tags;
  const url = getHTMLAttributes(start, end, HREF_ATTR) || '';
  const openInTab = getHTMLAttributes(start, end, TARGET_ATTR) === WindowTarget.Blank;
  return { url, openInTab };
};

/** Generates an SVG path based on the bounds and selected range */
export const generateSelectionPath = (bounds: ClientRect, rects: ClientRect[]): string => {
  const { top: y, left: x } = bounds;
  return rects.reduce((acc, rect) => {
    const { top, left, bottom, right } = rect;
    const t = top - y;
    const l = left - x;
    const b = bottom - y;
    const r = right - x;
    acc += generateSVGPath([l, t], [l, b], [r, b], [r, t], [l, t]);
    return acc;
  }, '');
};

const isDataChip = (elem: Element | null) => {
  return elem?.tagName === DATA_CHIP_TAG.toUpperCase() ? (elem as DataChipElement) : undefined;
};

/**
 * Convoluted way of finding where a chip is inserted since documentExec can be unpredictable
 * Queryselectors are fallbacks if we know we added a chip but cannot find it
 */
export const locateClosestChip = (range: Range, textArea: HTMLElement): DataChipElement | null => {
  const startElem = range.startContainer as HTMLElement;
  const endElem = range.endContainer as HTMLElement;
  if (!startElem) return null;
  return (
    isDataChip(startElem) ||
    isDataChip(endElem) ||
    isDataChip(startElem?.nextElementSibling) ||
    isDataChip(startElem?.previousElementSibling) ||
    // Fallback if cannot find one
    textArea.querySelector(`${DATA_CHIP_TAG}:last-child`)
  );
};

export const selectLink = (selection: Selection | null, range: Range, text?: string) => {
  if (!selection) return;
  removeAllRanges(selection);
  const elem = range.startContainer.parentNode as HTMLLinkElement;
  if (elem.tagName === ANCHOR_TAG) {
    if (text) elem.textContent = text;
    selectElementContents(elem);
  } else {
    selection.addRange(range);
  }
};

/**
 * HOTFIX: Adding and removing the data chip sometimes
 * causes a rouge <font> tag to appear with red text...
 */
export const detectAndRemoveFontTags = (records: MutationRecord[]): void => {
  for (const record of records) {
    const { target } = record;
    if (target.nodeName === FONT_TAG) {
      target.parentNode?.removeChild(target);
      break;
    }
  }
};

export const selectHasIndent = (selection: Selection | null): boolean => {
  const anchor = selection?.anchorNode as HTMLElement;
  const parent = anchor?.parentElement;
  return (
    anchor.tagName === LIST_ITEM_TAG.toUpperCase() ||
    parent?.closest(LIST_ITEM_TAG) !== null ||
    parent?.closest(BLOCKQUOTE_TAG) !== null
  );
};
