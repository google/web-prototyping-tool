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

import { testRunner } from '../utils/test.runner.utils';
import { GOTO_PREVIEW } from './interactions.consts';
import { EditConfig } from 'src/app/routes/project/configs/project.config';
import { BehaviorType, ITest, ITestBehavior } from '../consts/tests.interface';
import { interactionsBehaviorReducer } from './interactions.reducer';
import { interactionsValidator } from './interactions.validator';
import * as cd from 'cd-interfaces';

const RECORD_DEFAULTS: ITestBehavior[] = [
  {
    type: BehaviorType.AddElement,
    target: cd.ElementEntitySubType.Generic,
    elementIndices: [0],
    boardIndex: 0,
  },
  {
    type: BehaviorType.AddAction,
    value: cd.ActionType.RecordState,
    boardIndex: 0,
    elementIndices: [0],
  },
  {
    type: BehaviorType.StartRecording,
    boardIndex: 0,
    elementIndices: [0],
  },
  {
    type: BehaviorType.SetProperties,
    props: {
      radius: 10,
      backgrounds: [{ hex: '#000000' }],
      width: 300,
      height: 300,
    },
    elementIndices: [0],
    boardIndex: 0,
  },
  {
    type: BehaviorType.StopRecording,
  },
];

const RECORDING_TESTS: ITest[] = [
  {
    title: 'Should reset recorded state',
    do: [
      ...RECORD_DEFAULTS,
      GOTO_PREVIEW,
      {
        type: BehaviorType.ClickPreview,
      },
      {
        type: BehaviorType.ResetPrototype,
        wait: 1000,
      },
    ],
    expected: {
      elementValues: [
        {
          elementIndices: [0],
          styles: {
            // Don't include backgroundColor
            // since that is set randomly
            borderRadius: '0px',
            width: '100px',
            height: '100px',
          },
        },
      ],
    },
  },
  {
    title: 'Should duplicate state changes and update pointers',
    do: [
      ...RECORD_DEFAULTS,
      // Duplicate the element
      {
        type: BehaviorType.ContextMenu,
        menuConfig: EditConfig.Duplicate,
        elementIndices: [0],
        boardIndex: 0,
      },
      {
        // Remove the original element
        type: BehaviorType.DeleteElement,
        boardIndex: 0,
        elementIndices: [0],
      },
      GOTO_PREVIEW,
      {
        type: BehaviorType.ClickPreview,
      },
    ],
    expected: {
      elementValues: [
        {
          // Ensure the duplicated plays recorded changes on click
          elementIndices: [0],
          styles: {
            backgroundColor: 'rgb(0, 0, 0)',
            borderRadius: '10px',
            width: '300px',
            height: '300px',
          },
        },
      ],
    },
  },
  {
    title: 'Should record state changes',
    do: [
      ...RECORD_DEFAULTS,
      GOTO_PREVIEW,
      {
        type: BehaviorType.ClickPreview,
      },
    ],
    expected: {
      elementValues: [
        {
          elementIndices: [0],
          styles: {
            backgroundColor: 'rgb(0, 0, 0)',
            borderRadius: '10px',
            width: '300px',
            height: '300px',
          },
        },
      ],
    },
  },
];

describe('Interactions: Recordings', () => {
  testRunner(RECORDING_TESTS, interactionsBehaviorReducer, interactionsValidator);
});
