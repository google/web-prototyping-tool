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

import { clamp } from 'cd-utils/numeric';

export class HistoryStack {
  private _stack: string[] = [];
  private _stackIndex = -1;
  public initalId?: string;

  get lastIdInStack() {
    const { _stack, stackIndex } = this;
    return _stack.length && _stack[stackIndex];
  }

  pushStack(id: string | undefined) {
    if (!id) return;
    const { lastIdInStack } = this;
    if (lastIdInStack === id) return;
    if (this._stack.length - 1 !== this.stackIndex) {
      // reset stack
      this._stack = [...this._stack.slice(0, this.stackIndex)];
    }
    this._stack.push(id);
    this._stackIndex = this.stackLength;
  }

  resetStack() {
    this._stack = [];
    this._stackIndex = -1;
  }

  get stackLength() {
    return this._stack.length - 1;
  }

  get stackAtCurrentIndex() {
    return this._stack[this.stackIndex];
  }

  set stackIndex(value: number) {
    this._stackIndex = clamp(value, -1, this.stackLength);
  }

  get stackIndex() {
    return this._stackIndex;
  }

  goBack() {
    this.stackIndex = this.stackIndex - 1;
    return this.stackAtCurrentIndex;
  }

  goForward() {
    this.stackIndex = this.stackIndex + 1;
    return this.stackAtCurrentIndex;
  }

  get canGoForward() {
    return this.stackLength !== this.stackIndex;
  }

  get canGoBack() {
    return this._stack.length > 0 && this.stackIndex > 0;
  }
}
