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

import { IComponent } from './component';
import { IProjectContentDocument } from './project';
import { EntityType } from './entity-types';
import { IPublishable } from './publish';
import { IScreenshotable } from './database';
import { IBaseElementInputs, IComponentInstance } from './component-instances';
import { PropertyValue } from './properties';
import { ILockingRect } from './index';
import { IFontFamily } from './font';

/**
 * Functions cannot be stored in the database, so for a CodeComponent we store
 * all the values except for the function properties of `IComponent`.
 */
export type PersistedComponent = Omit<IComponent, 'factory' | 'template' | 'validate'>;

export interface ICodeComponentDocument
  extends PersistedComponent,
    IProjectContentDocument,
    IPublishable,
    IScreenshotable {
  type: EntityType.CodeComponent;

  /**
   * Frame is used as initial width/height for an instance of this component.
   * Also used at size of render outlet iframe on code component eidtor page and preview page
   */
  frame: ILockingRect;

  /**
   * Path in Firebase storage to the JavaScript bundle for this code component
   * e.g. code_components/132467091234/bundle.js
   */
  jsBundleStoragePath: string;

  /**
   * Optional field to allow a code component author to provide a url to the repository where
   * the code for their component is stored
   */
  repositoryUrl?: string;

  /** Attach code components to font family */
  fontList?: IFontFamily[];
}

export type CodeComponentMap = Record<string, ICodeComponentDocument>;

export interface ICodeComponentInstanceInputs extends IBaseElementInputs {
  [key: string]: PropertyValue;
}

export interface ICodeComponentInstance extends IComponentInstance {
  inputs: ICodeComponentInstanceInputs;
}
