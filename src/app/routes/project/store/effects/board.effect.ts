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

import { AppGoToPreview } from 'src/app/store/actions/router.action';
import { calculateScrollFrameFromOutletFrame } from '../../components/glass-layer/glass.utils';
import { CanvasService } from '../../services/canvas/canvas.service';
import { CanvasSnapToBoard } from '../actions/canvas.action';
import { createEffect, ofType, Actions } from '@ngrx/effects';
import { getSymbolMode, getSelectionState } from '../selectors';
import { Injectable } from '@angular/core';
import { EMPTY } from 'rxjs';
import { InteractionService } from '../../services/interaction/interaction.service';
import { IProjectState } from '../reducers/index';
import { movePoint } from '../../utils/store.utils';
import { NO_CANVAS_ANIMATION_EVENT } from './canvas.effect';
import { ProjectDataUpdate } from '../actions/project-data.action';
import { RendererService } from 'src/app/services/renderer/renderer.service';
import { SelectionSet } from '../actions/selection.action';
import { Store, select, Action } from '@ngrx/store';
import { switchMap, withLatestFrom, map, filter } from 'rxjs/operators';
import { createId } from 'cd-utils/guid';
import * as actions from '../actions/board.action';
import * as cd from 'cd-interfaces';
import * as eActions from '../actions/element-properties.action';
import * as boardUtils from '../../utils/board.utils';
import { ProjectContentService } from 'src/app/database/changes/project-content.service';
import { createElementChangePayload } from 'cd-common/utils';

@Injectable()
export class BoardEffects {
  constructor(
    private actions$: Actions,
    private _canvasService: CanvasService,
    private _renderService: RendererService,
    private _interactionService: InteractionService,
    private _projectStore: Store<IProjectState>,
    private _projectContentService: ProjectContentService
  ) {}

  previewBoard$ = createEffect(() =>
    this.actions$.pipe(
      ofType<actions.BoardPreview>(actions.BOARD_PREVIEW),
      map(({ payload: { propertyModels } }) => {
        const elements = propertyModels || ([] as cd.PropertyModel[]);
        const lastElement = elements[elements.length - 1];
        return new AppGoToPreview(lastElement?.rootId);
      })
    )
  );

  setHomeBoard$ = createEffect(() =>
    this.actions$.pipe(
      ofType<actions.BoardSetHome>(actions.BOARD_SET_HOME),
      map(({ payload: { propertyModels } }) => {
        const elements = propertyModels || ([] as cd.PropertyModel[]);
        const lastElement = elements[elements.length - 1];
        return new ProjectDataUpdate({ homeBoardId: lastElement.rootId });
      })
    )
  );

  fitContent$ = createEffect(() =>
    this.actions$.pipe(
      ofType<actions.BoardFitContent>(actions.BOARD_FIT_CONTENT),
      withLatestFrom(this._projectContentService.elementProperties$),
      map(([action, elementProperties]) => {
        const updates: cd.IPropertiesUpdatePayload[] = [];
        const renderRects = this._renderService.renderResultsByBoard$.getValue();

        const { ids } = action;
        for (const elementId of ids) {
          const props = elementProperties[elementId];
          if (!props) continue;
          const scrollFrame = calculateScrollFrameFromOutletFrame(props, renderRects);
          const scrollFrameSize = scrollFrame.width + scrollFrame.height;
          if (scrollFrameSize && props) {
            const { width, height } = boardUtils.calculateBoardFit(scrollFrame, props);
            const { width: frameWidth, height: frameHeight } = props.frame;
            const canWidthAdjust = scrollFrame.width !== frameWidth;
            const canHeightAdjust = scrollFrame.height !== frameHeight;

            if (canWidthAdjust || canHeightAdjust) {
              const frame = {
                ...props.frame,
                width: Math.round(width),
                height: Math.round(height),
              };
              const properties: Partial<cd.IBoardProperties> = { frame };
              updates.push({ elementId, properties });
              // Fixes Glass layer update b/137208621
              this._interactionService.updateElementRect(elementId, frame);
            }
          }
        }

        return new eActions.ElementPropertiesUpdate(updates);
      })
    )
  );

  createBoardViaMarquee$ = createEffect(() =>
    this.actions$.pipe(
      ofType<actions.BoardCreateViaMarquee>(actions.BOARD_CREATE_VIA_MARQUEE),
      withLatestFrom(this._projectStore.pipe(select(getSymbolMode))),
      filter(([, symbolMode]) => symbolMode === false),
      withLatestFrom(this._projectContentService.project$),
      filter(([, proj]) => proj !== undefined),
      withLatestFrom(this._projectContentService.boardsArray$),
      switchMap(([[[action], project], boardsArray]) => {
        const projectId = project?.id;
        if (!projectId) return EMPTY;
        const boardId = createId();
        const board = boardUtils.generateEmptyBoardFromFrame(
          action.rect,
          boardId,
          projectId,
          boardsArray
        );

        return [
          new eActions.ElementPropertiesCreate([board], true),
          new SelectionSet(new Set([board.id]), true),
        ];
      })
    )
  );

  /**
   * Create Property Model for Board
   */
  createBoard$ = createEffect(() =>
    this.actions$.pipe(
      ofType<actions.BoardCreate>(actions.BOARD_CREATE),
      withLatestFrom(this._projectStore.pipe(select(getSymbolMode))),
      filter(([, symbolMode]) => symbolMode === false),
      withLatestFrom(this._projectContentService.project$),
      filter(([, proj]) => proj !== undefined),
      withLatestFrom(this._projectContentService.boardsArray$),
      withLatestFrom(this._projectContentService.elementProperties$),
      withLatestFrom(this._projectStore.pipe(select(getSelectionState))),
      switchMap(([[[[[action], project], boardsArray], elementProperties], selectionState]) => {
        const projectId = project?.id;
        if (!projectId) return EMPTY;
        const canvas = this._canvasService.canvas;
        const [boards, boardChanges] = boardUtils.generateBoards(
          action,
          boardsArray,
          elementProperties,
          projectId,
          canvas,
          selectionState
        );

        // When the canvas is empty, don't animate
        const evt = boardsArray.length ? undefined : new Event(NO_CANVAS_ANIMATION_EVENT);
        const shouldSnapToBoards = boardUtils.shouldSnapToBoardsOnCreate(boards, canvas);
        const snapToBoardAction = shouldSnapToBoards
          ? [new CanvasSnapToBoard(null, { propertyModels: boards, zoom: canvas.position.z }, evt)]
          : [];

        const { symbolModels, isResultingElemActionUndoable: undoable } = action;
        const symbolChanges = symbolModels ? createElementChangePayload(symbolModels) : null;
        const payload = symbolChanges ? [...boardChanges, symbolChanges] : boardChanges;
        const changeAction = new eActions.ElementPropertiesChangeRequest(payload, undoable);
        const resultingActions: Action[] = [changeAction, ...snapToBoardAction];

        // Menu events don't specify selectOnCreate boolean so we should infer true for undefined
        const selectBoard = action.selectOnCreate === undefined || action.selectOnCreate === true;
        const boardIds = boards.map((item) => item.id);
        if (selectBoard) resultingActions.push(new SelectionSet(new Set(boardIds), true));

        return resultingActions;
      })
    )
  );

  moveBoard$ = createEffect(() =>
    this.actions$.pipe(
      ofType<actions.BoardMove>(actions.BOARD_MOVE),
      map(({ payload: { propertyModels }, event }) => {
        const boards = propertyModels || ([] as cd.IBoardProperties[]);
        const { key, shiftKey } = event as KeyboardEvent;
        const updates = boards.reduce<cd.IPropertiesUpdatePayload[]>((acc, board) => {
          const { id: elementId, frame: oldFrame } = board;
          const changes = movePoint(key, shiftKey, oldFrame.x, oldFrame.y);
          const frame = { ...oldFrame, ...changes };
          const properties: Partial<cd.IBoardProperties> = { frame };
          acc.push({ elementId, properties });
          return acc;
        }, []);

        return new eActions.ElementPropertiesUpdate(updates);
      })
    )
  );
}
