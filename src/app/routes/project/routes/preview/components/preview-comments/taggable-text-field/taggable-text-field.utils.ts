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
import * as consts from 'cd-common/consts';
import { generateLinkTag } from 'cd-common/utils';
import { buildCommentChip } from '../comments.utils';
import { KEYS } from 'cd-utils/keycodes';
import { CHIP_ELEMENT_NAME } from '../comments.consts';
import { LINK_REGEX } from 'cd-utils/url';

// Since the browser wraps text content in divs for single line breaks,
// and <br> tags in divs for multi-line breaks. Because of this, we normalize to
// non-wrapped <br> tags. We also remove non-breaking spaces because we only need them
// when a user is editing text.
export const ZERO_WIDTH_SPACE_REGEX = /[\u200B-\u200D\uFEFF]/g;
const OPENING_DIV_WITH_BREAK_REGEX = /<div><br><\/div>/g;
const OPENING_DIV_REGEX = /<div>/g;
const CLOSING_DIV_REGEX = /<\/div>/g;
const TAG_CONTENT_REGEX = /\[\*\[(.*?)\]\*\]/;
const NEW_LINE = '\n';
const BREAK_NODE_NAME = 'BR';
const HTML_MIME_TYPE = 'text/html';
const TEXT_NODE_NAME = '#text';
const BREAK_TAG = '<br>'; // <- I dont know why this is open only
const LINK_NODE_NAME = 'A';
const CHIP_ELEMENT_OPENING = `<${CHIP_ELEMENT_NAME}`;
const CHIP_ELEMENT_CLOSING = `</${CHIP_ELEMENT_NAME}>`;
const SPACE_REGEX = /^\s$/;
const RIGHT_CARET = '>';
const LINK_STRIPPING_REGEX = /<(a|\/a)[^>]*>/g;

/** Keys that are used to init a new tag: + and @ */
const TAG_TRIGGER_KEYS: string[] = [KEYS.At, KEYS.Plus];

export const QUERY_REGEX = /((\+|\@)[A-Z, a-z])\w+/;

// This regex requires that a trigger key be preceded by a space or another chip element
// or be the first character in the string
export const TRIGGER_KEY_REGEX = /^(\+|\@)|\s(\+|\@)|<\/chip-element>(\+|\@)/;

/**
 * Values source: https://www.w3.org/TR/uievents-code/#alphanumeric-section
 */

// Tab is ommitted since it advances focus.
const PRINTABLE_WHITESPACE_CODES = ['Space', 'Enter'];
const PUNCTUATION_CODES = [
  'Backquote',
  'Backslash',
  'BracketLeft',
  'BracketRight',
  'Comma',
  'Equal',
  'IntlBackslash',
  'IntlRo',
  'IntlYen',
  'Minus',
  'Period',
  'Quote',
  'Semicolon',
  'Slash',
];

enum CodePrefix {
  Key = 'Key',
  Numpad = 'Numpad',
  Digit = 'Digit',
}

export const isVerticalArrowKey = (key: string): boolean => {
  return key === KEYS.ArrowUp || key === KEYS.ArrowDown;
};

const escapeHtml = (unescapedHtml: string): string => {
  return unescapedHtml
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

const keyIsNumberOrOperator = (code: string) => {
  return code.includes(CodePrefix.Numpad) || code.includes(CodePrefix.Digit);
};

const keyIsPrintableWhitespace = (code: string): boolean => {
  return PRINTABLE_WHITESPACE_CODES.includes(code);
};

const keyIsPunctuation = (code: string): boolean => PUNCTUATION_CODES.includes(code);

export const isTagTriggerKey = (key: string): boolean => TAG_TRIGGER_KEYS.includes(key);

/**
 * Find the first index of a trigger character (+ or @) that is not
 * inside a <chip-element></chip-element> block.
 *
 * The trigger character must also be preceded by a space or be the first character in the string
 */
export const getTagTriggerKeyIndex = (content: string): number => {
  let insideChipElement = false;
  const openingLength = CHIP_ELEMENT_OPENING.length;
  const closingLength = CHIP_ELEMENT_CLOSING.length;

  // Search from back to front since it is more likely that a user is adding a tag at the end of
  // the current string
  for (let i = content.length - 1; i >= 0; i--) {
    const key = content[i];

    // Check if the next few characters are a chip element opening tag
    if (!insideChipElement && content.substr(i, openingLength) === CHIP_ELEMENT_OPENING) {
      insideChipElement = true;
    }

    // Check if the next few characters are a chip element closing tag
    if (
      insideChipElement &&
      i >= closingLength &&
      content.substr(i, closingLength) === CHIP_ELEMENT_CLOSING
    ) {
      insideChipElement = false;
    }

    // Ignore any keys (such as @) that are inside a chip element tag
    if (insideChipElement) continue;
    if (!TAG_TRIGGER_KEYS.includes(key)) continue;
    if (i === 0) return i;

    // ensure that the previous character is a space or the closing tag of another chip element
    const prevCharacter = content[i - 1];
    if (prevCharacter === RIGHT_CARET || SPACE_REGEX.test(prevCharacter)) return i;
  }

  return -1;
};

export const keyIsLetter = (code: string): boolean => code.includes(CodePrefix.Key);

export const keyIsPrintableCharacter = (code = ''): boolean => {
  return (
    keyIsLetter(code) ||
    keyIsNumberOrOperator(code) ||
    keyIsPrintableWhitespace(code) ||
    keyIsPunctuation(code)
  );
};

export const getArrayOfNodes = (text: string) => {
  const domParser = new DOMParser();
  const { body } = domParser.parseFromString(text, HTML_MIME_TYPE);
  const { childNodes } = body;

  return Array.from(childNodes);
};

export const getTagIndexFromChildNodes = (tag: any, textFieldNodes: any) => {
  const { email } = tag;
  const nodeArray = Array.from(textFieldNodes);

  return nodeArray.findIndex((node) => {
    if (!(node as HTMLElement).dataset) return false;

    const nodeId = (node as HTMLElement).dataset.itemId;
    return nodeId === email;
  });
};

export const findNodeIndex = (
  list: Array<cd.ITaggableTextFieldNode>,
  targetEmail: string
): undefined | number => {
  if (!list) return;

  return list.findIndex((item) => {
    const { email } = <cd.IUser>item.content;
    return email ? email === targetEmail : false;
  });
};

export const stripDivTags = (html: string): string => {
  return html
    .trim()
    .replace(OPENING_DIV_WITH_BREAK_REGEX, BREAK_TAG)
    .replace(OPENING_DIV_REGEX, BREAK_TAG)
    .replace(CLOSING_DIV_REGEX, '')
    .replace(ZERO_WIDTH_SPACE_REGEX, '');
};

const replaceAllLinksFromSet = (text: string, links: Set<string>) => {
  return [...links].reduce((acc, match) => {
    const link = generateLinkTag(match, match, true);
    return acc.split(match).join(link);
  }, text);
};

const replaceLinks = (content: string, regexMatches: RegExpMatchArray[]): string => {
  const links = regexMatches.map((match) => match[0]); // Grab the matched text from the MatchArray
  const linksSet = new Set(links); // Convert to set to remove any duplicates
  return replaceAllLinksFromSet(content, linksSet);
};

const buildTextNode = (textContent?: any): cd.ITaggableTextFieldNode => {
  const escapedHtml = escapeHtml(String(textContent));
  const linkMatches = [...escapedHtml.matchAll(LINK_REGEX)];
  const linksInText = linkMatches.length > 0;
  const content = linksInText ? replaceLinks(escapedHtml, linkMatches) : escapedHtml;
  const type = linksInText ? cd.TextFieldElementType.Link : cd.TextFieldElementType.Text;
  return { type, content };
};

const buildFallbackTextNode = (innerText: string): cd.ITaggableTextFieldNode => {
  return { type: cd.TextFieldElementType.Text, content: escapeHtml(innerText) };
};

const buildChipNode = (
  dataset: DOMStringMap,
  taggedItems: cd.IStringMap<any>
): cd.ITaggableTextFieldNode => {
  const email = dataset.itemId || '';
  const type = cd.TextFieldElementType.Chip;
  const content = taggedItems[email];
  return { type, content };
};

const buildBreakNode = (): cd.ITaggableTextFieldNode => {
  return { type: cd.TextFieldElementType.Break, content: NEW_LINE };
};

const buildLinkNode = (node: ChildNode): cd.ITaggableTextFieldNode => {
  const content = (<HTMLElement>node).outerHTML;
  return { type: cd.TextFieldElementType.Link, content };
};

export const htmlToNodes = (
  html: string,
  taggedItems: cd.IStringMap<any>
): Array<cd.ITaggableTextFieldNode> => {
  const strippedHtml = stripDivTags(html);
  const domNodes = getArrayOfNodes(strippedHtml);

  return domNodes.map<cd.ITaggableTextFieldNode>(
    (currNode: ChildNode): cd.ITaggableTextFieldNode => {
      const { className, innerText, dataset, nodeName, textContent } = currNode as HTMLElement;

      const isText = nodeName === TEXT_NODE_NAME;
      if (isText) return buildTextNode(textContent);

      const isChip = className === cd.TextFieldElementType.Chip;
      if (isChip) return buildChipNode(dataset, taggedItems);

      const isBreakTag = (<HTMLElement>currNode).innerHTML === BREAK_TAG;
      const isBreak = isBreakTag || nodeName === BREAK_NODE_NAME;
      if (isBreak) return buildBreakNode();

      const isLink = nodeName === LINK_NODE_NAME;
      if (isLink) return buildLinkNode(currNode);

      return buildFallbackTextNode(innerText);
    }
  );
};

export const templateStringToHtml = (
  templateString: string,
  taggedItems: cd.IStringMap<any>
): string => {
  const results = TAG_CONTENT_REGEX.exec(templateString) || null;
  if (!results) return templateString;
  const email = results[1];
  const name = taggedItems[email].name;
  const chipElement = buildCommentChip(name, email);
  const html = stripDivTags(templateString).replace(
    TAG_CONTENT_REGEX,
    `${chipElement}${consts.ZERO_WIDTH_SPACE}`
  );

  return html;
};

/**
 * Sets the cursor position at the end of the given element.
 * If `insideContents === true`, moves it to the end of the child contents
 */
export const setCaretPositionAtEndOfElement = (element: HTMLElement, insideContents = false) => {
  if (!element) return;

  const selectionObject = window.getSelection();

  if (!selectionObject) return;

  if (selectionObject.rangeCount > 0) {
    selectionObject.removeAllRanges();
  }

  const range = document.createRange();

  insideContents ? range.selectNodeContents(element) : range.selectNode(element);
  selectionObject.addRange(range);
  selectionObject.collapseToEnd();
};

export const nodeIsChipElement = (node: Node): boolean => {
  return (node as HTMLElement)?.localName === CHIP_ELEMENT_NAME;
};

/** Given an html link string, return the text from the inside of it */
export const stripLinkTags = (html: string): string => {
  const toRemove = [...html.matchAll(LINK_STRIPPING_REGEX)];
  const linkTagsToRemove = toRemove.map((match) => match[0]);
  return linkTagsToRemove.reduce((acc, curr) => {
    return acc.replace(curr, '');
  }, html);
};

/** Converts any `type: Link` node to a `type: Text` node */
export const convertLinkNodesToTextNodes = (
  nodes: cd.ITaggableTextFieldNode[]
): cd.ITaggableTextFieldNode[] => {
  return nodes.map((node) => {
    if (node.type !== cd.TextFieldElementType.Link) return node;
    const content = stripLinkTags(node.content as string);
    return {
      type: cd.TextFieldElementType.Text,
      content,
    };
  });
};
