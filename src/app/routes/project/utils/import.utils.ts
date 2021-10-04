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
import * as consts from 'cd-common/consts';
import { AnalyticsEvent, AnalyticsEventType } from 'cd-common/analytics';

export const generateImportMessage = (publishEntries: cd.IPublishEntry[]): string => {
  const { length } = publishEntries;
  if (length === 0) return '';

  // determine "Importing ComponentName" vs "Importing 3 components"
  const [first] = publishEntries;
  const suffix = length === 1 ? first.name : `${length} ${consts.SYMBOL_USER_FACING_NAME_LC}s`;
  return `Importing ${suffix}`;
};

export const generateImportSuccessMessage = (publishEntries: cd.IPublishEntry[]): string => {
  return generateImportMessage(publishEntries) + ' succeeded';
};

type ProjectContentModel = cd.IProjectContentDocument | cd.PropertyModel;

const filterContents = <T extends cd.IProjectContentDocument>(
  contents: ReadonlyArray<ProjectContentModel>,
  type: cd.EntityType,
  elementType?: cd.ElementEntitySubType
): T[] => {
  return contents.filter((doc) => {
    const isType = doc.type === type;
    if (type === cd.EntityType.Element && elementType) {
      const isElementType = (doc as cd.PropertyModel).elementType === elementType;
      return isType && isElementType;
    }
    return isType;
  }) as unknown as T[];
};

export const filterSymbols = (
  contents: ReadonlyArray<ProjectContentModel>
): cd.ISymbolProperties[] => {
  return filterContents<cd.ISymbolProperties>(
    contents,
    cd.EntityType.Element,
    cd.ElementEntitySubType.Symbol
  );
};

export const filterBoards = (
  contents: cd.ReadOnlyPropertyModelList | cd.ReadOnlyPropertyModelList
): cd.IBoardProperties[] => {
  return filterContents<cd.IBoardProperties>(
    contents,
    cd.EntityType.Element,
    cd.ElementEntitySubType.Board
  );
};

export const filterAssets = (contents: ReadonlyArray<ProjectContentModel>): cd.IProjectAsset[] => {
  return filterContents<cd.IProjectAsset>(contents, cd.EntityType.Asset);
};

export const filterElements = (
  contents: ReadonlyArray<ProjectContentModel>
): cd.PropertyModel[] => {
  return filterContents<cd.PropertyModel>(contents, cd.EntityType.Element);
};

export const filterCodeComponents = (
  contents: ReadonlyArray<ProjectContentModel>
): cd.ICodeComponentDocument[] => {
  return filterContents<cd.ICodeComponentDocument>(contents, cd.EntityType.CodeComponent);
};

export const filterDatasets = (
  contents: ReadonlyArray<ProjectContentModel>
): cd.ProjectDataset[] => {
  return filterContents<cd.ProjectDataset>(contents, cd.EntityType.Dataset);
};

export const filterSymbolInstances = (
  contents: cd.IProjectContentDocument[]
): cd.ISymbolInstanceProperties[] => {
  return filterContents<cd.ISymbolInstanceProperties>(
    contents,
    cd.EntityType.Element,
    cd.ElementEntitySubType.SymbolInstance
  );
};

export const analyticsEventForType = (type: cd.PublishType): AnalyticsEventType | undefined => {
  if (type === cd.PublishType.Symbol) return AnalyticsEvent.ComponentImport;
  if (type === cd.PublishType.CodeComponent) return AnalyticsEvent.CodeComponentImport;
  return;
};
