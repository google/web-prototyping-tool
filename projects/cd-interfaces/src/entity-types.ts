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

export enum EntityType {
  Project = 'Project',
  Element = 'Element',
  DesignSystem = 'Design System',
  Asset = 'Asset',
  Dataset = 'Dataset',
  CommentThread = 'Comment Thread',
  Comment = 'Comment',
  CodeComponent = 'Code Component',
}

export type ComponentIdentity = ElementEntitySubType | string;

// TODO: Migrate to use consistent naming in the future
export enum ElementEntitySubType {
  // Core
  Board = 'Board',
  BoardPortal = 'BoardPortal',
  Symbol = 'Symbol',
  SymbolInstance = 'SymbolInstance',

  // Primitive
  Generic = 'Generic',
  Icon = 'Icon',
  Image = 'Image',
  Media = 'Media',
  TextInput = 'TextInput',
  Text = 'Text',
  IFrame = 'IFrame', // Embed
  AutoNav = 'AutoNav',

  // Material
  Button = 'Button',
  Checkbox = 'Checkbox',
  ChipList = 'ChipList',
  Datepicker = 'Datepicker',
  ExpansionPanel = 'ExpansionPanel',
  Input = 'Input',
  ProgressBar = 'ProgressBar',
  RadioButtonGroup = 'RadioButtonGroup',
  Select = 'Select',
  Slider = 'Slider',
  Spinner = 'Spinner',
  Stepper = 'Stepper',
  Switch = 'Switch',
  Tabs = 'Tabs',
  ToggleButtonGroup = 'ToggleButtonGroup',

  // Legacy, rolls up into IFrame
  Map = 'Map',
  Video = 'Video',
}
