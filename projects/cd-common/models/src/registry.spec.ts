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
  componentRegistry,
  register,
  registerComponent,
  registerCodeComponent,
  unRegisterCodeComponent,
  getComponent,
  getComponents,
  componentQueryCache,
  componentAliases,
  clearRegistry,
} from './registry';
import { CdComponent } from './component';
import { createCodeComponent } from 'cd-common/utils';
import * as cd from 'cd-interfaces';

describe('Component registry', () => {
  beforeEach(clearRegistry);

  it('registers a component by decorator', () => {
    @registerComponent('test')
    class MyComponent extends CdComponent {
      tagName = 'div';
      title = 'Foo';
    }
    expect(componentRegistry.size).toBe(1);
    const cmp = componentRegistry.get('test');
    expect(cmp instanceof MyComponent).toBe(true);
  });

  it('registers a component', () => {
    const cmp = new CdComponent('test', { title: 'Foo', tagName: 'div' });
    register(cmp);
    expect(componentRegistry.size).toBe(1);
    expect(componentRegistry.get('test')).toBe(cmp);
  });

  it('cannot register invalid component', () => {
    // Missing tag name
    const cmp = new CdComponent('test', { title: 'Foo' });
    const errors = register(cmp);
    expect(errors).not.toBeNull();
    expect(errors && errors.length).toBe(1);
    expect(errors && errors[0].name).toBe('tagName');
    expect(componentRegistry.size).toBe(0);
  });

  it('can re-register a code component', () => {
    let cmp = new CdComponent('test', { title: 'Foo', tagName: 'div' });
    register(cmp);
    expect(componentRegistry.size).toBe(1);
    cmp = componentRegistry.get('test') as CdComponent;
    expect(cmp).not.toBeUndefined();
    expect(cmp.title).toBe('Foo');
    cmp = new CdComponent('test', { title: 'Bar', tagName: 'div' });
    register(cmp);
    expect(componentRegistry.size).toBe(1);
    cmp = componentRegistry.get('test') as CdComponent;
    expect(cmp).not.toBeUndefined();
    expect(cmp.title).toBe('Bar');
  });

  it('auto-adds size, position, opacity, and advanced properties', () => {
    let cmp = new CdComponent('test', {
      title: 'Foo',
      tagName: 'div',
    });
    register(cmp);
    cmp = componentRegistry.get('test') as CdComponent;
    expect(componentRegistry.size).toBe(1);
    expect(cmp.properties.length).toBe(5);
    expect(cmp.properties[0].type).toBe(cd.PropertyType.StyleSize);
    expect(cmp.properties[1].type).toBe(cd.PropertyType.StylePosition);
    const opacity = cmp.properties![2].children![0];
    expect(opacity.type).toBe(cd.PropertyType.StyleOpacity);
    expect(cmp.properties[3].label).toBe('Advanced');
  });

  it('does not auto-add properties if `autoAddDefaultProperties` is false', () => {
    let cmp = new CdComponent('test', {
      title: 'Foo',
      tagName: 'div',
      autoAddDefaultProperties: false,
    });
    register(cmp);
    cmp = componentRegistry.get('test') as CdComponent;
    expect(cmp.properties.length).toBe(0);
  });

  it('auto-adds GenericAttribute to properties', () => {
    let cmp = new CdComponent('test', {
      title: 'Foo',
      tagName: 'div',
      properties: [
        {
          inputType: cd.PropertyInput.Text,
        },
      ],
    });
    register(cmp);
    expect(componentRegistry.size).toBe(1);
    cmp = componentRegistry.get('test') as CdComponent;
    expect(cmp.properties.length).toBe(6);
    expect(cmp.properties[3].type).toBe(cd.PropertyType.AttributeGeneric);
  });

  it('does not auto-add size if `preventResize`', () => {
    let cmp = new CdComponent('test', {
      title: 'Foo',
      tagName: 'div',
      preventResize: true,
    });
    register(cmp);
    cmp = componentRegistry.get('test') as CdComponent;
    expect(componentRegistry.size).toBe(1);
    expect(cmp.properties.length).toBe(4);
    expect(cmp.properties[0].type).toBe(cd.PropertyType.StylePosition);
  });

  it('auto-adds conditionals for variant props', () => {
    let cmp = new CdComponent('test', {
      title: 'Foo',
      variants: {
        foo: { tagName: 'tag1' },
        bar: { tagName: 'tag2' },
      },
      properties: [
        { name: 'prop', variant: 'tag1' },
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
    register(cmp);
    expect(componentRegistry.size).toBe(1);
    cmp = componentRegistry.get('test') as CdComponent;
    expect(cmp.properties.length).toBe(7);
    const prop = cmp.properties.find((p) => p.name === 'prop') as cd.IPropertyGroup;
    const conditions = prop.conditions as cd.PropertyCondition[];
    expect(conditions.length).toBe(1);
    expect(conditions[0].name).toBe('type');
  });

  it('gets a single component by id', () => {
    let cmp = new CdComponent('test', { title: 'Foo', tagName: 'div' });
    register(cmp);
    cmp = getComponent('test') as CdComponent;
    expect(cmp).not.toBeUndefined();
    expect(cmp.title).toBe('Foo');
  });

  it('returns undefined for non-existing component', () => {
    const result = getComponent('non-existing');
    expect(result).toBe(undefined);
  });

  it('gets components by library, ignoring deprecated', () => {
    registerFakeCmps();
    const results = getComponents(cd.ComponentLibrary.Primitive, true /* ignoreHidden */);
    expect(results.length).toBe(1);
    expect(results[0].id).toBe('test1');
  });

  it('gets components by library, including deprecated', () => {
    registerFakeCmps();
    const results = getComponents(cd.ComponentLibrary.Primitive);
    expect(results.length).toBe(2);
    expect(results[0].id).toBe('test1');
    expect(results[1].id).toBe('test2');
  });

  it('gets components by library, ignoring aliases', () => {
    registerFakeCmps(/* withAliases */ true);
    const results = getComponents(cd.ComponentLibrary.Primitive, true /* ignoreHidden */);
    expect(results.length).toBe(1);
    expect(results[0].id).toBe('test1');
    expect(componentAliases.get('test1-alias')).toEqual(getComponent('test1'));
  });

  it('caches components by library/deprecated', () => {
    registerFakeCmps();
    const results1 = getComponents(cd.ComponentLibrary.Primitive);
    expect(results1.length).toBe(2);
    const results2 = componentQueryCache.get('primitive:false') as CdComponent[];
    expect(results2.length).toBe(2);
    const results3 = getComponents(cd.ComponentLibrary.Primitive, true);
    expect(results3.length).toBe(1);
    const results4 = componentQueryCache.get('primitive:true') as CdComponent[];
    expect(results4.length).toBe(1);
  });

  it('registers component aliases', () => {
    const cmp = new CdComponent('test', {
      title: 'Foo',
      tagName: 'div',
      aliases: ['test1', 'test2'],
    });
    register(cmp);
    expect(componentRegistry.size).toBe(1);
    expect(componentAliases.size).toBe(2);
    const test = getComponent('test');
    const test1 = getComponent('test1');
    const test2 = getComponent('test2');
    expect(test).toBe(test1);
    expect(test).toBe(test2);
    expect(test1).toBe(test2);
  });

  it('clears the registry', () => {
    registerFakeCmps(/* withAliases */ true);
    clearRegistry();
    expect(componentRegistry.size).toBe(0);
    expect(componentAliases.size).toBe(0);
  });

  it('registers a code component', () => {
    const component = createCodeComponent('test', 'projectId', 'title', 'div', '/js-bundle.js');
    registerCodeComponent(component);
    expect(componentRegistry.size).toBe(1);
    const cmp = componentRegistry.get('test') as any as cd.ICodeComponentDocument;
    expect(cmp.tagName).not.toBe('div');
    expect(cmp.tagName.startsWith('div-')).toBe(true);
  });

  it('unregisters a code component', () => {
    const component = createCodeComponent('test', 'projectId', 'title', 'div', '/js-bundle.js');
    registerCodeComponent(component);
    expect(componentRegistry.size).toBe(1);
    unRegisterCodeComponent(component.id);
    expect(componentRegistry.size).toBe(0);
    expect(getComponent(component.id)).toBeUndefined();
  });
});

function registerFakeCmps(withAliases = false) {
  // Primitive
  const cmp1 = new CdComponent('test1', {
    library: cd.ComponentLibrary.Primitive,
    title: 'Foo',
    tagName: 'div',
    aliases: withAliases ? ['test1-alias'] : undefined,
  });
  register(cmp1);
  // Primitive deprecated
  const cmp2 = new CdComponent('test2', {
    library: cd.ComponentLibrary.Primitive,
    title: 'Bar',
    tagName: 'span',
    deprecated: true,
  });
  register(cmp2);
  // Angular
  const cmp3 = new CdComponent('test3', {
    library: cd.ComponentLibrary.AngularMaterial,
    title: 'Bas',
    tagName: 'div',
  });
  register(cmp3);
}
