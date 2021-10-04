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
import { FlatLayersNode } from '../../interfaces/layers.interface';

export class DropManager {
  private _current?: FlatLayersNode;
  private _parent?: FlatLayersNode;
  private _dropLevel = 0;

  reset() {
    if (this._current) {
      this._current.dropAbove = false;
      this._current.dropBelow = false;
      this._current = undefined;
    }
    if (this._parent) {
      this._parent.dropParent = false;
    }
  }

  set parent(parent: FlatLayersNode) {
    this._parent = parent;
    this._parent.dropParent = true;
  }

  setBefore(current: FlatLayersNode, parent: FlatLayersNode) {
    this._current = current;
    this._current.dropAbove = true;
    this._dropLevel = this._current.level;
    this.parent = parent;
  }

  setAfter(lastChild: FlatLayersNode, parent: FlatLayersNode) {
    this._current = lastChild;
    this._current.dropBelow = true;
    this._dropLevel = this._current.level;
    this.parent = parent;
  }

  setAfterGroup(lastChild: FlatLayersNode, parent: FlatLayersNode) {
    this._current = lastChild;
    this._current.dropBelow = true;
    this._dropLevel = parent.level + 1;
    this.parent = parent;
  }

  setPrepend(current: FlatLayersNode) {
    this._current = current;
    this._current.dropBelow = true;
    this._dropLevel = this._current.level + 1;
    this.parent = current;
  }

  setAppend(lastChild: FlatLayersNode, targetAsParent: FlatLayersNode) {
    this._current = lastChild;
    this._current.dropBelow = true;
    this._dropLevel = this._current.level + 1;
    this.parent = targetAsParent;
  }

  setRelation(
    relation: cd.InsertRelation,
    targetNode: FlatLayersNode,
    parentNode: FlatLayersNode,
    lastChild: FlatLayersNode
  ) {
    // prettier-ignore
    switch (relation) {
      case cd.InsertRelation.Before: return this.setBefore(targetNode, parentNode);
      case cd.InsertRelation.After: return this.setAfter(lastChild, parentNode);
      case cd.InsertRelation.Prepend: return this.setPrepend(targetNode);
      case cd.InsertRelation.Append: return this.setAppend(lastChild, targetNode);
      case cd.InsertRelation.AfterGroup: return this.setAfterGroup(lastChild, parentNode);
    }
  }

  // Determine indentation amount of drop line
  get parentLevel() {
    const { _dropLevel } = this;
    return _dropLevel > 0 ? _dropLevel - 1 : 0;
  }

  cleanup() {
    this._current = undefined;
    this._parent = undefined;
  }
}
