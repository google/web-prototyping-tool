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
import { CdComponent } from './component';
import { register, clearRegistry } from './registry';
import { CdComponentFactory } from './component-factory';
import { createInstance } from './instance.utils';

const TEST_CMP_ID = 'test-cmp-id';
const TEST_PROJECT_ID = 'project-id';
const TEST_ID = 'test-cmp';

describe('Component', () => {
  beforeAll(clearRegistry);

  it('is constructed', () => {
    const cmp = new CdComponent(TEST_CMP_ID, { tagName: 'foo' });
    expect(cmp.id).toBe(TEST_CMP_ID);
    expect(cmp.tagName).toBe('foo');
    expect(cmp.properties).not.toBeUndefined();
    expect(cmp.properties.length).toBe(0);
    expect(cmp.preventResize).toBe(false);
    expect(cmp.childrenAllowed).toBe(false);
  });

  it('creates a component instance', () => {
    const cmp = new CdComponent(TEST_CMP_ID, { tagName: 'div', title: 'test' });
    register(cmp);
    const instance = createInstance(cmp, TEST_PROJECT_ID, TEST_ID);
    expect(instance.projectId).toBe(TEST_PROJECT_ID);
    expect(instance.id).toBe(TEST_ID);
    expect(instance.styles).not.toBeUndefined();
    expect(instance.attrs).toEqual([]);
    expect(instance.state).toBe(cd.State.Default);
    expect(instance.inputs).not.toBeUndefined();
  });

  it('auto-assigns template/factory', () => {
    const cmp = new CdComponent(TEST_CMP_ID);
    expect(cmp.template).not.toBeUndefined();
    expect(typeof cmp.template).toBe('function');
    expect(cmp.factory).not.toBeUndefined();
    expect(cmp.factory instanceof CdComponentFactory || cmp.factory === CdComponentFactory).toBe(
      true
    );
  });

  // Additional render tests in `component-template.spec`
  it('renders a template', () => {
    const cmp = new CdComponent(TEST_CMP_ID, { tagName: 'div' });
    const template = cmp.template(cd.TemplateBuildMode.Simple, {}, 'child');
    expect(template).toBe('<div>child</div>');
  });

  it('validates component', () => {
    const cmp = new CdComponent(TEST_CMP_ID, { title: 'Foo', tagName: 'div' });
    const errors = cmp.validate();
    expect(errors.length).toBe(0);
  });

  it('validates missing title', () => {
    const cmp = new CdComponent(TEST_CMP_ID, { tagName: 'div' });
    const errors = cmp.validate();
    expect(errors.length).toBe(1);
    expect(errors[0].name).toBe('title');
    expect(errors[0].type).toBe(cd.ComponentErrorType.Field);
  });

  it('validates missing tag name', () => {
    const cmp = new CdComponent(TEST_CMP_ID, { title: 'foo' });
    const errors = cmp.validate();
    expect(errors.length).toBe(1);
    expect(errors[0].name).toBe('tagName');
    expect(errors[0].type).toBe(cd.ComponentErrorType.Field);
  });

  it('validates has tag name via variant', () => {
    const cmp = new CdComponent(TEST_CMP_ID, {
      title: 'Foo',
      variants: {
        foo: { tagName: 'tag1' },
        bar: { tagName: 'tag2' },
      },
      properties: [
        {
          name: 'type',
          bindingType: cd.BindingType.Variant,
          menuData: [
            { title: 'Foo', value: 'foo' },
            { title: 'Bar', value: 'bar' },
          ],
        },
      ],
    });
    const errors = cmp.validate();
    expect(errors.length).toBe(0);
  });

  it('validates has tag name via tag binding', () => {
    const cmp = new CdComponent(TEST_CMP_ID, {
      title: 'Foo',
      properties: [
        {
          name: 'type',
          bindingType: cd.BindingType.TagName,
          menuData: [
            { title: 'foo', value: 'Foo' },
            { title: 'bar', value: 'Bar' },
          ],
        },
      ],
    });
    const errors = cmp.validate();
    expect(errors.length).toBe(0);
  });

  it('validates missing property name', () => {
    const cmp = new CdComponent(TEST_CMP_ID, {
      title: 'Foo',
      tagName: 'div',
      properties: [{ bindingType: cd.BindingType.Property }],
    });
    const errors = cmp.validate();
    expect(errors.length).toBe(1);
    expect(errors[0].type).toBe(cd.ComponentErrorType.Property);
  });

  it('validates tag name binding missing menu data ', () => {
    const cmp = new CdComponent(TEST_CMP_ID, {
      title: 'Foo',
      tagName: 'div',
      properties: [{ name: 'type', bindingType: cd.BindingType.TagName }],
    });
    const errors = cmp.validate();
    expect(errors.length).toBe(1);
    expect(errors[0].type).toBe(cd.ComponentErrorType.Property);
    expect(errors[0].name).toBe('type');
    expect(errors[0].message).toContain('menuData');
  });

  it('validates missing menu data', () => {
    const cmp = new CdComponent(TEST_CMP_ID, {
      title: 'Foo',
      tagName: 'div',
      properties: [{ name: 'type', menuData: [] }],
    });
    const errors = cmp.validate();
    expect(errors.length).toBe(1);
    expect(errors[0].type).toBe(cd.ComponentErrorType.Property);
    expect(errors[0].name).toBe('type');
    expect(errors[0].message).toContain('menuData');
  });

  it('validates missing output binding', () => {
    const cmp = new CdComponent(TEST_CMP_ID, {
      title: 'Foo',
      tagName: 'div',
      outputs: [
        {
          eventName: 'test-event',
          binding: '',
          label: 'My label',
          icon: '',
          type: cd.OutputPropertyType.String,
        },
      ],
    });
    const errors = cmp.validate();
    expect(errors.length).toBe(1);
    expect(errors[0].type).toBe(cd.ComponentErrorType.Output);
    expect(errors[0].name).toBe('test-event');
    expect(errors[0].message).toContain('binding');
  });

  it('detects is Component class', () => {
    class Cmp1 extends CdComponent {}
    class Cmp2 extends Cmp1 {}
    expect(CdComponent.isComponentClass(CdComponent)).toBe(true);
    expect(CdComponent.isComponentClass(Cmp1)).toBe(true);
    expect(CdComponent.isComponentClass(Cmp2)).toBe(true);
  });

  it('detects is not Component class', () => {
    expect(CdComponent.isComponentClass(null)).toBe(false);
    expect(CdComponent.isComponentClass('foo')).toBe(false);
    expect(CdComponent.isComponentClass(123)).toBe(false);
    expect(CdComponent.isComponentClass({})).toBe(false);
    expect(CdComponent.isComponentClass(() => {})).toBe(false);
    class NoCmp {}
    expect(CdComponent.isComponentClass(NoCmp)).toBe(false);
    // Instance, not class
    expect(CdComponent.isComponentClass(new CdComponent(TEST_CMP_ID))).toBe(false);
  });
});
