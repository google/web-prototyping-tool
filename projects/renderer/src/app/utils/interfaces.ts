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

import { ComponentFactory, ComponentRef, NgModuleFactory } from '@angular/core';
import type { OutletComponentDirective } from '../outlets/outlet.component';
import type * as cd from 'cd-interfaces';

export interface ICompilationPayload<T> {
  cmpFactory: ComponentFactory<T>;
  ngModuleFactory: NgModuleFactory<any>;
}

export interface IOutletRef<T> {
  compRef: ComponentRef<T>;
  contentRef: ComponentRef<OutletComponentDirective>;
}

export interface IOutletOutputEvent {
  value: any;
  elementId: string;
  instanceId?: string;
  inputBinding: string;
  /**
   * Tells the OutletManager to update the property model state ( Default:true )
   * For example, you selected a radio button, we then set that value on the model
   * In the case of a Button's menu, we're just triggering an event so this value is false
   * */
  writeValue: boolean;
}

export interface IOutletAutoNavEvent {
  /** Nav item clicked */
  navItem: cd.IAutoNavItemUrl | cd.IAutoNavItemBoard;
  /** ID of a portal to change it's contents */
  target?: string;
  instanceId?: string;
}

export interface IStateChange {
  id: string;
  payload: Record<string, any>;
  instanceId?: string;
}
