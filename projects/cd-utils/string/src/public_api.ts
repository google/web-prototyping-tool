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

const DASH = '-';
const UNDERSCORE = '_';
const ELLIPSIS_VAL = '...';
const LINE_BREAK_REGEX = /[^\r\n;]+/g;
const STRING_VALUE = 'string';
const REGEX_NUMBERS = /[0-9]/g;
const SPECIAL_CHARS = /\W/g;
const REGEX_IS_LETTER = /[A-Za-z]/;
const REGEX_UPPER_LETTER = /([A-Z])/g;
const SPACE = ' ';
const REGEX_SPACE_TO_DASH = /\s+/g;
const REGEX_AZ_09 = /([a-z0-9])([A-Z])/g;
const REGEX_CAPS_TO_DASH = /([A-Z])([A-Z])(?=[a-z])/g;
/** Matches argument placeholders in a formatted string: 'foo {0}' */
const REGEX_FORMAT_STRING_ARGUMENT = /{(\d+)}/g;
const DASH_REGEX = /-/g;
const SNAKE_REGEX = /_/g;
const ALL_DOUBLE_QUOTES_REGEX = /["]/g;
const HTML_QUOTE = '&quot;';
/** Matches any non-alphanumeric char. Including whitespace. */
const ALPHANUMERIC_REGEX = /[a-zA-Z0-9]+/g;
/** Given an alphanumeric string, match the change from Upper to lower case */
const CASE_CHANGE_REGEX = /(\d*[A-Z][a-z\d]+)/g;
export const HTML_TAG_REGEX = /<[^>]*>/g;
export const NON_BREAKING_SPACE_REGEX = /&nbsp;/g;

/** Replace all double quotes (") with &quot; */
export const htmlEscapeDoubleQuotes = (str: string): string => {
  return str.replace(ALL_DOUBLE_QUOTES_REGEX, HTML_QUOTE);
};

/**
 * An alternative to using regex.test which can be unpredictable if not used properly
 */
export const stringMatchesRegex = (str: string, regex: RegExp): boolean => !!str.match(regex);

export const areStringsEqual = (strA: string, strB: string): boolean => {
  return strA.replace(LINE_BREAK_REGEX, '') === strB.replace(LINE_BREAK_REGEX, '');
};

export const isString = (value: any): value is string => {
  return typeof value === STRING_VALUE || value instanceof String;
};

export const isLetter = (char: string): boolean => !!char.match(REGEX_IS_LETTER);

export const capitalizeFirst = (text: string | undefined): string => {
  return (text && text[0].toLocaleUpperCase() + text.substr(1)) || '';
};

export const removeNumbersAndTrim = (str: string): string => {
  return str.replace(REGEX_NUMBERS, '').trim();
};

// For example, for a string 'Board 10' return 10
export const extractTrailingNumber = (str: string): number | undefined => {
  const split = str.split(SPACE);
  const value = split[split.length - 1];
  const number = parseInt(value, 10);
  return number || undefined;
};

export const incrementedName = (name = '', existingNames: string[], offset = 0): string => {
  const baseName = removeNumbersAndTrim(name);
  let maxNumber = 0;
  for (const existingName of existingNames) {
    if (existingName?.includes(baseName)) {
      const number = extractTrailingNumber(existingName);
      if (number !== undefined && number > maxNumber) maxNumber = number;
      if (!maxNumber && !number) maxNumber = 1;
    }
  }

  const increment = maxNumber + 1 + offset;
  const suffix = increment === 1 ? '' : ` ${increment}`;

  return `${baseName}${suffix}`;
};

/** Trims a specific character from start of string. */
export const trimStart = (char: string, text: string): string => {
  return text.replace(new RegExp(`^[${char}]+`), '');
};

/** Trims a specific character from end string. */
export const trimEnd = (char: string, text: string): string => {
  return text.replace(new RegExp(`[${char}]+$`), '');
};

/** Trims a specific character from a string. */
export const trimChar = (char: string, text: string): string => {
  return trimStart(char, trimEnd(char, text));
};

export const stringSplice = (string: string, index: number, count: number, add: string) => {
  return string.slice(0, index) + (add || '') + string.slice(index + count);
};

export const stripHTMLTags = (text: string): string => {
  return text.replace(HTML_TAG_REGEX, '').replace(NON_BREAKING_SPACE_REGEX, SPACE);
};

export const truncateText = (text: string, length: number, ellipsis = true): string => {
  const suffix = ellipsis && text.length > length ? ELLIPSIS_VAL : '';
  return text.substring(0, length) + suffix;
};

/**
 * Adds an 's' to the end of supplied string if the number given is not 1
 *
 * All numbers (even negative) except for positive 1 should be plural
 */
export const makePluralFromLength = (baseText: string, itemsLength: number): string => {
  if (itemsLength === 1) return baseText;
  return baseText + 's';
};

export const removeSpecialCharacters = (text: string): string => {
  return text.replace(SPECIAL_CHARS, '');
};

/**
 * Formats a string using a variable number of arguments.
 * @example formatString('Foo {0} bar {1}', 'baz', 123) === 'Foo baz bar 123'
 */
export const formatStringWithArguments = (str: string, ...args: any[]) => {
  return str.replace(REGEX_FORMAT_STRING_ARGUMENT, (match, number) => {
    return typeof args[number] !== undefined ? args[number] : match;
  });
};

//#region Casing

// TODO: Test that these can be removed without issues

/** @obsolete  */
export const constructKebabCase = (...args: string[]): string => args.join(DASH);

/** @obsolete  */
export const kebabToSentenceStyle = (text: string): string => {
  const sentence = text.replace(DASH_REGEX, SPACE);
  return capitalizeFirst(sentence);
};

/** @obsolete  */
export const camelCaseToSpaces = (text: string): string => {
  return text.replace(REGEX_UPPER_LETTER, (val) => SPACE + val);
};

export const toKebabCase = (text: string): string => {
  return text
    .replace(REGEX_AZ_09, '$1-$2')
    .replace(REGEX_CAPS_TO_DASH, '$1-$2')
    .replace(REGEX_SPACE_TO_DASH, DASH)
    .toLowerCase();
};

/** Converts a string to "spaced case" */
export const toSpacedCase = (text: string): string => {
  return splitTerms(text).join(SPACE);
};

/** Converts a string to "Sentence case" */
export const toSentenceCase = (text: string, preserveWordsInAllCaps = false): string => {
  return capitalizeFirst(splitTerms(text, preserveWordsInAllCaps).join(SPACE));
};

/** Converts a string to "Title Case". */
export const toTitleCase = (text: string): string => {
  return splitTerms(text)
    .map((term) => term[0].toUpperCase() + term.slice(1))
    .join(SPACE);
};

export const removeCamelAndSnakeCase = (text: string): string => {
  return text.replace(DASH_REGEX, SPACE).replace(SNAKE_REGEX, SPACE).toLowerCase();
};
/** Converts a string to "camelCase". */
export const toCamelCase = (text: string): string => {
  text = toPascalCase(text);
  return text[0].toLowerCase() + text.slice(1);
};

/** Converts a string to "PascalCase". */
export const toPascalCase = (text: string): string => {
  return splitTerms(text)
    .map((term) => term[0].toUpperCase() + term.slice(1))
    .join('');
};

/** Converts a string to "snake_case". */
export const toSnakeCase = (text: string): string => {
  return splitTerms(text).join(UNDERSCORE);
};

// Test to see if each letter of string is capitalized
const isAllCaps = (text: string): boolean => {
  return text === text.toUpperCase();
};

/**
 * Splits a string into lowercase terms, based these rules in order of importance:
 * - All non-alphanumeric characters indicate a split.
 * - A capital letter followed by small letter indicates a split.
 * - Multiple capital letters are assumed to be a single term (acronym).
 * - Terms may have 1 or more digits at the beginning, middle, or end.
 *
 * For example, following terms would be split like so:
 * foo-bar -> foo, bar
 * foo_-/bar -> foo, bar
 * Foo-Bar -> foo, bar
 * foo bar -> foo, bar
 * FooBar -> foo, bar
 * FooBarBaz -> foo, bar, baz
 * Foo1Bar -> foo1, bar
 * Foo12Bar -> foo12, bar
 * Foo1bAr -> foo1b, ar
 * Foo12bAr -> foo12b, ar
 * 1FooBar -> 1foo, bar
 * 12FooBar -> 12foo, bar
 * FooBar1 -> foo, bar1
 * FooBar12 -> foo, bar12
 * FOOBar -> foo, bar
 * HtmlDivElement -> html, div, element
 * HTMLDivElement -> html, div, element
 *
 * Though this should handle most cases, it won't handle all.  Usage
 * should be for common conventions, and overridable where possible.
 * FOObar -> fo|obar  // Possible incorrect split
 */
export const splitTerms = (text: string, preserveWordsInAllCaps = false): string[] => {
  const terms: string[] = [];
  // Split by any non alphanumeric chars
  // Example: 'Foo-Bar/A1' -> ['Foo', 'Bar', 'A1']
  for (const frag of text.match(ALPHANUMERIC_REGEX) || []) {
    // Split terms by case change
    // Example: 'HTMLDivElement' -> ['html', 'div', 'element']
    for (const term of frag.split(CASE_CHANGE_REGEX)) {
      if (term !== '') {
        const casedTerm = preserveWordsInAllCaps && isAllCaps(term) ? term : term.toLowerCase();
        terms.push(casedTerm);
      }
    }
  }
  return terms;
};

//#endregion
