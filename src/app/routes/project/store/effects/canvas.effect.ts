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

import { CanvasService } from '../../services/canvas/canvas.service';
import { createEffect, Actions, ofType } from '@ngrx/effects';
import { getSymbolMode } from '../selectors';
import { IBoardProperties, PropertyModel, IProject } from 'cd-interfaces';
import { Injectable } from '@angular/core';
import { DISCONNECT_PROJECT } from '../actions';
import { Store, select } from '@ngrx/store';
import { tap, map, withLatestFrom, filter, switchMap, skipWhile, take } from 'rxjs/operators';
import { ProjectContentService } from 'src/app/database/changes/project-content.service';
import * as actions from '../actions/canvas.action';
import { RouterNavigationAction, ROUTER_NAVIGATED } from '@ngrx/router-store';
import { IAppState, getRouterState } from 'src/app/store/reducers';
import { Route } from 'src/app/configs/routes.config';
import { canvasHasBounds } from '../../utils/canvas.utils';
import { forkJoin, Observable, of } from 'rxjs';
import { isBoard } from 'cd-common/models';
import { ActivatedRoute, Router } from '@angular/router';
import { IProjectState } from '../reducers/reducer.interface';

export const NO_CANVAS_ANIMATION_EVENT = 'no-animate';
const FIT_TO_BOUNDS_BOARD_LIMIT = 8;
const LARGE_PROJECT_INITAL_ZOOM = 0.5;

type snapToBoardContent = [
  action: actions.CanvasSnapToBoard,
  propertyModels: PropertyModel[],
  zoom?: number
];

@Injectable()
export class CanvasEffects {
  /** This is used to prevent applying fit to bounds or fit to board on project load if the project has already loaded */
  private _currentProjectId?: string;

  constructor(
    private actions$: Actions,
    private canvasService: CanvasService,
    private projectContentService: ProjectContentService,
    private _canvasService: CanvasService,
    private _activatedRoute: ActivatedRoute,
    private _projectStore: Store<IProjectState>,
    private _appStore: Store<IAppState>,
    private _router: Router
  ) {}

  fitToBounds$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(actions.CANVAS_FIT_TO_BOUNDS),
        tap(() => this.canvasService.fitToBounds())
      ),
    { dispatch: false }
  );

  disconnect$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(DISCONNECT_PROJECT),
        tap(() => {
          if (!this._currentProjectId) return;
          this._canvasService.clearSavedState();
          this._currentProjectId = undefined;
        })
      ),
    { dispatch: false }
  );

  /**
   * Anytime we navigate to project page we call fit to bounds if this is the first time that
   * a user has gone to project page for the current project. When returning from preview, we do
   * not call again in order to preserve user's canvas position
   *
   * Dispatch action instead of calling service directly to ensure that
   * board subscriptions have triggered in canvas before fitToBounds is called.
   *
   * The canvas service will ignore fitToBounds if bounds is empty, so the additional
   * call will have no effect.
   */
  centerCanvasOnNavigateToProject$ = createEffect(() => {
    return this.actions$.pipe(
      ofType<RouterNavigationAction>(ROUTER_NAVIGATED),
      withLatestFrom(this._appStore.pipe(select(getRouterState))),
      filter(([, routerState]) => {
        // only proceed when on project page and not preview page
        const { url } = routerState.state;
        return url.includes(Route.Project) && !url.includes(Route.Preview);
      }),
      switchMap(() => {
        return this.projectContentService.elementsLoaded$.pipe(
          skipWhile((loaded) => loaded === false)
        );
      }),
      withLatestFrom(this.projectContentService.project$),
      map(([, proj]) => proj),
      filter((proj): proj is IProject => proj !== undefined),
      filter((proj) => proj.id !== this._currentProjectId),
      switchMap((proj) => {
        // Ensure bounds have been determined before dispatching action to fit to bounds.
        // If action is dispatched before canvas has calculated bounds, it will be ignored
        const { canvas$ } = this.canvasService; // subscribe to changes in canvas object
        const canvasHasBounds$ = canvas$.pipe(
          map((canvas) => canvasHasBounds(canvas)), // check if canvasHasBounds on changes to canvas
          skipWhile((hasBounds) => hasBounds === false), // ignore events until hasBounds is true
          take(1) // unsubscribe as soon as we get a true result
        );
        return forkJoin([of(proj), canvasHasBounds$]);
      }),
      withLatestFrom(this._projectStore.pipe(select(getSymbolMode))),
      map(([[proj], symbolMode]) => [proj, symbolMode]),
      withLatestFrom(this.projectContentService.project$),
      map(([[proj, symbolMode], elementProps]) => {
        this._currentProjectId = proj.id;
        const boardId = this._activatedRoute.snapshot.queryParams?.id;
        const snapBoard = boardId && elementProps[boardId];
        // Handle the scenario where user lands on preview initally then navigates
        // to a specific board
        if (snapBoard) {
          this._router.navigate([], { queryParams: { id: null }, replaceUrl: true });
          const payload = { propertyModels: [snapBoard], zoom: 1 };
          return new actions.CanvasSnapToBoard(null, payload, new Event(NO_CANVAS_ANIMATION_EVENT));
        }

        // User is deeplinked into a symbol
        if (symbolMode) return new actions.CanvasFitToBounds();
        const boardIds = proj.boardIds ?? [];
        const action =
          boardIds.length > FIT_TO_BOUNDS_BOARD_LIMIT
            ? new actions.CanvasSnapToHomeBoard()
            : new actions.CanvasFitToBounds();

        return action;
      })
    ) as Observable<actions.CanvasSnapToHomeBoard | actions.CanvasFitToBounds>;
    // TODO: figure out why this "as" cast is necessary for typings to work
  });

  snapToHomeBoard$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType<actions.CanvasSnapToHomeBoard>(actions.CANVAS_SNAP_TO_HOME_BOARD),
        withLatestFrom(this.projectContentService.project$),
        map(([, proj]) => proj),
        filter((proj): proj is IProject => proj !== undefined),
        withLatestFrom(this.projectContentService.elementProperties$),
        withLatestFrom(this.projectContentService.boardIds$),
        tap(([[proj, props], boardIds]) => {
          const homeId = proj.homeBoardId;
          const homeBoard =
            homeId && boardIds.includes(homeId) && (props[homeId] as IBoardProperties);
          if (!homeBoard) {
            // Fall back if home board breaks for some reason
            this.canvasService.fitToBounds();
            return;
          }
          this.canvasService.snapToBoard([homeBoard], false, LARGE_PROJECT_INITAL_ZOOM);
        })
      ),
    { dispatch: false }
  );

  snapToBoard$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType<actions.CanvasSnapToBoard>(actions.CANVAS_SNAP_TO_BOARD),
        map<actions.CanvasSnapToBoard, snapToBoardContent>((action) => {
          const { propertyModels, zoom } = action.payload;
          const propModels = propertyModels || [];
          return [action, propModels, zoom];
        }),
        filter(([, propertyModels]) => propertyModels.length > 0),
        withLatestFrom(this.projectContentService.elementProperties$),
        tap(([[action, propertyModels, zoom], props]) => {
          const { event } = action;
          const areBoards = propertyModels.every(isBoard);
          const boards = areBoards
            ? propertyModels
            : propertyModels.map((item) => props[item.rootId]);
          const animate = !(event && event.type === NO_CANVAS_ANIMATION_EVENT);
          this.canvasService.snapToBoard(boards as IBoardProperties[], animate, zoom);
        })
      ),
    { dispatch: false }
  );

  handlePan$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType<actions.CanvasPan>(actions.CANVAS_PAN),
        tap(({ event }: actions.CanvasPan) => this.canvasService.panTo(event as KeyboardEvent))
      ),
    { dispatch: false }
  );

  handleZoom$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(actions.CANVAS_ZOOM_IN, actions.CANVAS_ZOOM_OUT),
        tap(({ type }) => {
          const zoomIn = type === actions.CANVAS_ZOOM_IN;
          this.canvasService.zoomInOut(zoomIn);
        })
      ),
    { dispatch: false }
  );

  resetZoom$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(actions.CANVAS_ZOOM_RESET),
        tap(() => this.canvasService.resetZoom())
      ),
    { dispatch: false }
  );

  /** Used to save state when entering symbol isolation */

  saveState$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(actions.CANVAS_SAVE_STATE),
        tap(() => this.canvasService.saveState())
      ),
    { dispatch: false }
  );

  /** Used to restore state when exiting symbol isolation */

  restoreState$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(actions.CANVAS_RESTORE_STATE),
        tap(() => this.canvasService.restoreSavedState())
      ),
    { dispatch: false }
  );
}
