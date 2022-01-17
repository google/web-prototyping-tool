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

import { Page } from 'puppeteer';
import * as cd from 'cd-interfaces';
import { IProjectDataState } from '../../../src/app/routes/project/store/reducers/project-data.reducer';
import { getModels } from 'cd-common/models';

export const getProjectData = (page: Page): Promise<IProjectDataState> =>
  page.evaluate(() => (window as any).app.appState.project.projectData);

export const getElementPropertiesData = (page: Page): Promise<cd.ElementPropertiesMap> =>
  page.evaluate(() => (window as any).app.appState.project.elementProperties.elementProperties);

export const getDataForId = async (id: string, page: Page): Promise<cd.IComponentInstance> => {
  const data = await getElementPropertiesData(page);
  return Object.values(data).find(
    (item) => (item as cd.IComponentInstance).id === id
  ) as cd.IComponentInstance;
};

export const getDataForBoardAtIndex = async (
  index: number,
  page: Page
): Promise<cd.IRootElementProperties | undefined> => {
  const { project } = await getProjectData(page);
  if (!project) return;
  const { boardIds } = project;
  const boardId = boardIds[index];
  const elementProperties = await getElementPropertiesData(page);

  return Object.values(elementProperties).find(
    (item) => (item as cd.IRootElementProperties).id === boardId
  ) as cd.IRootElementProperties;
};

export const getDataForElementName = async (
  name: string,
  page: Page,
  elementType?: cd.ElementEntitySubType
): Promise<cd.IComponentInstance> => {
  const data = await getElementPropertiesData(page);
  return getModels(data).find((item) => {
    return elementType
      ? item.name === name && item.elementType === elementType
      : item.name === name;
  }) as cd.IComponentInstance;
};
