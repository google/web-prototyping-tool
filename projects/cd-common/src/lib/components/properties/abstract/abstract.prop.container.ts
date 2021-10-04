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
import { Input, EventEmitter, Output, Directive } from '@angular/core';

@Directive()
export class AbstractPropContainerDirective {
  protected _model: cd.IStyleDeclaration = {};
  protected _parentModel: cd.IStyleDeclaration = {};
  @Input()
  set model(value: cd.IStyleDeclaration) {
    this._model = value;
    this.parseModel(value);
  }
  get model(): cd.IStyleDeclaration {
    return this._model;
  }

  @Input()
  set parentModel(value: cd.IStyleDeclaration) {
    this._parentModel = value;
    this.parseParentModel(value);
  }
  get parentModel(): cd.IStyleDeclaration {
    return this._parentModel;
  }

  @Output() modelChange = new EventEmitter<cd.IStyleDeclaration>();

  protected parseModel(_model: cd.IStyleDeclaration) {}
  protected parseParentModel(_model: cd.IStyleDeclaration) {}

  onModelChange(model: cd.IStyleDeclaration) {
    this.modelChange.emit(model);
  }
}
