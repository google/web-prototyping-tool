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

import { IActionBehaviorGenericOverlay, OverlaySize } from 'cd-interfaces';

/** Determine overlay size value and handle legacy version, this is used in the editor action-card.component and in the renderer*/
export const overlaySizeFromAction = (action: IActionBehaviorGenericOverlay): OverlaySize => {
  const { size, width, height } = action;
  if (size) return size;
  // Legacy support
  if (width || height) return OverlaySize.Custom;
  return OverlaySize.Board;
};
