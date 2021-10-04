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

import { AssetsEffects } from './assets.effect';
import { BoardEffects } from './board.effect';
import { CanvasEffects } from './canvas.effect';
import { ClipboardEffects } from './clipboard.effect';
import { CodeComponentEffects } from './code-component.effect';
import { CommentThreadsEffects } from './comment-threads.effect';
import { CustomComponentEffect } from './custom-component.effects';
import { DatasetEffects } from './datasets.effect';
import { DesignSystemEffects } from './design-system.effect';
import { ElementPropertiesEffects } from './element-properties.effect';
import { HistoryEffects } from './history.effect';
import { ImagesEffects } from './images.effect';
import { InteractionEffect } from './interaction.effect';
import { LayersTreeEffects } from './layers-tree.effect';
import { LayoutEffects } from './layout.effect';
import { PanelsEffect } from './panels.effect';
import { ProjectContentEffects } from './project-content.effect';
import { ProjectDataEffects } from './project-data.effect';
import { PublishEffect } from './publish.effect';
import { RendererEffects } from './renderer.effect';
import { SelectionEffects } from './selection.effect';
import { SymbolsEffect } from './symbols.effect';

export const effects: any[] = [
  AssetsEffects,
  BoardEffects,
  CanvasEffects,
  ClipboardEffects,
  CodeComponentEffects,
  CommentThreadsEffects,
  DatasetEffects,
  DesignSystemEffects,
  CustomComponentEffect,
  ElementPropertiesEffects,
  HistoryEffects,
  ImagesEffects,
  InteractionEffect,
  LayersTreeEffects,
  PanelsEffect,
  LayoutEffects,
  ProjectContentEffects,
  ProjectDataEffects,
  PublishEffect,
  RendererEffects,
  SelectionEffects,
  SymbolsEffect,
];

export * from './assets.effect';
export * from './board.effect';
export * from './clipboard.effect';
export * from './code-component.effect';
export * from './comment-threads.effect';
export * from './datasets.effect';
export * from './design-system.effect';
export * from './element-properties.effect';
export * from './history.effect';
export * from './images.effect';
export * from './interaction.effect';
export * from './layers-tree.effect';
export * from './panels.effect';
export * from './project-content.effect';
export * from './project-data.effect';
export * from './publish.effect';
export * from './renderer.effect';
export * from './selection.effect';
export * from './symbols.effect';
