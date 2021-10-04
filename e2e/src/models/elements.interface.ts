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

// TODO Allow indexing elements deep in the tree.
// Support for indexing nested elements was taken down because renderer and glass
// no longer had hLoc as data-* attributes, which makes nested elements harder
// to querySelect.
export interface IElementPosition {
  boardIndex: number;
  // hLoc: string;
  indices: number[];
}
