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

import * as paths from './path.utils';
import * as consts from 'cd-common/consts';
import * as cd from 'cd-interfaces';

const ID = 'test';

describe('Path utils', () => {
  it('creates correct project path', () => {
    expect(paths.projectPathForId(ID)).toBe(`${consts.FirebaseCollection.Projects}/${ID}`);
  });

  it('creates correct project content path', () => {
    expect(paths.projectContentsPathForId(ID)).toBe(
      `${consts.FirebaseCollection.ProjectContents}/${ID}`
    );
  });

  it('creates correct comment path', () => {
    expect(paths.commentPathForId(ID)).toBe(`${consts.FirebaseCollection.Comments}/${ID}`);
  });

  it('creates correct settings path', () => {
    expect(paths.settingsPathForId(ID)).toBe(`${consts.FirebaseCollection.UserSettings}/${ID}`);
  });

  it('creates correct news update path', () => {
    expect(paths.newsUpdatesPathForId(ID)).toBe(`${consts.FirebaseCollection.NewsUpdates}/${ID}`);
  });

  it('creates correct status message path', () => {
    expect(paths.statusMessagePathForId(ID)).toBe(
      `${consts.FirebaseCollection.StatusMessage}/${ID}`
    );
  });

  it('creates correct publish entry path', () => {
    expect(paths.publishEntryPathForId(ID)).toBe(
      `${consts.FirebaseCollection.PublishEntries}/${ID}`
    );
  });

  it('creates correct admins path', () => {
    expect(paths.adminsPathForId(ID)).toBe(`${consts.FirebaseCollection.Admins}/${ID}`);
  });

  it('creates correct exceptions path', () => {
    expect(paths.exceptionsPathForId(ID)).toBe(`${consts.FirebaseCollection.Exceptions}/${ID}`);
  });

  it('creates correct maintenance mode path', () => {
    expect(paths.maintenanceModePathForId(ID)).toBe(
      `${consts.FirebaseCollection.MaintenanceMode}/${ID}`
    );
  });

  it('creates correct screenshot path', () => {
    expect(paths.screenshotTaskPathForId(ID)).toBe(
      `${consts.FirebaseCollection.ScreenshotQueue}/${ID}`
    );
  });

  it('creates correct path for entity type', () => {
    const pathMap = [
      [`${consts.FirebaseCollection.Projects}/${ID}`, cd.EntityType.Project],
      [`${consts.FirebaseCollection.Comments}/${ID}`, cd.EntityType.CommentThread],
      [`${consts.FirebaseCollection.Comments}/${ID}`, cd.EntityType.Comment],
      [`${consts.FirebaseCollection.ProjectContents}/${ID}`, cd.EntityType.Element],
      [`${consts.FirebaseCollection.ProjectContents}/${ID}`, cd.EntityType.Asset],
      [`${consts.FirebaseCollection.ProjectContents}/${ID}`, cd.EntityType.Dataset],
    ];
    for (const entry of pathMap) {
      expect(paths.pathForEntityType(ID, entry[1] as cd.EntityType)).toBe(entry[0]);
    }
  });
});
