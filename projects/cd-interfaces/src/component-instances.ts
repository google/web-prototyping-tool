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

/* eslint-disable max-lines */

import { IStyleAttributes, State } from './css';
import { ComponentIdentity, ElementEntitySubType, EntityType } from './entity-types';
import { IProjectContentDocument } from './project';
import { IKeyValue, IValue, ILockingRect, IDataBoundValue } from './index';
import type firebase from 'firebase/app';
import type { ThemePalette } from '@angular/material/core';
import type { ProgressSpinnerMode } from '@angular/material/progress-spinner';
import type {
  MatAccordionDisplayMode,
  MatAccordionTogglePosition,
} from '@angular/material/expansion';
import { Position } from './';
import { ActionBehavior } from './interaction';
import { IA11yAttr } from './a11y';
import { IComponent } from './component';
import { SelectedIcon } from './icons';
import { IAutoNavItem } from './auto-nav';

export type LabelPosition = 'before' | 'after';
export type StepperLabelPosition = 'bottom' | 'end';

/**
 * The instance of the component, created from an `IComponent` definition,
 * that is persisted in memory and in the database.
 */
export interface IComponentInstance extends IProjectContentDocument {
  id: string;
  name: string;
  a11yInputs?: IA11yInputs;
  actions: ActionBehavior[];
  attrs: IKeyValue[];
  childIds: string[];
  frame: ILockingRect;
  inputs?: IBaseElementInputs;
  isCodeComponentInstance?: boolean;
  metadata?: IElementMetadata;
  parentId?: string;
  fractionalIndex?: string | null;
  projectId: string;
  readonly childrenAllowed?: boolean;
  readonly elementType: ComponentIdentity;
  readonly type: EntityType.Element;
  rootId: string;
  showPreviewStyles?: boolean;
  state?: State;
  styles: IStyleAttributes;
}

export enum PropertyMode {
  Default = 'default',
  Custom = 'custom',
}

export enum MatInputAppearance {
  Standard = 'standard',
  Fill = 'fill',
  Outline = 'outline',
}
export enum MatInputFieldType {
  Text = 'text',
  Number = 'number',
  Password = 'password',
}

export interface IEdgeItem {
  label: string;
  tooltip: string;
}

export interface IElementMetadata {
  description?: string;
  preview?: string; // path to icon, svg, image, etc
}

export interface IDataSources {
  title: string;
  data: any;
}

export interface IGenericConfig {
  name: string;
  icon?: SelectedIcon;
  value?: string; // Note conditions for Actions with OutputPropertyType.ListItemValue will not work unless value is specified
  disabled?: boolean;
  selected?: boolean;
}

export interface IBaseElementInputs {
  hidden?: boolean;
  exclude?: boolean;
}

export type IComponentFactory = new (
  projectId: string,
  id: string,
  component?: IComponent
) => IComponentInstance;

export interface IRootElementProperties extends IComponentInstance {
  lastScreenshotTime?: firebase.firestore.Timestamp;
}

// Board portal and symbol instances extend this interface
// referenceId refers to the board or symbol that they are an instance of
export interface IRootInstanceInputs extends IBaseElementInputs {
  referenceId: string | null;
}

export interface IRootInstanceProperties extends IComponentInstance {
  inputs: IRootInstanceInputs;
}

/** Interface to model the user inputs belonging to the a11y panel.  */
export interface IA11yInputs {
  /** All user updated/added aria attributes for the component instance */
  ariaAttrs?: IA11yAttr[];
  /** User inputted notes field */
  notes?: string;
}

// BOARD

export interface IBoardProperties extends IRootElementProperties {
  readonly elementType: ElementEntitySubType.Board;
}

export interface IBoardPortalProperties extends IRootInstanceProperties {
  readonly elementType: ElementEntitySubType.BoardPortal;
}

// GENERIC ELEMENT (DIV)

export interface IGenericInputs extends IBaseElementInputs {
  tooltipLabel?: string;
  tooltipPosition?: Position;
  matRipple?: boolean;
  matRippleCentered?: boolean;
}

export interface IGenericProperties extends IComponentInstance {
  readonly elementType: ElementEntitySubType.Generic;
  inputs: IGenericInputs;
}

// TEXT
export interface IRichTextInput {
  /** innerHTML naming is based no legacy implementation */
  innerHTML: string | IDataBoundValue;
  richText: boolean;
}

export interface ITextInputs extends IBaseElementInputs, IRichTextInput {
  tooltipLabel?: string;
  tooltipPosition?: Position;
}

export interface ITextProperties extends IComponentInstance {
  readonly childrenAllowed: false;
  readonly elementType: ElementEntitySubType.Text;
  inputs: ITextInputs;
}

// IMAGE

export interface IImageInputs extends IBaseElementInputs {
  src: IValue;
  tooltipLabel?: string;
  tooltipPosition?: Position;
}

export interface IImageProperties extends IComponentInstance {
  readonly childrenAllowed: false;
  readonly elementType: ElementEntitySubType.Image;
  inputs: IImageInputs;
}

// ICON

export interface IIconInputs extends IBaseElementInputs {
  iconName: SelectedIcon;
  tooltipLabel?: string;
  tooltipPosition?: Position;
}

export interface IIconProperties extends IComponentInstance {
  readonly childrenAllowed: false;
  readonly elementType: ElementEntitySubType.Icon;
  inputs: IIconInputs;
}

// IFRAME
export enum EmbedVariant {
  Default = '',
  Figma = 'figma',
  YouTube = 'youtube',
  GoogleDocs = 'gdocs',
  GoogleSheets = 'gsheets',
  GoogleSlides = 'gslides',
  GoogleMaps = 'gmaps',
}

export interface IIFrameInputs extends IBaseElementInputs {
  variant?: EmbedVariant;
  src: string;
}

export interface IIFrameProperties extends IComponentInstance {
  readonly childrenAllowed: false;
  readonly elementType: ElementEntitySubType.IFrame;
  inputs: IIFrameInputs;
}

// VIDEO

export interface IVideoInputs extends IBaseElementInputs {
  src: string;
  videoId: string;
  autoplay: boolean;
  showControls: boolean;
}

export interface IVideoProperties extends IComponentInstance {
  readonly childrenAllowed: false;
  readonly elementType: ElementEntitySubType.Video;
  inputs: IVideoInputs;
}

// MAP

export interface IMapInputs extends IBaseElementInputs {
  latitude: number;
  longitude: number;
  query: string;
  src: string;
  useQuery: boolean;
  zoom: number;
}

export interface IMapProperties extends IComponentInstance {
  readonly childrenAllowed: false;
  readonly elementType: ElementEntitySubType.Map;
  inputs: IMapInputs;
}

// NAVIGATION

export interface IAutoNavInputs extends IBaseElementInputs {
  items: IAutoNavItem[];
  target?: string;
  selectedIndex?: number;
  smallIcons?: boolean;
}

export interface IAutoNavProperties extends IComponentInstance {
  childrenAllowed: false;
  elementType: ElementEntitySubType.AutoNav;
  inputs: IAutoNavInputs;
}

// BUTTON

export enum ButtonVariant {
  Basic = 'Basic',
  Raised = 'Raised',
  Stroked = 'Stroked',
  Flat = 'Flat',
  Icon = 'Icon',
  Fab = 'Fab',
}

export interface IButtonInputs extends IBaseElementInputs {
  color?: ThemePalette;
  disabled: boolean;
  iconName?: SelectedIcon;
  iconRightSide?: boolean;
  label?: string;
  small?: boolean;
  variant: ButtonVariant;
  tooltipLabel?: string;
  tooltipPosition?: Position;
  menu?: IGenericConfig[];
  split?: boolean;
  splitIcon?: SelectedIcon;
}

export interface IButtonProperties extends IComponentInstance {
  readonly childrenAllowed: false;
  readonly elementType: ElementEntitySubType.Button;
  inputs: IButtonInputs;
}

// TOGGLE BUTTON GROUP

export interface IToggleButtonConfig extends IGenericConfig {
  tooltipLabel?: string;
}

export interface IToggleButtonGroupInputs extends IBaseElementInputs {
  buttons: IToggleButtonConfig[];
  color?: ThemePalette;
  disabled?: boolean;
  multiple?: boolean;
  vertical?: boolean;
  small?: boolean;
  value?: string;
  variant: ButtonVariant;
}

export interface IToggleButtonGroupProperties extends IComponentInstance {
  readonly childrenAllowed: false;
  readonly elementType: ElementEntitySubType.ToggleButtonGroup;
  inputs: IToggleButtonGroupInputs;
}

// SELECT DROPDOWN

export interface ISelectInputs extends IBaseElementInputs {
  color?: ThemePalette;
  disabled: boolean;
  label?: string;
  hint?: string;
  options: IGenericConfig[];
  required: boolean;
  value?: string | number;
  tooltipLabel?: string;
  labelPosition: LabelPosition;
  appearance?: MatInputAppearance;
  tooltipPosition?: Position;
}

export interface ISelectProperties extends IComponentInstance {
  readonly childrenAllowed: false;
  readonly elementType: ElementEntitySubType.Select;
  inputs: ISelectInputs;
}

// INPUT ELEMENT

export interface IInputElementInputs extends IBaseElementInputs {
  type?: string;
  inputType?: string;
  color?: ThemePalette;
  disabled: boolean;
  appearance?: MatInputAppearance;
  hint?: string;
  label: string;
  icon?: SelectedIcon;
  placeholder?: string;
  iconTooltipLabel?: string;
  required: boolean;
  value: string;
  tooltipLabel?: string;
  tooltipPosition?: Position;
  rowMin?: number;
  rowMax?: number;
  useChips?: boolean;
}

export interface IInputProperties extends IComponentInstance {
  readonly childrenAllowed: false;
  readonly elementType: ElementEntitySubType.Input;
  inputs: IInputElementInputs;
}

// DATE PICKER
export interface IDatePickerInputs extends IBaseElementInputs {
  color?: ThemePalette;
  disabled: boolean;
  hint?: string;
  label: string;
  required: boolean;
  value: string;
  tooltipLabel?: string;
  appearance?: MatInputAppearance;
  tooltipPosition?: Position;
}

export interface IDatepickerProperties extends IComponentInstance {
  readonly childrenAllowed: false;
  readonly elementType: ElementEntitySubType.Datepicker;
  inputs: IDatePickerInputs;
}

// CHECKBOX

export interface ICheckboxInputs extends IBaseElementInputs {
  color?: ThemePalette;
  disabled: boolean;
  label: string;
  checked: boolean;
  indeterminate?: boolean;
  labelPosition: LabelPosition;
  tooltipLabel?: string;
  tooltipPosition?: Position;
  /** underscore denotes inputs excluded from data-tree */
  _children?: string[];
}

export interface ICheckboxProperties extends IComponentInstance {
  readonly childrenAllowed: false;
  readonly elementType: ElementEntitySubType.Checkbox;
  inputs: ICheckboxInputs;
}

// SWITCH

export interface ISwitchInputs extends IBaseElementInputs {
  checked: boolean;
  color?: ThemePalette;
  disabled: boolean;
  label: string;
  labelPosition: LabelPosition;
  tooltipLabel?: string;
  tooltipPosition?: Position;
}

export interface ISwitchProperties extends IComponentInstance {
  readonly elementType: ElementEntitySubType.Switch;
  readonly childrenAllowed: false;
  inputs: ISwitchInputs;
}

// RADIO BUTTON

export interface IRadioButtonGroupInputs extends IBaseElementInputs {
  color?: ThemePalette;
  disabled: boolean;
  required: boolean;
  value?: string | undefined | number;
  labelPosition: LabelPosition;
  radioButtons: IGenericConfig[];
}

export interface IRadioButtonGroupProperties extends IComponentInstance {
  readonly childrenAllowed: false;
  readonly elementType: ElementEntitySubType.RadioButtonGroup;
  inputs: IRadioButtonGroupInputs;
}

// CHIP LIST

export interface IChipListInputs extends IBaseElementInputs {
  chips: IGenericConfig[];
  color?: ThemePalette;
}

export interface IChipListProperties extends IComponentInstance {
  readonly childrenAllowed: false;
  readonly elementType: ElementEntitySubType.ChipList;
  inputs: IChipListInputs;
}

// SLIDER

export interface ISliderInputs extends IBaseElementInputs {
  color?: ThemePalette;
  disabled: boolean;
  invert: boolean;
  max?: number;
  min?: number;
  step?: number;
  thumbLabel: boolean;
  value?: number;
  vertical: boolean;
  tooltipLabel?: string;
  tooltipPosition?: Position;
}

export interface ISliderProperties extends IComponentInstance {
  readonly childrenAllowed: false;
  readonly elementType: ElementEntitySubType.Slider;
  inputs: ISliderInputs;
}

// SPINNER

export interface ISpinnerInputs extends IBaseElementInputs {
  color?: ThemePalette;
  diameter: number;
  mode: ProgressSpinnerMode;
  strokeWidth: number;
  value: number;
  tooltipLabel?: string;
  tooltipPosition?: Position;
}

export interface ISpinnerProperties extends IComponentInstance {
  readonly childrenAllowed: false;
  readonly elementType: ElementEntitySubType.Spinner;
  inputs: ISpinnerInputs;
}

// PROGRESS BAR

export enum ProgressBarMode {
  Buffer = 'buffer',
  Determinate = 'determinate',
  Indeterminate = 'indeterminate',
  Query = 'query',
}

export interface IProgressBarInputs extends IBaseElementInputs {
  bufferValue?: number;
  color?: ThemePalette;
  mode: ProgressBarMode;
  value?: number;
  tooltipLabel?: string;
  tooltipPosition?: Position;
}

export interface IProgressBarProperties extends IComponentInstance {
  readonly childrenAllowed: false;
  readonly elementType: ElementEntitySubType.ProgressBar;
  inputs: IProgressBarInputs;
}

// PORTAL

export interface IPortalParentInputs extends IBaseElementInputs {
  childPortals: IGenericConfig[];
}

// TABS

export interface ITabInputs extends IPortalParentInputs {
  color?: ThemePalette;
  selectedIndex?: number;
}

export interface ITabProperties extends IComponentInstance {
  readonly childrenAllowed: false;
  readonly elementType: ElementEntitySubType.Tabs;
  inputs: ITabInputs;
}

// STEPPER

export interface IStepperInputs extends IPortalParentInputs {
  verticalStepper: boolean;
  labelPosition: StepperLabelPosition;
  selectedIndex?: number;
}

export interface IStepperProperties extends IComponentInstance {
  readonly childrenAllowed: false;
  readonly elementType: ElementEntitySubType.Stepper;
  inputs: IStepperInputs;
}

// EXPANSION PANEL

export interface IExpansionPanelInputs extends IPortalParentInputs {
  displayMode: MatAccordionDisplayMode;
  hideToggle: boolean;
  togglePosition: MatAccordionTogglePosition;
  multi: boolean;
}

export interface IExpansionPanelProperties extends IComponentInstance {
  readonly childrenAllowed: false;
  readonly elementType: ElementEntitySubType.ExpansionPanel;
  inputs: IExpansionPanelInputs;
}

export type PortalParent = ITabProperties | IStepperProperties | IExpansionPanelProperties;
