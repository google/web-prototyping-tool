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
import { KUBERNETES_CLUSTERS_DATASET } from './kubernetes-clusters';
import { LOG_FILES_DATASET } from './log-files';
import { MICROKITCHENS_DATASET } from './microkitchens';
import { PEOPLE_DATASET } from './people';
import { VM_IMAGES_DATASET } from './vm-images';
import { VM_INSTANCES_DATASET } from './vm-instances';
import { INSTANCE_GROUPS_DATASET } from './instance-groups';
import { INSTANCE_TEMPLATES_DATASET } from './instance-templates';
import { STORAGE_BUCKETS_DATASET } from './storage-buckets';

export const BUILT_IN_DATASET_LOOKUP: cd.IStringMap<cd.IBuiltInDataset> = {
  [VM_INSTANCES_DATASET.id]: VM_INSTANCES_DATASET,
  [INSTANCE_GROUPS_DATASET.id]: INSTANCE_GROUPS_DATASET,
  [INSTANCE_TEMPLATES_DATASET.id]: INSTANCE_TEMPLATES_DATASET,
  [VM_IMAGES_DATASET.id]: VM_IMAGES_DATASET,
  [KUBERNETES_CLUSTERS_DATASET.id]: KUBERNETES_CLUSTERS_DATASET,
  [LOG_FILES_DATASET.id]: LOG_FILES_DATASET,
  [MICROKITCHENS_DATASET.id]: MICROKITCHENS_DATASET,
  [PEOPLE_DATASET.id]: PEOPLE_DATASET,
  [STORAGE_BUCKETS_DATASET.id]: STORAGE_BUCKETS_DATASET,
};

export const BUILT_IN_DATASET_LIST: cd.IConfig[] = [
  {
    id: VM_INSTANCES_DATASET.id,
    title: VM_INSTANCES_DATASET.name,
  },
  {
    id: INSTANCE_GROUPS_DATASET.id,
    title: INSTANCE_GROUPS_DATASET.name,
  },
  {
    id: INSTANCE_TEMPLATES_DATASET.id,
    title: INSTANCE_TEMPLATES_DATASET.name,
  },
  {
    id: VM_IMAGES_DATASET.id,
    title: VM_IMAGES_DATASET.name,
  },
  {
    id: KUBERNETES_CLUSTERS_DATASET.id,
    title: KUBERNETES_CLUSTERS_DATASET.name,
  },
  {
    id: LOG_FILES_DATASET.id,
    title: LOG_FILES_DATASET.name,
  },
  {
    id: MICROKITCHENS_DATASET.id,
    title: MICROKITCHENS_DATASET.name,
  },
  {
    id: PEOPLE_DATASET.id,
    title: PEOPLE_DATASET.name,
  },
  {
    id: STORAGE_BUCKETS_DATASET.id,
    title: STORAGE_BUCKETS_DATASET.name,
  },
];

export const DEFAULT_DATASETS = [
  VM_INSTANCES_DATASET,
  INSTANCE_GROUPS_DATASET,
  INSTANCE_TEMPLATES_DATASET,
  VM_IMAGES_DATASET,
  KUBERNETES_CLUSTERS_DATASET,
  LOG_FILES_DATASET,
  MICROKITCHENS_DATASET,
  PEOPLE_DATASET,
  STORAGE_BUCKETS_DATASET,
];
