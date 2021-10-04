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

import { IPropertyGroup, IOutputProperty, PropertyValue } from './properties';
import { IComponentFactory } from './component-instances';
import { ComponentIdentity } from './entity-types';
import { TemplateFunction } from './templates';
import { IStringMap } from './index';
import { IStyleDeclaration } from './style-declaration';

/**
 * The universal definition of a component type.
 * - Almost everything in the renderer is a component, including boards, symbols,
 *   portals, primitives, material, cloud components, and user code components.
 * - The `IComponent` definition represents the TYPE of component, NOT the instance.
 *   `IComponentInstance` objects are created from this definition.
 * - Components have metadata, properties, outputs/events, children, attributes,
 *   styles, input data, variations, logic binding, aria attributes, etc.
 * - A component represents a single HTML element.
 * - Components are often composed of other child components.
 */
export type ComponentTemplateFn = (component: IComponent) => TemplateFunction;

export interface IComponent {
  /** Globally unique ID for component. */
  id: ComponentIdentity;

  /** Tag name rendered in the DOM. */
  tagName: string;

  /** Tag name used when exporting HTML (Optional) */
  exportTagName?: string;

  /** Globally unique for associated library. */
  library?: string;

  /**
   * Defines a set of variants, which are slightly different configs for a
   * similar component.  For instance, an input vs textarea component.
   */
  variants?: IStringMap<ComponentVariant>;

  /** If this is a wrapper component, only the child element is exported. */
  isWrapper?: boolean;

  /** Automatically adds a top-level wrapper to the template. */
  wrapperTag?: string;

  /** User-friendly display title. */
  title: string;

  /** A detailed description 10-100 words. */
  description?: string;

  /** Directives added to this component */
  directives?: string[];

  /** A set of tags for categorizing a component */
  tags?: string[];

  /** Name of existing material/extended icon, or an image path. */
  icon: string;

  /** Allows children to be added to the element. */
  childrenAllowed: boolean;

  /**
   * Defines a set of child items to be rendered in the template,
   * which supports complex, composable component definitions.
   * This does NOT refer to "children" added by the user.
   */
  children?: ComponentChild[];

  /** Allows the width/height to be adjusted. */
  preventResize: boolean;

  /** Defines how the component can be adjusted. See `ResizeType` for details. */
  resizeType?: ResizeType;

  /** Adds the .cd-fit-content CSS class which assigns width/height: fit-content */
  fitContent?: boolean;

  /** All properties and property groups, in a hierarchical structure. */
  properties: IPropertyGroup[];

  /** Defines all event outputs for component. */
  outputs?: IOutputProperty[];

  /** An initial set of inputs. */
  inputs?: IStringMap<any>;

  // Initial state of a component being added to a board
  width?: string | number;
  height?: string | number;
  styles?: IStyleDeclaration;
  attrs?: AttributeMap;

  /** CSS classes can be a static, or a bound to a truthy input value. */
  css?: Array<string | ICssBinding>;

  /** Adds an `if` expression bound to an input value, evaluated as truthy. */
  bindIf?: string;

  // TODO: Finish implementation
  /**
   * Adds a `for` expression bound to an input value array.  The context is
   * automatically switched from `props.inputs` to `item` for children.
   */
  bindFor?: string;

  /**
   * Defines an alternative set of ID's for component, primarily used to support
   * backwards compatibility of legacy components. For this to work seamlessly
   * however, the legacy and new components should very similar inputs.
   */
  aliases?: ComponentIdentity[];

  /** Registered, but hidden on menus. */
  deprecated?: boolean;

  /**
   * Indicates the component is a child of another top-level component,
   * so any top-level items such as default attributes/css are not added.
   */
  isInnerChild?: boolean;

  /** Export all properties as attributes. */
  exportPropsAsAttrs?: boolean;

  /** Auto-add common properties such as size, position, opacity, and advanced. */
  autoAddDefaultProperties?: boolean;

  // Aria attributes
  ariaRole?: string;
  ariaLabel?: string;
  ariaAttrs?: IStringMap<string | number | boolean>;

  /**
   * Creates an instance of the component.  A custom factory can be provided,
   * or the default component factory is used instead.
   */
  factory: IComponentFactory;

  /**
   * Renders a string template for the component.  A custom function can be
   * provided, or the default template function is used instead.
   */
  template: TemplateFunction;

  /** Config for auto-generating an audit/demo page for the component. */
  audit?: IAuditConfig;

  /** Returns a list of validation errors for component. */
  validate(): IComponentError[] | null;
}

export type AttributeMap = IStringMap<string | number | boolean>;

/** Binds a CSS class to a truthy input value. */
export interface ICssBinding {
  name: string;
  binding: string;
}

// TODO Add support for resize types
/**
 * Defines how and in what directions the component can be resized. For instance,
 * The icon is resize uniformly, as the width/height should always be equal.
 * Other components, such as the datepicker should only be resized horizontally.
 */
export enum ResizeType {
  Any = 'any',
  VerticalOnly = 'vertical',
  HorizontalOnly = 'horizontal',
  Uniform = 'uniform',
  None = 'none',
}

/** The types of child items that can be rendered in the template. */
export type ComponentChild =
  | IComponent
  | Partial<IComponent>
  | TemplateFunction
  | Function
  | string;

/**
 * Only certain fields can be used for variants, mostly the ones used to
 * generate templates.  In addition, the properties and outputs can be marked
 * for different variants.
 */
export type ComponentVariant = Pick<
  IComponent,
  'tagName' | 'inputs' | 'children' | 'width' | 'height' | 'css' | 'attrs' | 'styles' | 'fitContent'
>;

export enum ComponentErrorType {
  Field = 'field',
  Property = 'property',
  Output = 'output',
}

/**
 * Used to create a consistent error string. Example:
 * ${type} "${name}" ${message} -> 'field "title" cannot be blank'
 */
export interface IComponentError {
  type: ComponentErrorType;
  name: string;
  message: string;
}

export interface IAuditConfig {
  /** Automatically creates a section for every property if true. */
  autoGenerateSections?: boolean;

  /** Optionally define individual sections for view. */
  sections?: IAuditSection[];

  /**
   * The most important property for this component, usually type or variant.
   * All sections are repeated for each possible value of this property.
   */
  variantProperty?: string;

  /** Set these values, for every instance in every section. */
  values?: Record<string, PropertyValue>;

  /** One or more properties to combine/iterate through, in every section. */
  properties?: string[];

  /**
   * Allows for input updates after components are created.
   * If `false` is returned, the component is excluded.
   */
  transform?: (inputs: Record<string, PropertyValue>) => boolean | undefined;

  /** Exclude this properties when auto-generating sections. */
  exclude?: string[];

  /** Width of component column. */
  columnWidth?: string | number;
}

export interface IAuditSection {
  /** One or more properties to combine/iterate through. */
  properties: string[];

  /** Optionally set title for section. */
  title?: string;

  /** Set these values for section. */
  values?: Record<string, PropertyValue>;
}
