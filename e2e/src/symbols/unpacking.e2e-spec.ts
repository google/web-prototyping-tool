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
import { BOARD_1 } from '../configs/generic.config';
import { symbolsBehaviorReducer } from './symbols.reducer';
import { symbolsValidator } from './symbols.validator';
import { ITest, BehaviorType } from '../consts/tests.interface';
import * as cd from 'cd-interfaces';
import { EditConfig } from 'src/app/routes/project/configs/project.config';

const UNPACKING_TESTS: ITest[] = [
  {
    title: 'Unpacking a symbol with no children should result in one element with no children',
    do: [
      // add first icon element
      {
        type: BehaviorType.AddElement,
        target: cd.ElementEntitySubType.Generic,
        elementIndices: [0],
        boardIndex: 0,
        wait: INTERACTION_INTERVAL,
      },

      // create component from them
      {
        type: BehaviorType.ContextMenu,
        menuConfig: EditConfig.CreateSymbol,
        elementIndices: [0],
        boardIndex: 0,
        wait: INTERACTION_INTERVAL,
      },

      // unpack component
      {
        type: BehaviorType.ContextMenu,
        menuConfig: EditConfig.UnpackSymbolInstance,
        elementIndices: [0],
        boardIndex: 0,
        wait: INTERACTION_INTERVAL,
      },

      // confirm confirmation dialog
      {
        type: BehaviorType.ConfirmConfirmationDialog,
      },
    ],
    expected: {
      numberOfChildren: {
        elementIndex: 0,
        numberChildren: 0,
        boardName: BOARD_1,
      },
    },
  },
  {
    title: 'Unpacking a symbol with children should result in a group with children',
    do: [
      // add first icon element
      {
        type: BehaviorType.AddElement,
        target: cd.ElementEntitySubType.Icon,
        elementIndices: [0],
        boardIndex: 0,
        wait: INTERACTION_INTERVAL,
      },

      // add second icon element
      {
        type: BehaviorType.AddElement,
        target: cd.ElementEntitySubType.Icon,
        elementIndices: [1],
        boardIndex: 0,
        wait: INTERACTION_INTERVAL,
      },

      // shift click first icon to add to selection
      {
        type: BehaviorType.ShiftClickElement,
        elementIndices: [0],
        boardIndex: 0,
        wait: INTERACTION_INTERVAL,
      },

      // right click elements
      {
        type: BehaviorType.RightClickElement,
        elementIndices: [0],
        boardIndex: 0,
        wait: INTERACTION_INTERVAL,
      },

      // create component from them
      {
        type: BehaviorType.ContextMenu,
        menuConfig: EditConfig.CreateSymbol,
        wait: INTERACTION_INTERVAL,
      },

      // unpack component
      {
        type: BehaviorType.ContextMenu,
        menuConfig: EditConfig.UnpackSymbolInstance,
        elementIndices: [0],
        boardIndex: 0,
        wait: INTERACTION_INTERVAL,
      },

      // confirm confirmation dialog
      {
        type: BehaviorType.ConfirmConfirmationDialog,
      },
    ],
    expected: {
      numberOfChildren: {
        elementIndex: 0,
        numberChildren: 2,
        boardName: BOARD_1,
      },
    },
  },
  {
    title: 'Unpacking a symbol with overrides should result in overrides being applied throughout',
    do: [
      // add first icon element
      {
        type: BehaviorType.AddElement,
        target: cd.ElementEntitySubType.Icon,
        elementIndices: [0],
        boardIndex: 0,
        wait: INTERACTION_INTERVAL,
      },

      // add second icon element
      {
        type: BehaviorType.AddElement,
        target: cd.ElementEntitySubType.Icon,
        elementIndices: [1],
        boardIndex: 0,
        wait: INTERACTION_INTERVAL,
      },

      // shift click first icon to add to selection
      {
        type: BehaviorType.ShiftClickElement,
        elementIndices: [0],
        boardIndex: 0,
        wait: INTERACTION_INTERVAL,
      },

      // right click elements
      {
        type: BehaviorType.RightClickElement,
        elementIndices: [0],
        boardIndex: 0,
        wait: INTERACTION_INTERVAL,
      },

      // create component from them
      {
        type: BehaviorType.ContextMenu,
        menuConfig: EditConfig.CreateSymbol,
        wait: INTERACTION_INTERVAL,
      },

      // change color of first icon to red through an override
      {
        type: BehaviorType.SetProperties,
        elementIndices: [0],
        boardIndex: 0,
        props: { color: { hex: '#ff0000' } },
        wait: INTERACTION_INTERVAL,
      },

      // unpack component
      {
        type: BehaviorType.ContextMenu,
        menuConfig: EditConfig.UnpackSymbolInstance,
        elementIndices: [0],
        boardIndex: 0,
        wait: INTERACTION_INTERVAL,
      },

      // confirm confirmation dialog
      {
        type: BehaviorType.ConfirmConfirmationDialog,
      },
    ],
    expected: {
      stylesMatch: [
        {
          elementIndices: [0, 0],
          boardIndex: 0,
          styles: { color: 'rgb(255, 0, 0)' },
          failureMessage: "mismatching first element's color after unpacking",
        },
      ],
    },
  },
];

describe('Symbols: Unpacking', () => {
  testRunner(UNPACKING_TESTS, symbolsBehaviorReducer, symbolsValidator);
});
