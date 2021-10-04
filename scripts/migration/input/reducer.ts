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

import * as cd from 'cd-interfaces';
const HIDDEN = 'hidden';

const TEXT_INPUTS: ReadonlyArray<keyof cd.ITextInputs> = ['innerHTML', 'richText'];
const IMAGE_INPUTS: ReadonlyArray<keyof cd.IImageInputs> = ['src'];
const ICON_INPUTS: ReadonlyArray<keyof cd.IIconInputs> = ['iconName'];
const IFRAME_INPUTS: ReadonlyArray<keyof cd.IIFrameInputs> = ['src'];

const VIDEO_INPUTS: ReadonlyArray<keyof cd.IVideoInputs> = [
  'src',
  'videoId',
  'autoplay',
  'showControls',
];

const MAP_INPUTS: ReadonlyArray<keyof cd.IMapInputs> = [
  'latitude',
  'longitude',
  'query',
  'src',
  'useQuery',
  'zoom',
];

const BUTTON_INPUTS: ReadonlyArray<keyof cd.IButtonInputs> = [
  'color',
  'disabled',
  'iconName',
  'label',
  'variant',
];

const SELECT_INPUTS: ReadonlyArray<keyof cd.ISelectInputs> = [
  'color',
  'disabled',
  'options',
  'label',
  'required',
  'selectedIndex',
];

const INPUT_INPUTS: ReadonlyArray<keyof cd.IInputElementInputs> = [
  'color',
  'disabled',
  'appearance',
  'label',
  'hint',
  'value',
  'required',
];

const CHECKBOX_INPUTS: ReadonlyArray<keyof cd.ICheckboxInputs> = [
  'color',
  'disabled',
  'label',
  'checked',
  'labelPosition',
];

const SWITCH_INPUTS: ReadonlyArray<keyof cd.ISwitchInputs> = [
  'color',
  'disabled',
  'label',
  'checked',
  'labelPosition',
];

const RADIO_INPUTS: ReadonlyArray<keyof cd.IRadioButtonGroupInputs> = [
  'color',
  'disabled',
  'labelPosition',
  'radioButtons',
  'required',
  'selectedIndex',
];

const CHIP_INPUTS: ReadonlyArray<keyof cd.IChipListInputs> = ['color', 'chips'];

const SLIDER_INPUTS: ReadonlyArray<keyof cd.ISliderInputs> = [
  'color',
  'disabled',
  'invert',
  'max',
  'min',
  'step',
  'thumbLabel',
  'value',
  'vertical',
];

const SPINNER_INPUTS: ReadonlyArray<keyof cd.ISpinnerInputs> = [
  'color',
  'value',
  'diameter',
  'mode',
  'strokeWidth',
];

const PROGRESS_INPUTS: ReadonlyArray<keyof cd.IProgressBarInputs> = [
  'color',
  'value',
  'mode',
  'bufferValue',
];

const DATE_INPUTS: ReadonlyArray<keyof cd.IDatePickerInputs> = [
  'color',
  'value',
  'required',
  'label',
  'hint',
  'disabled',
];

const TABS_INPUTS: ReadonlyArray<keyof cd.ITabInputs> = [
  'color',
  'childPortals',
  'selectedIndex',
  'childPortals',
];

const STEP_INPUTS: ReadonlyArray<keyof cd.IStepperInputs> = [
  'childPortals',
  'selectedIndex',
  'labelPosition',
  'verticalStepper',
  'childPortals',
];

const EXP_INPUTS: ReadonlyArray<keyof cd.IExpansionPanelInputs> = [
  'childPortals',
  'displayMode',
  'hideToggle',
  'multi',
  'togglePosition',
  'childPortals',
];

const INSTANCE_INPUTS: ReadonlyArray<keyof cd.IRootInstanceInputs> = ['referenceId'];

const inputLookup: cd.IStringMap<ReadonlyArray<string>> = {
  [cd.ElementEntitySubType.Text]: TEXT_INPUTS,
  [cd.ElementEntitySubType.Image]: IMAGE_INPUTS,
  [cd.ElementEntitySubType.Icon]: ICON_INPUTS,
  [cd.ElementEntitySubType.IFrame]: IFRAME_INPUTS,
  [cd.ElementEntitySubType.Video]: VIDEO_INPUTS,
  [cd.ElementEntitySubType.Map]: MAP_INPUTS,
  [cd.ElementEntitySubType.Button]: BUTTON_INPUTS,
  [cd.ElementEntitySubType.Select]: SELECT_INPUTS,
  [cd.ElementEntitySubType.Input]: INPUT_INPUTS,
  [cd.ElementEntitySubType.Checkbox]: CHECKBOX_INPUTS,
  [cd.ElementEntitySubType.Switch]: SWITCH_INPUTS,
  [cd.ElementEntitySubType.RadioButtonGroup]: RADIO_INPUTS,
  [cd.ElementEntitySubType.ChipList]: CHIP_INPUTS,
  [cd.ElementEntitySubType.Slider]: SLIDER_INPUTS,
  [cd.ElementEntitySubType.Spinner]: SPINNER_INPUTS,
  [cd.ElementEntitySubType.ProgressBar]: PROGRESS_INPUTS,
  [cd.ElementEntitySubType.Datepicker]: DATE_INPUTS,
  [cd.ElementEntitySubType.Tabs]: TABS_INPUTS,
  [cd.ElementEntitySubType.Stepper]: STEP_INPUTS,
  [cd.ElementEntitySubType.ExpansionPanel]: EXP_INPUTS,
  [cd.ElementEntitySubType.BoardPortal]: INSTANCE_INPUTS,
  [cd.ElementEntitySubType.SymbolInstance]: INSTANCE_INPUTS,
};

export const transformSymbolInstanceInputs = (entity: cd.IStringMap<any>): cd.PropertyModel => {
  const instance = entity as cd.ISymbolInstanceProperties;
  const instanceInputs = instance.instanceInputs as cd.SymbolInstanceInputs;
  const inputEntries = Object.entries(instanceInputs || {});

  for (const [key, value] of inputEntries) {
    let { styles, ...inputs } = value;

    // if this model has already been migrated -> merge what has already been migrated.
    const existingInputs = value.inputs || {};
    delete inputs.inputs; // in case already migrated.
    inputs = { ...inputs, ...existingInputs };

    instance.instanceInputs[key] = {};
    if (styles) instance.instanceInputs[key].styles = styles;
    if (inputs && Object.keys(inputs).length > 0)
      instance.instanceInputs[key].inputs = inputs as any;
  }

  return instance;
};

// move current inputs on Symbols to symbolInputs
export const transformSymbolInputs = (entity: any): cd.PropertyModel => {
  if (entity.symbolInputs) return entity; // prevent migrating twice

  const { inputs } = entity;

  (entity as cd.ISymbolProperties).symbolInputs = inputs || {};
  delete entity.inputs;

  return entity;
};

export const transformEntity = (entity: cd.IStringMap<any>): cd.PropertyModel | undefined => {
  if (entity.type !== cd.EntityType.Element) return;

  if (entity.elementType === cd.ElementEntitySubType.SymbolInstance) {
    entity = transformSymbolInstanceInputs(entity);
  } else if (entity.elementType === cd.ElementEntitySubType.Symbol) {
    entity = transformSymbolInputs(entity);
  }

  const inputKeys = inputLookup[entity.elementType] || [];
  const concatKeys = [HIDDEN, ...inputKeys];
  const inputs = { ...entity.inputs };
  for (const key of concatKeys) {
    /// Might need to track values for removal from firebase
    const value = entity[key];
    if (value === undefined) continue;
    Object.assign(inputs, { [key]: value });
    delete entity[key];
  }

  Object.assign(entity, { inputs });

  return entity as cd.PropertyModel;
};

// Verify that symbolInputs is now defined
// and verify that inputs no longer contains SymbolInput[]
export const verifySymbol = (entity: cd.ISymbolProperties): boolean => {
  const { inputs, symbolInputs } = entity;
  const inputValues = Object.values(inputs || {});

  if (symbolInputs === undefined) return false;

  for (const val of inputValues) {
    if (Array.isArray(val)) return false;
  }

  return true;
};

// Verify that for each override in instanceInputs there are no properties outside of inputs and styles
export const verifySymbolInstance = (entity: cd.ISymbolInstanceProperties): boolean => {
  const { instanceInputs } = entity;
  const values = Object.values(instanceInputs || {});
  const allowedOverrideKeys = ['styles', 'inputs'];

  for (const val of values) {
    const overrideKeys = Object.keys(val);
    const allKeysValid = overrideKeys.every((key) => allowedOverrideKeys.includes(key));
    if (!allKeysValid) return false;
  }
  return true;
};

export const verifyEntity = (entity: cd.PropertyModel): boolean => {
  if (entity.type !== cd.EntityType.Element) return true; // not an element, ignore

  if (entity.elementType === cd.ElementEntitySubType.Symbol) {
    const symbolVerified = verifySymbol(entity as cd.ISymbolProperties);
    if (!symbolVerified) return false;
  } else if (entity.elementType === cd.ElementEntitySubType.SymbolInstance) {
    const instanceVerified = verifySymbolInstance(entity as cd.ISymbolInstanceProperties);
    if (!instanceVerified) return false;
  }

  const inputKeys = inputLookup[entity.elementType] || [];
  const concatKeys = [HIDDEN, ...inputKeys];
  const entityKeys = Object.keys(entity);
  // Does any of these input keys exist on the root?
  if (entityKeys.some((val) => concatKeys.includes(val))) return false;
  // Does the inputs value exist?
  if (!entity.inputs) return false;

  const keys = Object.keys(entity.inputs);
  if (keys.includes('input')) {
    console.log('found input inside input');
    return false;
  }
  // Every elements input exists in the lookup and No unknown inputs exist in the element's inputs
  // keys.every(val => concatKeys.includes(val)) && // <- Disable for now
  return concatKeys.some((val) => keys.includes(val));
};
