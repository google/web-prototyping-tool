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

import { testRunner } from '../utils/test.runner.utils';
import { ITest, BehaviorType } from '../consts/tests.interface';
import { EditConfig } from 'src/app/routes/project/configs/project.config';
import { INTERACTION_INTERVAL } from '../configs/timing.configs';
import { BOARD_2, SYMBOL_NAME_1 } from '../configs/generic.config';
import { interactionsBehaviorReducer } from './interactions.reducer';
import { interactionsValidator } from './interactions.validator';
import * as consts from './interactions.consts';
import * as cd from 'cd-interfaces';

const SYMBOL_TESTS: ITest[] = [
  {
    title: 'Should select child of a symbol as an action',
    do: [
      // add button to board 1
      {
        type: BehaviorType.AddElement,
        target: cd.ElementEntitySubType.Button,
        boardIndex: 0,
      },

      // create symbol
      {
        type: BehaviorType.ContextMenu,
        menuConfig: EditConfig.CreateSymbol,
        boardIndex: 0,
        elementIndices: [0],
      },

      // add a second board
      {
        type: BehaviorType.AddBoard,
        boardIndex: 1,
      },

      // select button
      {
        type: BehaviorType.SelectElement,
        boardIndex: 0,
        elementIndices: [0],
        wait: INTERACTION_INTERVAL,
      },

      // add navigation action
      {
        type: BehaviorType.AddAction,
        value: cd.ActionType.NavigateToBoard,
        from: 'Button (Button)',
        target: BOARD_2,
        boardIndex: 0,
        elementIndices: [0],
      },

      // go to preview
      consts.GOTO_PREVIEW,

      // click button
      {
        type: BehaviorType.ClickPreview,
        elementIndices: [0],
      },
    ],
    expected: {
      boardName: BOARD_2,
    },
  },
  {
    title: 'Should navigate between boards when action is attached to symbol',
    do: [
      // add button to board 1
      {
        type: BehaviorType.AddElement,
        target: cd.ElementEntitySubType.Button,
        boardIndex: 0,
      },

      // create symbol
      {
        type: BehaviorType.ContextMenu,
        menuConfig: EditConfig.CreateSymbol,
        boardIndex: 0,
        elementIndices: [0],
      },

      // add a second board
      {
        type: BehaviorType.AddBoard,
        boardIndex: 1,
        wait: INTERACTION_INTERVAL,
      },

      {
        type: BehaviorType.SelectBoard,
        boardIndex: 0,
      },

      {
        type: BehaviorType.RightClickElement,
        boardIndex: 0,
        elementIndices: [0],
      },

      // enter isolation mode
      {
        type: BehaviorType.ContextMenu,
        menuConfig: EditConfig.EditSymbol,
        wait: INTERACTION_INTERVAL,
      },

      // select button
      {
        type: BehaviorType.IsolationSelectElement,
        elementIndices: [1],
        wait: INTERACTION_INTERVAL,
      },

      // add action to navigate
      {
        type: BehaviorType.AddAction,
        value: cd.ActionType.NavigateToBoard,
        target: BOARD_2,
      },

      // exit isolation mode
      {
        type: BehaviorType.ExitSymbolIsolationMode,
      },

      // go to preview
      consts.GOTO_PREVIEW,

      // click button
      {
        type: BehaviorType.ClickPreview,
        elementIndices: [0],
      },
    ],
    expected: {
      boardName: BOARD_2,
    },
  },
  {
    title: 'Should navigate between boards when action is attached to symbol instance',
    do: [
      // add button to board 1
      {
        type: BehaviorType.AddElement,
        target: cd.ElementEntitySubType.Generic,
        boardIndex: 0,
      },

      // create symbol
      {
        type: BehaviorType.ContextMenu,
        menuConfig: EditConfig.CreateSymbol,
        boardIndex: 0,
        elementIndices: [0],
      },

      // add a second board
      {
        type: BehaviorType.AddBoard,
        boardIndex: 1,
      },

      // select button
      {
        type: BehaviorType.SelectElement,
        boardIndex: 0,
        elementIndices: [0],
        wait: INTERACTION_INTERVAL,
      },

      // add navigation action
      {
        type: BehaviorType.AddAction,
        value: cd.ActionType.NavigateToBoard,
        // from: 'Self',
        target: BOARD_2,
        boardIndex: 0,
        elementIndices: [0],
      },

      // go to preview
      consts.GOTO_PREVIEW,

      // click button
      {
        type: BehaviorType.ClickPreview,
        elementIndices: [0],
      },
    ],
    expected: {
      boardName: BOARD_2,
    },
  },
  // TODO: Add in test once this is allowed in the UI
  // {
  //   title: 'Should navigate a portal inside a symbol',
  //   do: [
  //     // add board 2
  //     {
  //       type: BehaviorType.AddBoard,
  //       boardIndex: 1,
  //     },

  //     // add board 3
  //     {
  //       type: BehaviorType.AddBoard,
  //       boardIndex: 2,
  //     },

  //     // add button to board 1
  //     {
  //       type: BehaviorType.AddElement,
  //       target: cd.ElementEntitySubType.BoardPortal,
  //       boardIndex: 0,
  //     },

  //     // point board initially to board 2
  //     {
  //       type: BehaviorType.SetPortal,
  //       target: BOARD_2,
  //       boardIndex: 0,
  //       elementIndices: [0],
  //     },

  //     // create symbol out of board after pointing it to board 2
  //     {
  //       type: BehaviorType.ContextMenu,
  //       menuConfig: EditConfig.CreateSymbol,
  //       boardIndex: 0,
  //       elementIndices: [0],
  //     },

  //     // add button that will nav the portal
  //     {
  //       type: BehaviorType.AddElement,
  //       target: cd.ElementEntitySubType.Button,
  //       boardIndex: 0,
  //     },

  //     // add navigation action
  //     {
  //       type: BehaviorType.AddAction,
  //       value: cd.ActionType.SwapPortal,
  //       target: BOARD_2,
  //       boardIndex: 0,
  //       elementIndices: [1],
  //     },

  //     // go to preview
  //     consts.GOTO_PREVIEW,

  //     // click button
  //     {
  //       type: BehaviorType.ClickPreview,
  //       elementIndices: [0],
  //     },
  //   ],
  //   expected: {
  //     boardName: BOARD_2,
  //   },
  // },
  {
    title: 'Should perform recorded action from inside a symbol',
    do: [
      // add generic element
      {
        type: BehaviorType.AddElement,
        target: cd.ElementEntitySubType.Generic,
        boardIndex: 0,
      },

      // add button
      {
        type: BehaviorType.AddElement,
        target: cd.ElementEntitySubType.Button,
        boardIndex: 0,
      },

      // shift click first element
      {
        type: BehaviorType.ShiftClickElement,
        elementIndices: [0],
        boardIndex: 0,
      },

      // right click first element
      {
        type: BehaviorType.RightClickElement,
        elementIndices: [0],
        boardIndex: 0,
        wait: INTERACTION_INTERVAL,
      },

      // create symbol
      {
        type: BehaviorType.ContextMenu,
        menuConfig: EditConfig.CreateSymbol,
      },

      // edit symbol
      {
        type: BehaviorType.ContextMenu,
        menuConfig: EditConfig.EditSymbol,
        boardIndex: 0,
        elementIndices: [0],
      },

      // select button
      {
        type: BehaviorType.IsolationSelectElement,
        elementIndices: [2],
        wait: INTERACTION_INTERVAL,
      },

      // add record action
      {
        type: BehaviorType.AddAction,
        value: cd.ActionType.RecordState,
      },

      // start recording
      {
        type: BehaviorType.StartRecording,
      },

      // select generic element
      {
        type: BehaviorType.IsolationSelectElement,
        elementIndices: [1],
        wait: INTERACTION_INTERVAL,
      },

      // change props
      {
        type: BehaviorType.SetProperties,
        props: {
          radius: 50,
          width: 50,
          height: 50,
          backgrounds: [{ hex: '#34A853' }],
        },
      },

      // stop recording
      {
        type: BehaviorType.StopRecording,
      },

      // exit isolation mode
      {
        type: BehaviorType.ExitSymbolIsolationMode,
      },

      // go to preview
      consts.GOTO_PREVIEW,

      // click button
      {
        type: BehaviorType.ClickSymbolChildPreview,
        target: SYMBOL_NAME_1,
        elementIndices: [1],
      },
    ],
    expected: {
      symbolElementValues: [
        {
          elementIndices: [0],
          symbolName: SYMBOL_NAME_1,
          styles: {
            width: '50px',
            height: '50px',
            'border-radius': '50px',
            'background-color': 'rgb(52, 168, 83)',
          },
        },
      ],
    },
  },
  {
    title: 'Should launch a modal from inside a symbol',
    do: [
      // add button to board 1
      {
        type: BehaviorType.AddElement,
        target: cd.ElementEntitySubType.Button,
        boardIndex: 0,
        elementIndices: [0],
      },

      // create symbol out of it
      {
        type: BehaviorType.ContextMenu,
        menuConfig: EditConfig.CreateSymbol,
        boardIndex: 0,
        elementIndices: [0],
      },

      // add board 2
      {
        type: BehaviorType.AddBoard,
        boardIndex: 1,
      },

      // select board 1
      {
        type: BehaviorType.SelectBoard,
        boardIndex: 0,
      },

      // enter isolation mode for symbol
      {
        type: BehaviorType.ContextMenu,
        menuConfig: EditConfig.EditSymbol,
        boardIndex: 0,
        elementIndices: [0],
      },

      // select button in symbol
      {
        type: BehaviorType.IsolationSelectElement,
        elementIndices: [1],
      },

      // add action to button to open modal pointing towards board 2
      {
        type: BehaviorType.AddAction,
        value: cd.ActionType.PresentModal,
        target: BOARD_2,
      },

      // exit isolation mode
      {
        type: BehaviorType.ExitSymbolIsolationMode,
      },

      // go to preview
      consts.GOTO_PREVIEW,

      // click button in symbol
      {
        type: BehaviorType.ClickSymbolChildPreview,
        target: 'Button',
        elementIndices: [0],
      },
    ],
    expected: {
      modalName: BOARD_2,
    },
  },
];

describe('Interactions: Symbols', () => {
  testRunner(SYMBOL_TESTS, interactionsBehaviorReducer, interactionsValidator);
});
