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
import * as consts from 'cd-common/consts';
import { CdComponent } from './component';
import { TemplateFactory } from './template.utils';
import { checkExportTemplate, checkTemplate } from './test.utils';
import {
  BindingType,
  CoerceValue,
  OutputPropertyType,
  PropertyInput,
  TemplateBuildMode,
  TemplateFunction,
} from 'cd-interfaces';
import { buildChildPortal } from './portal.utils';

/**
 * Tests the internal rendering of components.
 * Matching tests for exported templates are below.
 */
describe('Internal Component Template', () => {
  it('adds default attributes', () => {
    const component = new CdComponent('', { tagName: 'div' });
    checkTemplate(component, `<div ${defaultAttrs()}></div>`);
  });

  it('renders correct tag', () => {
    const component = new CdComponent('', { tagName: 'test' });
    checkTemplate(component, `<test ${defaultAttrs()}></test>`);
  });

  it('adds fit content class', () => {
    const component = new CdComponent('', { tagName: 'div', fitContent: true });
    checkTemplate(component, `<div ${defaultAttrs([consts.FIT_CONTENT_CLASS])}></div>`);
  });

  it('adds CSS class', () => {
    const component = new CdComponent('', { tagName: 'div', css: ['test'] });
    checkTemplate(component, `<div ${defaultAttrs(['test'])}></div>`);
  });

  it('adds bound CSS class', () => {
    const component = new CdComponent('', {
      tagName: 'div',
      css: [
        { name: 'test', binding: 'inputName' },
        { name: 'test1', binding: 'input-name' },
      ],
    });
    checkTemplate(
      component,
      `
        <div ${defaultAttrs()} [class.test]="props?.inputs?.inputName" [class.test1]="props?.inputs['input-name']"></div>
      `
    );
  });

  it('adds attributes', () => {
    const component = new CdComponent('', {
      tagName: 'div',
      attrs: {
        test: 'foo',
        testInt: 123,
        testTrue: true,
        testFalse: false,
        testNull: null as any,
        testUndefined: undefined as any,
        testZero: 0,
        testBooleanString: 'true',
      },
    });
    checkTemplate(
      component,
      `<div ${defaultAttrs()} test="foo" testInt="123" testTrue testZero="0" testBooleanString="true"></div>`
    );
  });

  it('adds property binding', () => {
    const component = new CdComponent('', {
      tagName: 'div',
      properties: [
        { name: 'test', bindingType: BindingType.Property },
        { name: 'another-test', bindingType: BindingType.Property },
      ],
    });
    checkTemplate(
      component,
      `
        <div ${defaultAttrs()} [test]="props?.inputs?.test" [another-test]="props?.inputs['another-test']"></div>
      `
    );
  });

  it('adds property binding with type coercion', () => {
    const component = new CdComponent('', {
      tagName: 'div',
      properties: [
        { name: 'test', bindingType: BindingType.Property, coerceType: CoerceValue.String },
      ],
    });
    checkTemplate(
      component,
      `
        <div ${defaultAttrs()} [test]="props?.inputs?.test | coerceStringPipe"></div>
      `
    );
  });

  it('does not add properties as attributes via `exportPropsAsAttrs`', () => {
    const component = new CdComponent('', {
      tagName: 'div',
      exportPropsAsAttrs: true,
      properties: [{ name: 'test', bindingType: BindingType.Property }],
    });
    checkTemplate(component, `<div ${defaultAttrs()} [test]="props?.inputs?.test"></div>`);
  });

  it('adds attribute binding', () => {
    const component = new CdComponent('', {
      tagName: 'div',
      properties: [{ name: 'test', bindingType: BindingType.Attribute }],
    });
    checkTemplate(
      component,
      `
      <div ${defaultAttrs()}
        [attr.test]="props?.inputs?.test | conditionalAttrPipe"></div>
      `
    );
  });

  it('adds inner text binding', () => {
    const component = new CdComponent('', {
      tagName: 'div',
      properties: [{ name: 'test', bindingType: BindingType.InnerText }],
    });
    checkTemplate(component, `<div ${defaultAttrs()}>{{ props?.inputs?.test }}</div>`);
  });

  it('adds inner html binding', () => {
    const component = new CdComponent('', {
      tagName: 'div',
      properties: [{ name: 'test', bindingType: BindingType.InnerHtml }],
    });
    checkTemplate(
      component,
      `<div ${defaultAttrs()} [cdTextInject]="props?.inputs?.test" [richText]="props?.inputs?.richText"></div>`
    );
  });

  it('adds dataset binding', () => {
    const component = new CdComponent('', {
      tagName: 'div',
      properties: [{ name: 'test', inputType: PropertyInput.DatasetSelect }],
    });
    checkTemplate(
      component,
      `
      <div ${defaultAttrs()}
        [test]="props?.inputs?.test | datasetLookupPipe:dataBindingRefreshTrigger"></div>
      `
    );
  });

  it('adds tag name binding', () => {
    const component = new CdComponent('', {
      properties: [
        {
          name: 'type',
          bindingType: BindingType.TagName,
          menuData: [
            { title: 'Foo', value: 'foo' },
            { title: 'Bar', value: 'bar' },
          ],
        },
      ],
    });
    checkTemplate(
      component,
      `
        <ng-container [ngSwitch]="props?.inputs?.type">
          <foo ${defaultAttrs()} *ngSwitchCase="'foo'"></foo>
          <bar ${defaultAttrs()} *ngSwitchCase="'bar'"></bar>
        </ng-container>
      `
    );
  });

  it('adds CSS variable binding', () => {
    const component = new CdComponent('', {
      tagName: 'div',
      properties: [{ name: '--foo', bindingType: BindingType.CssVar }],
    });
    checkTemplate(
      component,
      `<div ${defaultAttrs()} [style.--foo]="props?.inputs['--foo'] | cssVarPipe"></div>`
    );
  });

  it('overrides binding input name', () => {
    const component = new CdComponent('', {
      tagName: 'div',
      properties: [
        { name: 'testProp', bindingType: BindingType.Property, inputName: 'propInput' },
        { name: 'testAttr', bindingType: BindingType.Attribute, inputName: 'attrInput' },
        { name: 'testText', bindingType: BindingType.InnerText, inputName: 'textInput' },
        { name: 'testHtml', bindingType: BindingType.InnerHtml, inputName: 'htmlInput' },
        { name: '--test-css-var', bindingType: BindingType.CssVar, inputName: 'cssVarInput' },
        { name: 'testData', inputType: PropertyInput.DatasetSelect, inputName: 'dataInput' },
      ],
    });
    checkTemplate(
      component,
      `
        <div ${defaultAttrs()}
          [testProp]="props?.inputs?.propInput"
          [attr.testAttr]="props?.inputs?.attrInput | conditionalAttrPipe"
          [cdTextInject]="props?.inputs?.htmlInput"
          [richText]="props?.inputs?.richText"
          [style.--test-css-var]="props?.inputs?.cssVarInput | cssVarPipe"
          [testData]="props?.inputs?.dataInput | datasetLookupPipe:dataBindingRefreshTrigger">
            {{ props?.inputs?.textInput }}
        </div>
      `
    );
  });

  it('overrides tag binding input name', () => {
    const component = new CdComponent('', {
      properties: [
        {
          name: 'type',
          bindingType: BindingType.TagName,
          inputName: 'tagInput',
          menuData: [
            { title: 'Foo', value: 'foo' },
            { title: 'Bar', value: 'bar' },
          ],
        },
      ],
    });
    checkTemplate(
      component,
      `
        <ng-container [ngSwitch]="props?.inputs?.tagInput">
          <foo ${defaultAttrs()} *ngSwitchCase="'foo'"></foo>
          <bar ${defaultAttrs()} *ngSwitchCase="'bar'"></bar>
        </ng-container>
      `
    );
  });

  it('adds output binding', () => {
    const component = new CdComponent('', {
      tagName: 'input',
      outputs: [
        {
          binding: 'my-event',
          type: OutputPropertyType.String,
          label: 'My Event',
          icon: '',
        },
      ],
    });
    checkTemplate(
      component,
      `
        <input ${defaultAttrs()} (my-event)="onOutputChange($event,elementId,'my-event')">
      `
    );
  });

  it('adds output binding with `eventName`', () => {
    const component = new CdComponent('', {
      tagName: 'input',
      outputs: [
        {
          binding: 'my-binding',
          eventName: 'another-event',
          type: OutputPropertyType.String,
          label: 'My Event',
          icon: '',
        },
      ],
    });
    checkTemplate(
      component,
      `
        <input ${defaultAttrs()} (another-event)="onOutputChange($event,elementId,'my-binding')">
      `
    );
  });

  it('adds output binding with `eventKey`', () => {
    const component = new CdComponent('', {
      tagName: 'input',
      outputs: [
        {
          binding: 'value',
          eventName: 'custom-event',
          type: OutputPropertyType.String,
          label: 'My Event',
          icon: '',
          eventKey: 'target.value',
        },
      ],
    });
    checkTemplate(
      component,
      `
        <input ${defaultAttrs()} (custom-event)="onOutputChange($event.target.value,elementId,'value')">
      `
    );
  });

  it('adds output binding without writing value', () => {
    const component = new CdComponent('', {
      tagName: 'input',
      outputs: [
        {
          binding: 'my-event',
          type: OutputPropertyType.None,
          label: 'My Event',
          icon: '',
        },
      ],
    });
    checkTemplate(
      component,
      `
        <input ${defaultAttrs()} (my-event)="onOutputChange($event,elementId,'my-event',false)">
      `
    );
  });

  it('adds simple variants', () => {
    const component = new CdComponent('', {
      variants: {
        foo: { tagName: 'foo' },
        bar: { tagName: 'bar' },
      },
      properties: [
        {
          name: 'type',
          bindingType: BindingType.Variant,
          menuData: [
            { title: 'Foo', value: 'foo' },
            { title: 'Bar', value: 'bar' },
          ],
        },
      ],
    });
    checkTemplate(
      component,
      `
        <ng-container [ngSwitch]="props?.inputs?.type">
          <foo ${defaultAttrs()} *ngSwitchCase="'foo'"></foo>
          <bar ${defaultAttrs()} *ngSwitchCase="'bar'"></bar>
        </ng-container>
      `
    );
  });

  it('adds complex variants', () => {
    const component = new CdComponent('', {
      variants: {
        type1: {
          tagName: 'tag1',
          css: ['test-css'],
          attrs: { 'test-attr': 123 },
        },
        type2: { tagName: 'tag2', fitContent: true },
      },
      properties: [
        {
          name: 'type',
          bindingType: BindingType.Variant,
          menuData: [
            { title: 'Tag 1', value: 'type1' },
            { title: 'Tag 2', value: 'type2' },
          ],
        },
        {
          name: 'innerText',
          bindingType: BindingType.InnerText,
          variant: 'type1',
        },
        {
          name: 'tag1prop',
          bindingType: BindingType.Property,
          variant: 'type1',
        },
        {
          name: 'tag2prop',
          bindingType: BindingType.Property,
          variant: 'type2',
        },
        {
          name: 'tag1attr',
          bindingType: BindingType.Attribute,
          variant: 'type1',
        },
        {
          name: 'tag2attr',
          bindingType: BindingType.Attribute,
          variant: 'type2',
        },
      ],
    });
    checkTemplate(
      component,
      `
        <ng-container [ngSwitch]="props?.inputs?.type">
          <tag1 ${defaultAttrs(['test-css'])}
            test-attr="123"
            [tag1prop]="props?.inputs?.tag1prop"
            [attr.tag1attr]="props?.inputs?.tag1attr | conditionalAttrPipe"
            *ngSwitchCase="'type1'">
            {{ props?.inputs?.innerText }}
          </tag1>
          <tag2 ${defaultAttrs([consts.FIT_CONTENT_CLASS])}
            [tag2prop]="props?.inputs?.tag2prop"
            [attr.tag2attr]="props?.inputs?.tag2attr | conditionalAttrPipe"
            *ngSwitchCase="'type2'">
          </tag2>
        </ng-container>
      `
    );
  });

  it('adds a wrapper', () => {
    const component = new CdComponent('', {
      tagName: 'my-component',
      wrapperTag: 'div',
      properties: [
        {
          name: 'test',
          bindingType: BindingType.Property,
        },
      ],
    });
    checkTemplate(
      component,
      `
      <div ${defaultAttrs()}>
        <my-component [test]="props?.inputs?.test"></my-component>
      </div>
      `
    );
  });

  it('adds a wrapper with fit content', () => {
    const component = new CdComponent('', {
      tagName: 'my-component',
      wrapperTag: 'div',
      fitContent: true,
    });
    checkTemplate(
      component,
      `
      <div ${defaultAttrs([consts.FIT_CONTENT_CLASS])}>
        <my-component></my-component>
      </div>
      `
    );
  });

  it('adds a wrapper with initial attributes/CSS', () => {
    const component = new CdComponent('', {
      tagName: 'my-component',
      wrapperTag: 'div',
      css: ['my-css'],
      attrs: { test: 123 },
    });
    checkTemplate(
      component,
      `
      <div ${defaultAttrs()}>
        <my-component class="my-css" test="123"></my-component>
      </div>
      `
    );
  });

  it('adds a child via string', () => {
    const component = new CdComponent('', {
      tagName: 'div',
      children: ['foo'],
    });
    checkTemplate(component, `<div ${defaultAttrs()}>foo</div>`);
  });

  it('adds a child via template function', () => {
    const component = new CdComponent('', {
      tagName: 'div',
      children: [templateFunction as TemplateFunction],
    });
    checkTemplate(
      component,
      `<div ${defaultAttrs()}>
        <span [value]="props?.inputs?.value">{{ props?.inputs?.text }}</span>
      </div>`
    );
  });

  it('adds a child via child component instance', () => {
    const child = new CdComponent('', {
      tagName: 'span',
      properties: [
        { name: 'text', bindingType: BindingType.InnerText },
        { name: 'value', bindingType: BindingType.Property },
      ],
    });
    const component = new CdComponent('', {
      tagName: 'div',
      children: [child],
    });
    checkTemplate(
      component,
      `
      <div ${defaultAttrs()}>
        <span [value]="props?.inputs?.value">{{ props?.inputs?.text }}</span>
      </div>`
    );
  });

  it('adds a child via child component class', () => {
    class ChildComponent extends CdComponent {
      tagName = 'span';
      properties = [
        { name: 'text', bindingType: BindingType.InnerText },
        { name: 'value', bindingType: BindingType.Property },
      ];
    }
    const component = new CdComponent('', {
      tagName: 'div',
      children: [ChildComponent],
    });
    checkTemplate(
      component,
      `
      <div ${defaultAttrs()}>
        <span [value]="props?.inputs?.value">{{ props?.inputs?.text }}</span>
      </div>`
    );
  });

  it('adds children recursively w/ complex structure', () => {
    const child = {
      tagName: 'p',
      properties: [{ name: 'foo', bindingType: BindingType.Property }],
      children: [templateFunction],
    };
    const component = new CdComponent('', {
      tagName: 'div',
      children: [child],
    });
    checkTemplate(
      component,
      `
      <div ${defaultAttrs()}>
        <p [foo]="props?.inputs?.foo">
          <span [value]="props?.inputs?.value">{{ props?.inputs?.text }}</span>
        </p>
      </div>`
    );
  });

  it('adds logic if binding', () => {
    const component = new CdComponent('', { tagName: 'div', bindIf: 'value' });
    checkTemplate(component, `<div ${defaultAttrs()} *ngIf="props?.inputs?.value"></div>`);
  });

  it('adds dataBindable input', () => {
    const properties = [{ name: 'foo', bindingType: BindingType.Property, dataBindable: true }];
    const component = new CdComponent('', { tagName: 'div', properties });

    checkTemplate(
      component,
      `<div ${defaultAttrs()} [foo]="props?.inputs?.foo | dataBindingLookupPipe:dataBindingRefreshTrigger"></div>`
    );
  });

  it('adds a portal slot', () => {
    const properties = [
      {
        inputType: PropertyInput.PortalSlot,
        name: 'portal-slot-name',
      },
    ];
    const component = new CdComponent('', { tagName: 'div', properties });
    checkTemplate(
      component,
      `<div ${defaultAttrs()}>
        ${buildChildPortal(`props?.inputs['portal-slot-name']`, false, 'portal-slot-name')}
      </div>
    `
    );
  });

  it('adds a dynamic list of portal slots', () => {
    const properties = [
      {
        inputType: PropertyInput.DynamicList,
        name: 'steps',
        schema: [
          {
            inputType: PropertyInput.PortalSlot,
            name: 'step-slot',
          },
        ],
      },
    ];

    const component = new CdComponent('', { tagName: 'div', properties });
    checkTemplate(
      component,
      `
        <div ${defaultAttrs()} [steps]="props?.inputs?.steps">
          <ng-container *ngFor="let slot of props?.inputs?.steps; let i = index">
            ${buildChildPortal(`props?.inputs?.steps[i]['step-slot']`, true, 'step-slot', true)}
          </ng-container>
        </div>
      `
    );
  });
});

/**
 * Tests the export rendering of components.
 * Matching tests for internal templates are above.
 */
describe('Exported Component Template', () => {
  it('does not add default attributes', () => {
    const component = new CdComponent('', { tagName: 'div' });
    checkExportTemplate(component, '<div></div>');
  });

  it('renders correct tag', () => {
    const component = new CdComponent('', { tagName: 'test' });
    checkExportTemplate(component, '<test></test>');
  });

  it('does not add fit content class', () => {
    const component = new CdComponent('', { tagName: 'div', fitContent: true });
    checkExportTemplate(component, '<div></div>');
  });

  it('adds CSS class', () => {
    const component = new CdComponent('', { tagName: 'div', css: ['test'] });
    checkExportTemplate(component, '<div class="test"></div>');
  });

  it('adds bound CSS class', () => {
    const component = new CdComponent('', {
      tagName: 'div',
      css: [
        { name: 'test', binding: 'inputName' },
        { name: 'test1', binding: 'input-name' },
      ],
    });
    checkExportTemplate(
      component,
      `
        <div class="test test1"></div>
      `,
      { inputName: true, 'input-name': 'true' }
    );
  });

  it('adds attributes', () => {
    const component = new CdComponent('', {
      tagName: 'div',
      attrs: {
        test: 'foo',
        testInt: 123,
        testTrue: true,
        testFalse: false,
        testNull: null as any,
        testUndefined: undefined as any,
        testZero: 0,
        testBooleanString: 'true',
      },
    });
    checkExportTemplate(
      component,
      `<div test="foo" testInt="123" testTrue testZero="0" testBooleanString="true"></div>`
    );
  });

  it('does not add property binding as attribute', () => {
    const component = new CdComponent('', {
      tagName: 'div',
      properties: [{ name: 'test', bindingType: BindingType.Property }],
    });
    checkExportTemplate(component, '<div></div>', { test: 'foo' });
  });

  it('adds properties as attributes via `exportPropsAsAttrs`', () => {
    const component = new CdComponent('', {
      tagName: 'div',
      exportPropsAsAttrs: true,
      properties: [{ name: 'test', bindingType: BindingType.Property }],
    });
    checkExportTemplate(component, '<div test="foo"></div>', { test: 'foo' });
  });

  it('adds attribute bindings as attributes', () => {
    const component = new CdComponent('', {
      tagName: 'div',
      properties: [
        { name: 'test-int', bindingType: BindingType.Attribute },
        { name: 'test-zero', bindingType: BindingType.Attribute },
        { name: 'test-str', bindingType: BindingType.Attribute },
        { name: 'test-true', bindingType: BindingType.Attribute },
        { name: 'test-false', bindingType: BindingType.Attribute },
        { name: 'test-null', bindingType: BindingType.Attribute },
        { name: 'test-undefined', bindingType: BindingType.Attribute },
      ],
    });
    checkExportTemplate(
      component,
      '<div test-int="123" test-zero="0" test-str="str" test-true></div>',
      {
        'test-int': 123,
        'test-zero': 0,
        'test-str': 'str',
        'test-true': true,
        'test-false': false,
        'test-null': null,
        'test-undefined': undefined,
      }
    );
  });

  it('adds inner text binding as inner text', () => {
    const component = new CdComponent('', {
      tagName: 'div',
      properties: [{ name: 'test', bindingType: BindingType.InnerText }],
    });
    checkExportTemplate(component, '<div>foo bar</div>', { test: 'foo bar' });
  });

  it('adds inner html binding', () => {
    const component = new CdComponent('', {
      tagName: 'div',
      properties: [{ name: 'test', bindingType: BindingType.InnerHtml }],
    });
    checkExportTemplate(component, '<div><span>foo</span></div>', { test: '<span>foo</span>' });
  });

  it('does not add dataset binding attribute', () => {
    const component = new CdComponent('', {
      tagName: 'div',
      properties: [{ name: 'test', inputType: PropertyInput.DatasetSelect }],
    });
    checkExportTemplate(component, '<div></div>', { test: 'mydataset' });
  });

  it('renders current tag for tag name binding', () => {
    const component = new CdComponent('', {
      properties: [
        {
          name: 'type',
          bindingType: BindingType.TagName,
          menuData: [
            { title: 'Foo', value: 'foo' },
            { title: 'Bar', value: 'bar' },
          ],
        },
      ],
    });
    checkExportTemplate(component, '<foo></foo>', { type: 'foo' });
    checkExportTemplate(component, '<bar></bar>', { type: 'bar' });
  });

  it('adds css variable', () => {
    // TODO: How to handle export for CSS var?
  });

  it('overrides binding input name', () => {
    const component = new CdComponent('', {
      tagName: 'div',
      properties: [
        { name: 'testProp', bindingType: BindingType.Property, inputName: 'propInput' },
        { name: 'testAttr', bindingType: BindingType.Attribute, inputName: 'attrInput' },
        { name: 'testText', bindingType: BindingType.InnerText, inputName: 'textInput' },
      ],
      exportPropsAsAttrs: true,
    });
    checkExportTemplate(
      component,
      `
        <div testProp="foo" testAttr="bar">baz</div>
      `,
      { propInput: 'foo', attrInput: 'bar', textInput: 'baz' }
    );
  });

  it('overrides tag binding input name', () => {
    const component = new CdComponent('', {
      properties: [
        {
          name: 'type',
          bindingType: BindingType.TagName,
          inputName: 'tagInput',
          menuData: [
            { title: 'Foo', value: 'foo' },
            { title: 'Bar', value: 'bar' },
          ],
        },
      ],
    });
    checkExportTemplate(
      component,
      `
        <foo></foo>
      `,
      { tagInput: 'foo' }
    );
  });

  it('does not add output binding', () => {
    const component = new CdComponent('', {
      tagName: 'input',
      outputs: [
        {
          binding: 'my-binding',
          type: OutputPropertyType.String,
          label: 'My Event',
          icon: '',
        },
      ],
    });
    checkExportTemplate(
      component,
      `
        <input>
      `
    );
  });

  it('renders current tag for simple variants', () => {
    const component = new CdComponent('', {
      variants: {
        foo: { tagName: 'foo' },
        bar: { tagName: 'bar' },
      },
      properties: [
        {
          name: 'type',
          bindingType: BindingType.Variant,
          menuData: [
            { title: 'Foo', value: 'foo' },
            { title: 'Bar', value: 'bar' },
          ],
        },
      ],
    });
    checkExportTemplate(component, '<foo></foo>', { type: 'foo' });
    checkExportTemplate(component, '<bar></bar>', { type: 'bar' });
  });

  it('renders current tag for complex variants', () => {
    const component = new CdComponent('', {
      variants: {
        type1: {
          tagName: 'tag1',
          css: ['test-css'],
          attrs: { 'test-attr': 123 },
        },
        type2: { tagName: 'tag2', fitContent: true },
      },
      properties: [
        {
          name: 'type',
          bindingType: BindingType.Variant,
          menuData: [
            { title: 'Tag 1', value: 'type1' },
            { title: 'Tag 2', value: 'type2' },
          ],
        },
        {
          name: 'innerText',
          bindingType: BindingType.InnerText,
          variant: 'type1',
        },
        {
          name: 'tag1prop',
          bindingType: BindingType.Property,
          variant: 'type1',
        },
        {
          name: 'tag2prop',
          bindingType: BindingType.Property,
          variant: 'type2',
        },
        {
          name: 'tag1attr',
          bindingType: BindingType.Attribute,
          variant: 'type1',
        },
        {
          name: 'tag2attr',
          bindingType: BindingType.Attribute,
          variant: 'type2',
        },
      ],
    });
    checkExportTemplate(
      component,
      '<tag1 class="test-css" test-attr="123" tag1attr="foo">foo bar</tag1>',
      {
        type: 'type1',
        tag1prop: '123',
        tag2prop: '345',
        tag1attr: 'foo',
        tag2attr: true,
        innerText: 'foo bar',
      }
    );
    checkExportTemplate(component, '<tag2 tag2attr="baz"></tag2>', {
      type: 'type2',
      tag1prop: '123',
      tag2prop: '345',
      tag1attr: 'bar',
      tag2attr: 'baz',
      innerText: 'foo bar',
    });
  });

  it('does not add a wrapper', () => {
    const component = new CdComponent('', {
      tagName: 'my-component',
      wrapperTag: 'div',
    });
    checkExportTemplate(
      component,
      `
      <my-component></my-component>
      `
    );
  });

  it('adds a child via string', () => {
    const component = new CdComponent('', {
      tagName: 'div',
      children: ['foo'],
    });
    checkExportTemplate(component, '<div>foo</div>');
  });

  it('adds a child via template function', () => {
    const component = new CdComponent('', {
      tagName: 'div',
      children: [templateFunction as TemplateFunction],
    });
    checkExportTemplate(component, '<div><span value="foo">bar</span></div>', {
      value: 'foo',
      text: 'bar',
    });
  });

  it('adds a child via child component instance', () => {
    const child = new CdComponent('', {
      tagName: 'span',
      properties: [
        { name: 'text', bindingType: BindingType.InnerText },
        { name: 'value', bindingType: BindingType.Property },
      ],
    });
    const component = new CdComponent('', {
      tagName: 'div',
      exportPropsAsAttrs: true,
      children: [child],
    });
    checkExportTemplate(component, '<div><span value="bar">baz</span></div>', {
      value: 'bar',
      text: 'baz',
    });
  });

  it('adds a child via child component class', () => {
    class ChildComponent extends CdComponent {
      tagName = 'span';
      properties = [
        { name: 'text', bindingType: BindingType.InnerText },
        { name: 'value', bindingType: BindingType.Property },
      ];
    }
    const component = new CdComponent('', {
      tagName: 'div',
      exportPropsAsAttrs: true,
      children: [ChildComponent],
    });
    checkExportTemplate(component, '<div><span value="bar">baz</span></div>', {
      value: 'bar',
      text: 'baz',
    });
  });

  it('adds children recursively w/ complex structure', () => {
    const child = {
      tagName: 'p',
      properties: [{ name: 'foo', bindingType: BindingType.Property }],
      children: [templateFunction],
    };
    const component = new CdComponent('', {
      tagName: 'div',
      exportPropsAsAttrs: true,
      children: [child],
    });
    checkExportTemplate(
      component,
      `
      <div>
        <p foo="baz"><span value="foo">bar</span></p>
      </div>`,
      { foo: 'baz', value: 'foo', text: 'bar' }
    );
  });

  it('does not add logic if binding', () => {
    const component = new CdComponent('', { tagName: 'div', bindIf: 'value' });
    checkExportTemplate(component, `<div></div>`);
  });
});

const defaultAttrs = (css: string[] = []) => {
  return `
    [class.cd-render-rect-marker]="!instanceId"
    class="cd-rendered-element${css.length ? ' ' + css.join(' ') : ''}"
    [attr.data-id]="elementId"
    [attr.data-full-id-path]="elementId | fullIdPathPipe : ancestors"
    [cdStyle]="styleMap[elementId]"
    [classPrefix]="elementClassPrefix"
    [class.cd-preview-styles]="props?.showPreviewStyles"
    [cdHidden]="props?.inputs?.hidden | dataBindingLookupPipe:dataBindingRefreshTrigger | coerceBooleanPipe"
    [cdCoTooltip]="props?.inputs?.tooltipLabel"
    [cdCoTooltipPosition]="props?.inputs?.tooltipPosition"
    [cdAttrs]="props?.attrs"
    [cdA11yAttrs]="props?.a11yInputs"
  `;
};

// Renders `<span [value]="props?.inputs?.value">{{props?.inputs?.text}}</span>`
// @ts-ignore
function templateFunction(mode: TemplateBuildMode, props: any = {}) {
  const html = new TemplateFactory(mode, 'span')
    .ifInternal((me) => {
      me.addInnerTextBinding('text').addPropsBoundInputAttribute('value');
    })
    .ifExport((me) => {
      me.addAttribute('value', props.inputs['value']).addChild(props.inputs['text']);
    })
    .build();
  return html;
}
