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
  BindingType,
  ComponentErrorType,
  ComponentVariant,
  IComponent,
  IComponentError,
  IPropertyGroup,
} from 'cd-interfaces';
import { getPropsRecursive } from './properties.utils';

/** Determines if the tag name can be retrieve from the current config. */
const hasTagName = (component: IComponent, allProps: IPropertyGroup[]): boolean => {
  return (
    !!component.tagName || // tagName directly provided
    // Determined via variants
    Object.values(component.variants ?? {}).some((v: ComponentVariant) => !!v.tagName) ||
    // Determined via tag name binding
    allProps.some((p) => p.bindingType === BindingType.TagName)
  );
};

export const validateComponent = (comp: IComponent): IComponentError[] => {
  const errors: IComponentError[] = [];
  const allProps = getPropsRecursive(comp.properties);
  const addError = (type: ComponentErrorType, name: string, message: string) =>
    errors.push({ type, name, message });

  // Title
  if (!comp.title) {
    addError(ComponentErrorType.Field, 'title', 'is required');
  }

  // Validate variants
  if (comp.variants !== undefined) {
    const variantKeys = Object.keys(comp.variants);
    if (variantKeys.length) {
      // Ensure variant components have a corresponding property with `BindingType.Variant`
      const variantProp = allProps.find(({ bindingType }) => bindingType === BindingType.Variant);
      if (!variantProp || !variantProp.name) {
        addError(ComponentErrorType.Field, 'variants', 'needs a property with variant binding');
      }

      // Ensure the variant names match the property menu data
      else {
        const menuData = variantProp?.menuData || undefined;
        for (const name of variantKeys) {
          if (!menuData || !menuData.find((m) => m.value === name)) {
            addError(
              ComponentErrorType.Property,
              variantProp.name,
              'needs `menuData` values that match the variants.'
            );
            break;
          }
        }
      }
    }
  }

  // Validate has tag name
  if (!hasTagName(comp, allProps)) {
    addError(
      ComponentErrorType.Field,
      'tagName',
      'must be provided directly, by variants, or by tag name binding'
    );
  }

  // Properties
  for (const prop of allProps) {
    // Bound properties must have `name` set
    if (prop.bindingType && !prop.name) {
      addError(ComponentErrorType.Property, '', 'bound property must have `name` set.');
    }

    // Tag name binding
    if (prop.bindingType === BindingType.TagName) {
      if (!prop.menuData || !prop.menuData.length) {
        addError(
          ComponentErrorType.Property,
          prop.name || '',
          'must have `menuData` set with tag names.'
        );
      }
    }

    // Empty menu data
    if (prop.menuData && prop.menuData.length === 0) {
      addError(ComponentErrorType.Property, prop.name || '', '`menuData` data cannot be empty');
    }
  }

  // Outputs

  for (const output of comp.outputs ?? []) {
    // Missing binding
    if (!output.binding) {
      addError(ComponentErrorType.Output, output.eventName || '', 'missing `binding`');
    }
  }

  // TODO: Add additional validations/tests
  return errors;
};
