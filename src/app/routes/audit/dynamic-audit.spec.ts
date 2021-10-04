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
import { IAuditView } from './configs/audit.config';
import { createAuditViewFromDefinition } from './dynamic-audit';
import { CdComponent } from 'cd-common/models';

class TestComponent extends CdComponent {
  id = 'foo';
  title = 'Foo';
  properties = [
    {
      name: 'prop1',
      label: 'Property 1',
      menuData: [
        { title: 'A', value: 'a' },
        { title: 'B', value: 'b' },
      ],
    },
    {
      label: 'A Group',
      groupType: cd.PropertyGroupType.Collapse,
      children: [
        {
          name: 'prop2',
          label: 'Property 2',
          menuData: [
            { title: 'C', value: 'c' },
            { title: 'D', value: 'd' },
          ],
        },
      ],
    },
    {
      label: 'Group Label',
      children: [
        {
          // Missing label, use group label
          name: 'prop3',
          inputType: cd.PropertyInput.Checkbox,
        },
      ],
    },
  ];

  audit = {
    values: { foo: 'bar' },
    sections: [
      { properties: ['prop1'] },
      { properties: ['prop1', 'prop2'] },
      { title: 'Custom Title', properties: ['prop2'], values: { test: 123 } },
      { properties: ['prop3'] },
    ],
  };
}

const expectedView: IAuditView = {
  title: 'Foo',
  elementType: 'foo',
  variants: [
    // Single property
    {
      title: 'Property 1',
      subVariants: [
        { title: 'A', inputs: { prop1: 'a', foo: 'bar' } },
        { title: 'B', inputs: { prop1: 'b', foo: 'bar' } },
      ],
    },
    // Property combinations
    {
      title: 'Property 1 / Property 2',
      subVariants: [
        { title: 'A / C', inputs: { prop1: 'a', prop2: 'c', foo: 'bar' } },
        { title: 'A / D', inputs: { prop1: 'a', prop2: 'd', foo: 'bar' } },
        { title: 'B / C', inputs: { prop1: 'b', prop2: 'c', foo: 'bar' } },
        { title: 'B / D', inputs: { prop1: 'b', prop2: 'd', foo: 'bar' } },
      ],
    },
    // With custom title & set value
    {
      title: 'Custom Title',
      subVariants: [
        { title: 'C', inputs: { prop2: 'c', test: 123, foo: 'bar' } },
        { title: 'D', inputs: { prop2: 'd', test: 123, foo: 'bar' } },
      ],
    },
    // Group label as title, boolean type
    {
      title: 'Group Label',
      subVariants: [
        { title: 'True', inputs: { prop3: true, foo: 'bar' } },
        { title: 'False', inputs: { prop3: false, foo: 'bar' } },
      ],
    },
  ],
};

describe('Dynamic Audit', () => {
  const cmp = new TestComponent();
  const view = createAuditViewFromDefinition(cmp);

  it('Sets audit view title', () => {
    expect(view.title).toBe('Foo');
  });

  it('Sets elementType', () => {
    expect(view.elementType).toBe('foo');
  });

  it('Sets section titles correctly', () => {
    expect(view.variants[0].title).toBe('Property 1');
    expect(view.variants[1].title).toBe('Property 1 / Property 2');
    expect(view.variants[2].title).toBe('Custom Title');
  });

  it('Sets component titles correctly', () => {
    const subVar1 = view.variants[0].subVariants[0];
    const subVar2 = view.variants[0].subVariants[1];
    expect(subVar1.title).toBe('A');
    expect(subVar2.title).toBe('B');
    const subVar3 = view.variants[1].subVariants[0];
    expect(subVar3.title).toBe('A / C');
  });

  it('Sets global input values', () => {
    for (const variant of view.variants) {
      for (const subVariant of variant.subVariants) {
        expect(subVariant.inputs.foo).toBe('bar');
      }
    }
  });

  it('Sets section input values', () => {
    const variant = view.variants[2];
    expect(variant.subVariants[0].inputs.test).toBe(123);
    expect(variant.subVariants[1].inputs.test).toBe(123);
  });

  it('Sets true/false variations for boolean inputs', () => {
    const subVar1 = view.variants[3].subVariants[0];
    const subVar2 = view.variants[3].subVariants[1];
    subVar1.title = 'True';
    subVar1.inputs.prop3 = true;
    subVar2.title = 'False';
    subVar2.inputs.prop3 = false;
  });

  it('Uses the group label if not prop label exists', () => {
    const variant = view.variants[3];
    expect(variant.title).toBe('Group Label');
  });

  it('Creates full audit view from component definition', () => {
    console.log(JSON.stringify(view));
    expect(view).toEqual(expectedView);
  });

  it('Auto-generates audit view with variantProperty set', () => {
    const auditCfg: cd.IAuditConfig = {
      variantProperty: 'prop1',
      sections: [{ properties: ['prop2'] }],
    };
    const auditView = createAuditViewFromDefinition(cmp, auditCfg);
    expect(auditView).toEqual({
      title: 'Foo',
      elementType: 'foo',
      variants: [
        {
          title: 'A | Property 2',
          subVariants: [
            { title: 'C', inputs: { prop1: 'a', prop2: 'c' } },
            { title: 'D', inputs: { prop1: 'a', prop2: 'd' } },
          ],
        },
        {
          title: 'B | Property 2',
          subVariants: [
            { title: 'C', inputs: { prop1: 'b', prop2: 'c' } },
            { title: 'D', inputs: { prop1: 'b', prop2: 'd' } },
          ],
        },
      ],
    });
  });
});
