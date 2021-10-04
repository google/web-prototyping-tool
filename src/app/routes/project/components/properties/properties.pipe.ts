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

import { Pipe, PipeTransform } from '@angular/core';
import * as cd from 'cd-interfaces';
import { isObject } from 'cd-utils/object';
import { valueFromIValue, isIValue, isDataBoundValue, lookupDataBoundValue } from 'cd-common/utils';
import { processCondition } from './properties.utils';
import { isString } from 'cd-utils/string';

const propsToSelectItemList = (
  props: cd.PropertyModel[],
  selectedId?: string
): cd.ISelectItem[] => {
  return props.map(({ name: title, id: value }) => {
    const selected = value === selectedId;
    return { title, value, selected };
  });
};

/**
 * Check for conditions on dynamic properties
 */
@Pipe({ name: 'meetsConditions' })
export class MeetsConditionsPipe implements PipeTransform {
  transform(
    conditions: cd.PropertyCondition[] | undefined,
    mergedProps: cd.PropertyModel,
    parentMergedProps?: cd.PropertyModel
  ): boolean {
    if (!conditions) return true;
    return conditions.every((condition) => {
      return processCondition(condition, mergedProps, parentMergedProps);
    });
  }
}

@Pipe({ name: 'styleBinding' })
export class StyleBindingPipe implements PipeTransform {
  transform(ref: cd.RecursivePartial<cd.PropertyModel>): cd.IStyleDeclaration {
    const state = ref.state || cd.State.Default;
    const group = ref.styles && (ref.styles[state] as cd.IStyleGroup);
    return (group && (group.style as cd.IStyleDeclaration)) || {};
  }
}

/**
 * Generates an ngTemplateOutletContext based on current properties
 * If this property is a symbolOverride it will bind to the override
 * otherwise it will use the default mergedProps
 */
export interface ITemplateContext {
  prop: cd.IPropertyGroup;
  target: cd.RecursivePartial<cd.PropertyModel>;
}

@Pipe({ name: 'contextPipe' })
export class TemplateContextPipe implements PipeTransform {
  transform(
    prop: cd.IPropertyGroup,
    mergedProps: cd.PropertyModel,
    symbolInstanceInputs?: cd.SymbolInstanceInputs
  ): { $implicit: ITemplateContext } {
    const { targetId } = prop;
    const target = (
      targetId && symbolInstanceInputs ? symbolInstanceInputs[targetId] : mergedProps
    ) as cd.PropertyModel;

    return { $implicit: { prop, target } };
  }
}

const processStyleBinding = (context: ITemplateContext) => {
  const { name, defaultValue } = context.prop;
  if (!name) return defaultValue;
  const styleValue = context.target.styles?.base?.style?.[name] ?? defaultValue;
  // For objects, attempt to convert if IValue object,
  // otherwise throw unsupported error for other types
  if (isObject(styleValue)) {
    if (isIValue(styleValue)) return valueFromIValue(styleValue);
    throw Error('Style binding does not currently support complex styles (font, border, etc)');
  }

  return styleValue;
};

const processDataBinding = (
  inputValue: cd.IDataBoundValue,
  elementProperties: cd.ElementPropertiesMap,
  loadedData: Record<string, any>,
  fallbackValue?: any
): any => {
  const valueLookup = lookupDataBoundValue(inputValue, elementProperties, loadedData);
  return valueLookup !== undefined ? inputValue : fallbackValue;
};

const inputFromContext = (context: ITemplateContext, name: string): any => {
  const targetInputs = context.target?.inputs;
  if (!targetInputs) return undefined;
  return (targetInputs as cd.IStringMap<any>)[name];
};

@Pipe({ name: 'contextBinding' })
export class ContextBindingPipe implements PipeTransform {
  transform(context: ITemplateContext, altFallback?: any): any {
    const { name, bindingType, defaultValue } = context.prop;
    if (!name) return defaultValue;
    if (bindingType === cd.BindingType.Style) return processStyleBinding(context);
    const value = inputFromContext(context, name);
    if (isDataBoundValue(value)) return altFallback; // Ignore data bound values
    return value ?? (defaultValue || altFallback);
  }
}

/** Verify that a value has data binding - used along side input-group and rich-text */
@Pipe({ name: 'dataBoundValuePipe' })
export class DataBoundValuePipe implements PipeTransform {
  transform(
    context: ITemplateContext,
    props: cd.ElementPropertiesMap = {},
    loadedData: Record<string, any> = {}
  ): any | undefined {
    const { name, defaultValue } = context.prop;
    if (!name) return defaultValue;
    const value = inputFromContext(context, name);
    return isDataBoundValue(value) ? processDataBinding(value, props, loadedData) : undefined;
  }
}

@Pipe({ name: 'richTextValuePipe' })
export class RichTextValuePipe implements PipeTransform {
  transform(
    context: ITemplateContext,
    props: cd.ElementPropertiesMap = {},
    loadedData: Record<string, any> = {},
    altFallback = ''
  ): any | undefined {
    const { name, defaultValue } = context.prop;
    if (!name) return defaultValue;
    const value = inputFromContext(context, name);
    if (isDataBoundValue(value)) return processDataBinding(value, props, loadedData, altFallback);
    return value ?? (defaultValue || altFallback);
  }
}

@Pipe({ name: 'portalPipe' })
export class BoardPortalPipe implements PipeTransform {
  transform(
    referenceId: string,
    boards: cd.IBoardProperties[] = [],
    root: cd.PropertyModel[] | string = []
  ): cd.ISelectItem[] {
    const rootId = Array.isArray(root) ? root[0]?.rootId : root;
    const selectedReferenceId = referenceId || '';
    const props = boards.filter((item) => {
      // Filter out the current root board unless it is selected
      return item.id === rootId ? selectedReferenceId === rootId : true;
    });

    return propsToSelectItemList(props, selectedReferenceId);
  }
}

/** This returns a select list of all checkboxes for the current board */
@Pipe({ name: 'boardCheckboxPipe' })
export class BoardCheckboxPipe implements PipeTransform {
  transform(
    _currentChildren: cd.IGenericConfig[] = [],
    selectedIds: ReadonlyArray<string> = [],
    props: cd.ElementPropertiesMap = {}
  ): cd.ISelectItem[] {
    const [first] = selectedIds;
    const elem = props[first];
    const boardId = elem?.rootId;
    const list = Object.values(props) as cd.PropertyModel[];
    const checkboxes = list.filter((item): item is cd.ICheckboxProperties => {
      const isRoot = item.rootId === boardId;
      const notSelected = !selectedIds.includes(item.id);
      return isRoot && notSelected && item?.elementType === cd.ElementEntitySubType.Checkbox;
    });

    return propsToSelectItemList(checkboxes);
  }
}

/** Checks to see if there is a input value for a toggle button, if not fallback on default value */
@Pipe({ name: 'selectedTogglePipe' })
export class SelectedTogglePipe implements PipeTransform {
  transform(
    inputValue: string | boolean | number | undefined,
    value: string | boolean | number | undefined,
    defaultValue: string | boolean | number | undefined
  ): boolean {
    const checkValue = inputValue ?? defaultValue;
    return checkValue === value;
  }
}

/** Checks to see if there is a input value for a toggle button, if not fallback on default value */
@Pipe({ name: 'fallbackValuePipe' })
export class FallbackValuePipe implements PipeTransform {
  transform(inputValue: any, fallbackValue: any): any {
    return inputValue ?? fallbackValue;
  }
}

/**
 * Adds legacy dataset items if model currenty has one of them selected
 *
 * Also, always adds built-in People dataset if model is the Cloud Table
 */
@Pipe({ name: 'legacyDatasetPipe' })
export class LegacyDatasetPipe implements PipeTransform {
  transform(
    datasetItems: cd.ISelectItem[],
    _currentDatasetId?: string,
    _propertyModel?: cd.PropertyModel
  ): any {
    return datasetItems;
  }
}

@Pipe({ name: 'propsTargetIdPipe' })
export class PropsTargetIdPipe implements PipeTransform {
  transform(value: ITemplateContext): string | undefined {
    return value.prop?.targetId || value.target.id;
  }
}

@Pipe({ name: 'selectedPropIdsPipe' })
export class SelectedPropsIdsPipe implements PipeTransform {
  transform(value: ITemplateContext, ids: ReadonlyArray<string>): ReadonlyArray<string> {
    const targetId = new PropsTargetIdPipe().transform(value) || '';
    return Array.from(new Set([targetId, ...ids]));
  }
}

@Pipe({ name: 'richTooltipPipe' })
export class RichTooltipPipe implements PipeTransform {
  transform(helpValue?: string | cd.IRichTooltip): cd.IRichTooltip | undefined {
    if (isString(helpValue)) return { text: helpValue };
    return helpValue;
  }
}

@Pipe({ name: 'autoNavItemDestinationOptionsPipe' })
export class AutoNavItemDestinationOptionsPipe implements PipeTransform {
  transform(
    navItemInputs: cd.IAutoNavItemBoard | undefined,
    boards: cd.IBoardProperties[] = [],
    parentPortalTarget = '',
    selectedElements: cd.PropertyModel[]
  ): cd.ISelectItem[] {
    const rootId = selectedElements[0]?.rootId;
    const selectedReferenceId = navItemInputs?.referenceId || '';
    const portalConnected = parentPortalTarget !== '';
    const navItemTopSelected = navItemInputs && navItemInputs.top === true;
    const portalConnectedAndTopNotSelected = portalConnected && !navItemTopSelected;
    const list = boards.filter((item) => {
      // Filter out the current root board unless it is selected
      const itemIdIsRoot = item.id === rootId;
      const shouldFilterOutCurrentBoard = portalConnectedAndTopNotSelected && itemIdIsRoot;
      return shouldFilterOutCurrentBoard ? selectedReferenceId === rootId : true;
    });

    return propsToSelectItemList(list, selectedReferenceId);
  }
}
