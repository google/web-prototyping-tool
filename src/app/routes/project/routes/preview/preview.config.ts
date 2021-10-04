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

export const LEFT_PANEL_GAP_WIDTH = 35;

export const enum PreviewShortcut {
  Comments = 'c',
  Fullscreen = 'f',
}

export const defaultDeviceMenu: cd.IMenuConfig[] = [
  { title: 'Set to Board size', id: cd.DeviceMenuSizes.FitToBoard },
  { title: 'Fill Screen', id: cd.DeviceMenuSizes.FitToScreen, divider: true },
];

export const zoomMenuConfig: cd.IMenuConfig[] = [
  { title: 'Default (100%)', value: '100' },
  { title: 'Scale to Fit', value: cd.ZoomAmount.ScaleToFit, divider: true },
  { title: '25%', value: '25' },
  { title: '50%', value: '50' },
  { title: '125%', value: '125' },
  { title: '150%', value: '150' },
  { title: '200%', value: '200' },
];

export const defaultPreviewConfig: cd.IPreviewParams = {
  id: '',
  comments: false,
  device: cd.DeviceMenuSizes.FitToBoard,
  embedMode: false,
  fullscreen: false,
  showLeftPanel: true,
  rotate: false,
  accessibilityMode: cd.AccessibilityMode.Default,
  zoom: cd.ZoomAmount.Default,
};

export const colorBlindMenu: cd.ISelectItem[] = [
  { title: 'None', value: String(cd.AccessibilityMode.Default), divider: true },
  { title: 'Grayscale', value: String(cd.AccessibilityMode.Grayscale) },
  { title: 'Protanopiam', value: String(cd.AccessibilityMode.Protanopiam) },
  { title: 'Deuteranomaly', value: String(cd.AccessibilityMode.Deuteranomaly) },
];
