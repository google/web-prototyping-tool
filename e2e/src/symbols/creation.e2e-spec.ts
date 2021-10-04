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
import { INTERACTION_INTERVAL } from '../configs/timing.configs';
import { DEFAULT_ICON_STYLES, DEFAULT_PRIMITIVE_STYLES } from '../consts/styles.consts';
import { symbolsBehaviorReducer } from './symbols.reducer';
import { symbolsValidator } from './symbols.validator';
import { ITest, BehaviorType } from '../consts/tests.interface';
import { EditConfig } from 'src/app/routes/project/configs/project.config';
import { BOARD_1 } from '../configs/generic.config';
import * as cd from 'cd-interfaces';

const CREATION_TESTS: ITest[] = [
  {
    title: 'Should be able to create a symbol from a single icon',
    do: [
      // Add icon element
      {
        type: BehaviorType.AddElement,
        target: cd.ElementEntitySubType.Icon,
        elementIndices: [0],
        boardIndex: 0,
        wait: INTERACTION_INTERVAL,
      },

      // Create symbol
      {
        type: BehaviorType.ContextMenu,
        menuConfig: EditConfig.CreateSymbol,
        boardIndex: 0,
        elementIndices: [0],
      },
    ],
    expected: {
      propsPanelExists: { boardIndex: 0, elementIndex: 0 },
      numberOfChildren: {
        elementIndex: 0,
        numberChildren: 1,
        boardName: BOARD_1,
      },
      stylesMatch: [
        {
          elementIndices: [0],
          boardIndex: 0,
          styles: DEFAULT_ICON_STYLES,
          failureMessage: 'mismatching default element styles after converting to symbol',
        },
      ],
    },
  },
  {
    title: 'Should be able to create a symbol from a single generic element',
    do: [
      // Add icon element
      {
        type: BehaviorType.AddElement,
        target: cd.ElementEntitySubType.Generic,
        elementIndices: [0],
        boardIndex: 0,
        wait: INTERACTION_INTERVAL,
      },

      // Create symbol
      {
        type: BehaviorType.ContextMenu,
        menuConfig: EditConfig.CreateSymbol,
        boardIndex: 0,
        elementIndices: [0],
      },
    ],
    expected: {
      numberOfChildren: {
        elementIndex: 0,
        numberChildren: 0,
        boardName: BOARD_1,
      },
      symbolStylesMatch: [
        {
          instanceIndex: 0,
          boardIndex: 0,
          styles: DEFAULT_PRIMITIVE_STYLES,
          failureMessage: "mismatching first element's color after changing color override",
        },
      ],
    },
  },
  {
    title: 'Should be able to create a symbol from a group of n elements',
    do: [
      // add first button
      {
        type: BehaviorType.AddElement,
        target: cd.ElementEntitySubType.Icon,
        boardIndex: 0,
        wait: INTERACTION_INTERVAL,
      },

      // add second button
      {
        type: BehaviorType.AddElement,
        target: cd.ElementEntitySubType.Icon,
        boardIndex: 0,
        wait: INTERACTION_INTERVAL,
      },

      // shift click second icon
      {
        type: BehaviorType.ShiftClickElement,
        elementIndices: [0],
        boardIndex: 0,
        wait: INTERACTION_INTERVAL,
      },

      // Right click icon
      {
        type: BehaviorType.RightClickElement,
        elementIndices: [0],
        boardIndex: 0,
      },

      // Group elements
      {
        type: BehaviorType.ContextMenu,
        menuConfig: EditConfig.Group,
      },

      // Create symbol
      {
        type: BehaviorType.ContextMenu,
        menuConfig: EditConfig.CreateSymbol,
        elementIndices: [0],
        boardIndex: 0,
      },
    ],
    expected: {
      // Ensure that children were moved into a group
      numberOfChildren: {
        elementIndex: 0,
        numberChildren: 2,
        boardName: BOARD_1,
      },
    },
  },
  {
    title: 'Should be able to create a symbol from multiple elements ungrouped',
    do: [
      // add first button
      {
        type: BehaviorType.AddElement,
        target: cd.ElementEntitySubType.Icon,
        boardIndex: 0,
        wait: INTERACTION_INTERVAL,
      },

      // add second button
      {
        type: BehaviorType.AddElement,
        target: cd.ElementEntitySubType.Icon,
        boardIndex: 0,
        wait: INTERACTION_INTERVAL,
      },

      // shift click second icon
      {
        type: BehaviorType.ShiftClickElement,
        elementIndices: [0],
        boardIndex: 0,
        wait: INTERACTION_INTERVAL,
      },

      // Right click icon
      {
        type: BehaviorType.RightClickElement,
        elementIndices: [0],
        boardIndex: 0,
      },

      // Create symbol
      {
        type: BehaviorType.ContextMenu,
        menuConfig: EditConfig.CreateSymbol,
      },
    ],
    expected: {
      // Ensure that children were moved into a group
      numberOfChildren: {
        elementIndex: 0,
        numberChildren: 2,
        boardName: BOARD_1,
      },
    },
  },
];

describe('Symbols: Creation', () => {
  testRunner(CREATION_TESTS, symbolsBehaviorReducer, symbolsValidator);
});
