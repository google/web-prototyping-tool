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
import * as commentThreads from './comment-threads.reducer';
import * as panelsReducer from './panels.reducer';
import * as selectionReducer from './selection.reducer';
import * as publishReducer from './publish.reducer';
import * as interactionReducer from './interaction.reducer';
import { Route } from 'src/app/configs/routes.config';
import { environment } from 'src/environments/environment';
import { DISCONNECT_PROJECT } from '../actions';
// import { runAllHealthChecks } from './health.metareducer';
import { IProjectState, ProjectReducer } from './reducer.interface';
// import { checkCrudActions } from './reducer.utils';
export * from './reducer.interface';

export const reducers: ActionReducerMap<IProjectState, ActionExtension> = {
  commentsState: commentThreads.reducer,
  panels: panelsReducer.reducer,
  selection: selectionReducer.reducer,
  publish: publishReducer.reducer,
  interactions: interactionReducer.reducer,
};

export function resetProjectState(reducer: ProjectReducer): ProjectReducer {
  return (state: IProjectState | undefined, action: Action): IProjectState => {
    if (action.type === DISCONNECT_PROJECT) {
      state = undefined;
    }
    return reducer(state, action);
  };
}

// TODO: reenable running health cheks in an effect?
// Realtime tests for non-production builds
// export function healthMonitorMetaReducer(reducer: ProjectReducer): ProjectReducer {
//   return (state: IProjectState | undefined, action: Action): IProjectState => {
//     const updatedState = reducer(state, action);
//     if (updatedState && checkCrudActions(action.type)) {
//       runAllHealthChecks(updatedState, true);
//     }
//     return updatedState;
//   };
// }

// resetProjectState has to precede history metaReducer --
// Not sure why, but if historyMetaReducer was executed first, then
// the history state would reappear after the meta reducers finish running, which
// broke other project's undo/redo if you navigate to another project from dashboard.
const middleWare = environment.e2e || environment.production ? [] : [];

export const metaReducers: MetaReducer<IProjectState, ActionExtension>[] = [
  ...middleWare,
  resetProjectState,
];
export const getProjectState = createFeatureSelector<IProjectState>(Route.Project);
