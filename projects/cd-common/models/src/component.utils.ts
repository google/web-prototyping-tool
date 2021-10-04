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
  INDEX_VAR,
  inputPropsBinding,
  isValidAttribute,
  lookupPropAtPath,
  TemplateFactory,
  wrapInBrackets,
} from './template.utils';
import { getPropsRecursive } from './properties.utils';
import { buildChildPortal } from './portal.utils';
import { isString } from 'cd-utils/string';
import * as consts from 'cd-common/consts';
import * as cd from 'cd-interfaces';

export interface IComponentVariant {
  name: string;
  component: cd.IComponent;
}

export const addDirectives = (
  directives: string[] | undefined,
  factory: TemplateFactory,
  isInternal: boolean
) => {
  if (!isInternal) return; // ignore external for now
  if (!directives) return;
  for (const directive of directives) {
    factory.addDirective(directive);
  }
};

export const addAttributes = (
  attrs: cd.AttributeMap | undefined,
  factory: TemplateFactory,
  ariaAttrs?: cd.IA11yAttr[]
) => {
  if (attrs) {
    for (const [key, value] of Object.entries(attrs)) {
      addAttribute(key, value, factory);
    }
  }

  if (ariaAttrs) {
    for (const { name, value } of ariaAttrs) {
      addAttribute(name, value, factory);
    }
  }
};

/**
 * If the component contains a dynamic list property, check to see if there are any portal slots
 * within it. If so, generate an ngFor that creates a portal for each item in the list.
 */
const addDynamicPortalSlots = (
  dynamicListProperty: cd.IPropertyGroup,
  factory: TemplateFactory
) => {
  const { name, inputType, schema } = dynamicListProperty;
  if (!name || inputType !== cd.PropertyInput.DynamicList || !schema) return;
  const allProps = getPropsRecursive(schema);
  const portalSlots = allProps.filter((p) => p.inputType === cd.PropertyInput.PortalSlot);

  // Create a separate ngFor for each portal slot in the dynamic list
  // This is posibble if a component utilizes multiple slots per item
  for (const slotProp of portalSlots) {
    const { name: slotPropName, portalZeroStateMessage } = slotProp;
    if (!slotPropName) continue;
    const propPath = inputPropsBinding(name) + wrapInBrackets(INDEX_VAR);
    const portalPath = lookupPropAtPath(propPath, slotPropName);
    const portal = buildChildPortal(portalPath, true, slotProp.name, true, portalZeroStateMessage);
    const ngForContainer = new TemplateFactory(cd.TemplateBuildMode.Internal, consts.NG_CONTAINER)
      .add_ngFor_Attribute(consts.SLOT, name, true)
      .addChild(portal)
      .build();

    factory.addChild(ngForContainer);
  }
};

export const addPortalSlots = (
  component: cd.IComponent,
  factory: TemplateFactory,
  isInternal: boolean
) => {
  if (!isInternal) return;
  const allProps = getPropsRecursive(component.properties);

  for (const prop of allProps) {
    const { name, inputType, portalZeroStateMessage } = prop;
    if (!name) continue;
    if (inputType === cd.PropertyInput.DynamicList) return addDynamicPortalSlots(prop, factory);
    if (inputType !== cd.PropertyInput.PortalSlot) continue;
    const portalLookup = inputPropsBinding(name);
    const portal = buildChildPortal(portalLookup, false, name, false, portalZeroStateMessage);
    factory.addChild(portal);
  }
};
/** Adds a plain attribute to the factory. */
const addAttribute = (key: string, value: any, factory: TemplateFactory) => {
  // Ignore with false/null/undefined
  if (key && isValidAttribute(value)) {
    const actualVal = value === true ? '' : value === 0 ? '0' : value;
    factory.addAttribute(key, actualVal);
  }
};

export const addCSSClasses = (
  classes: Array<string | cd.ICssBinding> | undefined,
  factory: TemplateFactory,
  isInternal: boolean,
  model?: cd.PropertyModel
) => {
  if (!classes) return;
  for (const cls of classes) {
    if (isString(cls)) {
      // Add static class
      factory.addCSSClass(cls);
    } else {
      // Add input bound class: `[class.className]="props?.input?.binding"`
      const cssBinding: cd.ICssBinding = cls;
      const { name, binding } = cssBinding;

      if (isInternal) {
        factory.addClassPropsBinding(name, binding, true);
      }
      // Add static class for export if truthy value
      else if (model && model.inputs) {
        const value = (model.inputs as cd.IStringMap<cd.PropertyValue>)[binding];
        if (value) factory.addCSSClass(name);
      }
    }
  }
};
export const buildWrapperFactory = (
  factory: TemplateFactory,
  mode: cd.TemplateBuildMode,
  component: cd.IComponent,
  isInternal: boolean
) => {
  if (!isInternal || !component.wrapperTag) return null;
  const wrapperFactory = new TemplateFactory(mode, component.wrapperTag);
  factory.addWrapper(wrapperFactory);
  return wrapperFactory;
};

/** Create temporary components for each variant for rendering templates. */
export const createVariantComponents = (component: cd.IComponent): IComponentVariant[] => {
  // Create a sub-component for each variant
  if (!component.variants) throw Error('Missing variants');
  const entries = Object.entries(component.variants);
  return entries.map((variant) => {
    const [name, variantOverrides] = variant;
    const variantComponent = { ...component, ...variantOverrides };
    return { name, component: variantComponent };
  });
};

export const addOutputBinding = (
  outputs: cd.IOutputProperty[] | undefined,
  currentVariant: string | undefined,
  factory: TemplateFactory,
  isInternal: boolean
) => {
  if (!isInternal || !outputs) return;
  for (const output of outputs) {
    const { eventName, eventKey, type, binding, variant } = output;
    // Exclude if property is not for current variant
    if (variant && variant !== currentVariant) continue;
    const actualEventName = eventName || binding;
    const writeValue = type !== cd.OutputPropertyType.None;
    factory.addOutputBinding(actualEventName, binding, eventKey, writeValue);
  }
};

/** [attr.name]="props?.inputs?.name" */
const addAttributeBinding = (
  propName: string,
  inputName: string,
  value: any,
  factory: TemplateFactory,
  isInternal: boolean,
  addDataBindingLookup = false,
  coerceType?: cd.CoerceValueType
) => {
  if (isInternal) {
    factory.addAttrBoundInputAttribute(propName, inputName, addDataBindingLookup, coerceType);
  } else {
    addAttribute(propName, value, factory);
  }
};

/** [style.--name]="props?.inputs['--name']" | cssVarPipe */
const addCssVarBinding = (
  propName: string,
  inputName: string,
  _value: any, // For export
  factory: TemplateFactory,
  isInternal: boolean,
  _addDataBindingLookup = false, // For data-binding
  _coerceType?: cd.CoerceValueType // For data-binding
) => {
  if (isInternal) {
    // TODO: Consider enabling data-binding after data transformation feature
    factory.addCssVarInputBinding(propName, inputName);
  } else {
    // TODO: Should we export as style="--name: value" ?
    // This will require adding `addStyle` to the TemplateFactory
  }
};

/** <foo>{{value}}</foo> */
const addInnerTextBinding = (
  inputName: string,
  value: any,
  factory: TemplateFactory,
  isInternal: boolean,
  addDataBindingLookup = false,
  coerceType?: cd.CoerceValueType
) => {
  // Internal
  if (isInternal) {
    factory.addInnerTextBinding(inputName, true, addDataBindingLookup, coerceType);
  } else {
    // Exported
    if (value !== null && value !== undefined) {
      factory.addChild(value);
    }
  }
};

/**
 * <foo
 *  [cdTextInject]="props?.inputs?.inputName | dataBindingLookupPipe:dataBindingRefreshTrigger"
 *  [richText]="props?.inputs?.richText">Rich HTML
 * </foo>
 */
const addInnerHTMLBinding = (
  inputName: string,
  value: any,
  factory: TemplateFactory,
  isInternal: boolean,
  addDataBindingLookup = false,
  coerceType?: cd.CoerceValueType
) => {
  // Internal
  if (isInternal) {
    factory.addPropsBoundInputAttribute(
      consts.CD_TEXT_INJECT_DIRECTIVE,
      inputName,
      addDataBindingLookup,
      coerceType
    );
    // Directive requires additional input `richText` to save type (rich or plain text)
    factory.addPropsBoundInputAttribute(consts.RICH_TEXT_ATTR, consts.RICH_TEXT_ATTR);
  }
  // Exported
  else {
    if (value !== null && value !== undefined) {
      factory.addChild(value);
    }
  }
};

/** Create a switch based on tag names. */
const addTagNameBinding = (
  inputName: string,
  menuData: cd.IPropertyMenuItem[] | undefined,
  model: cd.PropertyModel | undefined,
  factory: TemplateFactory,
  isInternal: boolean
) => {
  if (!menuData) throw Error('Missing menu data');
  // Internal
  if (isInternal) {
    const tagNames = menuData.map((item) => item.value);
    factory.addTagBoundInputSwitch(inputName, tagNames);
  }
  // Exported
  else {
    // Set tag name as selected tag name, or first
    if (model && model.inputs) {
      const selectedTag = (model.inputs as cd.IStringMap<any>)[inputName] || menuData[0].value;
      factory.tagName = selectedTag;
    }
  }
};

export const addPropertyBindings = (
  component: cd.IComponent,
  model: cd.PropertyModel | undefined,
  factory: TemplateFactory,
  currentVariant: string | undefined,
  isInternal: boolean
) => {
  // Property bindings
  const inputs: any = model?.inputs || {};
  const allProps = getPropsRecursive(component.properties);

  for (const prop of allProps) {
    if (!prop.name) continue;

    // Exclude if property is not for current variant
    if (prop.variant && prop.variant !== currentVariant) continue;

    const { name, dataBindable, coerceType, bindingType, inputType, optionsConfig } = prop;
    const inputName = prop.inputName || name;
    const value = inputs[inputName];
    const { List, DynamicList, DatasetSelect, PortalSlot } = cd.PropertyInput;
    const datasetLookup = prop.inputType === DatasetSelect;

    // If inputType is a portal slot, we do not need to setup a property binding
    if (inputType === PortalSlot) continue;

    // If the property uses a list control and unique selection is enabled, automatically setup the
    // binding to the selectedIndex input
    if ((inputType === List || inputType === DynamicList) && optionsConfig) {
      const { supportsSelection, supportsUniqueSelection } = optionsConfig;
      if (supportsSelection && supportsUniqueSelection) {
        const selectedIndex = consts.SELECTED_INDEX_ATTR;
        const indexValue = inputs[selectedIndex];
        if (isInternal) factory.addPropsBoundInputAttribute(selectedIndex);
        else addAttribute(selectedIndex, indexValue, factory);
      }
    }

    // Setup template binding for this properties `BindingType`
    switch (bindingType) {
      /** No binding */
      case cd.BindingType.None:
        break;

      case cd.BindingType.Attribute:
        addAttributeBinding(name, inputName, value, factory, isInternal, dataBindable, coerceType);
        break;

      case cd.BindingType.InnerText:
        addInnerTextBinding(inputName, value, factory, isInternal, dataBindable, coerceType);
        break;

      case cd.BindingType.InnerHtml:
        addInnerHTMLBinding(inputName, value, factory, isInternal, dataBindable, coerceType);
        break;

      case cd.BindingType.TagName:
        addTagNameBinding(inputName, prop.menuData, model, factory, isInternal);
        break;

      case cd.BindingType.CssVar:
        addCssVarBinding(name, inputName, value, factory, isInternal, dataBindable, coerceType);
        break;

      /** Create a switch based on multiple variants. */
      case cd.BindingType.Variant:
        // Added in `getTemplateFunction`
        break;

      /** JS Property Binding (default) - [name]="props?.inputs?.value" */
      default:
        if (isInternal) {
          if (datasetLookup) factory.addPropsBoundDatasetLookup(name, inputName);
          else factory.addPropsBoundInputAttribute(name, inputName, dataBindable, coerceType);
        }
        // For export, properties are added as attributes in some cases
        // This is set via a special config, `exportPropsAsAttrs`
        else if (component.exportPropsAsAttrs) {
          addAttribute(name, value, factory);
        }
    }
  }
};
