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

import * as cd from 'cd-interfaces';
import * as assetsActions from '../actions/assets.action';
import * as elementPropertiesActions from '../actions/element-properties.action';
import { AssetsService } from '../../services/assets/assets.service';
import { AssetsUploadService } from '../../services/assets/assets-upload.service';
import { createEffect, Actions, ofType } from '@ngrx/effects';
import { Injectable } from '@angular/core';
import { replaceAsset } from '../../utils/design-system.utils';
import { replaceAssets } from '../../utils/assets.utils';
import { tap, withLatestFrom, map, filter } from 'rxjs/operators';
import { getModelEntries } from 'cd-common/models';
import { DISCONNECT_PROJECT } from '../actions';
import { ProjectContentService } from 'src/app/database/changes/project-content.service';
import { createAssetChangePayload } from 'cd-common/utils';
import { ProjectChangeCoordinator } from 'src/app/database/changes/project-change.coordinator';

/**
 * Effects for Assets are minimal --- State management for asset uploads is
 * done by services. We have an "entry" action (AssetsSelectFiles) to bridge
 * with existing side panel's IActivityConfig mechanism, which dispatches a
 * store action when "Add" button is clicked (see ProjectComponent#onPanelPrimaryAction)
 *
 * Similarly, when loading a project, the remote added action is handled to
 * add previously uploaded assets stored the project contents doccollection.
 */
@Injectable()
export class AssetsEffects {
  constructor(
    private actions$: Actions,
    private _assetsUploadService: AssetsUploadService,
    private _assetsService: AssetsService,
    private _projectContentService: ProjectContentService,
    private _projectChangeCoordinator: ProjectChangeCoordinator
  ) {}

  onSelectFiles$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType<assetsActions.AssetsSelectFiles>(assetsActions.ASSETS_SELECT_FILES),
        tap(() => this._assetsUploadService.selectFilesAndUpload())
      ),
    { dispatch: false }
  );

  onAssetAdded$ = createEffect(
    () =>
      this._projectContentService.assetArray$.pipe(
        map((assets) => {
          // filter out any assets we've already loaded into the asset service
          return assets.filter((d) => !this._assetsService.hasAsset(d));
        }),
        filter((assets) => !!assets.length),
        tap((assets) => this._assetsService.addAssetDocuments(assets))
      ),
    { dispatch: false }
  );

  onDeleted$ = createEffect(() =>
    this.actions$.pipe(
      ofType<assetsActions.AssetsDeleted>(assetsActions.ASSETS_DELETED),
      withLatestFrom(this._projectContentService.elementProperties$),
      map(([{ id }, elementProperties]) => {
        const propEntries = getModelEntries(elementProperties);
        const propertiesUpdates = propEntries.reduce((acc: cd.IPropertiesUpdatePayload[], curr) => {
          const [elementId, value] = curr;
          const [properties, didReplace] = replaceAsset(value, id);
          if (didReplace) {
            const found = { elementId, properties };
            acc.push(found);
          }
          return acc;
        }, []);

        return new elementPropertiesActions.ElementPropertiesUpdate(propertiesUpdates);
      })
    )
  );

  onReplace$ = createEffect(() =>
    this.actions$.pipe(
      ofType<assetsActions.AssetReplace>(assetsActions.ASSETS_REPLACE),
      withLatestFrom(this._projectContentService.elementProperties$),
      map(([{ oldId, replacementId }, elementProperties]) => {
        const propertiesUpdates = replaceAssets(oldId, replacementId, elementProperties);
        return new elementPropertiesActions.ElementPropertiesUpdate(propertiesUpdates);
      })
    )
  );

  onNameChanged$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType<assetsActions.AssetsNameChanged>(assetsActions.ASSETS_NAME_CHANGED),
        tap(({ id, name }) => {
          const update: cd.IUpdateChange<cd.IProjectAsset> = { id, update: { name } };
          const payload = createAssetChangePayload(undefined, [update]);
          this._projectChangeCoordinator.dispatchChangeRequest([payload]);
        })
      ),
    { dispatch: false }
  );

  onCreate$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType<assetsActions.AssetsCreateDocuments>(assetsActions.ASSETS_CREATE_DOCS),
        tap(({ payload }) => {
          const changePayload = createAssetChangePayload(payload);
          return this._projectChangeCoordinator.dispatchChangeRequest([changePayload]);
        })
      ),
    { dispatch: false }
  );

  onDisconnect$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(DISCONNECT_PROJECT),
        tap(() => {
          this._assetsService.onDisconnectProject();
        })
      ),
    { dispatch: false }
  );
}
