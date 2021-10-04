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

import * as codeComponentUtils from './code-component.utils';

describe('Code Componenent Utils', () => {
  it('should create scoped tagname', () => {
    const tagName = 'my-custom-element';
    const id = '1234';
    const scopedTagname = codeComponentUtils.getCodeComponentScopedTagName(id, tagName);
    expect(scopedTagname).toEqual('my-custom-element-1234');
  });

  it('should accept valid tag name', () => {
    const tagName = 'my-custom-element';
    expect(codeComponentUtils.validateTagname(tagName)).toEqual(true);
  });

  it('should reject tag name that starts with a number', () => {
    const tagName = '1234-my-custom-element';
    expect(codeComponentUtils.validateTagname(tagName)).toEqual(false);
  });

  it('should reject tag name that is too long', () => {
    const tagName = 'my-really-long-custom-element-name-asdfasdfasdfasdfasdfasdfasdfasdfasdf';
    expect(codeComponentUtils.validateTagname(tagName)).toEqual(false);
  });

  it('should reject tag name that has capital letters', () => {
    const tagName = 'my-CUSTOM-element';
    expect(codeComponentUtils.validateTagname(tagName)).toEqual(false);
  });

  it('should reject tag name that contains brackets', () => {
    const tagName = '<my-custom-element>';
    expect(codeComponentUtils.validateTagname(tagName)).toEqual(false);
  });

  it('should reject tag name with special character', () => {
    const tagName = 'my-custom-%#$-element';
    expect(codeComponentUtils.validateTagname(tagName)).toEqual(false);
  });

  it('should reject forbidden tag name', () => {
    const tagName = 'font-face';
    expect(codeComponentUtils.validateTagname(tagName)).toEqual(false);
  });

  it('should accept valid input name', () => {
    expect(codeComponentUtils.validateInputOutputName('foo_BAR-1234')).toEqual(true);
  });

  it('should accept valid input name that starts with an uppercase', () => {
    expect(codeComponentUtils.validateInputOutputName('Foo_BAR-1234')).toEqual(true);
  });

  it('should reject input name that starts with a number', () => {
    expect(codeComponentUtils.validateInputOutputName('1234')).toEqual(false);
  });

  it('should reject input name that starts with a underscore', () => {
    expect(codeComponentUtils.validateInputOutputName('_foo')).toEqual(false);
  });

  it('should reject input name that starts with a hyphen', () => {
    expect(codeComponentUtils.validateInputOutputName('-foo')).toEqual(false);
  });

  it('should reject input name that contains invalid characters', () => {
    expect(codeComponentUtils.validateInputOutputName('foo*')).toEqual(false);
  });
});
