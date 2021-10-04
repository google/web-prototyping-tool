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

import { Injectable } from '@angular/core';
import { createEffect, ofType, Actions } from '@ngrx/effects';
import { AssetsService } from '../../services/assets/assets.service';
import { map, filter } from 'rxjs/operators';
import { InteractionService } from '../../services/interaction/interaction.service';
import * as utils from '../../utils/images.utils';
import * as actions from '../actions/images.action';
import { ElementPropertiesUpdate } from '../actions/element-properties.action';
import * as cd from 'cd-interfaces';

@Injectable()
export class ImagesEffects {
  constructor(
    private _actions$: Actions,
    private _assetsService: AssetsService,
    private _interactionService: InteractionService
  ) {}

  fitToAspectRatio$ = createEffect(() =>
    this._actions$.pipe(
      ofType<actions.ImagesFitToAspectRatio>(actions.IMAGES_FIT_TO_ASPECT_RATIO),
      filter(({ payload }) => !!payload.propertyModels),
      map(({ payload }) => {
        const { propertyModels } = payload;
        const [first] = propertyModels as cd.IImageProperties[];
        return first;
      }),
      filter((propertyModel) => !!propertyModel.inputs.src.id),
      map((propertyModel) => {
        const assetId = propertyModel.inputs.src.id as string;
        const asset = this._assetsService.getAssetForId(assetId);
        const rects = this._interactionService.renderRectsForIds(true, propertyModel.id);
        const imgRect = rects.get(propertyModel.id);
        return utils.calculateFitAspectRatioForAsset(asset, propertyModel, imgRect);
      }),
      filter((update) => !!update),
      map((update) => new ElementPropertiesUpdate(update as cd.IPropertiesUpdatePayload[]))
    )
  );

  resetSize$ = createEffect(() =>
    this._actions$.pipe(
      ofType<actions.ImagesResetSize>(actions.IMAGES_RESET_SIZE),
      filter(({ payload }) => !!payload.propertyModels),
      map(({ payload }) => {
        const { propertyModels } = payload;
        const [first] = propertyModels as cd.IImageProperties[];
        return first;
      }),
      filter((propertyModel) => !!propertyModel.inputs.src.id),
      map((propertyModel) => {
        const assetId = propertyModel.inputs.src.id as string;
        const asset = this._assetsService.getAssetForId(assetId);
        return utils.calculateResetSizeForAsset(asset, propertyModel);
      }),
      filter((update) => !!update),
      map((update) => new ElementPropertiesUpdate(update as cd.IPropertiesUpdatePayload[]))
    )
  );
}
