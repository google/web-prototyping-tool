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
import {
  createCodeComponent,
  DEFAULT_CODE_COMPONENT_FRAME,
  generateFrame,
  generateIValue,
} from 'cd-common/utils';
import { getComponent, register, clearRegistry } from './registry';
import { BASE_ELEMENT_INPUTS, CdComponentFactory } from './component-factory';
import { UnitTypes } from 'cd-metadata/units';
import { createCodeComponentInstance, createInstance } from './instance.utils';

const TEST_PROJECT = 'project-id';
const TEST_ID = 'test-id';
const TEST_CMP_ID = 'test-cmp';
const TEST_NAME = 'Element';

const BASE_STYLES = { position: cd.PositionType.Relative, display: cd.Display.Block, opacity: 1 };

const width = generateIValue(DEFAULT_CODE_COMPONENT_FRAME.width, UnitTypes.Pixels);
const height = generateIValue(DEFAULT_CODE_COMPONENT_FRAME.height, UnitTypes.Pixels);
const CODE_COMPONENT_BASE_STYLES = { ...BASE_STYLES, width, height };

/** Default set of values for an instance. */
const DEFAULTS = {
  projectId: TEST_PROJECT,
  id: TEST_ID,
  name: TEST_NAME,
  actions: [],
  attrs: [],
  childIds: [],
  elementType: cd.ElementEntitySubType.Generic,
  frame: generateFrame(),
  metadata: {},
  rootId: '',
  showPreviewStyles: false,
  state: cd.State.Default,
  styles: {
    base: { style: BASE_STYLES, overrides: [] },
  },
  type: cd.EntityType.Element,
  inputs: BASE_ELEMENT_INPUTS,
} as cd.IComponentInstance;

const CODE_COMPONENT_INSTANCE_DEFAULTS = {
  ...DEFAULTS,
  elementType: TEST_CMP_ID,
  isCodeComponentInstance: true,
  styles: {
    base: { style: CODE_COMPONENT_BASE_STYLES, overrides: [] },
  },
  type: cd.EntityType.Element,
  inputs: BASE_ELEMENT_INPUTS as cd.ICodeComponentInstanceInputs,
} as cd.ICodeComponentInstance;

/** Creates a new test instance from a component */
const newInstance = (cmp: cd.IComponent) => {
  return new CdComponentFactory(TEST_PROJECT, TEST_ID, cmp).build();
};

describe('ComponentFactory', () => {
  let factory!: CdComponentFactory;
  beforeEach(() => (factory = new CdComponentFactory(TEST_PROJECT, TEST_ID)));

  it('builds an instance w/ default values', () => {
    const instance = factory.build();
    expect(instance instanceof CdComponentFactory).toBe(false);
    expect(instance).toEqual(DEFAULTS);
  });

  it('adds inputs', () => {
    const inputs1 = {
      foo: 'bar',
      bar: 'baz',
    };
    const inputs2 = {
      baz: 123,
      testBool: true,
    };
    const instance = factory.addInputs(inputs1).addInputs(inputs2).build();
    expect(instance.inputs).toEqual({ ...inputs1, ...inputs2, ...BASE_ELEMENT_INPUTS });
  });

  it('adds attributes', () => {
    const validAttrs = [
      { name: 'test', value: 'foo' },
      { name: 'testInt', value: 123 },
      { name: 'testTrue', value: true },
      { name: 'testZero', value: 0 },
    ];
    const invalidAttrs = [
      { name: 'testFalse', value: false },
      { name: 'testNull', value: null },
      { name: 'testUndefined', value: undefined },
    ];
    const allAttrs = [...validAttrs, ...invalidAttrs] as cd.IKeyValue[];
    const instance = factory.addAttributes(allAttrs).build();
    expect(instance.attrs).toEqual(validAttrs);
  });

  it('assigns styles', () => {
    const styles = {
      base: { display: cd.Display.InlineBlock },
      verticalAlign: cd.VerticalAlign.Middle,
    } as cd.IStyleAttributes;
    const instance = factory.assignStyles(styles).build();
    expect(instance.styles).toEqual(styles);
  });

  it('adds base styles', () => {
    const styles = {
      display: cd.Display.Flex,
      verticalAlign: cd.VerticalAlign.Bottom,
    };
    const instance = factory.addBaseStyle(styles).build();
    expect(instance.styles.base.style).toEqual({ ...BASE_STYLES, ...styles });
  });

  it('adds overrides from existing styles', () => {
    const styles = {
      base: {},
      display: { style: { display: cd.Display.Flex }, overrides: [{ name: 'important' }] },
    } as cd.IStyleAttributes;
    const instance = factory.addOverridesFromExistingStyles(styles).build();
    expect(instance.styles.display.overrides.length).toBe(1);
    expect(instance.styles.display.overrides[0].name).toBe('important');
  });

  it('assigns width/height ', () => {
    const instance = factory.assignWidth(200).assignHeight('100%').build();
    expect(instance.styles.base.style.width).toEqual({ value: 200, units: 'px' });
    expect(instance.styles.base.style.height).toEqual({ value: 100, units: '%' });
  });

  it('assigns parent ID', () => {
    const testParentId = 'parent-id';
    const instance = factory.assignParentId(testParentId).build();
    expect(instance.parentId).toBe(testParentId);
  });

  it('adds child ID', () => {
    const childIds = ['child-1', 'child-2'];
    const instance = factory.addChildId(childIds[0]).addChildId(childIds[1]).build();
    expect(instance.childIds).toEqual(childIds);
  });

  it('assigns child IDs', () => {
    const childIds = ['child-1', 'child-2'];
    const instance = factory.assignChildIds(childIds).build();
    expect(instance.childIds).toEqual(childIds);
  });

  it('assigns root ID', () => {
    const testRootId = 'root-id';
    const instance = factory.assignRootId(testRootId).build();
    expect(instance.rootId).toBe(testRootId);
  });

  it('assigns frame', () => {
    const frame = { width: 200, height: 100, x: 50, y: 10 };
    const instance = factory.assignFrame(frame.width, frame.height, frame.x, frame.y).build();
    expect(instance.frame).toEqual(frame);
  });

  it('assigns frame from frame', () => {
    const frame = { width: 200, height: 100, x: 50, y: 10 };
    const instance = factory.assignFrameFromFrame(frame).build();
    expect(instance.frame).toEqual(frame);
  });

  it('locks frame', () => {
    expect(factory.lockFrame().build().frame.locked).toBe(true);
    expect(factory.lockFrame(false).build().frame.locked).toBe(false);
  });

  it('sets as code component', () => {
    expect(factory.setIsCodeComponent().build().isCodeComponentInstance).toBe(true);
  });
});

describe('ComponentFactory initialized from Component', () => {
  it('builds an instance w/ default values', () => {
    const testTitle = 'Title';
    const cmp = new CdComponent(TEST_CMP_ID, { tagName: 'div', title: testTitle });
    const instance = newInstance(cmp);
    expect(instance).toEqual({ ...DEFAULTS, elementType: TEST_CMP_ID, name: testTitle });
  });

  it('assigns styles from component', () => {
    const cmp = new CdComponent(TEST_CMP_ID, {
      tagName: 'div',
      styles: {
        display: cd.Display.Flex,
        verticalAlign: cd.VerticalAlign.Baseline,
      },
    }) as cd.IComponent;
    const instance = newInstance(cmp);
    expect(instance.styles.base.style).toEqual({ ...BASE_STYLES, ...cmp.styles });
  });

  it('assigns inputs from component', () => {
    const cmp = new CdComponent(TEST_CMP_ID, {
      tagName: 'div',
      inputs: {
        foo: 'bar',
        baz: 123,
      },
    }) as cd.IComponent;
    const instance = newInstance(cmp);
    expect(instance.inputs).toEqual({ ...BASE_ELEMENT_INPUTS, ...cmp.inputs });
  });

  it('assigns width/height from component', () => {
    const cmp = new CdComponent(TEST_CMP_ID, {
      tagName: 'div',
      width: 200,
      height: '100%',
    });
    const instance = newInstance(cmp);
    expect(instance.styles.base.style.width).toEqual({ value: 200, units: 'px' });
    expect(instance.styles.base.style.height).toEqual({ value: 100, units: '%' });
  });

  it('assigns attrs from component', () => {
    const validAttrs = {
      test: 'foo',
      testInt: 123,
      testTrue: true,
      testZero: 0,
    };
    const invalidAttrs = {
      testFalse: false,
      testNull: null,
      testUndefined: undefined,
    };
    const validAttrPairs = [
      { name: 'test', value: 'foo' },
      { name: 'testInt', value: 123 },
      { name: 'testTrue', value: true },
      { name: 'testZero', value: 0 },
    ];
    const cmp = new CdComponent(TEST_CMP_ID, {
      tagName: 'div',
      attrs: { ...validAttrs, ...invalidAttrs } as any,
    }) as cd.IComponent;
    const instance = newInstance(cmp);
    expect(instance.attrs).toEqual(validAttrPairs);
  });

  it('sets resize type', () => {
    const cmp = new CdComponent(TEST_CMP_ID, { tagName: 'div', resizeType: cd.ResizeType.Uniform });
    const instance = newInstance(cmp);
    expect(instance.frame.locked).toEqual(true);
  });
});

describe('createInstance util', () => {
  let cmp: cd.IComponent;
  beforeEach(() => {
    clearRegistry();

    cmp = new CdComponent(TEST_CMP_ID, { tagName: 'div', title: TEST_NAME });
    register(cmp);
  });

  it('creates a factory', () => {
    const instance = createInstance(TEST_CMP_ID, TEST_PROJECT, TEST_ID);
    expect(instance instanceof CdComponentFactory).toBe(true);
  });

  it('builds an instance w/ default values', () => {
    const instance = createInstance(TEST_CMP_ID, TEST_PROJECT, TEST_ID).build();
    expect(instance).toEqual({ ...DEFAULTS, ...{ elementType: TEST_CMP_ID } });
  });

  it('accepts a component definition', () => {
    const fromReg = getComponent(TEST_CMP_ID) as cd.IComponent;
    const instance = createInstance(fromReg, TEST_PROJECT, TEST_ID).build();
    expect(instance).toEqual({ ...DEFAULTS, ...{ elementType: TEST_CMP_ID } });
  });

  it('throws error for empty project id', () => {
    expect(() => createInstance(TEST_CMP_ID, '', TEST_ID)).toThrow();
  });

  it('throws error for empty id', () => {
    expect(() => createInstance(TEST_CMP_ID, TEST_PROJECT, '')).toThrow();
  });
});

describe('createCodeComponentInstance util', () => {
  let cmp: cd.ICodeComponentDocument;
  beforeEach(() => {
    cmp = createCodeComponent(TEST_CMP_ID, TEST_PROJECT, 'Element', 'div', '');
  });

  it('creates a instance, not a factory', () => {
    const instance = createCodeComponentInstance(TEST_ID, cmp);
    expect(instance instanceof CdComponentFactory).toBe(false);
  });

  it('builds an instance w/ default values', () => {
    const instance = createCodeComponentInstance(TEST_ID, cmp);
    expect(instance).toEqual(CODE_COMPONENT_INSTANCE_DEFAULTS);
  });

  it('throws error for empty component id', () => {
    expect(() => createCodeComponentInstance('', cmp)).toThrow();
  });
});
