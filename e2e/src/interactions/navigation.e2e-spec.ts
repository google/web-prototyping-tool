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
import { BOARD_1, BOARD_2, BOARD_3 } from '../configs/generic.config';
import { ITestBehavior, BehaviorType, ITest } from '../consts/tests.interface';
import { interactionsBehaviorReducer } from './interactions.reducer';
import { interactionsValidator } from './interactions.validator';
import * as consts from './interactions.consts';
import * as cd from 'cd-interfaces';

const DEFAULT_INTERACTION_BEHAVIORS: ITestBehavior[] = [
  {
    type: BehaviorType.AddElement,
    target: cd.ElementEntitySubType.Generic,
    elementIndices: [0],
    boardIndex: 0,
  },
  {
    type: BehaviorType.AddBoard,
    boardIndex: 1,
  },
  {
    type: BehaviorType.AddElement,
    target: cd.ElementEntitySubType.Generic,
    elementIndices: [0],
    boardIndex: 1,
  },
];

const NAVIGATION_TESTS: ITest[] = [
  {
    title: 'Should Navigate between Boards on click',
    do: [
      ...DEFAULT_INTERACTION_BEHAVIORS,
      {
        type: BehaviorType.AddAction,
        value: cd.ActionType.NavigateToBoard,
        target: BOARD_2,
        boardIndex: 0,
        elementIndices: [0],
      },
      consts.GOTO_PREVIEW,
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
    title: 'Should Navigate to first board on reset',
    do: [
      ...DEFAULT_INTERACTION_BEHAVIORS,
      {
        type: BehaviorType.AddAction,
        value: cd.ActionType.NavigateToBoard,
        target: BOARD_2,
        boardIndex: 0,
        elementIndices: [0],
      },
      consts.GOTO_PREVIEW,
      {
        type: BehaviorType.ClickPreview,
        elementIndices: [0],
      },
      {
        type: BehaviorType.ResetPrototype,
        wait: 1000,
      },
    ],
    expected: {
      boardName: BOARD_1,
    },
  },
  {
    title: 'Should Present modal',
    do: [
      ...DEFAULT_INTERACTION_BEHAVIORS,
      {
        type: BehaviorType.AddAction,
        value: cd.ActionType.PresentModal,
        target: BOARD_2,
        boardIndex: 0,
        elementIndices: [0],
      },
      consts.GOTO_PREVIEW,
      {
        type: BehaviorType.ClickPreview,
        elementIndices: [0],
      },
    ],
    expected: {
      boardName: BOARD_1, // Preview should stay on board 1
      modalName: BOARD_2, // Modal should present board 2
    },
  },
  {
    title: 'Should Navigate within a modal',
    do: [
      ...DEFAULT_INTERACTION_BEHAVIORS,
      {
        type: BehaviorType.AddBoard,
        boardIndex: 2,
      },
      {
        type: BehaviorType.AddAction,
        value: cd.ActionType.PresentModal,
        target: BOARD_2,
        boardIndex: 0,
        elementIndices: [0],
      },
      {
        type: BehaviorType.AddAction,
        value: cd.ActionType.NavigateToBoard,
        target: BOARD_3,
        boardIndex: 1,
        elementIndices: [0],
      },
      consts.GOTO_PREVIEW,
      {
        type: BehaviorType.ClickPreview,
        elementIndices: [0],
        wait: 2000,
      },
      {
        type: BehaviorType.ClickPreview,
        elementIndices: [0],
        wait: 2000,
      },
    ],
    expected: {
      boardName: BOARD_1, // Preview should stay on board 1
      modalName: BOARD_3, // Modal should present board 3
    },
  },
  {
    title: 'Should exit a modal',
    do: [
      ...DEFAULT_INTERACTION_BEHAVIORS,
      {
        type: BehaviorType.AddBoard,
        boardIndex: 2,
      },
      {
        type: BehaviorType.AddAction,
        value: cd.ActionType.PresentModal,
        target: BOARD_2,
        boardIndex: 0,
        elementIndices: [0],
      },
      {
        type: BehaviorType.AddAction,
        value: cd.ActionType.ExitModal,
        boardIndex: 1,
        elementIndices: [0],
      },
      consts.GOTO_PREVIEW,
      {
        // Go To Board 2
        type: BehaviorType.ClickPreview,
        elementIndices: [0],
        wait: 1000,
      },
      {
        // Click Exit modal
        type: BehaviorType.ClickPreview,
        elementIndices: [0],
        wait: 1000,
      },
    ],
    expected: {
      boardName: BOARD_1, // Preview should stay on board 1
      boardShouldNotHaveElementsInQuery: [consts.MODAL_ELEMENT], // Modal should be closed
    },
  },
  {
    title: 'Should close modal on reset',
    do: [
      ...DEFAULT_INTERACTION_BEHAVIORS,
      {
        type: BehaviorType.AddAction,
        value: cd.ActionType.PresentModal,
        target: BOARD_2,
        boardIndex: 0,
        elementIndices: [0],
      },
      consts.GOTO_PREVIEW,
      {
        type: BehaviorType.ClickPreview,
        elementIndices: [0],
      },
      {
        type: BehaviorType.ResetPrototype,
        wait: 1000,
      },
    ],
    expected: {
      boardName: BOARD_1, // Preview should stay on board 1
      boardShouldNotHaveElementsInQuery: [consts.MODAL_ELEMENT], // Modal should be closed
    },
  },
  {
    title: 'Should Navigate outside a modal ( Top Level Navigation )',
    do: [
      ...DEFAULT_INTERACTION_BEHAVIORS,
      {
        type: BehaviorType.AddBoard,
        boardIndex: 2,
      },
      {
        type: BehaviorType.AddAction,
        value: cd.ActionType.PresentModal,
        target: BOARD_2,
        boardIndex: 0,
        elementIndices: [0],
      },
      {
        type: BehaviorType.AddAction,
        value: cd.ActionType.NavigateToBoard,
        target: BOARD_3,
        top: true,
        boardIndex: 1,
        elementIndices: [0],
      },
      consts.GOTO_PREVIEW,
      {
        type: BehaviorType.ClickPreview,
        elementIndices: [0],
        wait: 2000,
      },
      {
        type: BehaviorType.ClickPreview,
        elementIndices: [0],
        wait: 2000,
      },
    ],
    expected: {
      boardName: BOARD_3, // Preview should stay on board 1
      boardShouldNotHaveElementsInQuery: [consts.MODAL_ELEMENT], // Modal should be closed
    },
  },
  {
    title: 'Should Replace modal (launch a modal from inside a modal)',
    do: [
      ...DEFAULT_INTERACTION_BEHAVIORS,
      {
        type: BehaviorType.AddBoard,
        boardIndex: 2,
      },
      {
        type: BehaviorType.AddAction,
        value: cd.ActionType.PresentModal,
        target: BOARD_2,
        boardIndex: 0,
        elementIndices: [0],
      },
      {
        type: BehaviorType.AddAction,
        value: cd.ActionType.PresentModal,
        target: BOARD_3,
        boardIndex: 1,
        elementIndices: [0],
      },
      consts.GOTO_PREVIEW,
      {
        type: BehaviorType.ClickPreview,
        elementIndices: [0],
        wait: 2000,
      },
      {
        type: BehaviorType.ClickPreview,
        elementIndices: [0],
        wait: 2000,
      },
    ],
    expected: {
      boardName: BOARD_1, // Preview should stay on board 1
      modalName: BOARD_3, // Modal should present board 3
    },
  },
];

describe('Interactions: Navigation', () => {
  testRunner(NAVIGATION_TESTS, interactionsBehaviorReducer, interactionsValidator);
});
