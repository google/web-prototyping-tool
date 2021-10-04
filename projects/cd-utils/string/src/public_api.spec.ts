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

import * as stringUtils from './public_api';

const CASE_DATA = [
  'FooBar',
  'fooBar',
  'foo Bar',
  'Foo bar',
  'Foo Bar',
  'foo bar',
  ' foo  bar ',
  'foo_bar',
  'foo-bar',
  'foo%^bar_',
  '!foo $bar ',
  '  foo!bar%#',
];

describe('StringUtils', () => {
  describe('incrementedName', () => {
    it('Should increment names', () => {
      const normalName = stringUtils.incrementedName('Board', ['Board', 'Board 2', 'Board 3']);
      expect(normalName).toEqual('Board 4');

      const skipName = stringUtils.incrementedName('Board', ['Board', 'Board 2', 'Board 4']);
      expect(skipName).toEqual('Board 5');
    });

    it('Should increment names with space', () => {
      const normalName = stringUtils.incrementedName('My Symbol', [
        'My Symbol',
        'My Symbol 2',
        'My Symbol 3',
      ]);
      expect(normalName).toEqual('My Symbol 4');

      const skipName = stringUtils.incrementedName('My Symbol', [
        'My Symbol',
        'My Symbol 2',
        'My Symbol 4',
      ]);
      expect(skipName).toEqual('My Symbol 5');
    });

    it('Should use offset if provided', () => {
      const normalName = stringUtils.incrementedName('Board', ['Board 1', 'Board 2', 'Board 3'], 2);
      expect(normalName).toEqual('Board 6');
    });
  });

  describe('Casing', () => {
    it('toSentenceCase', () => {
      for (const item of CASE_DATA) {
        expect(stringUtils.toSentenceCase(item)).toEqual('Foo bar');
      }
    });

    it('toSpacedCase', () => {
      for (const item of CASE_DATA) {
        expect(stringUtils.toSpacedCase(item)).toEqual('foo bar');
      }
    });

    it('toTitleCase', () => {
      for (const item of CASE_DATA) {
        expect(stringUtils.toTitleCase(item)).toEqual('Foo Bar');
      }
    });

    it('toCamelCase', () => {
      for (const item of CASE_DATA) {
        expect(stringUtils.toCamelCase(item)).toEqual('fooBar');
      }
    });

    it('toPascalCase', () => {
      for (const item of CASE_DATA) {
        expect(stringUtils.toPascalCase(item)).toEqual('FooBar');
      }
    });

    // TODO: Enable when obsolete methods are removed.
    /*it('toKebabCase', () => {
      for (const item of CASE_DATA) {
        expect(stringUtils.toKebabCase(item)).toEqual('foo-bar');
      }
    });*/

    it('toSnakeCase', () => {
      for (const item of CASE_DATA) {
        expect(stringUtils.toSnakeCase(item)).toEqual('foo_bar');
      }
    });

    it('splitTerms', () => {
      expect(stringUtils.splitTerms('foo-bar')).toEqual(['foo', 'bar']);
      expect(stringUtils.splitTerms('foo_-/bar')).toEqual(['foo', 'bar']);
      expect(stringUtils.splitTerms('#!/foo# ~bar')).toEqual(['foo', 'bar']);
      expect(stringUtils.splitTerms('foo|bar$(*')).toEqual(['foo', 'bar']);
      expect(stringUtils.splitTerms('FooBar')).toEqual(['foo', 'bar']);
      expect(stringUtils.splitTerms('Foo-Bar')).toEqual(['foo', 'bar']);
      expect(stringUtils.splitTerms('foo bar')).toEqual(['foo', 'bar']);
      expect(stringUtils.splitTerms('FooBarBaz')).toEqual(['foo', 'bar', 'baz']);
      expect(stringUtils.splitTerms('Foo1Bar')).toEqual(['foo1', 'bar']);
      expect(stringUtils.splitTerms('Foo12Bar')).toEqual(['foo12', 'bar']);
      expect(stringUtils.splitTerms('Foo1bAr')).toEqual(['foo1b', 'ar']);
      expect(stringUtils.splitTerms('Foo12bAr')).toEqual(['foo12b', 'ar']);
      expect(stringUtils.splitTerms('1FooBar')).toEqual(['1foo', 'bar']);
      expect(stringUtils.splitTerms('12FooBar')).toEqual(['12foo', 'bar']);
      expect(stringUtils.splitTerms('FooBar1')).toEqual(['foo', 'bar1']);
      expect(stringUtils.splitTerms('FooBar12')).toEqual(['foo', 'bar12']);
      expect(stringUtils.splitTerms('FOOBar')).toEqual(['foo', 'bar']);
      expect(stringUtils.splitTerms('HtmlDivElement')).toEqual(['html', 'div', 'element']);
      expect(stringUtils.splitTerms('HTMLDivElement')).toEqual(['html', 'div', 'element']);
    });

    it('should preserve words in all-caps when converting to sentence case', () => {
      expect(stringUtils.toSentenceCase('external-IP', true)).toEqual('External IP');
    });
  });

  describe('Char trimming', () => {
    it('trims start of string', () => {
      expect(stringUtils.trimStart('/', '/test/')).toBe('test/');
      expect(stringUtils.trimStart('/', '//test')).toBe('test');
    });

    it('trims end of string', () => {
      expect(stringUtils.trimEnd('/', '/test/')).toBe('/test');
      expect(stringUtils.trimEnd('/', 'test//')).toBe('test');
    });

    it('trims a char on string', () => {
      expect(stringUtils.trimChar('/', '/test/')).toBe('test');
      expect(stringUtils.trimChar('/', '//test//')).toBe('test');
    });
  });

  describe('formatStringWithArguments', () => {
    it('formats a string', () => {
      const result = stringUtils.formatStringWithArguments('foo {0} bar {1}', 'baz', 123);
      expect(result).toBe('foo baz bar 123');
    });
  });
});
