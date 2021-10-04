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

import { IPropertiesUpdatePayload, PropertyModel } from './property-models';
import { PropertyType } from './property-type';
import { IGenericListConfig } from './generic-list';
import { IGenericConfig } from './component-instances';
import { IRichTooltip, IStringMap, IValue } from './index';
import { IIconOptionsConfig } from './icons';

export type Primitive = string | number | boolean | undefined;
export type PropertyValue =
  | Primitive
  | Primitive[]
  | IStringMap<Primitive>
  | IStringMap<PropertyValue>[]
  | IGenericConfig[]
  | IValue
  | IValue[];

export type MixedCollection = 'Mixed Collection';
export const MIXED_COLLECTION: MixedCollection = 'Mixed Collection';

// TODO: Document all fields

export const CoerceValue = {
  Boolean: 'boolean',
  String: 'string',
  Number: 'number',
} as const;

export type CoerceValueType = typeof CoerceValue[keyof typeof CoerceValue];

export interface IProperty {
  id?: string;
  /** Name of the property, but allow the default name for input/attr/js prop. */
  name?: string;
  bindingType?: BindingType;
  inputType?: PropertyInput;
  /** The explicit name of the input, otherwise defaults to `name`. */
  inputName?: string;

  /**
   * The label of the group or input which depends on context. When used
   * inside a `children` array it will act as the input label.
   */
  label?: string;
  bottomLabel?: string;
  placeholder?: string;
  help?: string | IRichTooltip;
  defaultValue?: PropertyValue;
  menuData?: IPropertyMenuItem[];
  min?: number;
  minBinding?: string;
  max?: number;
  maxBinding?: string;
  step?: number;
  stepBinding?: string;
  innerLabel?: string;
  /** Function that is called when a property changes that can modify typically inputs and styles on the model*/
  propertyTransformer?: PropertyTransformerFn;
  /** Function that is called when a property changes to modify properties on a different element */
  siblingTransformer?: SiblingPropertyTransformerFn;
  optionsConfig?: IGenericListConfig;
  /** Only show if the properties panel is in a specific state. */
  conditions?: PropertyCondition[];

  /** Indicates the property is only valid for certain variants. */
  variant?: string;
  resetState?: string;

  /* Used for PropertyInput.DatasetSelect - check that dataset chosen is an array of objects **/
  enforceTablularData?: boolean;

  /**
   * Use to ensure that the value of an input is always a certain type.
   *
   * Primarily for data-binding cases when a user can bind a value of any type to an input.
   * This will ensure that an input that requires a string can coerce a number, etc to a string.
   */
  coerceType?: CoerceValueType;

  /**
   * Used if inputType is DynamicList.
   * Defines the properties that appear within the modal for each list item
   */
  schema?: IPropertyGroup[];

  /** Options available for icon input */
  iconInputOptions?: IIconOptionsConfig;

  /** Message to use inside empty portal */
  portalZeroStateMessage?: string;
}

// TODO: IPropertyGroup probably shouldn't extend IProperty.
// children can just be changed to IPropertyGroup[] | IProperty
export interface IPropertyGroup extends IProperty, ICosmeticProperty {
  targetId?: string;
  type?: PropertyType;
  enabled?: boolean;
  groupType?: PropertyGroupType;
  collapsed?: boolean;
  dataBindable?: boolean;
  /** Auto expand a collapsed group based on if child values are set */
  autoExpand?: boolean;
  /** list of style properties which for expansion i.e ['zIndex', 'cursor'] */
  autoExpandStyles?: string[];
  /**
   * This ensures that a custom property group isn't wrapped in a container, which
   * would add unwanted padding.  An example of this are things like background,
   * border and shadow which are already a grouping of sorts.
   */
  standalone?: boolean;

  /**
   * Nesting PropertyGroups inside as children is one level deep, with the top
   * level as the group and children as the list of inputs.
   */
  children?: IPropertyGroup[];
}

export interface IPropertyMenuItem {
  id?: string;
  title: string;
  value: any;
}

export interface ICosmeticProperty {
  colorMenu?: boolean; // Show colors in menu dropdown
  removePadding?: boolean; // Removes padding from within a propertyGroup component
  fullWidth?: boolean; // Used to ignore left label and maximize input
}

export enum PropertyGroupType {
  Add = 'add',
  Collapse = 'collapse',
  Delete = 'delete',
  DeleteAll = 'delete-all',
  ToggleSwitch = 'switch',
}

export enum PropertyInput {
  AutoComplete = 'auto-complete',
  Checkbox = 'checkbox',
  Color = 'color',
  Date = 'date',
  DynamicList = 'dynamic-list',
  ElementPicker = 'element-picker',
  Group = 'group',
  Icon = 'icon',
  Integer = 'integer',
  List = 'list',
  Number = 'number',
  PercentRange = 'percent',
  Range = 'range',
  Select = 'select',
  SelectGrid = 'select-grid',
  Text = 'text',
  TextArea = 'textarea',
  Toggle = 'toggle',
  RichText = 'rich-text',
  DatasetSelect = 'dataset-select',
  PortalSlot = 'portal-slot',
  Units = 'units',

  /** Select from the available portals on a given board */
  PortalSelect = 'portal-select',
}

export type PropertyTransformerFn = (
  value: any,
  props: PropertyModel,
  loadedData: Record<string, any>
) => Partial<PropertyModel>;

export type SiblingPropertyTransformerFn = (
  value: any,
  props: PropertyModel,
  loadedData: Record<string, any>
) => IPropertiesUpdatePayload[];

export enum PropConditionEquality {
  Equals = 'equals',
  NotEquals = 'not-equals',
  EqualsInParent = 'equals-in-parent',
  NotEqualsInParent = 'not-equals-in-parent',
}

export enum PropConditionExists {
  Exists = 'exists',
  ExistsInParent = 'exists-in-parents',
}

export interface IPropertyConditionalBase {
  name: string;
  type: PropConditionEquality | PropConditionExists;
}

export interface IPropertyConditional extends IPropertyConditionalBase {
  name: string;
  value: any;
  type: PropConditionEquality;
}

export interface IPropertyConditionExists extends IPropertyConditionalBase {
  name: string;
  type: PropConditionExists;
}

export type PropertyCondition = IPropertyConditional | IPropertyConditionExists;

export interface IOutputProperty {
  id?: string;

  label: string;
  icon: string;

  /** Should be the default trigger */
  defaultTrigger?: boolean;

  /**
   * Defines which input value we're listening to,
   * this is used in the action card for output bindings
   */
  binding: string;

  /** Type defines how to display the trigger in the Actions panel */
  type: OutputPropertyType;

  /** Defines the name of the event, e.g. (change)= */
  eventName?: string;

  /** Property path to lookup event payload, e.g. $event.detail */
  eventKey?: string;

  /**
   * Used by OutputPropertyTypeList to lookup contextual values
   * such as radioButtons and Select dropdown
   */
  context?: string;

  /**
   * Property to use when creating menu data from context. If not specified defaults to using the
   * 'name' and 'value' properties from an IGenericConfig
   */
  contextProperty?: string;

  /**
   * For some events we want want to setup an output binding so that value is preserved when
   * navigating between boards, but we don't want to use them as action triggers since
   * the experience for setting up Equals X is not a good experience.
   *
   * For example on datepicker value change, a user would have to enter Equals 2020-06-15
   * for action to trigger. This format is not documented.
   * Also dates are off by one day due to b/159480812
   */
  disableAsActionTrigger?: boolean;

  /** Indicates the property is only valid for certain variants. */
  variant?: string;
}

/** The data type that an output event emits */
export enum OutputPropertyType {
  None = 'none',
  Boolean = 'boolean',
  Numeric = 'number',
  String = 'string',
  Array = 'array',
  Object = 'object',

  // This is used for output events that emit a value
  // in context of a generic list or dynamic list control
  // For example, a select emits the value of one the select options
  // By using this type, a menu of Equals options is automatically contructed to create a condition
  ListItemValue = 'list-item-value',
}

export enum BindingType {
  Property = 'property',
  Attribute = 'attribute',
  Style = 'style',
  InnerText = 'text',
  InnerHtml = 'html',
  Image = 'image',
  URL = 'url',
  TagName = 'tag',
  Variant = 'variant',
  None = 'none',
  CssVar = 'cssvar',
  // TODO: Consider other binding types in the future
  /*
  CssClass = 'css',
  ChildTemplate = 'childTemplate',
  Slot = 'slot',
  Theme = 'theme',
  */
}
