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
import { RouterNavigatedAction, ROUTER_NAVIGATION } from '@ngrx/router-store';
import { createEffect, Actions, ofType } from '@ngrx/effects';
import { RendererService } from 'src/app/services/renderer/renderer.service';
import { tap, withLatestFrom, map, filter, distinctUntilChanged } from 'rxjs/operators';
import { ProjectContentService } from 'src/app/database/changes/project-content.service';
import { Injectable } from '@angular/core';
import { lookupElementIds } from 'cd-common/models';
import * as config from 'src/app/configs/routes.config';
import * as actions from '../actions';

/**
 * This is a set of effects to keep the renderer in sync with state changes in the app
 */
@Injectable()
export class RendererEffects {
  constructor(
    private actions$: Actions,
    private _rendererService: RendererService,
    private _projectContentService: ProjectContentService
  ) {}

  /**
   * Sync design system with renderer
   */
  syncDesignSystem$ = createEffect(
    () =>
      this._projectContentService.designSystem$.pipe(
        tap((designSystem) => {
          if (!designSystem) return;
          // TODO: how to update vs set?
          this._rendererService.setDesignSystem(designSystem);
        })
      ),
    { dispatch: false }
  );

  /**
   * Sync element content with renderer
   */
  syncElementProperties$ = createEffect(
    () =>
      this._projectContentService.elementContent$.pipe(
        tap((content) => {
          const {
            idsCreatedInLastChange,
            idsUpdatedInLastChange,
            idsDeletedInLastChange,
            records,
          } = content;
          const createdIds = Array.from(idsCreatedInLastChange);
          const created = lookupElementIds(createdIds, records);
          const updatedIds = Array.from(idsUpdatedInLastChange);
          const updated = lookupElementIds(updatedIds, records);
          const deletedIds = Array.from(idsDeletedInLastChange);
          this._rendererService.applyElementChanges(created, updated, deletedIds);
        })
      ),
    { dispatch: false }
  );

  /**
   * Sync the elementsLoaded flag with the renderer
   */
  syncElementsLoaded$ = createEffect(
    () =>
      this._projectContentService.elementsLoaded$.pipe(
        tap(() => this._rendererService.setPropertiesLoaded(true))
      ),
    { dispatch: false }
  );

  /**
   * Reset renderer when disconnecting project
   */
  reset$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType<actions.DisconnectProject>(actions.DISCONNECT_PROJECT),
        tap(() => this._rendererService.reset())
      ),
    { dispatch: false }
  );

  previewMode$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType<RouterNavigatedAction>(ROUTER_NAVIGATION),
        map((action) => {
          const { url } = action.payload.routerState;
          return url.includes(config.Route.Preview) || url.includes(config.Route.Embed);
        }),
        distinctUntilChanged(),
        tap((previewMode) => this._rendererService.setPreviewMode(previewMode)),
        withLatestFrom(this._projectContentService.projectLoaded$),
        filter(([previewMode, loaded]) => loaded === true && previewMode === false),
        withLatestFrom(this._projectContentService.elementProperties$),
        // This is important to reset element properties when exiting preview
        // since the user may have interacted with the perview which updated its internal state
        tap(([, elementProperties]) => {
          // Recompile must be called to ensure symbols get reset
          const recompile = true;
          this._rendererService.updateElementProperties(elementProperties, recompile);
        })
        // One potential optimization would be to detect if the user performed any
        // actions in preview and ignore this update
      ),
    { dispatch: false }
  );

  setAll$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType<actions.ElementPropertiesSetAll | actions.ElementPropertiesReplaceAll>(
          actions.ELEMENT_PROPS_SET_ALL,
          actions.ELEMENT_PROPS_REPLACE_ALL
        ),
        withLatestFrom(this._projectContentService.elementProperties$),
        map(([, elementProperties]) => {
          // when we get set all action (from health check or syncing on visbility change)
          // send all element properties renderer and recompile everything
          this._rendererService.updateElementProperties(elementProperties, true);
        })
      ),
    { dispatch: false }
  );

  deleteDataset$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType<actions.DatasetDelete>(actions.DATASET_DELETE),
        tap((action) => this._rendererService.removeDatasets([action.dataset.id]))
      ),
    { dispatch: false }
  );
}
