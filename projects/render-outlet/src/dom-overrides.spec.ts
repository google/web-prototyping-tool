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

import { insertScopedTagNamesIntoHTML, setupDomOverrides } from './dom-overrides';

function getCustomElementClass() {
  class CustomElementTestClass extends HTMLElement {}
  return CustomElementTestClass;
}

describe('Render Outlet DOM Overrides', () => {
  it('should insert scoped custom element tag name', () => {
    const tagName = 'my-custom-element';
    const scopedTagName = 'my-custom-element-1234';
    const tagNameMap = new Map([[tagName, scopedTagName]]);
    const html = '<my-custom-element></my-custom-element>';
    const overriddenHtml = insertScopedTagNamesIntoHTML(html, tagNameMap);
    expect(overriddenHtml).toEqual('<my-custom-element-1234></my-custom-element-1234>');
  });

  it('should not replace instance of tag name in plain text', () => {
    const tagName = 'my-custom-element';
    const scopedTagName = 'my-custom-element-1234';
    const tagNameMap = new Map([[tagName, scopedTagName]]);
    const html = '<span>Information about my-custom-element</span>';
    const overriddenHtml = insertScopedTagNamesIntoHTML(html, tagNameMap);
    expect(overriddenHtml).toEqual(html);
  });

  it('should insert scoped custom element tag name with attributes', () => {
    const tagName = 'my-custom-element';
    const scopedTagName = 'my-custom-element-1234';
    const tagNameMap = new Map([[tagName, scopedTagName]]);
    const html = '<my-custom-element title="foo"></my-custom-element>';
    const overriddenHtml = insertScopedTagNamesIntoHTML(html, tagNameMap);
    expect(overriddenHtml).toEqual('<my-custom-element-1234 title="foo"></my-custom-element-1234>');
  });

  it('should handle html with invalid spaces', () => {
    const tagName = 'my-custom-element';
    const scopedTagName = 'my-custom-element-1234';
    const tagNameMap = new Map([[tagName, scopedTagName]]);
    const html = '< my-custom-element   title="foo" ></  my-custom-element   foo>';
    const expected = '< my-custom-element-1234   title="foo" ></  my-custom-element-1234   foo>';
    const overriddenHtml = insertScopedTagNamesIntoHTML(html, tagNameMap);
    expect(overriddenHtml).toEqual(expected);
  });

  it('should insert scoped custom element tag name into nested html', () => {
    const tagName = 'my-element2';
    const scopedTagName = 'my-element2-1234';
    const tagNameMap = new Map([[tagName, scopedTagName]]);
    const html = '<span><my-element2></my-element2></span>';
    const overriddenHtml = insertScopedTagNamesIntoHTML(html, tagNameMap);
    expect(overriddenHtml).toEqual('<span><my-element2-1234></my-element2-1234></span>');
  });

  it('should not replace tagname that starts the same', () => {
    const tagName = 'my-custom-element';
    const scopedTagName = 'my-custom-element-1234';
    const tagNameMap = new Map([[tagName, scopedTagName]]);
    const html = '<my-custom-element2></my-custom-element2>';
    const overriddenHtml = insertScopedTagNamesIntoHTML(html, tagNameMap);
    expect(overriddenHtml).toEqual('<my-custom-element2></my-custom-element2>');
  });

  it('should insert scoped custom element tag name into complex html', () => {
    const tagName = 'my-custom-element';
    const scopedTagName = 'my-custom-element-1234';
    const tagNameMap = new Map([[tagName, scopedTagName]]);
    const html = `
      <div>
        <my-custom-element>
          my-custom-element
          <a>1234</a>
          <label>Info about &lt;my-custom-element/&gt;</label>
          <my-custom-element></my-custom-element>
        </my-custom-element>
      </div>
    `;
    const expectedHtml = `
      <div>
        <my-custom-element-1234>
          my-custom-element
          <a>1234</a>
          <label>Info about &lt;my-custom-element/&gt;</label>
          <my-custom-element-1234></my-custom-element-1234>
        </my-custom-element-1234>
      </div>
    `;
    const overriddenHtml = insertScopedTagNamesIntoHTML(html, tagNameMap);
    expect(overriddenHtml).toEqual(expectedHtml);
  });

  it('should insert multiple scoped custom element tag names', () => {
    const tagName = 'my-custom-element';
    const scopedTagName = 'my-custom-element-1234';
    const tagName2 = 'my-other-element';
    const scopedTagName2 = 'my-other-element-1234';
    const tagNameMap = new Map([
      [tagName, scopedTagName],
      [tagName2, scopedTagName2],
    ]);
    const html = `
      <my-custom-element>
        <my-custom-element></my-custom-element>
        <my-other-element></my-other-element>
        <my-other-element></my-other-element>
      </my-custom-element>
      <my-other-element>
        <my-other-element></my-other-element>
        <my-custom-element></my-custom-element>
      </my-other-element>
    `;
    const expectedHtml = `
      <my-custom-element-1234>
        <my-custom-element-1234></my-custom-element-1234>
        <my-other-element-1234></my-other-element-1234>
        <my-other-element-1234></my-other-element-1234>
      </my-custom-element-1234>
      <my-other-element-1234>
        <my-other-element-1234></my-other-element-1234>
        <my-custom-element-1234></my-custom-element-1234>
      </my-other-element-1234>
    `;
    const overriddenHtml = insertScopedTagNamesIntoHTML(html, tagNameMap);
    expect(overriddenHtml).toEqual(expectedHtml);
  });

  it('should insert multiple scoped custom element tag names with attributes', () => {
    const tagNameMap = new Map([
      ['mwc-slider', 'mwc-slider-1234'],
      ['mwc-checkbox', 'mwc-checkbox-1234'],
      ['mwc-switch', 'mwc-switch-1234'],
      ['mwc-button', 'mwc-button-1234'],
    ]);
    const html = `
      <mwc-slider value="25" min="10" max="50"></mwc-slider>
      <mwc-checkbox></mwc-checkbox>
      <mwc-switch></mwc-switch>
      <mwc-button label="standard"></mwc-button>
    `;
    const expectedHtml = `
      <mwc-slider-1234 value="25" min="10" max="50"></mwc-slider-1234>
      <mwc-checkbox-1234></mwc-checkbox-1234>
      <mwc-switch-1234></mwc-switch-1234>
      <mwc-button-1234 label="standard"></mwc-button-1234>
    `;
    const overriddenHtml = insertScopedTagNamesIntoHTML(html, tagNameMap);
    expect(overriddenHtml).toEqual(expectedHtml);
  });

  it('should insert scoped custom element tag name regardless of case', () => {
    const tagName = 'my-custom-element';
    const scopedTagName = 'my-custom-element-1234';
    const tagNameMap = new Map([[tagName, scopedTagName]]);
    const html = '<MY-custom-ELEMENT></MY-custom-ELEMENT>';
    const overriddenHtml = insertScopedTagNamesIntoHTML(html, tagNameMap);
    expect(overriddenHtml).toEqual('<my-custom-element-1234></my-custom-element-1234>');
  });

  it('should intercept call to document.createElement', () => {
    setupDomOverrides(window, document);
    const win = window as any;
    win._cdCustomElementsDefineOverride('my-element', getCustomElementClass(), null, '1234');
    const element = document.createElement('my-element');
    const tagName = element.tagName.toLowerCase();
    expect(tagName).toEqual('my-element-1234');
  });

  it('should intercept setting innerHTML', () => {
    setupDomOverrides(window, document);
    const win = window as any;
    win._cdCustomElementsDefineOverride('my-element2', getCustomElementClass(), null, '1234');
    const element = document.createElement('div');
    element.innerHTML = `<span><my-element2></my-element2></span>`;
    expect(element.innerHTML).toEqual(`<span><my-element2-1234></my-element2-1234></span>`);
  });

  it('should intercept setting outerHTML', () => {
    setupDomOverrides(window, document);
    const win = window as any;
    win._cdCustomElementsDefineOverride('my-element3', getCustomElementClass(), null, '1234');
    const element = document.createElement('div');
    const parentElement = document.createElement('div');
    parentElement.appendChild(element);
    element.outerHTML = `<span><my-element3></my-element3></span>`;
    expect(parentElement.innerHTML).toEqual(`<span><my-element3-1234></my-element3-1234></span>`);
  });

  it('should intercept call to insertAdjacentHTML', () => {
    setupDomOverrides(window, document);
    const win = window as any;
    win._cdCustomElementsDefineOverride('my-element4', getCustomElementClass(), null, '1234');
    const element = document.createElement('div');
    element.insertAdjacentHTML('afterbegin', `<span><my-element4></my-element4></span>`);
    expect(element.innerHTML).toEqual(`<span><my-element4-1234></my-element4-1234></span>`);
  });
});
