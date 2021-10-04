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

export interface IOverflow {
  x?: cd.Overflow;
  y?: cd.Overflow;
}

export enum OverflowState {
  Visible,
  Hidden,
  Scroll,
}

export interface IOverflowModel {
  overflow: IOverflow;
}

export enum ScrollDirection {
  Vertical = 'vert',
  Horizontal = 'horz',
  Both = 'both',
}

export const SCROLL_DIRECTION_MENU: cd.ISelectItem[] = [
  { title: 'Vertical', icon: '/assets/icons/scroll-vert.svg', value: ScrollDirection.Vertical },
  { title: 'Horizontal', icon: '/assets/icons/scroll-horz.svg', value: ScrollDirection.Horizontal },
  { title: 'Both', icon: '/assets/icons/scroll-both.svg', value: ScrollDirection.Both },
];
