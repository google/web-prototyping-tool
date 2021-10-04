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

import { createEffect, Actions, ofType } from '@ngrx/effects';
import { withLatestFrom, map, switchMap, filter, tap } from 'rxjs/operators';
import { select, Store } from '@ngrx/store';
import { Injectable } from '@angular/core';
import { IAppState, getRouterState, AppGo } from 'src/app/store';
import { ROUTER_NAVIGATION, RouterNavigationAction } from '@ngrx/router-store';
import { IProjectState } from '../reducers';
import { getIsolatedSymbolId, getSymbolMode } from '../selectors/panels.selector';
import { PanelConfig } from '../../configs/project.config';
import { DataPickerService } from 'cd-common';
import { Router } from '@angular/router';
import { ProjectContentService } from 'src/app/database/changes/project-content.service';
import * as config from 'src/app/configs/routes.config';
import * as actions from '../actions/panels.action';
import * as storeActions from '../actions';
import * as cd from 'cd-interfaces';

@Injectable()
export class PanelsEffect {
  private _symbolIdHistory: string[] = [];

  constructor(
    private actions$: Actions,
    private _router: Router,
    private _appStore: Store<IAppState>,
    private _dataPickerService: DataPickerService,
    private _projectStore: Store<IProjectState>,
    private _projectContentService: ProjectContentService
  ) {}

  showSymbols$ = createEffect(() =>
    this.actions$.pipe(
      ofType<actions.PanelIsolateSymbol>(actions.PANEL_SHOW_SYMBOLS),
      withLatestFrom(this._appStore.pipe(select(getRouterState))),
      map(([, routerState]) => {
        const query = { ...routerState.state.queryParams };
        query[config.SYMBOL_MODE_QUERY_PARAM] = true;
        return new AppGo({ path: [], query });
      })
    )
  );

  isolateSymbol$ = createEffect(() =>
    this.actions$.pipe(
      ofType<actions.PanelIsolateSymbol>(actions.PANEL_ISOLATE_SYMBOL),
      withLatestFrom(this._appStore.pipe(select(getRouterState))),
      withLatestFrom(this._projectStore.pipe(select(getSymbolMode))),
      switchMap(([[action, routerState], symbolMode]) => {
        const query = { ...routerState.state.queryParams };
        const { propertyModels } = action.payload;
        const model = propertyModels && (propertyModels[0] as cd.ISymbolInstanceProperties);
        const isolatedSymbolId = model ? model.inputs.referenceId || model.id : null;
        query[config.SYMBOL_MODE_QUERY_PARAM] = true;
        query[config.ISOLATED_SYMBOL_ID_QUERY_PARAM] = isolatedSymbolId;

        if (isolatedSymbolId) {
          // reset if coming from a non-symbol mode
          if (!symbolMode) this._symbolIdHistory = [];
          this._symbolIdHistory.push(isolatedSymbolId);
        }
        return [new storeActions.CanvasSaveState(), new AppGo({ path: [], query })];
      })
    )
  );

  exitSymbolMode$ = createEffect(() =>
    this.actions$.pipe(
      ofType<actions.PanelExitSymbolMode>(actions.PANEL_EXIT_SYMBOL_MODE),
      withLatestFrom(this._appStore.pipe(select(getRouterState))),
      tap(() => this._dataPickerService.exitSymbolIsolationMode()),
      switchMap(([, routerState]) => {
        const query = { ...routerState.state.queryParams };
        this._symbolIdHistory.pop();
        const lastSymbolId = this._symbolIdHistory[this._symbolIdHistory.length - 1];
        if (!lastSymbolId) query[config.SYMBOL_MODE_QUERY_PARAM] = null;
        query[config.ISOLATED_SYMBOL_ID_QUERY_PARAM] = lastSymbolId || null;
        const _actions = [];
        if (lastSymbolId) _actions.push(new storeActions.CanvasRestoreState());
        _actions.push(new AppGo({ path: [], query }));
        return _actions;
      })
    )
  );

  panelSetSymbolMode$ = createEffect(() =>
    this.actions$.pipe(
      ofType<RouterNavigationAction>(ROUTER_NAVIGATION),
      withLatestFrom(this._appStore.pipe(select(getRouterState))),
      filter(([, routerState]) => {
        // only listen to when on project page an not preview page
        const { url } = routerState.state;
        return url.includes(config.Route.Project) && !url.includes(config.Route.Preview);
      }),
      map<any, [boolean, string]>(([, routerState]) => {
        const { queryParams } = routerState.state;
        const symbolMode = !!queryParams[config.SYMBOL_MODE_QUERY_PARAM];
        const symbolId = queryParams[config.ISOLATED_SYMBOL_ID_QUERY_PARAM];
        return [symbolMode, symbolId];
      }),
      withLatestFrom(this._projectStore.pipe(select(getIsolatedSymbolId))),
      withLatestFrom(this._projectStore.pipe(select(getSymbolMode))),
      filter(([[queryParams, isolatedSymbolId], symbolMode]) => {
        // only process if current state doesn't match what is in the url
        const [urlSymbolMode, urlIsolatedSymbolId] = queryParams;
        return !(urlSymbolMode === symbolMode && urlIsolatedSymbolId === isolatedSymbolId);
      }),
      tap(([[queryParams]]) => {
        const [, symbolId] = queryParams;
        if (symbolId) this._dataPickerService.setSymbolIsolationMode(symbolId);
      }),
      switchMap(([[queryParams]]) => {
        const [symbolMode, symbolId] = queryParams;
        const canvasPostAction = symbolMode
          ? [new storeActions.CanvasFitToBounds()]
          : [new storeActions.CanvasRestoreState()];

        return [
          new actions.PanelSetIsolationMode(symbolMode, symbolId),
          new storeActions.SelectionDeselectAll(),
          ...canvasPostAction,
        ];
      })
    )
  );

  exitIsolationModeForUndefinedSymbol$ = createEffect(() =>
    this.actions$.pipe(
      // run this check when a project finishes loading and when isolation mode is set
      ofType(storeActions.PROJECT_CONTENT_QUERY_SUCCESS, actions.PANEL_SET_ISOLATION_MODE),
      withLatestFrom(this._projectStore.pipe(select(getIsolatedSymbolId))),
      filter(([, isolatedSymbolId]) => !!isolatedSymbolId), // check that we are in isolation mode with a symbol id
      withLatestFrom(this._projectContentService.projectLoaded$),
      filter(([, projectLoaded]) => projectLoaded), // check project has been loaded from database
      withLatestFrom(this._projectContentService.elementProperties$),
      filter(([[[, isolatedSymbolId]], elementProperties]) => {
        // check if property  model for isolated symbol does not exist
        return !!(isolatedSymbolId && !elementProperties[isolatedSymbolId]);
      }),
      tap(() => this._dataPickerService.exitSymbolIsolationMode()), // clear
      map(() => {
        // if above conditions are all met:
        // return an action to navigate to current url with isolationMode query params left out
        return new AppGo({ path: [window.location.pathname] });
      })
    )
  );

  /** Show the layers tree if coming from preview or from fragment flag on dashboard */
  setInitalPanelState$ = createEffect(() =>
    this.actions$.pipe(
      ofType(storeActions.PROJECT_DATA_QUERY),
      withLatestFrom(this._appStore.pipe(select(getRouterState))),
      map(([, { state }]) => state),
      filter((state) => {
        return (
          state.fragment === config.LAYERS_PANEL_FRAGMENT ||
          state.url.includes(config.Route.Preview)
        );
      }),
      tap((state) => {
        // Auto remove the layers panel fragment
        if (state.fragment !== config.LAYERS_PANEL_FRAGMENT) return;
        setTimeout(() => {
          this._router.navigate([], { replaceUrl: true });
        });
      }),
      map(() => {
        return new actions.PanelSetActivity(PanelConfig.Layers, {});
      })
    )
  );
}
