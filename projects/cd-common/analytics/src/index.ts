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

import { InjectionToken } from '@angular/core';

export const AnalyticsEvent = {
  A11yAttrAdded: 'A11y attribute added',
  A11yAttrInspected: 'A11y preview attribute inspected',
  A11yColorsChanged: 'A11y color mode changed',
  A11yFlowGreenlinesViewed: 'A11y flow greenlines viewed',
  A11yHeadingGreenlinesViewed: 'A11y heading greenlines viewed',
  A11yLandmarkGreenlinesViewed: 'A11y landmark greenlines viewed',
  A11yNotesModified: 'A11y notes modified',
  A11yPreviewPanelOpen: 'A11y preview panel opened',
  ActionCreate: 'Action created',
  AssetsGallerySelection: 'Asset added from Asset Gallery',
  CodeComponentBundleDownloaded: 'Code component bundle downloaded',
  CodeComponentBundleUpdated: 'Code component bundle updated',
  CodeComponentCreated: 'Code component created',
  CodeComponentImport: 'Code component imported from marketplace',
  CodeComponentInputAdded: 'Code component input added',
  CodeComponentInputDeleted: 'Code component input deleted',
  CodeComponentInputUpdated: 'Code component input updated',
  CodeComponentInstanceCreated: 'Code component instance created',
  CodeComponentOutputAdded: 'Code component output added',
  CodeComponentOutputDeleted: 'Code component output deleted',
  CodeComponentOutputUpdated: 'Code component output updated',
  CodeComponentPublish: 'Code component published',
  CodeComponentRemoved: 'Code component removed',
  CodeComponentUpdated: 'Code component updated',
  CommentCreate: 'Comment create',
  CommentDelete: 'Comment delete',
  CommentEdit: 'Comment edit',
  CommentReply: 'Comment reply',
  CommentTag: 'Comment tag user',
  ComponentCreate: 'Component create',
  ComponentDelete: 'Component delete',
  ComponentImport: 'Component import',
  ComponentPublish: 'Component publish',
  ComponentUnpack: 'Component unpack',
  DataBindingAdded: 'Data binding added',
  DataBindingModified: 'Data binding modified',
  DataBindingRemoved: 'Data binding removed',
  DatasetAdded: 'Dataset added',
  DatasetDataModified: 'Dataset data modified',
  DatasetRemoved: 'Dataset removed',
  DatasetRenamed: 'Dataset renamed',
  DatasetSizeLimitExceeded: 'Dataset size limit exceeded',
  DesignSystemUpdate: 'Design system update',
  EmailAlertClickThrough: 'Preview opened from email alert',
  EmbedBadgeClickThrough: 'Preview opened from embed badge',
  EmbedRendered: 'Embed rendered',
  Exception: 'exception',
  IssuesRepaired: 'Issues repaired',
  PreviewOpen: 'Preview open',
  ProjectCreate: 'Project create',
  ProjectCreateFromTemplate: 'Project create from template',
  ProjectDelete: 'Project delete',
  ProjectDuplicateByNonOwner: 'Project duplicate by non-owner',
  ProjectDuplicateByOwner: 'Project duplicate by owner',
  ProjectOpenedByNonOwner: 'Project opened by non-owner',
  ProjectOpenedByOwner: 'Project opened by owner',
  ProjectTemplatePublish: 'Project template published',
  ProjectZipDownload: 'Project zip download',
  PropertiesPanelOpened: 'Properties panel opened',
  ShareDialogEmbedCodeCopied: 'Share dialog copy: Embed code',
  ShareDialogEmbedLinkCopied: 'Share dialog copy: Embed link',
  ShareDialogLinkCopied: 'Share dialog copy: Share link',
  ShareDialogOpenedFromDashboard: 'Share dialog opened: Dashboard',
  ShareDialogOpenedFromPreview: 'Share dialog opened: Preview page',
  ShareDialogOpenedFromProject: 'Share dialog opened: Project page',
  StarredProject: 'Starred project',
  LayoutPreset: 'Layout preset',
} as const;

/**
 * Used to enforce properties of an optional eventParams arguement
 * in analytics.service.ts and subsequently firebase.analytics().logEvent()
 * https://firebase.google.com/docs/analytics/events?platform=web
 */

export interface IAnalyticsEventParams {
  /** If your application has specific needs not covered by a suggested event type, you can log your own custom events.
   * e.g analytics.logEvent('goal_completion', { name: 'lever_puzzle'});
   */
  name?: string;
  /** Anytime an event occurs involving multiple items. E.g.: User imports multiple assets
   * from the Asset Gallery. Can be used for tags, component import, etc...
   */
  items?: any[];
  /** Arbitrary message. This can be used for error messages, http response messages, etc... */
  message?: string;
}

export type AnalyticsEventType = typeof AnalyticsEvent[keyof typeof AnalyticsEvent];

export interface IAnalyticsEvent {
  type: AnalyticsEventType;
  params?: IAnalyticsEventParams;
}

export interface IAnalyticsService {
  logEvent: (event: AnalyticsEventType, eventParams?: IAnalyticsEventParams) => void;
  sendError: (description: string) => void;
}

export const ANALYTICS_SERVICE_TOKEN = new InjectionToken<IAnalyticsService>('analytics.service');
