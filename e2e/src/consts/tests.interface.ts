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

import { ICSSValues, IPropsChanges } from '../models/props.interfaces';
import * as cd from 'cd-interfaces';

export interface ITest {
  title: string;
  do: ITestBehavior[];
  expected?: ITestExpectations;
  run?: boolean;
}

export interface ITestBehavior {
  type: BehaviorType;
  value?: any;
  wait?: number;
  target?: any;
  boardIndex?: number;
  elementIndices?: number[];
  props?: Partial<IPropsChanges>;
  portal?: string;
  top?: boolean;
  from?: string;
  menuConfig?: cd.IConfig;
  symbolIsolation?: boolean;
}

export enum BehaviorType {
  AddElement,
  AddBoard,
  SelectBoard,
  SelectElement,
  ClearSelection,
  RightClickElement,
  ShiftClickElement,
  ConfirmConfirmationDialog,
  ReportProjectData,
  ChangeFrameWidth,
  ChangeFrameHeight,

  // Interactions
  AddNavigation,
  AddAction,
  DeleteBoard,
  DeleteElement,
  StartRecording,
  StopRecording,
  ContextMenu,
  GoToPreview,
  ClickPreview,
  SetRandomBackgroundColor,
  ResetPrototype,
  SetProperties,
  SetPortal,

  // Symbols
  ExitSymbolIsolationMode,
  IsolationSelectElement,
  IsolationShiftClickElement,
  IsolationRightClickElement,
  IsolationAddElement,
  ClickSymbolChildPreview,
}

export interface IExpectStylesMatch {
  elementIndices: number[];
  boardIndex: number;
  styles: ICSSValues;
  failureMessage?: string;
}

export interface IExpectSymbolStylesMatch {
  instanceIndex: number;
  childIndex?: number;
  boardIndex: number;
  boardName?: string;
  styles: ICSSValues;
  failureMessage?: string;
}

export interface IExpectSymbolDefStylesMatch {
  childIndex?: number;
  symbolName: string;
  styles: ICSSValues;
  failureMessage?: string;
}

export interface IElementValues {
  elementIndices: number[];
  symbolName?: string;
  inputs?: cd.IStringMap<any>;
  styles?: cd.IStringMap<any>;
}

export interface IPropsPanelExists {
  elementIndex: number;
  boardIndex: number;
}

export interface IPropsPanelGroupExists {
  groupName: string;
  boardIndex: number;
  elementIndices: number[];
}

export interface INumberOfChildren {
  elementIndex: number;
  numberChildren: number;
  boardName: string;
}

export interface IBoardSizeMatch {
  boardName: string;
  width: number;
  height: number;
}

export interface ISymbolSizeMatch {
  symbolName: string;
  width: number;
  height: number;
}

export interface IPortalChildrenCheck {
  boardIndex: number;
  elementIndices: number[];
  childIndices: number[];
  styles: cd.IStringMap<any>;
  symbolIndices?: number[];
}

export interface ITestExpectations {
  boardName?: string;
  modalName?: string;
  elementValues?: IElementValues[];
  symbolElementValues?: IElementValues[];
  portalPointedAtBoard?: string;
  boardHasElementsInQuery?: string[];
  boardShouldNotHaveElementsInQuery?: string[];
  stylesMatch?: IExpectStylesMatch[];
  symbolStylesMatch?: IExpectSymbolStylesMatch[];
  symbolDefStylesMatch?: IExpectSymbolDefStylesMatch[];
  propsPanelExists?: IPropsPanelExists;
  propsPanelGroupExists?: IPropsPanelGroupExists;
  propsPanelGroupDoesNotExist?: IPropsPanelGroupExists;
  numberOfChildren?: INumberOfChildren;
  boardSizeMatch?: IBoardSizeMatch;
  symbolSizeMatch?: ISymbolSizeMatch;
  checkPortalChildren?: IPortalChildrenCheck;
}
