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

import { ElementEntitySubType, ElementPropertiesMap, ActionStateType } from 'cd-interfaces';
import { createInstance } from 'cd-common/models';
import { mergeAddedStateChange } from './record-action.utils';
import { registerComponentDefinitions } from 'cd-definitions';

registerComponentDefinitions();

describe('Interaction Recording Utilities', () => {
  const PROJECT_ID = 'pid';
  const RADIO_BUTTON_ID = 'radioButtonGroup';
  const GENERIC_ELEMENT_ID = 'genericElement';

  const genericElement = createInstance(
    ElementEntitySubType.Generic,
    PROJECT_ID,
    GENERIC_ELEMENT_ID
  )
    .assignBackgroundColor('red')
    .build();

  const radioButtonGroup = createInstance(
    ElementEntitySubType.RadioButtonGroup,
    PROJECT_ID,
    RADIO_BUTTON_ID
  ).build();

  const elementProperties: ElementPropertiesMap = {
    genericElement,
    radioButtonGroup,
  };

  it('Should Merge new state changes into empty record state', () => {
    const simpleMerge = mergeAddedStateChange(
      [
        {
          type: ActionStateType.Input,
          elementId: RADIO_BUTTON_ID,
          key: 'value',
          value: '2',
        },
        {
          type: ActionStateType.Input,
          elementId: RADIO_BUTTON_ID,
          key: 'labelPosition',
          value: 'before',
        },
      ],
      [],
      [],
      elementProperties
    );

    expect(simpleMerge).toEqual([
      {
        type: ActionStateType.Input,
        elementId: RADIO_BUTTON_ID,
        key: 'value',
        value: '2',
      },
      {
        type: ActionStateType.Input,
        elementId: RADIO_BUTTON_ID,
        key: 'labelPosition',
        value: 'before',
      },
    ]);
  });

  it('Should ignore values that have not changed from default element properties state', () => {
    const simpleMerge = mergeAddedStateChange(
      [
        {
          type: ActionStateType.Input,
          elementId: RADIO_BUTTON_ID,
          key: 'labelPosition',
          value: 'after',
        },
        {
          type: ActionStateType.Style,
          elementId: GENERIC_ELEMENT_ID,
          key: 'background',
          value: [{ value: 'red' }],
        },
      ],
      [],
      [],
      elementProperties
    );

    expect(simpleMerge).toEqual([]);
  });

  it('Should Not Replace Previous Recording even if they match the current element state', () => {
    const simpleMerge = mergeAddedStateChange(
      [
        {
          type: ActionStateType.Input,
          elementId: RADIO_BUTTON_ID,
          key: 'labelPosition',
          value: 'after',
        },
      ],
      [],
      [
        {
          type: ActionStateType.Input,
          elementId: RADIO_BUTTON_ID,
          key: 'labelPosition',
          value: 'after',
        },
      ],
      elementProperties
    );

    expect(simpleMerge).toEqual([
      {
        type: ActionStateType.Input,
        elementId: RADIO_BUTTON_ID,
        key: 'labelPosition',
        value: 'after',
      },
    ]);
  });

  it('Should Replace new recorded value on update and not create duplicates', () => {
    const simpleMerge = mergeAddedStateChange(
      [
        {
          type: ActionStateType.Input,
          elementId: RADIO_BUTTON_ID,
          key: 'value',
          value: '2',
        },
      ],
      [
        {
          type: ActionStateType.Input,
          elementId: RADIO_BUTTON_ID,
          key: 'value',
          value: '3',
        },
      ],
      [],
      elementProperties
    );

    expect(simpleMerge).toEqual([
      {
        type: ActionStateType.Input,
        elementId: RADIO_BUTTON_ID,
        key: 'value',
        value: '2',
      },
    ]);
  });

  it('Should Merge style overrides', () => {
    const simpleMerge = mergeAddedStateChange(
      [
        // Should exclude this because the value array is empty
        {
          type: ActionStateType.StyleOverride,
          elementId: GENERIC_ELEMENT_ID,
          key: ':hover',
          value: [],
        },
        // Base exists so this should merge in
        {
          type: ActionStateType.StyleOverride,
          elementId: GENERIC_ELEMENT_ID,
          key: 'base',
          value: [{ name: 'background', value: 'red' }],
        },
        // :before does not exists, but should be merged in
        {
          type: ActionStateType.StyleOverride,
          elementId: GENERIC_ELEMENT_ID,
          key: ':before',
          value: [{ name: 'background', value: 'red' }],
        },
      ],
      [],
      [],
      elementProperties
    );
    expect(simpleMerge).toEqual([
      {
        type: ActionStateType.StyleOverride,
        elementId: GENERIC_ELEMENT_ID,
        key: 'base',
        value: [{ name: 'background', value: 'red' }],
      },
      {
        type: ActionStateType.StyleOverride,
        elementId: GENERIC_ELEMENT_ID,
        key: ':before',
        value: [{ name: 'background', value: 'red' }],
      },
    ]);
  });

  it('Should Merge not merge overrides that equal current element overrides', () => {
    const props = JSON.parse(JSON.stringify(elementProperties));
    props[GENERIC_ELEMENT_ID].styles.base.overrides = [{ name: 'background', value: 'red' }];
    const simpleMerge = mergeAddedStateChange(
      [
        // Element already has an override for background color:red
        // so this should be ignored
        {
          type: ActionStateType.StyleOverride,
          elementId: GENERIC_ELEMENT_ID,
          key: 'base',
          value: [{ name: 'background', value: 'red' }],
        },
      ],
      [],
      [],
      props
    );
    expect(simpleMerge).toEqual([]);
  });

  it('Should Not remove previously recorded style overrides', () => {
    const simpleMerge = mergeAddedStateChange(
      [],
      [
        {
          type: ActionStateType.StyleOverride,
          elementId: GENERIC_ELEMENT_ID,
          key: 'base',
          value: [{ name: 'background', value: 'red' }],
        },
      ],
      [],
      elementProperties
    );
    expect(simpleMerge).toEqual([
      {
        type: ActionStateType.StyleOverride,
        elementId: GENERIC_ELEMENT_ID,
        key: 'base',
        value: [{ name: 'background', value: 'red' }],
      },
    ]);
  });
});
