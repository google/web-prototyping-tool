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
  addAttributes,
  addCSSClasses,
  addDirectives,
  addOutputBinding,
  addPortalSlots,
  addPropertyBindings,
  buildWrapperFactory,
  createVariantComponents,
  IComponentVariant,
} from './component.utils';
import { TemplateFactory } from './template.utils';
import { isOfClassType, isClass } from 'cd-utils/class';
import { CdComponentFactory } from './component-factory';
import { validateComponent } from './component.validator';
import { getPropsRecursive } from './properties.utils';
import { isString } from 'cd-utils/string';
import { isObject, isFunction } from 'cd-utils/object';
import * as consts from 'cd-common/consts';
import * as cd from 'cd-interfaces';

const LOG_TEMPLATE = false;

type RegistryMap = Map<cd.ComponentIdentity, Readonly<cd.IComponent>>;
/** A registry of all components, including built-in and code components. */
export const componentRegistry: RegistryMap = new Map();
/** As map of component aliases. */
export const componentAliases: RegistryMap = new Map();

/**
 * Track all registered components that have portal slots so that
 * we can track dependencies for change detection
 */
export const componentsWithPortalSlots = new Set<string>();

export const elementHasPortalSlot = (el: cd.PropertyModel): boolean => {
  return componentsWithPortalSlots.has(el.elementType);
};

/** Defines a component definition. */
export class CdComponent implements cd.IComponent {
  public library = '';
  public tagName = '';
  public title = '';
  public description = '';
  public icon: string = consts.LayerIcons.GenericElement;
  public childrenAllowed = false;
  public preventResize = false;
  public properties: cd.IPropertyGroup[] = [];
  public outputs: cd.IOutputProperty[] = [];
  public variants?: cd.IStringMap<cd.ComponentVariant>;
  public exportPropsAsAttrs = false;
  public autoAddDefaultProperties = true;
  public isInnerChild = false;
  public deprecated = false;
  public directives: string[] = [];
  /** Creates an instance of the component. */
  public factory: cd.IComponentFactory;

  /** Renders a string template for the component. */
  public template: cd.TemplateFunction;

  constructor(public id: cd.ComponentIdentity = '', config?: Partial<cd.IComponent>) {
    if (config) Object.assign<cd.IComponent, Partial<cd.IComponent>>(this, config);

    // Template function must be provided via default or config.
    // It is used to render the string template from the component.
    this.template = config?.template || getTemplateFunction(this);

    // Component factory must be provided via default or config.
    // It is used to create an `IComponentInstance` from the component.
    const factory = config?.factory || CdComponentFactory;
    this.factory = factory as cd.IComponentFactory;
  }

  /** Determines if the provided class is a subclass of `Component`. */
  static isComponentClass(cmp: any): boolean {
    return cmp === CdComponent || isOfClassType(cmp, CdComponent);
  }

  /** Returns a list of validation errors for component. */
  validate(): cd.IComponentError[] {
    return validateComponent(this);
  }
}

const getTemplateVariants = (
  component: cd.IComponent,
  mode: cd.TemplateBuildMode,
  allProps: cd.IPropertyGroup[],
  isInternal: boolean,
  model?: cd.PropertyModel,
  content?: string
): TemplateFactory => {
  // Existence of variant property, binding, and menu data has
  // already been validated in the component registry
  const variantProp = allProps.find((p) => p.bindingType === cd.BindingType.Variant);
  if (!variantProp) throw Error('Missing variant bound property');

  const variantName = variantProp.name as string;
  if (!variantProp.name) throw Error('Missing property name');
  const variants = createVariantComponents(component);

  // Internal, render all variants in switch
  if (isInternal) {
    return buildVariantSwitchTemplateFactory(variantName, variants, model, content);
  }

  // Get the currently selected variant, or the first one
  const inputs = model?.inputs as cd.IStringMap<any>;
  const selectedVariant = inputs?.[variantName] ?? null;
  const [first] = variants;
  const varComponent = !!selectedVariant
    ? variants.find((v) => v.name === selectedVariant) || first
    : first;

  // Export, render only currently selected variant
  return createTemplateFactory(varComponent.component, mode, model, content, selectedVariant);
};

/** Returns a template function for a given `IComponent` interface. */
const getTemplateFunction = (component: cd.IComponent): cd.TemplateFunction => {
  return (mode: cd.TemplateBuildMode, model?: cd.PropertyModel, content?: string): string => {
    const isInternal = mode === cd.TemplateBuildMode.Internal;
    const allProps = getPropsRecursive(component.properties);
    const hasVariants = component.variants && Object.keys(component.variants).length;

    if (hasVariants) {
      return getTemplateVariants(component, mode, allProps, isInternal, model, content).build(
        LOG_TEMPLATE
      );
    }

    // No variants, render as single element
    return createTemplateFactory(component, mode, model, content).build(LOG_TEMPLATE);
  };
};

const addChildComponents = (
  component: cd.IComponent,
  children: cd.ComponentChild[] = [],
  model: cd.PropertyModel | undefined,
  mode: cd.TemplateBuildMode,
  factory: TemplateFactory
) => {
  for (const child of children) {
    const childTemplate = renderChildComponent(component, child, mode, model);
    factory.addChild(childTemplate);
  }
};

/** Creates a template factory from a given component. */
const createTemplateFactory = (
  component: cd.IComponent,
  mode: cd.TemplateBuildMode,
  model?: cd.PropertyModel,
  content?: string,
  currentVariant?: string
): TemplateFactory => {
  const factory = new TemplateFactory(mode, component.tagName, model);
  const isInternal = mode === cd.TemplateBuildMode.Internal;
  const wrapperFactory = buildWrapperFactory(factory, mode, component, isInternal);

  // Add internal items such as default attributes and fit content CSS class
  // Don't add if is a child being recursively rendered
  if (isInternal && !component.isInnerChild) {
    // Top-level factory might be original or wrapper
    const topLevelFactory = wrapperFactory !== null ? wrapperFactory : factory;
    topLevelFactory.addDefaultAttributes();
    if (component.fitContent) topLevelFactory.addFitContentClass();
  }

  addCSSClasses(component.css, factory, isInternal, model);
  addAttributes(component.attrs, factory, model?.a11yInputs?.ariaAttrs);
  addDirectives(component.directives, factory, isInternal);

  // Children allowed
  if (isInternal && component.childrenAllowed) {
    factory.allowChildren();
  }

  addChildComponents(component, component.children, model, mode, factory);
  addPortalSlots(component, factory, isInternal);

  // Child content string passed to function
  if (!isInternal && content) factory.addChild(content);

  // If export tagname, set on template factory
  if (component.exportTagName) factory.setExportTagName(component.exportTagName);

  // If binding
  if (isInternal && component.bindIf) {
    factory.add_ngIf_conditionProps(component.bindIf, true);
  }

  // if (isInternal && component.bindFor) { }
  // TODO: Implement this, just need to add context switching
  addPropertyBindings(component, model, factory, currentVariant, isInternal);
  addOutputBinding(component.outputs, currentVariant, factory, isInternal);
  return factory;
};

/** Creates a template factory with a switch for multiple variants. */
const buildVariantSwitchTemplateFactory = (
  propertyName: string,
  variants: IComponentVariant[],
  model?: cd.PropertyModel,
  content?: string
): TemplateFactory => {
  const internal = cd.TemplateBuildMode.Internal;
  const containerFactory = new TemplateFactory(internal, consts.NG_CONTAINER);
  containerFactory.addPropsBoundInputSwitch(propertyName);
  for (const variant of variants) {
    const factory = createTemplateFactory(
      variant.component,
      internal,
      model,
      content,
      variant.name
    );
    factory.addSwitchCase(`'${variant.name}'`);
    containerFactory.addChild(factory.build());
  }
  return containerFactory;
};

/** Renders a child component/class/function to a string. */
const renderChildComponent = (
  component: cd.IComponent,
  child: cd.ComponentChild,
  mode: cd.TemplateBuildMode,
  props: any
): string => {
  // String
  if (isString(child)) return child;

  // Detect if `Component` class
  const isCmpCls = CdComponent.isComponentClass(child);
  if (isClass(child) && !isCmpCls) {
    throw Error('Child classes must extend Component');
  }

  // TemplateFunction
  if (isFunction(child) && !isCmpCls) {
    return (child as cd.TemplateFunction)(mode, props);
  }

  // Component class, instance, or Partial<IComponent>
  let cmp: CdComponent;
  if (child instanceof CdComponent) {
    cmp = child;
  } else if (isCmpCls) {
    cmp = new (child as typeof CdComponent)('');
  } else if (isObject(child)) {
    const cmpConfig = child as Partial<cd.IComponent>;
    cmp = new CdComponent(cmpConfig.id, cmpConfig);
  } else {
    throw Error('Incorrect component child type');
  }

  // Don't add default attributes to children
  cmp.isInnerChild = true;

  // Export behaviors should be inherited
  cmp.exportPropsAsAttrs = component.exportPropsAsAttrs as boolean;

  // Render the component using current build mode/inputs
  return cmp.template(mode, props);
};
