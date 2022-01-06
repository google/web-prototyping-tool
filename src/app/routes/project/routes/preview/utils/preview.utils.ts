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

import { coerceBooleanProperty } from '@angular/cdk/coercion';
import { sizeConfig } from 'src/app/routes/project/configs/root-element.properties.config';
import { CODE_CMP_OUTLET_FRAME_PADDING } from '../../../configs/custom-component.config';
import { clamp, toDecimal } from 'cd-utils/numeric';
import { Params } from '@angular/router';
import * as cd from 'cd-interfaces';

const DEFAULT_ZOOM = 100;
const MAX_ZOOM = 200;
const MIN_ZOOM = 15;
const ZOOM_PARAM_KEY = 'zoom';
const DEVICE_PARAM_KEY = 'device';

export interface IBoardSize {
  width: number;
  height: number;
}

const createFrameSize = (w: number, h: number, rotate = false, addCodeComponentPadding = false) => {
  let width = rotate ? h : w;
  let height = rotate ? w : h;
  width = addCodeComponentPadding ? width + CODE_CMP_OUTLET_FRAME_PADDING * 2 : width;
  height = addCodeComponentPadding ? height + CODE_CMP_OUTLET_FRAME_PADDING * 2 : height;
  return { width, height };
};

export const paramToOutletFrameSize = (
  outlet: cd.RootElement | cd.ICodeComponentDocument | undefined,
  params: cd.IPreviewParams,
  viewingComponent: boolean
): IBoardSize | undefined => {
  if (!outlet) return;
  const { device, rotate } = params;
  const { frame, type } = outlet;
  const isCodeComponent = type === cd.EntityType.CodeComponent;

  if (viewingComponent) {
    return createFrameSize(frame.width, frame.height, rotate, isCodeComponent);
  }

  const config = sizeConfig.find((item) => item.id === device);
  const width = config ? config.width : frame.width;
  const height = config ? config.height : frame.height;
  return createFrameSize(width, height, rotate);
};

export const paramsToPreviewParams = (
  params: Params,
  viewingComponent: boolean
): cd.IPreviewParams => {
  const comments = coerceBooleanProperty(params.comments);
  const embedMode = coerceBooleanProperty(params.embedMode);
  const accessibility = coerceBooleanProperty(params.accessibility);
  const includesBadge = Object.values(cd.EmbedBadgePosition).includes(params.showBadge);
  const showBadge = includesBadge ? params.showBadge : coerceBooleanProperty(params.showBadge);
  const fullscreen = viewingComponent ? false : coerceBooleanProperty(params.fullscreen);
  const disableHotspots = params.disableHotspots || '';
  const showLeftPanel = coerceBooleanProperty(params.showLeftPanel);
  const rotate = viewingComponent ? false : coerceBooleanProperty(params.rotate);
  const id = params.id || '';
  const elementId = params.elementId || '';
  const zoom = params.zoom || cd.ZoomAmount.Default;
  const accessibilityMode = Number(params.accessibilityMode) || cd.AccessibilityMode.Default;
  const device = viewingComponent
    ? cd.DeviceMenuSizes.FitToBoard
    : params.device || cd.DeviceMenuSizes.FitToBoard;
  const landmarks = coerceBooleanProperty(params.landmarks);
  const headings = coerceBooleanProperty(params.headings);
  const flow = coerceBooleanProperty(params.flow);
  /**
   * Setting this to null removes it from the url.
   * This prevents the event from getting logged on refresh.
   */
  const analyticsEvent = null;

  return cleanupParams({
    comments,
    embedMode,
    disableHotspots,
    fullscreen,
    showLeftPanel,
    rotate,
    id,
    zoom,
    device,
    accessibility,
    accessibilityMode,
    showBadge,
    elementId,
    landmarks,
    headings,
    flow,
    analyticsEvent,
  });
};

/** Filters out value=false and converts true to 1 */
export const cleanupParams = (params: cd.IPreviewParams | Params): cd.IPreviewParams => {
  return Object.entries(params).reduce<cd.IPreviewParams>((acc: any, curr) => {
    const [key, value] = curr;
    const defaultDevice = key === DEVICE_PARAM_KEY && value === cd.DeviceMenuSizes.FitToBoard;
    const defaultZoom = key === ZOOM_PARAM_KEY && value === cd.ZoomAmount.Default;
    // Remove false and default values
    if (!value || defaultDevice || defaultZoom) {
      acc[key] = null;
      return acc;
    }

    acc[key] = value === true ? Number(value) : value;
    return acc;
  }, {} as cd.IPreviewParams);
};

export const scaleFromZoomAmount = (zoom: string | undefined): number => {
  const zoomNumber = (zoom && Number(zoom)) || DEFAULT_ZOOM;
  const scale = clamp(zoomNumber, MIN_ZOOM, MAX_ZOOM);
  return toDecimal(scale);
};

export const buildA11yModeState = (update: cd.IPreviewParams): cd.IA11yModeState => {
  const panel = Boolean(update.accessibility);
  const flow = Boolean(update.flow);
  const landmarks = Boolean(update.landmarks);
  const headings = Boolean(update.headings);
  return { panel, flow, landmarks, headings };
};
