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

import type * as cd from 'cd-interfaces';

export const KUBERNETES_CLUSTERS_DATASET: cd.IBuiltInDataset = {
  id: 'kubernetes-clusters-dataset',
  name: 'Kubernetes clusters',
  url: 'assets/datasets/kubernetes-clusters.json',
  dataKeys: ['name', 'location', 'clusterSize', 'totalCores', 'totalMemory'],
};
