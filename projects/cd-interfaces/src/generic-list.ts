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

import { IIconOptionsConfig } from './icons';

export enum GenericListValueType {
  String = 'string',
  Number = 'number',
  Select = 'select',
}

export interface IGenericListConfig {
  valueType: GenericListValueType;
  /** Allow users to select an item */
  supportsSelection: boolean;

  /** Allow users to set the value of the item */
  supportsValue?: boolean;

  /** Allow users to set an icon */
  supportsIcons?: boolean;

  /** Sizes allowed for cloud platform icons */
  iconInputOptions?: IIconOptionsConfig;

  /** An item it the list can be disabled */
  supportsDisabled?: boolean;

  /** Unique selection means that only one item can be selected at a time */
  supportsUniqueSelection?: boolean;

  /** By default, selectedIndex is saved with this option, value is saved instead */
  selectionIsValue?: boolean;

  /** Selection cannot be toggled off, Auto reselect next available */
  mustHaveSelection?: boolean;

  /** Supports multiple items */
  multiSelect?: boolean;

  /** Label used next to name input */
  nameLabel?: string;

  /** Default value of name input */
  defaultName?: string;

  /** Label used next to value input */
  valueLabel?: string;

  /** Label used next to icon input */
  iconLabel?: string;

  /** Label used next to disabled input */
  disabledLabel?: string;

  /**
   * Used to determine what field is used to show name in the list of options
   *
   * For example: If the model for each list item looks like this:
   *
   * {
   *   columnHeader: string;
   *   dataBind: string;
   * }
   *
   * Then the config could set listItemLabelModelKey: 'columnHeader'. The list in the properties
   * panel would then use that key for the label in the list.
   */
  listItemLabelModelKey?: string;

  /**
   * Fallback key to lookup up the lookup using listItemLabelModelKey is undefined
   */
  listItemLabelFallbackModelKey?: string;

  /**
   * Allows property list to have an empty label without a warning,
   * used for example when icons are sufficient as visual labels
   */
  allowEmptyLabel?: boolean;

  /**
   * Used only in dynamic props list. Label to use for add button inside of overlay
   * E.g. "Add column"
   */
  addButtonLabel?: string;

  /**
   * This option allows the group to switch between multi and single mode,
   * which needs to handle the group value differently
   */
  supportsMultiAndSingle?: boolean;

  /** Select dropdown placeholder */
  placeholder?: string;
}
