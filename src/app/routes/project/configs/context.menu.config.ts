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

import * as config from './project.config';
import { IConfig } from 'cd-interfaces';
import { IActivityConfig } from '../interfaces/activity.interface';
import { IPropertyModeConfig } from '../interfaces/properties.interface';
import { environment } from 'src/environments/environment';

/**
 * Compose default states for context menus
 */

export const EditConfigGroupBase: IConfig[] = [
  config.EditConfig.Cut,
  config.EditConfig.Copy,
  config.EditConfig.Paste,
];

export const InteractionMenuConfig: IConfig[] = [
  {
    ...config.InteractionConfig.AddAction,
    children: [
      {
        title: 'Navigate',
        icon: 'arrow_right_alt',
        children: [
          config.InteractionConfig.NavigateToBoard,
          config.InteractionConfig.NavigateToUrl,
        ],
      },
      {
        title: 'State',
        icon: 'animation',
        children: [config.InteractionConfig.RecordState, config.InteractionConfig.ResetState],
      },
      {
        title: 'Modal',
        icon: 'present_to_all',
        children: [config.InteractionConfig.PresentModal, config.InteractionConfig.ExitModal],
      },
      {
        title: 'Drawer',
        icon: 'side_navigation',
        children: [config.InteractionConfig.OpenDrawer, config.InteractionConfig.CloseDrawer],
      },
      {
        title: 'Custom Overlay',
        icon: 'tooltip',
        children: [config.InteractionConfig.PresentOverlay, config.InteractionConfig.CloseOverlay],
      },
      {
        title: 'Code',
        icon: 'code',
        children: [config.InteractionConfig.PostMessage, config.InteractionConfig.RunJS],
      },
      config.InteractionConfig.Snackbar,
      config.InteractionConfig.ScrollTo,
    ],
  },
];

export const GroupMenuConfig: IConfig[] = [
  config.GroupConfig.VerticalGroup,
  config.GroupConfig.HorizontalGroup,
  config.GroupConfig.GridGroup,
];

export const EditConfigGroup: IConfig[] = [...EditConfigGroupBase, config.EditConfig.Duplicate];

export const ElementGroup: IConfig[] = [
  config.EditConfig.Group,
  config.EditConfig.Ungroup,
  config.EditConfig.GroupInto,
];
export const UndoRedoGroup: IConfig[] = [config.EditConfig.Undo, config.EditConfig.Redo];

export const ActivityTopConfig: IActivityConfig[] = [
  config.PanelConfig.Components,
  config.PanelConfig.Layers,
  config.PanelConfig.Theme,
  config.PanelConfig.Assets,
  config.PanelConfig.Data,
];

export const ActivityBottomConfig: IActivityConfig[] = [
  config.PanelConfig.About,
  config.PanelConfig.Settings,
];

export const PropertyModesConfig: IPropertyModeConfig[] = [
  config.PropertyConfig.Default,
  config.PropertyConfig.Custom,
];

export const defaultConfig: IConfig[] = [
  ...ActivityTopConfig,
  ...ActivityBottomConfig,
  config.ProjectConfig.TogglePanelCollapse,
  config.ProjectConfig.ToggleGlassBreak,
  config.ProjectConfig.ToggleKeyboardShortcutsModal,
  config.ZoomConfig.ZoomOut,
  config.ZoomConfig.ZoomIn,
  config.ZoomConfig.FitToBounds,
];

export const CanvasKeyEvents: IConfig[] = [
  ...defaultConfig,
  config.ProjectConfig.Run,
  config.CanvasConfig.PanLeft,
  config.CanvasConfig.PanRight,
  config.CanvasConfig.PanUp,
  config.CanvasConfig.PanDown,
  config.ZoomConfig.Reset,
  config.EditConfig.Paste,
  config.EditConfig.Undo,
  config.EditConfig.Redo,
];

// TODO: are there any different canvas hotkeys in symbol mode?
export const CanvasSymbolModeKeyEvents: IConfig[] = [...CanvasKeyEvents];

export const BoardKeyEvents: IConfig[] = [
  ...defaultConfig,
  config.BoardConfig.Preview,
  config.BoardConfig.MoveLeft,
  config.BoardConfig.MoveUp,
  config.BoardConfig.MoveDown,
  config.BoardConfig.MoveRight,
  config.BoardConfig.SnapTo,
  config.ZoomConfig.Reset,
  config.EditConfig.Delete,
  config.EditConfig.Cut,
  config.EditConfig.Copy,
  config.EditConfig.Paste,
  config.EditConfig.Duplicate,
  config.EditConfig.Undo,
  config.EditConfig.Redo,
];

export const SymbolKeyEvents: IConfig[] = [
  ...defaultConfig,
  config.BoardConfig.Preview,
  config.BoardConfig.MoveLeft,
  config.BoardConfig.MoveUp,
  config.BoardConfig.MoveDown,
  config.BoardConfig.MoveRight,
  config.BoardConfig.SnapTo,
  config.ZoomConfig.Reset,
  config.EditConfig.Paste,
  config.EditConfig.Undo,
  config.EditConfig.Redo,
];

const elementMoveEvents: IConfig[] = [
  config.ElementMoveConfig.Move,
  config.ElementMoveConfig.OrderChange,
  config.ElementMoveConfig.SelectParent,
];

const defaultElementKeyEvents: IConfig[] = [
  ...defaultConfig,
  ...elementMoveEvents,
  config.ZoomConfig.Reset,
  config.EditConfig.Delete,
  config.EditConfig.Cut,
  config.EditConfig.Copy,
  config.EditConfig.Paste,
  config.EditConfig.Duplicate,
  config.EditConfig.Group,
  config.EditConfig.Ungroup,
  config.EditConfig.Undo,
  config.EditConfig.Redo,
];

export const ElementKeyEvents: IConfig[] = [
  ...defaultElementKeyEvents,
  config.BoardConfig.Preview,
  config.BoardConfig.SnapTo,
  config.EditConfig.Visibility,
];

export const ElementSymbolModeKeyEvents: IConfig[] = [
  ...defaultElementKeyEvents,
  config.SymbolConfig.Preview,
  config.SymbolConfig.SnapTo,
];

export const ComponentInstanceKeyEvents: IConfig[] = [...ElementKeyEvents];

export const CodeComponentEditorKeyEvents: IConfig[] = [
  config.EditConfig.Undo,
  config.EditConfig.Redo,
];

const layoutBuilder = environment.production ? [] : [config.layoutConfig.ConvertToLayout];
export const CopySourceCode: IConfig[] = [
  {
    icon: 'code',
    title: 'Export Code...',
    children: [
      config.EditConfig.CopyHtml,
      config.EditConfig.CopyCss,
      config.EditConfig.CopyJSON,
      ...layoutBuilder,
    ],
  },
];

export const ElementMenu: IConfig[][] = [
  [config.BoardConfig.Preview],
  EditConfigGroup,
  [config.EditConfig.CreateSymbol],
  InteractionMenuConfig,
  ElementGroup,
  UndoRedoGroup,
  CopySourceCode,
  [config.EditConfig.Visibility],
  [config.EditConfig.Delete],
];

export const BoardMenu: IConfig[][] = [
  [config.BoardConfig.Preview, config.BoardConfig.AssignHome],
  EditConfigGroup,
  InteractionMenuConfig,
  UndoRedoGroup,
  CopySourceCode,
  [config.ZoomConfig.ZoomIn, config.ZoomConfig.ZoomOut],
  [config.BoardConfig.SnapTo],
  [config.EditConfig.Delete],
];

export const CanvasMenu: IConfig[][] = [
  [config.ProjectConfig.Run, config.BoardConfig.Add],
  EditConfigGroup,
  UndoRedoGroup,
  [config.ZoomConfig.ZoomIn, config.ZoomConfig.ZoomOut],
  [config.ZoomConfig.FitToBounds],
  [config.ProjectConfig.ToggleKeyboardShortcutsModal],
];
// Symbols
export const SymbolInstanceGroup: IConfig[] = [
  config.EditConfig.EditSymbol,
  config.EditConfig.UnpackSymbolInstance,
];

export const SymbolInstanceMenu: IConfig[][] = [
  [config.BoardConfig.Preview],
  SymbolInstanceGroup,
  EditConfigGroup,
  InteractionMenuConfig,
  ElementGroup,
  UndoRedoGroup,
  CopySourceCode,
  [config.EditConfig.Visibility],
  [config.EditConfig.Delete],
];

// Symbols
export const CodeComponentInstanceGroup: IConfig[] = [config.EditConfig.EditCodeComponent];

export const CodeComponentInstanceMenu: IConfig[][] = [
  [config.BoardConfig.Preview],
  CodeComponentInstanceGroup,
  EditConfigGroup,
  InteractionMenuConfig,
  ElementGroup,
  UndoRedoGroup,
  CopySourceCode,
  [config.EditConfig.Visibility],
  [config.EditConfig.Delete],
];

// Canvas menu inside isolation mode
export const CanvasSymbolIsolationModeMenu: IConfig[][] = [
  [config.ProjectConfig.Run],
  EditConfigGroup,
  UndoRedoGroup,
  [config.ZoomConfig.ZoomIn, config.ZoomConfig.ZoomOut],
  [config.ZoomConfig.FitToBounds],
  [config.ProjectConfig.ToggleKeyboardShortcutsModal],
];

export const BoardSymbolIsolationModeMenu: IConfig[][] = [
  [config.SymbolConfig.Preview],
  [config.EditConfig.Paste],
  InteractionMenuConfig,
  UndoRedoGroup,
  CopySourceCode,
  [config.ZoomConfig.ZoomIn, config.ZoomConfig.ZoomOut],
  [config.SymbolConfig.SnapTo],
];

export const ElementSymbolIsolationModeMenu: IConfig[][] = [
  [config.SymbolConfig.Preview],
  EditConfigGroup,
  [config.EditConfig.CreateSymbol],
  InteractionMenuConfig,
  ElementGroup,
  UndoRedoGroup,
  CopySourceCode,
  [config.EditConfig.Visibility],
  [config.EditConfig.Delete],
];
