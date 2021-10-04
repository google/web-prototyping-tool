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

import { filter, tap } from 'rxjs/operators';
import { ofType, Actions, createEffect } from '@ngrx/effects';
import { Injectable } from '@angular/core';
import * as actions from '../actions';
import { RouterRequestAction, ROUTER_REQUEST } from '@ngrx/router-store';
import { RoutePath } from 'src/app/configs/routes.config';
import { UndoRedoService } from 'src/app/database/changes/undo-redo.service';

@Injectable()
export class HistoryEffects {
  constructor(private actions$: Actions, private undoRedoService: UndoRedoService) {}

  undo$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(actions.HISTORY_UNDO),
        tap(() => this.undoRedoService.undo())
      ),
    { dispatch: false }
  );

  redo$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(actions.HISTORY_REDO),
        tap(() => this.undoRedoService.redo())
      ),
    { dispatch: false }
  );

  /**
   * Clear the undo/redo stack whenever a user enter or exists symbol isolation mode or the code
   * component editor
   */
  resetUndoRedoHistory$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(
          actions.CODE_COMPONENT_OPEN_EDITOR,
          actions.PANEL_SET_ISOLATION_MODE,
          actions.PANEL_EXIT_SYMBOL_MODE
        ),
        tap(() => this.undoRedoService.resetStack())
      ),
    { dispatch: false }
  );

  /**
   * Clear the undo/redo stack whenever a user exits the code component editor
   *
   * There is no unique action for this (can also occur from browser back button),
   * so just checking route changes
   */
  resetUndoRedoHistoryOnCodeComponentExit$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType<RouterRequestAction>(ROUTER_REQUEST),
        filter(({ payload }) => {
          const { routerState, event } = payload;
          const currentlyInCodeComponentEditor = routerState.url.includes(RoutePath.CodeComponent);
          const leavingEditor = !event.url.includes(RoutePath.CodeComponent);
          return currentlyInCodeComponentEditor && leavingEditor;
        }),
        tap(() => this.undoRedoService.resetStack())
      ),
    { dispatch: false }
  );
}
