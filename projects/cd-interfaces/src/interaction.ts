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

import type { IValue } from '.';

/**
 * Notes: Potential Triggers
 * - Scroll
 * - ScrollTop
 * - Board Enter
 * - Board Exit
 * - OnContextMenu
 */

export const EventTrigger = {
  Click: 'click',
  DoubleClick: 'dblclick',
  MouseEnter: 'mouseenter',
  MouseLeave: 'mouseleave',
  MouseDown: 'mousedown',
  MouseUp: 'mouseup',
  Hover: 'hover',
  BoardAppear: 'appear',
} as const;

export type EventTriggerType = typeof EventTrigger[keyof typeof EventTrigger];

export const OutputCondition = {
  None: 'none',
  Equals: '=',
  NotEquals: '!=',
  Includes: '~',
  NotIncludes: '!~',
  /** Numeric only */
  GreaterThan: '>',
  GreaterThanOrEqualTo: '>=',
  LessThan: '<',
  LessThanOrEqualTo: '<=',
} as const;

export type OutputConditionType = typeof OutputCondition[keyof typeof OutputCondition];

export interface IOutputEvent {
  binding: string;
  value: string | number | boolean | undefined;
  condition?: OutputConditionType;
}

export enum ActionNavigationTransition {
  Default,
  FadeIn,
  SlideInFromLeft,
  SlideInFromBottom,
}

export enum ActionDirection {
  Normal = 'normal',
  Reverse = 'reverse',
}

export enum ActionStateType {
  Style = 'style',
  StyleOverride = 'styleOverride',
  Input = 'input',
}

export const ActionEasing = {
  Linear: 'linear',
  Ease: 'ease',
  EaseOut: 'ease-out',
  EaseIn: 'ease-in',
  EaseInOut: 'ease-in-out',
  // Cubic Bezier types
  InOutSine: 'cubic-bezier(0.45, 0.05, 0.55, 0.95)',
  InSine: 'cubic-bezier(0.47, 0, 0.75, 0.72)',
  OutSine: 'cubic-bezier(0.39, 0.58, 0.57, 1)',
  InOutQuadratic: 'cubic-bezier(0.46, 0.03, 0.52, 0.96)',
  InQuadratic: 'cubic-bezier(0.55, 0.09, 0.68, 0.53)',
  OutQuadratic: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  InOutCubic: 'cubic-bezier(0.65, 0.05, 0.36, 1)',
  InCubic: 'cubic-bezier(0.55, 0.06, 0.68, 0.19)',
  OutCubic: 'cubic-bezier(0.22, 0.61, 0.36, 1)',
  FastOutSlowIn: 'cubic-bezier(0.4, 0, 0.2, 1)',
  FastLinearIn: 'cubic-bezier(0.4, 0, 1, 1)',
  LinearOutSlowIn: 'cubic-bezier(0, 0, 0.2, 1)',
  InOutBack: 'cubic-bezier(0.68, -0.55, 0.27, 1.55)',
  InBack: 'cubic-bezier(0.6, -0.28, 0.74, 0.05)',
  OutBack: 'cubic-bezier(0.18, 0.89, 0.32, 1.28)',
} as const;

export type ActionEasingType = typeof ActionEasing[keyof typeof ActionEasing];

export interface IActionAnimation {
  delay?: number;
  duration?: number;
  easing?: ActionEasingType;
  repeat?: number; // | Infinity
  direction?: ActionDirection;
  bezier?: [number, number, number, number];
}

export interface IActionStateChange {
  elementId?: string;
  type: ActionStateType;
  animation?: IActionAnimation;
  key: string;
  value: any;
  /**
   * Setting this property means that a user explcity modified this value after recording to prevent auto-removal
   * Properties are auto-removed by default if they match the state before recording
   */
  persist?: boolean;
  /**
   * Used to identify when recorded actions applied to symbol instances.
   * We need to know the instance (elementId) and a reference to what has changed inside that symbol
   */
  symbolChildId?: string;
}

export interface IActionStateChangePortal extends IActionStateChange {
  /** Portal element id to change */
  elementId: string | undefined;
  type: ActionStateType.Input;
  /** key for binding to portal output */
  key: 'referenceId';
  /** Value equals the board / root ID assigned to this portal*/
  value: string | undefined;
}

export enum ActionType {
  CloseDrawer = 'closeDrawer',
  ExitModal = 'exitModal',
  NavigateToBoard = 'navigateToBoard',
  NavigateToUrl = 'navigateToUrl',
  OpenDrawer = 'drawer',
  PostMessage = 'postMessage',
  PresentModal = 'presentModal',
  PresentOverlay = 'presentOverlay',
  CloseOverlay = 'closeOverlay',
  RecordState = 'recordState',
  ResetState = 'resetState',
  RunJS = 'runjs',
  Snackbar = 'snackbar',
  SwapPortal = 'swapPortal',
  ScrollTo = 'scrollTo',
}

export interface IBaseActionBehavior {
  id?: string;
  /** ChildRef is used to attach actions to elements within a symbol */
  childRef?: string;
  type: ActionType;
  trigger: EventTriggerType;
  outputEvent?: IOutputEvent;
  target?: string;
  delay?: number;
}

export const ActionScrollAlign = {
  Start: 'start',
  Center: 'center',
  End: 'end',
  Nearest: 'nearest',
} as const;

export const ActionScrollMode = {
  Top: 'top',
  Left: 'left',
  Right: 'right',
  Bottom: 'bottom',
  Element: 'element',
} as const;

export type ActionScrollModeType = typeof ActionScrollMode[keyof typeof ActionScrollMode];
export type ActionScrollAlignType = typeof ActionScrollAlign[keyof typeof ActionScrollAlign];

/** https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollIntoView */
export interface IActionBehaviorScrollTo extends IBaseActionBehavior {
  type: ActionType.ScrollTo;
  mode: ActionScrollModeType;
  animate: boolean;
  block: ActionScrollAlignType; // Defaults to start.
  inline: ActionScrollAlignType; //  Defaults to nearest
  /** target = element id */
  target?: string;
}

export interface IActionBehaviorPostMessage extends IBaseActionBehavior {
  type: ActionType.PostMessage;
  /** target = JSON or TEXT */
  target?: string;
}

export interface IActionBehaviorNavigationToBoard extends IBaseActionBehavior {
  type: ActionType.NavigateToBoard;
  transition?: ActionNavigationTransition;
  /** target = board id */
  target?: string;
  /** When inside a portal, when enabled, this option navigates the root instead */
  topLevelNavigation?: boolean;
}

export interface IActionBehaviorNavigationToURL extends IBaseActionBehavior {
  type: ActionType.NavigateToUrl;
  /** target = url */
  target?: string;
  /** window target="_blank" */
  openInTab?: boolean;
}

export interface IActionBehaviorRunJS extends IBaseActionBehavior {
  type: ActionType.RunJS;
  /** target = elementId */
  target?: string;
  value?: string;
}

export interface IActionBehaviorSwapPortal extends IBaseActionBehavior {
  type: ActionType.SwapPortal;
  transition?: ActionNavigationTransition;
  stateChanges?: IActionStateChange[];
}

export enum OverlaySize {
  Board = 'board',
  Content = 'content',
  Custom = 'custom',
}

export interface IActionBehaviorGenericOverlay extends IBaseActionBehavior {
  /** target = board id */
  target?: string;
  /** anchor = board id to attach position to*/
  anchor?: string;
  size?: OverlaySize;
  /** Size of modal undefined will use the board size  */
  width?: number;
  height?: number;
  borderRadius?: number;

  /** Material Elevation => box-shadow */
  shadow?: string;
}

export enum ActionDrawerPosition {
  Top,
  Left,
  Bottom,
  Right,
}

export enum ActionOverlayPosition {
  Top = 'top',
  Left = 'left',
  Center = 'center',
  Bottom = 'bottom',
  Right = 'right',
}

export interface IActionBehaviorPresentOverlay extends IActionBehaviorGenericOverlay {
  type: ActionType.PresentOverlay;
  transition?: ActionNavigationTransition;
  position: ActionOverlayPosition;
  alignment: ActionOverlayPosition;
  closeOnOutsideClick: boolean;
  spacing: number;
}

export interface IActionBehaviorCloseOverlay extends IBaseActionBehavior {
  type: ActionType.CloseOverlay;
}

export interface IActionBehaviorPresentModal extends IActionBehaviorGenericOverlay {
  type: ActionType.PresentModal;
  /** Background color of modal overlay, could be bound to the design system  */
  backgroundColor?: IValue;
}

export interface IActionBehaviorExitModal extends IBaseActionBehavior {
  type: ActionType.ExitModal;
  /** target = optional board id to navigate to */
  target?: string;
}

export enum ActionDrawerMode {
  Overlay,
  Push,
}

export interface IActionBehaviorOpenDrawer extends IBaseActionBehavior {
  type: ActionType.OpenDrawer;
  target?: string;
  size?: number;
  mode: ActionDrawerMode;
  position: ActionDrawerPosition;
  backdropColor?: IValue;
  /** Material Elevation => box-shadow */
  shadow?: string;
}

export interface IActionBehaviorCloseDrawer extends IBaseActionBehavior {
  type: ActionType.CloseDrawer;
}

export const ActionResetMode = {
  All: 'all',
  CurrentBoard: 'board',
  Element: 'element',
} as const;

export type ActionResetModeType = typeof ActionResetMode[keyof typeof ActionResetMode];

export interface IActionBehaviorResetState extends IBaseActionBehavior {
  type: ActionType.ResetState;
  mode: ActionResetModeType;
  /** target = board id */
  target?: string;
  /** if target is selected also reset those */
  targetChildren?: boolean;
}

export const SnackBarVerticalPosition = {
  Top: 'top',
  Bottom: 'bottom',
} as const;

export const SnackBarHorizontalPosition = {
  Left: 'left',
  Center: 'center',
  Right: 'right',
} as const;

type SnackBarVerticalPositionType =
  typeof SnackBarVerticalPosition[keyof typeof SnackBarVerticalPosition];
type SnackBarHorizontalPositionType =
  typeof SnackBarHorizontalPosition[keyof typeof SnackBarHorizontalPosition];

export interface IActionBehaviorSnackbar extends IBaseActionBehavior {
  type: ActionType.Snackbar;
  message?: string;
  actionTitle?: string;
  duration?: number;
  icon?: string;
  showDismissBtn?: boolean;
  verticalPosition?: SnackBarVerticalPositionType;
  horizontalPosition?: SnackBarHorizontalPositionType;
}

export interface IActionBehaviorRecordState extends IBaseActionBehavior {
  type: ActionType.RecordState;
  toggle?: boolean;
  /**  an array of state changes */
  stateChanges?: IActionStateChange[];
}

export type ActionBehavior =
  | IActionBehaviorCloseDrawer
  | IActionBehaviorCloseOverlay
  | IActionBehaviorExitModal
  | IActionBehaviorNavigationToBoard
  | IActionBehaviorNavigationToURL
  | IActionBehaviorOpenDrawer
  | IActionBehaviorPostMessage
  | IActionBehaviorPresentModal
  | IActionBehaviorPresentOverlay
  | IActionBehaviorRecordState
  | IActionBehaviorResetState
  | IActionBehaviorRunJS
  | IActionBehaviorScrollTo
  | IActionBehaviorSnackbar
  | IActionBehaviorSwapPortal;
