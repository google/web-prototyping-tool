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

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdCommonModule } from 'cd-common';
import { CanvasComponent } from './components/canvas/canvas.component';
import { SettingsPanelComponent } from './components/panels/settings-panel/settings-panel.component';
import { TopBarComponent } from './components/top-bar/top-bar.component';
import { ProjectComponent } from './project.component';
import { GlassModule } from './components/glass-layer/glass.module';
import { ProjectRoutingModule } from './project-routing.module';
import { OutletFrameModule } from './components/outlet-frame/outlet-frame.module';
import { reducers, metaReducers, effects } from './store';
import { Route } from 'src/app/configs/routes.config';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { CdCommonPipeModule } from 'cd-common/pipes';
import { DebugStatsComponent } from './components/debug-stats/debug-stats.component';
import { LayersModule } from './components/panels/layers-panel/layers.module';
import { PropsModule } from './components/properties/props.module';
import { BannersModule } from './components/banners/banners.module';
import { ThemeModule } from './components/panels/theme-panel/theme.module';
import { ComponentImportPickerComponent } from './components/component-import-picker/component-import-picker.component';
import { ActivityBarModule } from './components/activity-bar/activity-bar.module';
import { ComponentsPanelModule } from './components/panels/components-panel/components-panel.module';
import { AssetsPanelModule } from './components/panels/assets-panel/assets-panel.module';
import { ActivityPanelHeaderModule } from './components/panel-header/activity-panel-header.module';
import { KeyboardShortcutsComponent } from './components/keyboard-shortcuts/keyboard-shortcuts.component';
import { PublishEntryTileModule } from './components/publish-entry-tile/publish-entry-tile.module';
import { AboutPanelComponent } from './components/panels/about-panel/about-panel.component';
import { RecordModule } from './components/recordings/recordings.module';
import { AssetsImporterModule } from './components/assets-importer/assets-importer.module';
import { PublishPanelModule } from './components/publish-panel/publish-panel.module';
import { OwnerDetailsModule } from './components/owner-details/owner-details.module';
import { DndDirectorModule } from './dnd-director/dnd-director.module';
import { DataPanelModule } from './components/panels/data-panel/data.module';
import { PublishDetailsModule } from './components/publish-details/publish-details.module';
import { LayoutPickerModule } from './components/layout-picker/layout-picker.module';
import { PresenceIndicatorsModule } from './components/presence-indicators/presence-indicators.module';
import { PipesModule } from './pipes/pipes.module';

@NgModule({
  imports: [
    ProjectRoutingModule,
    StoreModule.forFeature(Route.Project, reducers, { metaReducers }),
    EffectsModule.forFeature(effects),
    OutletFrameModule,
    CommonModule,
    CdCommonModule,
    BannersModule,
    LayersModule,
    DataPanelModule,
    ThemeModule,
    LayoutPickerModule,
    PresenceIndicatorsModule,
    ActivityPanelHeaderModule,
    ComponentsPanelModule,
    ActivityBarModule,
    AssetsPanelModule,
    CdCommonPipeModule,
    PublishDetailsModule,
    DndDirectorModule,
    GlassModule,
    RecordModule,
    OwnerDetailsModule,
    PropsModule,
    PublishPanelModule,
    PublishEntryTileModule,
    AssetsImporterModule,
    PipesModule,
  ],
  declarations: [
    DebugStatsComponent,
    CanvasComponent,
    ProjectComponent,
    SettingsPanelComponent,
    TopBarComponent,
    DebugStatsComponent,
    ComponentImportPickerComponent,
    KeyboardShortcutsComponent,
    AboutPanelComponent,
  ],
})
export class ProjectModule {}
