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

import { ActionExtension } from 'cd-interfaces';
import { ActionReducerMap, createFeatureSelector, MetaReducer, Action } from '@ngrx/store';
import * as designSystem from './design-system.reducer';
import * as commentThreads from './comment-threads.reducer';
import * as historyReducer from './history.reducer';
import * as panelsReducer from './panels.reducer';
import * as projectDataReducer from './project-data.reducer';
import * as elementPropertiesReducer from './element-properties.reducer';
import * as selectionReducer from './selection.reducer';
import * as publishReducer from './publish.reducer';
import * as interactionReducer from './interaction.reducer';
import * as codeComponentsReducer from './code-component.reducer';
import * as datasetsReducer from './datasets.reducer';
import { Route } from 'src/app/configs/routes.config';
import { environment } from 'src/environments/environment';
import { DISCONNECT_PROJECT } from '../actions';
import { runAllHealthChecks } from './health.metareducer';
import { IProjectState, ProjectReducer } from './reducer.interface';
import { checkCrudActions } from './reducer.utils';
export * from './reducer.interface';

export const reducers: ActionReducerMap<IProjectState, ActionExtension> = {
  commentsState: commentThreads.reducer,
  projectData: projectDataReducer.reducer,
  elementProperties: elementPropertiesReducer.reducer,
  designSystem: designSystem.reducer,
  history: historyReducer.noOpReducer,
  panels: panelsReducer.reducer,
  selection: selectionReducer.reducer,
  publish: publishReducer.reducer,
  interactions: interactionReducer.reducer,
  codeComponents: codeComponentsReducer.reducer,
  datasets: datasetsReducer.reducer,
};

export function resetProjectState(reducer: ProjectReducer): ProjectReducer {
  return (state: IProjectState | undefined, action: Action): IProjectState => {
    if (action.type === DISCONNECT_PROJECT) {
      state = undefined;
    }
    return reducer(state, action);
  };
}

// Realtime tests for non-production builds
export function healthMonitorMetaReducer(reducer: ProjectReducer): ProjectReducer {
  return (state: IProjectState | undefined, action: Action): IProjectState => {
    const updatedState = reducer(state, action);
    if (updatedState && updatedState.elementProperties.loaded && checkCrudActions(action.type)) {
      runAllHealthChecks(updatedState, true);
    }
    return updatedState;
  };
}

// resetProjectState has to precede history metaReducer --
// Not sure why, but if historyMetaReducer was executed first, then
// the history state would reappear after the meta reducers finish running, which
// broke other project's undo/redo if you navigate to another project from dashboard.
const middleWare = environment.e2e || environment.production ? [] : [healthMonitorMetaReducer];

export const metaReducers: MetaReducer<IProjectState, ActionExtension>[] = [
  ...middleWare,
  resetProjectState,
  historyReducer.metaReducer,
];
export const getProjectState = createFeatureSelector<IProjectState>(Route.Project);
