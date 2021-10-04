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
import { INTERACTION_INTERVAL, LONG_INTERACTION_INTERVAL } from '../configs/timing.configs';
import { BOARD_1, ICON_SYMBOL_NAME } from '../configs/generic.config';
import { symbolsBehaviorReducer } from './symbols.reducer';
import { symbolsValidator } from './symbols.validator';
import { BehaviorType, ITest } from '../consts/tests.interface';
import * as cd from 'cd-interfaces';
import { EditConfig } from 'src/app/routes/project/configs/project.config';

const MODIFICATION_TESTS: ITest[] = [
  {
    title: "Editing a symbol's frame size should not change the width/height styles",
    do: [
      // add generic element
      {
        type: BehaviorType.AddElement,
        target: cd.ElementEntitySubType.Generic,
        boardIndex: 0,
        wait: INTERACTION_INTERVAL,
      },

      // create component
      {
        type: BehaviorType.ContextMenu,
        menuConfig: EditConfig.CreateSymbol,
        elementIndices: [0],
        boardIndex: 0,
        wait: INTERACTION_INTERVAL,
      },

      // enter isolation mode
      {
        type: BehaviorType.ContextMenu,
        menuConfig: EditConfig.EditSymbol,
        boardIndex: 0,
        elementIndices: [0],
        wait: INTERACTION_INTERVAL,
      },

      // select frame
      {
        type: BehaviorType.SelectBoard,
        boardIndex: 0,
        symbolIsolation: true,
        wait: INTERACTION_INTERVAL,
      },

      // change frame height
      {
        type: BehaviorType.ChangeFrameHeight,
        target: 300,
      },

      // exit symbol isolation mode
      {
        type: BehaviorType.ExitSymbolIsolationMode,
        wait: INTERACTION_INTERVAL,
      },
    ],
    expected: {
      symbolSizeMatch: {
        symbolName: 'Element',
        width: 100,
        height: 300,
      },
      symbolStylesMatch: [
        {
          instanceIndex: 0,
          boardIndex: 0,
          styles: { width: '100px', height: '100px' },
        },
      ],
    },
  },
  {
    title: 'Applying an override should change the styles of the child appropriately',
    do: [
      // add first icon element
      {
        type: BehaviorType.AddElement,
        target: cd.ElementEntitySubType.Icon,
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
      },
    ],
    expected: {
      symbolStylesMatch: [
        {
          instanceIndex: 0,
          childIndex: 0,
          boardIndex: 0,
          boardName: BOARD_1,
          styles: { color: 'rgb(255, 0, 0)' },
          failureMessage: "mismatching first element's color after changing color override",
        },
      ],
    },
  },
  {
    title: "Editing a symbol's definition should not blow away overrides",
    do: [
      // add first icon element
      {
        type: BehaviorType.AddElement,
        target: cd.ElementEntitySubType.Icon,
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
        wait: LONG_INTERACTION_INTERVAL,
      },

      // change color of first icon to red through an override
      {
        type: BehaviorType.SetProperties,
        elementIndices: [0],
        boardIndex: 0,
        props: { color: { hex: '#ff0000' } },
        wait: INTERACTION_INTERVAL,
      },

      // enter symbol isolation mode
      {
        type: BehaviorType.ContextMenu,
        menuConfig: EditConfig.EditSymbol,
        elementIndices: [0],
        boardIndex: 0,
        wait: INTERACTION_INTERVAL,
      },

      // select icon
      {
        type: BehaviorType.IsolationSelectElement,
        elementIndices: [1],
        wait: LONG_INTERACTION_INTERVAL,
      },

      // change color of first icon in symbol def
      {
        type: BehaviorType.SetProperties,
        props: { color: { hex: '#0000ff' } },
        wait: INTERACTION_INTERVAL,
      },

      // exit isolation mode
      {
        type: BehaviorType.ExitSymbolIsolationMode,
      },
    ],
    expected: {
      symbolDefStylesMatch: [
        {
          symbolName: ICON_SYMBOL_NAME,
          childIndex: 0,
          styles: { color: 'rgb(0,0,255)' },
        },
      ],
      symbolStylesMatch: [
        {
          instanceIndex: 0,
          childIndex: 0,
          boardIndex: 0,
          boardName: BOARD_1,
          styles: { color: 'rgb(255, 0, 0)' },
          failureMessage: "mismatching first element's color after changing color override",
        },
      ],
    },
  },
  {
    title: "Editing a symbol's definition should push changes to all instances unless overriden",
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
        props: { color: { hex: '#0000ff' } },
        wait: INTERACTION_INTERVAL,
      },

      // copy symbol
      {
        type: BehaviorType.ContextMenu,
        menuConfig: EditConfig.Copy,
        elementIndices: [0],
        boardIndex: 0,
      },

      // copy symbol
      {
        type: BehaviorType.ContextMenu,
        menuConfig: EditConfig.Paste,
        elementIndices: [0],
        boardIndex: 0,
      },

      // edit symbol
      {
        type: BehaviorType.ContextMenu,
        menuConfig: EditConfig.EditSymbol,
        elementIndices: [0],
        boardIndex: 0,
      },

      // select icon
      {
        type: BehaviorType.IsolationSelectElement,
        elementIndices: [1],
      },

      // change color of first icon in symbol def
      {
        type: BehaviorType.SetProperties,
        props: { color: { hex: '#0000ff' } },
      },

      // exit isolation mode
      {
        type: BehaviorType.ExitSymbolIsolationMode,
      },
    ],
    expected: {
      symbolStylesMatch: [
        {
          instanceIndex: 0,
          childIndex: 0,
          boardIndex: 0,
          boardName: BOARD_1,
          styles: { color: 'rgb(0, 0, 255)' },
          failureMessage: "mismatching first element's color after changing color override",
        },
        {
          instanceIndex: 1,
          childIndex: 0,
          boardIndex: 0,
          boardName: BOARD_1,
          styles: { color: 'rgb(0, 0, 255)' },
          failureMessage: "mismatching first element's color after changing color override",
        },
      ],
    },
  },
  {
    title: 'Removing element from symbol def should remove any overrides for that element',
    do: [
      // add first icon element
      {
        type: BehaviorType.AddElement,
        target: cd.ElementEntitySubType.Image,
        boardIndex: 0,
        wait: INTERACTION_INTERVAL,
      },

      // add second icon element
      {
        type: BehaviorType.AddElement,
        target: cd.ElementEntitySubType.Icon,
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
        props: { color: { hex: '#0000ff' } },
        wait: INTERACTION_INTERVAL,
      },

      // edit instance
      {
        type: BehaviorType.ContextMenu,
        menuConfig: EditConfig.EditSymbol,
        elementIndices: [0],
        boardIndex: 0,
      },

      // select icon from symbol (second element)
      {
        type: BehaviorType.IsolationRightClickElement,
        elementIndices: [2],
      },

      // delete icon
      {
        type: BehaviorType.ContextMenu,
        menuConfig: EditConfig.Delete,
      },

      // exit isolation mode
      {
        type: BehaviorType.ExitSymbolIsolationMode,
      },
    ],
    expected: {
      propsPanelGroupDoesNotExist: {
        groupName: 'Icon',
        boardIndex: 0,
        elementIndices: [0],
      },
    },
  },
  {
    title: 'Adding element to symbol def should add overrides for that element to symbol',
    do: [
      // add image
      {
        type: BehaviorType.AddElement,
        target: cd.ElementEntitySubType.Image,
      },

      // create component
      {
        type: BehaviorType.ContextMenu,
        menuConfig: EditConfig.CreateSymbol,
        boardIndex: 0,
        elementIndices: [0],
      },

      // edit symbol
      {
        type: BehaviorType.ContextMenu,
        menuConfig: EditConfig.EditSymbol,
        boardIndex: 0,
        elementIndices: [0],
      },

      // add icon to symbol board
      {
        type: BehaviorType.IsolationAddElement,
        target: cd.ElementEntitySubType.Icon,
      },

      // exist isolation mode
      {
        type: BehaviorType.ExitSymbolIsolationMode,
      },
    ],
    expected: {
      propsPanelGroupExists: {
        groupName: 'Image',
        boardIndex: 0,
        elementIndices: [0],
      },
    },
  },
  {
    title: 'Updating a symbol on a board referenced by a portal should update it inside the portal',
    do: [
      // add icon to board
      {
        type: BehaviorType.AddElement,
        target: cd.ElementEntitySubType.Icon,
      },

      // right click selected icons
      {
        type: BehaviorType.RightClickElement,
        elementIndices: [0],
        boardIndex: 0,
      },

      // create symbol
      {
        type: BehaviorType.ContextMenu,
        menuConfig: EditConfig.CreateSymbol,
        wait: INTERACTION_INTERVAL,
      },

      // create second board
      {
        type: BehaviorType.AddBoard,
        boardIndex: 1,
      },

      // add portal to second board
      {
        type: BehaviorType.AddElement,
        target: cd.ElementEntitySubType.BoardPortal,
        boardIndex: 1,
      },

      // set portal on the second board to point to board 1
      {
        type: BehaviorType.SetPortal,
        target: BOARD_1,
        boardIndex: 1,
        elementIndices: [0],
      },

      // select symbol on board 1
      {
        type: BehaviorType.SelectElement,
        boardIndex: 0,
        elementIndices: [0],
      },

      // change color of first icon to red through an override
      {
        type: BehaviorType.SetProperties,
        elementIndices: [0],
        boardIndex: 0,
        props: { color: { hex: '#ff0000' } },
      },
    ],
    expected: {
      checkPortalChildren: {
        boardIndex: 1,
        elementIndices: [0],
        childIndices: [0],
        symbolIndices: [0],
        styles: { color: 'rgb(255, 0, 0)' },
      },
    },
  },
];

fdescribe('Symbols: Modification', () => {
  testRunner(MODIFICATION_TESTS, symbolsBehaviorReducer, symbolsValidator);
});
