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

import { IProjectQueryResult } from '../../../../database/query.service';

export const getLastQueryResultContainingKeywords = (
  results: IProjectQueryResult[] = []
): IProjectQueryResult | undefined => {
  for (let i = results.length; i--; i > 0) {
    if (!!results[i].data.keywords) return results[i];
  }
  return;
};
