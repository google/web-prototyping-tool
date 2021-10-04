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
import { BOARD_1, BOARD_2, BOARD_3, PORTAL_NAME } from '../configs/generic.config';
import { GOTO_PREVIEW } from './interactions.consts';
import { BehaviorType, ITest } from '../consts/tests.interface';
import { interactionsBehaviorReducer } from './interactions.reducer';
import { interactionsValidator } from './interactions.validator';
import * as cd from 'cd-interfaces';

const PORTAL_TESTS: ITest[] = [
  {
    title: 'Should Navigate within a portal',
    do: [
      // Add portal to first board
      {
        type: BehaviorType.AddElement,
        target: cd.ElementEntitySubType.BoardPortal,
        elementIndices: [0],
        boardIndex: 0,
      },
      // Add another board (board 2)
      {
        type: BehaviorType.AddBoard,
        boardIndex: 1,
      },
      // Add a generic element to board 2
      {
        type: BehaviorType.AddElement,
        target: cd.ElementEntitySubType.Generic,
        elementIndices: [0],
        boardIndex: 1,
      },
      // Set element width + height
      // Click events on elements happen in the center
      // So clicking on a portal we need this element inside to be larger
      {
        type: BehaviorType.SetProperties,
        props: {
          width: 300,
          height: 300,
        },
        elementIndices: [0],
        boardIndex: 1,
      },
      // Add another board (board 3)
      {
        type: BehaviorType.AddBoard,
        boardIndex: 2,
      },
      // Add a generic element to board 3
      {
        type: BehaviorType.AddElement,
        target: cd.ElementEntitySubType.Generic,
        elementIndices: [0],
        boardIndex: 2,
      },
      // Set portal on the first board to point to board 2
      {
        type: BehaviorType.SetPortal,
        target: BOARD_2,
        boardIndex: 0,
        elementIndices: [0],
      },
      // Set the elment on board 2 to navigate to baord 3
      {
        type: BehaviorType.AddAction,
        value: cd.ActionType.NavigateToBoard,
        target: BOARD_3,
        boardIndex: 1,
        elementIndices: [0],
      },
      GOTO_PREVIEW,
      {
        type: BehaviorType.ClickPreview,
        elementIndices: [0],
        boardIndex: 1,
      },
    ],
    expected: {
      boardName: BOARD_1,
      portalPointedAtBoard: BOARD_3,
    },
  },
  {
    title: 'Should Navigate outside a portal ( Top Level Navigation )',
    do: [
      // Add portal to first board
      {
        type: BehaviorType.AddElement,
        target: cd.ElementEntitySubType.BoardPortal,
        elementIndices: [0],
        boardIndex: 0,
      },
      // Add another board (board 2)
      {
        type: BehaviorType.AddBoard,
        boardIndex: 1,
      },
      // Add a generic element to board 2
      {
        type: BehaviorType.AddElement,
        target: cd.ElementEntitySubType.Generic,
        elementIndices: [0],
        boardIndex: 1,
      },
      // Set element width + height
      // Click events on elements happen in the center
      // So clicking on a portal we need this element inside to be larger
      {
        type: BehaviorType.SetProperties,
        props: {
          width: 300,
          height: 300,
        },
        elementIndices: [0],
        boardIndex: 1,
      },
      // Add another board (board 3)
      {
        type: BehaviorType.AddBoard,
        boardIndex: 2,
      },
      // Add a generic element to board 3
      {
        type: BehaviorType.AddElement,
        target: cd.ElementEntitySubType.Generic,
        elementIndices: [0],
        boardIndex: 2,
      },
      // Set portal on the first board to point to board 2
      {
        type: BehaviorType.SetPortal,
        target: BOARD_2,
        boardIndex: 0,
        elementIndices: [0],
      },
      // Set the elment on board 2 to navigate to baord 3
      // With top level navigation
      {
        type: BehaviorType.AddAction,
        value: cd.ActionType.NavigateToBoard,
        target: BOARD_3,
        boardIndex: 1,
        elementIndices: [0],
        top: true,
      },
      GOTO_PREVIEW,
      {
        type: BehaviorType.ClickPreview,
        elementIndices: [0],
        boardIndex: 1,
        wait: 10000,
      },
    ],
    expected: {
      boardName: BOARD_3,
    },
  },
  {
    title: 'Should Swap portal',
    do: [
      {
        type: BehaviorType.AddElement,
        target: cd.ElementEntitySubType.Generic,
        elementIndices: [0],
        boardIndex: 0,
      },
      // Add portal to first board
      {
        type: BehaviorType.AddElement,
        target: cd.ElementEntitySubType.BoardPortal,
        elementIndices: [0],
        boardIndex: 0,
      },
      // Add another board (board 2)
      {
        type: BehaviorType.AddBoard,
        boardIndex: 1,
      },
      // Add a generic element to board 2
      {
        type: BehaviorType.AddElement,
        target: cd.ElementEntitySubType.Generic,
        elementIndices: [0],
        boardIndex: 1,
      },
      // Add another board (board 3)
      {
        type: BehaviorType.AddBoard,
        boardIndex: 2,
      },
      // Add a generic element to board 3
      {
        type: BehaviorType.AddElement,
        target: cd.ElementEntitySubType.Generic,
        elementIndices: [0],
        boardIndex: 2,
      },
      {
        type: BehaviorType.SetPortal,
        target: BOARD_2,
        boardIndex: 0,
        elementIndices: [1],
      },
      // When clicking on the element, swap portal to show board 3
      {
        type: BehaviorType.AddAction,
        value: cd.ActionType.SwapPortal,
        target: BOARD_3,
        portal: PORTAL_NAME,
        boardIndex: 0,
        elementIndices: [0],
      },
      GOTO_PREVIEW,
      {
        type: BehaviorType.ClickPreview,
        elementIndices: [0],
      },
    ],
    expected: {
      boardName: BOARD_1,
      portalPointedAtBoard: BOARD_3, // Portal should be pointed at board 3 after swap
    },
  },
  {
    title: 'Should Present Modal inside a portal',
    do: [
      // Add portal to first board
      {
        type: BehaviorType.AddElement,
        target: cd.ElementEntitySubType.BoardPortal,
        elementIndices: [0],
        boardIndex: 0,
      },
      // Add another board (board 2)
      {
        type: BehaviorType.AddBoard,
        boardIndex: 1,
      },
      // Add a generic element to board 2
      {
        type: BehaviorType.AddElement,
        target: cd.ElementEntitySubType.Generic,
        elementIndices: [0],
        boardIndex: 1,
      },
      {
        type: BehaviorType.SetProperties,
        props: {
          width: 300,
          height: 300,
        },
        elementIndices: [0],
        boardIndex: 1,
      },
      // Add another board (board 3)
      {
        type: BehaviorType.AddBoard,
        boardIndex: 2,
      },
      // Add a generic element to board 3
      {
        type: BehaviorType.AddElement,
        target: cd.ElementEntitySubType.Generic,
        elementIndices: [0],
        boardIndex: 2,
      },
      {
        type: BehaviorType.SetPortal,
        target: BOARD_2,
        boardIndex: 0,
        elementIndices: [0],
      },
      // When clicking on the element, swap portal to show board 3
      {
        type: BehaviorType.AddAction,
        value: cd.ActionType.PresentModal,
        target: BOARD_3,
        portal: PORTAL_NAME,
        boardIndex: 1,
        elementIndices: [0],
      },
      GOTO_PREVIEW,
      {
        type: BehaviorType.ClickPreview,
        elementIndices: [0],
      },
    ],
    expected: {
      boardName: BOARD_1,
      modalName: BOARD_3, // Modal should present board 3
      portalPointedAtBoard: BOARD_2, // Portal should be pointed at board 2 after swap
    },
  },
  {
    title: 'Should NOT allow navigating to current board from a portal inside of modal',
    do: [
      // Add a generic element to board 1
      {
        type: BehaviorType.AddElement,
        target: cd.ElementEntitySubType.Generic,
        elementIndices: [0],
        boardIndex: 0,
      },
      // Add 2nd board
      {
        type: BehaviorType.AddBoard,
        boardIndex: 1,
      },
      // Add a generic element to board 2
      {
        type: BehaviorType.AddElement,
        target: cd.ElementEntitySubType.Generic,
        elementIndices: [0],
        boardIndex: 1,
      },
      // Add 3rd board
      {
        type: BehaviorType.AddBoard,
        boardIndex: 2,
      },
      // Add a portal to board 3
      {
        type: BehaviorType.AddElement,
        target: cd.ElementEntitySubType.BoardPortal,
        elementIndices: [0],
        boardIndex: 2,
      },
      // set portal on board 3 to point to board 2
      {
        type: BehaviorType.SetPortal,
        target: BOARD_2,
        boardIndex: 2,
        elementIndices: [0],
      },
      // When clicking on the element on board 2, navigate to board 1
      {
        type: BehaviorType.AddAction,
        value: cd.ActionType.NavigateToBoard,
        target: BOARD_1,
        portal: PORTAL_NAME,
        boardIndex: 1,
        elementIndices: [0],
      },
      // When clicking on the element on board 1, present modal of board 3
      {
        type: BehaviorType.AddAction,
        value: cd.ActionType.PresentModal,
        target: BOARD_2,
        portal: PORTAL_NAME,
        boardIndex: 0,
        elementIndices: [0],
      },
      GOTO_PREVIEW,
      {
        // click element on board 1 to present modal
        type: BehaviorType.ClickPreview,
        elementIndices: [0],
        wait: 2000,
      },
      {
        // click to attempt to navagiate portal inside modal to board 1
        type: BehaviorType.ClickPreview,
        elementIndices: [0],
      },
    ],
    expected: {
      boardName: BOARD_1,
      // Navigate should be prevented. Portal should still be pointed at board 2
      portalPointedAtBoard: BOARD_2,
    },
  },
  {
    title: 'Swap portal should fail gracefully when board is removed',
    do: [
      {
        type: BehaviorType.AddElement,
        target: cd.ElementEntitySubType.Generic,
        elementIndices: [0],
        boardIndex: 0,
      },
      // Add portal to first board
      {
        type: BehaviorType.AddElement,
        target: cd.ElementEntitySubType.BoardPortal,
        elementIndices: [0],
        boardIndex: 0,
      },
      // Add another board (board 2)
      {
        type: BehaviorType.AddBoard,
        boardIndex: 1,
      },
      // Add a generic element to board 2
      {
        type: BehaviorType.AddElement,
        target: cd.ElementEntitySubType.Generic,
        elementIndices: [0],
        boardIndex: 1,
      },
      // Add another board (board 3)
      {
        type: BehaviorType.AddBoard,
        boardIndex: 2,
      },
      // Add a generic element to board 3
      {
        type: BehaviorType.AddElement,
        target: cd.ElementEntitySubType.Generic,
        elementIndices: [0],
        boardIndex: 2,
      },
      {
        type: BehaviorType.SetPortal,
        target: BOARD_2,
        boardIndex: 0,
        elementIndices: [1],
      },
      // When clicking on the element, swap portal to show board 3
      {
        type: BehaviorType.AddAction,
        value: cd.ActionType.SwapPortal,
        target: BOARD_3,
        portal: PORTAL_NAME,
        boardIndex: 0,
        elementIndices: [0],
      },
      {
        type: BehaviorType.DeleteBoard,
        boardIndex: 2, // DELETE Board 3
      },
      GOTO_PREVIEW,
      {
        type: BehaviorType.ClickPreview,
        elementIndices: [0],
      },
    ],
    expected: {
      // Portal should be pointed at board 2 after swap
      // Since swap should not have occured
      boardName: BOARD_1,
      portalPointedAtBoard: BOARD_2,
    },
  },
  {
    title: 'Swap portal should fail gracefully when portal is removed',
    do: [
      {
        type: BehaviorType.AddElement,
        target: cd.ElementEntitySubType.Generic,
        elementIndices: [0],
        boardIndex: 0,
      },
      // Add portal to first board
      {
        type: BehaviorType.AddElement,
        target: cd.ElementEntitySubType.BoardPortal,
        elementIndices: [0],
        boardIndex: 0,
      },
      // Add another board (board 2)
      {
        type: BehaviorType.AddBoard,
        boardIndex: 1,
      },
      // Add a generic element to board 2
      {
        type: BehaviorType.AddElement,
        target: cd.ElementEntitySubType.Generic,
        elementIndices: [0],
        boardIndex: 1,
      },
      // Add another board (board 3)
      {
        type: BehaviorType.AddBoard,
        boardIndex: 2,
      },
      // Add a generic element to board 3
      {
        type: BehaviorType.AddElement,
        target: cd.ElementEntitySubType.Generic,
        elementIndices: [0],
        boardIndex: 2,
      },
      {
        type: BehaviorType.SetPortal,
        target: BOARD_2,
        boardIndex: 0,
        elementIndices: [1],
      },
      // When clicking on the element, swap portal to show board 3
      {
        type: BehaviorType.AddAction,
        value: cd.ActionType.SwapPortal,
        target: BOARD_3,
        portal: PORTAL_NAME,
        boardIndex: 0,
        elementIndices: [0],
      },
      {
        // Remove portal from the first board
        type: BehaviorType.DeleteElement,
        boardIndex: 0,
        elementIndices: [1],
      },
      GOTO_PREVIEW,
      {
        type: BehaviorType.ClickPreview,
        elementIndices: [0],
      },
    ],
    expected: {
      // Portal should be pointed at board 2 after swap
      // Since swap should not have occured
      boardName: BOARD_1,
    },
  },
  {
    title: 'Should Navigate within a portal but not to parent board',
    do: [
      // Add portal to first board
      {
        type: BehaviorType.AddElement,
        target: cd.ElementEntitySubType.BoardPortal,
        elementIndices: [0],
        boardIndex: 0,
      },
      // Add another board (board 2)
      {
        type: BehaviorType.AddBoard,
        boardIndex: 1,
      },
      // Add a generic element to board 2
      {
        type: BehaviorType.AddElement,
        target: cd.ElementEntitySubType.Generic,
        elementIndices: [0],
        boardIndex: 1,
      },
      // Set element width + height
      // Click events on elements happen in the center
      // So clicking on a portal we need this element inside to be larger
      {
        type: BehaviorType.SetProperties,
        props: {
          width: 300,
          height: 300,
        },
        elementIndices: [0],
        boardIndex: 1,
      },
      // Set the elment on board 2 to navigate to baord 3
      {
        type: BehaviorType.AddAction,
        value: cd.ActionType.NavigateToBoard,
        target: BOARD_1,
        boardIndex: 1,
        elementIndices: [0],
      },
      // Set portal on the first board to point to board 2
      {
        type: BehaviorType.SetPortal,
        target: BOARD_2,
        boardIndex: 0,
        elementIndices: [0],
      },
      GOTO_PREVIEW,
      {
        type: BehaviorType.ClickPreview,
        elementIndices: [0],
        boardIndex: 1,
      },
    ],
    expected: {
      boardName: BOARD_1,
      portalPointedAtBoard: BOARD_2,
    },
  },
];

describe('Interactions: Portals', () => {
  testRunner(PORTAL_TESTS, interactionsBehaviorReducer, interactionsValidator);
});
