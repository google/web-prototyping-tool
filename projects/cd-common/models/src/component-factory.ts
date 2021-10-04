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
import * as utils from 'cd-common/utils';
import { UnitTypes } from 'cd-metadata/units';
import { StyleFactory } from './properties.styles.utils';
import { getPropsRecursive } from './properties.utils';
import { deepCopy, classToObject } from 'cd-utils/object';

const DEFAULT_ELEMENT_NAME = 'Element';

export const BASE_ELEMENT_INPUTS: cd.IBaseElementInputs = { hidden: false };

const assembleIValue = (value?: string | number, id?: string, units?: cd.Units, index?: number) => {
  const val: cd.IValue = {};
  if (value) val.value = value;
  if (id) val.id = id;
  if (units) val.units = units;
  if (index !== undefined) val.index = index;
  return val;
};

/** Generates an instance of a component from an `IComponent` definition. */
export class CdComponentFactory implements cd.IComponentInstance {
  public name = DEFAULT_ELEMENT_NAME;
  public actions = [];
  public attrs: cd.IKeyValue[] = [];
  public childIds: string[] = [];
  // TODO: Migrate/Rename to componentId or definitionId
  public elementType: cd.ComponentIdentity = cd.ElementEntitySubType.Generic;
  public frame: cd.ILockingRect = utils.generateFrame();
  public keywords?: string[];
  public metadata = {};
  public rootId = '';
  public showPreviewStyles = false;
  public state: cd.State = cd.State.Default;
  public styles: cd.IStyleAttributes = new StyleFactory().build();
  public type: cd.EntityType.Element = cd.EntityType.Element;
  public parentId?: string;
  public inputs = { ...BASE_ELEMENT_INPUTS };
  public a11yInputs?: cd.IA11yInputs;
  public isCodeComponentInstance?: boolean;

  constructor(public projectId: string, public id: string, component?: cd.IComponent) {
    // Base styles
    if (component?.id !== cd.ElementEntitySubType.SymbolInstance) {
      this.assignDisplayStyle();
    }
    this.assignPosition(cd.PositionType.Relative);
    this.assignOpacity();

    // Init from component
    if (component) this.initComponent(component);
  }

  /** Set initial values/properties based on the component definition. */
  private initComponent(component: cd.IComponent) {
    this.elementType = component.id;
    this.name = component?.title || DEFAULT_ELEMENT_NAME;

    // Initial styles
    if (component.styles) this.addBaseStyle(component.styles);
    if (component.width) this.assignWidth(component.width);
    if (component.height) this.assignHeight(component.height);

    // Initial attributes/inputs
    this.processAttrs(component);
    this.processInputs(component);
    // Resize type
    // TODO Add support for Vertical/Horizontal
    if (component.resizeType === cd.ResizeType.Uniform) {
      this.frame.locked = true;
    }
  }

  /** Sets initial attributes based on the component definition. */
  private processAttrs(component: cd.IComponent) {
    if (!component.attrs) return;
    // Convert to name/value dictionary to `IKeyValue` array
    const entries = Object.entries(component.attrs);
    const attrs = entries.map(([name, value]) => {
      return { name, value } as cd.IKeyValue;
    });
    this.addAttributes(attrs);
  }

  /** Sets initial inputs based on the component definition. */
  private processInputs(component: cd.IComponent) {
    // From `Component.inputs`
    const inputs: cd.IStringMap<unknown> = !!component.inputs ? deepCopy(component.inputs) : {};

    // From `IProperty.defaultValue`
    const props = getPropsRecursive(component.properties);
    for (const prop of props) {
      if (prop.name && prop.defaultValue !== undefined) {
        inputs[prop.name] = prop.defaultValue;
      }
    }

    this.addInputs(inputs);
  }

  assignName(name: string) {
    this.name = name;
    return this;
  }

  assignChildIds(childIds: string[]) {
    this.childIds = [...childIds];
    return this;
  }

  assignA11yInputs(a11yInputs: cd.IA11yInputs) {
    this.a11yInputs = a11yInputs;
    return this;
  }

  addAttributes(attrs: cd.IKeyValue[]) {
    this.attrs = attrs.reduce(
      (valid, attr) => {
        const value = attr.value as any;
        const isValid = value !== false && value !== null && value !== undefined;
        if (isValid) valid.push(attr);
        return valid;
      },
      [...this.attrs]
    );
    return this;
  }

  get baseStyle() {
    return this.styles.base.style;
  }

  lockFrame(value = true) {
    this.frame.locked = value;
    return this;
  }

  assignFrame(width: number, height: number, x = 0, y = 0) {
    this.frame = { ...this.frame, width, height, x, y };
    return this;
  }

  assignFrameFromFrame(frame: cd.ILockingRect) {
    if (frame) this.frame = { ...this.frame, ...frame };
    return this;
  }

  assignStyles(styles: cd.IStyleAttributes) {
    if (styles) this.styles = deepCopy(styles);
    return this;
  }

  /** Replaces any default styles applied in the constructor */
  replaceBaseStyles(style: cd.IStyleDeclaration | undefined) {
    if (!style) return this;
    this.styles.base.style = { ...style };
    return this;
  }

  addBaseStyle(style: Partial<cd.IStyleDeclaration>) {
    const merged = utils.deepMerge(this.styles.base.style, style, false);
    this.styles.base.style = merged;
    return this;
  }

  addInputs<T>(inputs: Partial<T>) {
    for (const [key, value] of Object.entries(inputs)) {
      (this.inputs as cd.IStringMap<any>)[key] = value;
    }
    return this;
  }

  addOverridesFromExistingStyles(styles: cd.IStyleAttributes) {
    for (const [key, value] of Object.entries(styles)) {
      const overrides = value?.overrides;
      if (overrides?.length) {
        this.styles[key] = { ...this.styles[key], overrides: [...overrides] };
      }
    }
    return this;
  }

  assignWidth(value: string | number | undefined, units = UnitTypes.Pixels) {
    if (value === undefined) return this;
    const [parsedValue, unit] = utils.parseUnits(value);
    const width = utils.generateIValue(parsedValue, unit || units);
    this.addBaseStyle({ width });
    return this;
  }

  assignHeight(value: string | number | undefined, units = UnitTypes.Pixels) {
    if (value === undefined) return this;
    const [parsedValue, unit] = utils.parseUnits(value);
    const height = utils.generateIValue(parsedValue, unit || units);
    this.addBaseStyle({ height });
    return this;
  }

  assignOpacity(opacity = 1) {
    this.addBaseStyle({ opacity });
    return this;
  }

  assignBackgroundColor(value: string, id?: string) {
    const color = assembleIValue(value, id);
    const background = [color];
    this.addBaseStyle({ background });
    return this;
  }

  assignColor(value: string, id?: string) {
    const color = assembleIValue(value, id);
    this.addBaseStyle({ color });
    return this;
  }

  assignDisplayStyle(display: cd.Display | null = cd.Display.Block) {
    this.addBaseStyle({ display });
    return this;
  }

  assignFont(type: cd.ITypographyStyle, id: string) {
    const font = { id, ...type };
    this.addBaseStyle({ font });
    return this;
  }

  assignPosition(position: cd.PositionType) {
    this.addBaseStyle({ position });
    return this;
  }

  assignPadding(top = 0, left = 0, right = 0, bottom = 0) {
    const padding = { top, left, bottom, right };
    this.addBaseStyle({ padding });
    return this;
  }

  assignOverflow(x = cd.Overflow.Auto, y = cd.Overflow.Auto) {
    const overflow = { x, y };
    this.addBaseStyle({ overflow });
    return this;
  }

  assignParentId(id: string) {
    this.parentId = id;
    return this;
  }

  addChildId(id: string) {
    this.childIds.push(id);
    return this;
  }

  assignRootId(id: string) {
    this.rootId = id;
    return this;
  }

  setIsCodeComponent(flag = true) {
    this.isCodeComponentInstance = flag;
    return this;
  }

  build() {
    return classToObject(this);
  }
}
