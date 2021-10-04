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

export const FirebaseField = {
  CreatedAt: 'createdAt',
  Date: 'date',
  DocumentId: 'id',
  DocumentType: 'type',
  ElementType: 'elementType',
  Keywords: 'keywords',
  LastUpdatedAt: 'updatedAt',
  MaintenanceModeEnabled: 'maintenanceModeEnabled',
  Owner: 'owner',
  OwnerId: 'owner.id',
  Editor: 'editors',
  OwnerEmail: 'owner.email',
  ProjectId: 'projectId',
  ThreadId: 'threadId',
  Payload: 'payload',
  Sets: 'sets',
  Updates: 'updates',
  Deletes: 'deletes',
  SessionId: 'sessionId',
  fromSessionId: 'fromSessionId',
  toSessionId: 'toSessionId',
} as const;

export const FirebaseCollection = {
  Admins: 'admins',
  Comments: 'comments',
  Exceptions: 'exceptions',
  MaintenanceMode: 'maintenance_mode',
  NewsUpdates: 'news_updates',
  ProjectContents: 'project_contents',
  Projects: 'projects',
  PublishEntries: 'publish_entries',
  ScreenshotQueue: 'screenshot_queue',
  StatusMessage: 'status_message',
  UserSettings: 'user_settings',
  ChangeRequests: 'change_requests',
  UserPresence: 'user_presence',
  RtcConnections: 'rtc_connections',
  fromUserIceCandidates: 'fromUserIceCandidates',
  toUserIceCandidates: 'toUserIceCandidates',
} as const;

export type FirebaseCollectionType = typeof FirebaseCollection[keyof typeof FirebaseCollection];

export const FirebaseQueryOperation = {
  Contains: 'array-contains',
  Equals: '==',
  NotEqualTo: '!=',
  GreaterThanOrEqualTo: '>=',
  LessThanOrEqualTo: '<=',
  In: 'in',
} as const;

export const FirebaseOrderBy = {
  Asc: 'asc',
  Desc: 'desc',
} as const;

export const FIRESTORE_BATCH_LIMIT = 500;
export const UNICODE_RANGE_MAX = '\uf8ff';
