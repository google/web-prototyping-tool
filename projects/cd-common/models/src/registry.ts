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
  getPropsRecursive,
  isIcon,
  isBoard,
  isSymbol,
  propsContainPortalSlot,
} from './properties.utils';
import { getCodeComponentScopedTagName } from 'cd-common/utils';
import { LayerIcons } from 'cd-common/consts';
import { CdComponent } from './component';
import { deepCopy } from 'cd-utils/object';
import { ADVANCED_CONFIG, HIDDEN_CONFIG } from './properties.consts';
import { generateContent } from './template.utils';
import * as cd from 'cd-interfaces';

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

/**
 * Registers a component to the registry. Code components can be re-registered
 * at any point during runtime to support dynamic updates.
 * @return a list of component errors on failure, otherwise null on success.
 */
export const register = (component: cd.IComponent): cd.IComponentError[] | null => {
  // Prevent built-in components from being re-registered
  if (component.id in cd.ElementEntitySubType && componentRegistry.has(component.id)) {
    throw Error(`Attempted re-registration of internal component ${component.id}`);
  }

  // Final processing before freezing
  component.properties = processComponentProps(component);

  // Validate component
  const errors = component.validate();
  if (errors && errors.length) {
    for (const error of errors) {
      console.error(
        `${component.title}: ${error.type} ${error.name ? `"${error.name}"` : ''} ${error.message}`
      );
    }
    return errors; // Failure
  }

  // Freeze and final registration
  const finalCmp = Object.freeze(component);
  componentRegistry.set(component.id, finalCmp);

  // Also register any aliases, which are just alternative names for components.
  // This is mainly used for backwards support of deprecated components.
  if (finalCmp.aliases) {
    for (const alias of finalCmp.aliases) {
      componentAliases.set(alias, finalCmp);
    }
  }

  // Invalidate query cache for new registrations
  componentQueryCache.clear();

  return null; // Success
};

/** Validates and sets any default values on the component properties. */
const processComponentProps = (component: cd.IComponent): cd.IPropertyGroup[] => {
  const propsClone = deepCopy(component.properties);
  const allProps = getPropsRecursive(propsClone);

  // Set any default values
  for (const prop of allProps) {
    // Properties with inputs should default to generic type
    // Currently `type` is only used internally, but needs to be set
    if (prop.inputType !== undefined && prop.type === undefined) {
      prop.type = cd.PropertyType.AttributeGeneric;
    }
  }

  // Some built-in properties such as Size, Position, Opacity, etc, are auto-added
  if (component.autoAddDefaultProperties) {
    // Opacity
    if (missingProperty(allProps, cd.PropertyType.StyleOpacity)) {
      propsClone.unshift({ children: [{ type: cd.PropertyType.StyleOpacity }] });
    }

    // Position
    if (missingProperty(allProps, cd.PropertyType.StylePosition)) {
      propsClone.unshift({ type: cd.PropertyType.StylePosition });
    }

    // Size
    if (missingProperty(allProps, cd.PropertyType.StyleSize) && !component.preventResize) {
      // TODO Add support for resize types
      // Do not add for Vertical/Horizontal/Uniform resize types
      // For example, the icon is resized uniformly
      if (!component.resizeType || component.resizeType === cd.ResizeType.Any) {
        propsClone.unshift({ type: cd.PropertyType.StyleSize });
      }
    }

    // Advanced
    if (missingProperty(allProps, cd.PropertyType.StyleAdvanced)) {
      propsClone.push(ADVANCED_CONFIG);
      propsClone.push(HIDDEN_CONFIG);
    }

    // track if this component has a portal slot
    if (propsContainPortalSlot(allProps)) {
      componentsWithPortalSlots.add(component.id);
    }
  }

  // Auto-add conditionals for variant properties
  const variantProp = allProps.find(({ bindingType }) => bindingType === cd.BindingType.Variant);

  if (variantProp && variantProp.name) {
    for (const prop of allProps) {
      if (prop.variant && prop.name) {
        prop.conditions = [generateCondition(variantProp.name, prop.variant)];
      }
    }
  }

  return propsClone;
};

const generateCondition = (
  name: string,
  value: any,
  type = cd.PropConditionEquality.Equals
): cd.PropertyCondition => {
  return { name, type, value };
};
/**
 * A @registerComponent decorator for defining components.
 * @param id - The definition ID.  It should only be set once, and cannot
 *    be changed since it is referenced by database entities.
 */
export const registerComponent =
  (id: cd.ComponentIdentity) => (ComponentCls: typeof CdComponent) => {
    const component = new ComponentCls(id);
    register(component);
  };

/**
 * Handles specific code-component registration details such as setting initial
 * width/height, and creating a uniquely scoped tag name.
 */
export const registerCodeComponent = (codeComponent: cd.ICodeComponentDocument) => {
  const { id, frame } = codeComponent;

  // Code component definitions can be updated,
  // so we remove from registry to allow re-registering with updates
  unRegisterCodeComponent(id);

  const copy = deepCopy(codeComponent);

  // Filter out any properties that the user has not defined a binding for yet
  const filteredProps = copy.properties.filter((p: cd.IPropertyGroup) => !!p.name);

  // Make all code component inputs data bindable
  // Some properties should be excluded such as CSS vars
  // TODO: Consider making css vars data-bindable after data transformation feature
  const dataBindableProps = filteredProps.map((prop) => {
    return { ...prop, dataBindable: isPropertyDataBindable(prop) };
  });

  // use frame size as initial width/height
  if (frame) {
    copy.width = frame.width;
    copy.height = frame.height;
  }

  // Currently all code code component properties are saved in a flat list.
  // This step moves all the properties down into a property group in order
  // to format/space correctly in the properties panel
  copy.properties = [{ children: dataBindableProps }];

  // Use scoped tag name when renderering, but preserve initial tagname for export
  copy.exportTagName = copy.tagName;
  copy.tagName = getCodeComponentScopedTagName(copy.id, copy.tagName);

  const component = new CdComponent(id, copy);
  register(component);
};

export const unRegisterCodeComponent = (id: string) => componentRegistry.delete(id);

/** Caches an array of components for each library. */
export const componentQueryCache = new Map<cd.ComponentLibrary | string, cd.IComponent[]>();

const filteredRegistryValues = (
  registry: RegistryMap,
  canIgnoreDeprecated: boolean,
  library: cd.ComponentLibrary
) => {
  return [...registry.values()].filter((cmp) => {
    const isDeprecated = canIgnoreDeprecated ? !cmp.deprecated : true;
    const withinLibrary = library !== cd.ComponentLibrary.All ? cmp.library === library : true;
    return isDeprecated && withinLibrary;
  });
};

/**
 * Retrieves a set of components, optionally for a specific library.
 * This method also caches any array that is retrieved.
 * @param library - Retrieve only from this library.
 * @param ignoreDeprecated - Ignore hidden components for UI
 */
export const getComponents = (
  library = cd.ComponentLibrary.All,
  ignoreDeprecated = false
): cd.IComponent[] => {
  // Create a cache key from params.  Example
  // all:true -> all components except for hidden
  // all:false -> all components
  // primitive:true -> all primitives except for hidden
  const key = `${library}:${ignoreDeprecated}`;

  const results = componentQueryCache.get(key);
  if (results) return results;

  // Filter based on library and hidden
  const filteredResults = filteredRegistryValues(componentRegistry, ignoreDeprecated, library);
  componentQueryCache.set(key, filteredResults);
  return filteredResults;
};

/**
 * Returns a component definition for the provided ID.  It works with both
 * built-in components and user-created code components.
 */
export const getComponent = (id: cd.ComponentIdentity | undefined): cd.IComponent | undefined => {
  if (!id) return undefined;
  // Try registry first
  if (componentRegistry.has(id)) return componentRegistry.get(id);
  // Try aliases
  if (componentAliases.has(id)) return componentAliases.get(id);
  console.warn(`Component "${id}" not found`);
  return undefined;
};

export const getAliasesIDs = (): cd.ComponentIdentity[] => {
  return Array.from(componentAliases).map(([id]) => id);
};

/** Removes all components from registry, mostly for testing. */
export const clearRegistry = () => {
  componentRegistry.clear();
  componentAliases.clear();
};

export const iconForComponent = (node: cd.PropertyModel, homeBoardId = ''): string => {
  if (homeBoardId === node.id) return LayerIcons.Home;
  if (isIcon(node)) return LayerIcons.Icon;
  if (isBoard(node)) return LayerIcons.Board;
  if (isSymbol(node)) return LayerIcons.Component;
  const { elementType: nodeElementType } = node;
  const entity = getComponent(nodeElementType);
  const indentity = entity?.id;
  if (
    entity &&
    indentity !== cd.ElementEntitySubType.Generic &&
    nodeElementType !== cd.ElementEntitySubType.Generic &&
    indentity === nodeElementType
  ) {
    return entity.icon;
  }
  return node.childIds?.length > 0 ? LayerIcons.Folder : LayerIcons.GenericElement;
};

/** Indicates if the property list contains a certain type. */
const missingProperty = (props: cd.IPropertyGroup[], type: cd.PropertyType): boolean => {
  return !props.some((prop) => prop.type === type);
};

/** Returns true if property is data-bindable. */
const isPropertyDataBindable = (prop: cd.IPropertyGroup): boolean => {
  return prop.bindingType !== cd.BindingType.CssVar;
};

export const generateTemplateContent = (rootIds: string[]): string => {
  return generateContent(getComponent, rootIds);
};
