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

import { isDataBoundValue, isElementDataBoundValue } from 'cd-common/utils';
import { DatasetType } from 'cd-interfaces';
import { AnalyticsEventType, AnalyticsEvent, IAnalyticsEventParams } from './index';
import * as data from './data';

/**
 * Compute analytics event if a data-binding was added, modified or removed.
 *
 * Also, include an event param for whether the data-binding was an
 * element or dataset data-binding
 */
export const analyticsEventForDataBinding = (
  prevValue?: any,
  newValue?: any
): [AnalyticsEventType | undefined, IAnalyticsEventParams | undefined] => {
  const { DataBindingAdded, DataBindingModified, DataBindingRemoved } = AnalyticsEvent;

  // Check if the previous and new values are data-bound and what type of data-binding they are
  const prevIsDataBound = isDataBoundValue(prevValue);
  const newIsDataBound = isDataBoundValue(newValue);
  const prevIsElemDataBinding = prevIsDataBound && isElementDataBoundValue(prevValue);
  const newIsElemDataBinding = newIsDataBound && isElementDataBoundValue(newValue);
  const prevType = prevIsElemDataBinding ? data.ELEMENT_DATA_BINDING : data.DATASET_DATA_BINDING;
  const newType = newIsElemDataBinding ? data.ELEMENT_DATA_BINDING : data.DATASET_DATA_BINDING;
  const modType = `${prevType} => ${newType}`;

  if (!prevIsDataBound && newIsDataBound) return [DataBindingAdded, { name: newType }];
  if (prevIsDataBound && newIsDataBound) return [DataBindingModified, { name: modType }];
  if (prevIsDataBound && !newIsDataBound) return [DataBindingRemoved, { name: prevType }];

  // In this case, neither previous nor new values were data-bound, so there is nothing to log
  return [undefined, undefined];
};

export const getDatasetAnalyticsName = (datasetType: DatasetType) => {
  // prettier-ignore
  switch (datasetType) {
    case DatasetType.GenericEndpoint: return data.GENERIC_ENDPOINT_IMPORT;
    case DatasetType.GoogleSheets: return data.GOOGLE_SHEETS_IMPORT;
    default: return data.DIRECT_INPUT;
  }
};
