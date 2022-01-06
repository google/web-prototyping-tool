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

export enum EmbedBadgePosition {
  TopRight = 'tr',
  BottomRight = 'br',
  BottomLeft = 'bl',
  TopLeft = 'tl',
}

export enum ZoomAmount {
  FitToBounds = 'fit-to-bounds',
  ScaleToFit = 'scale-to-fit',
  Half = '50',
  Default = '100',
  Double = '200',
}

export enum DeviceMenuSizes {
  FitToBoard = 'fit-to-board',
  FitToScreen = 'fit-to-screen',
}

export enum AccessibilityMode {
  Default,
  Grayscale,
  Protanopiam,
  Deuteranomaly,
}

/**
 * Values must start at 2 since the preview
 * page filters out 0 (false), and normalizes true to 1
 */
export enum PreviewAnalyticsParam {
  EmbedClickThrough = 2,
  EmailAlert,
}

export interface IPreviewParams {
  id: string;
  comments?: boolean;
  device?: string;
  embedMode?: boolean;
  fullscreen?: boolean;
  disableHotspots?: boolean;
  showLeftPanel?: boolean;
  rotate?: boolean;
  accessibility?: boolean;
  accessibilityMode?: AccessibilityMode;
  zoom?: ZoomAmount;
  showBadge?: EmbedBadgePosition | boolean;
  elementId?: string;
  landmarks?: boolean;
  headings?: boolean;
  flow?: boolean;
  analyticsEvent?: PreviewAnalyticsParam;
}
