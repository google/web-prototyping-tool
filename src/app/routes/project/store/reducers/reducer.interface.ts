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

import { ActionReducer, Action } from '@ngrx/store';
import { IHistoryState } from '../../interfaces/history.interface';
import { IPanelsState } from '../../interfaces/panel.interface';
import * as designSystem from './design-system.reducer';
import * as commentThreads from './comment-threads.reducer';
import * as projectDataReducer from './project-data.reducer';
import * as elementPropertiesReducer from './element-properties.reducer';
import * as selectionReducer from './selection.reducer';
import * as publishReducer from './publish.reducer';
import * as interactionReducer from './interaction.reducer';
import * as codeComponentsReducer from './code-component.reducer';
import * as datasetsReducer from './datasets.reducer';

export interface IProjectState {
  codeComponents: codeComponentsReducer.ICodeComponentState;
  commentsState: commentThreads.ICommentsState;
  datasets: datasetsReducer.IDatasetsState;
  designSystem: designSystem.IDesignSystemState;
  elementProperties: elementPropertiesReducer.IComponentInstanceState;
  history: IHistoryState;
  interactions?: interactionReducer.IInteractionState;
  panels: IPanelsState;
  projectData: projectDataReducer.IProjectDataState;
  publish: publishReducer.IPublishState;
  selection: selectionReducer.ISelectionState;
}

export type ProjectReducer = ActionReducer<IProjectState, Action>;
