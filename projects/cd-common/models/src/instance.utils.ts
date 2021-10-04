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

import { getComponent } from './registry';
import { CdComponentFactory } from './component-factory';
import { isObjectLegacy } from 'cd-utils/object';
import * as cd from 'cd-interfaces';

/** Creates a component instance factory based on a component type. */
export const createInstance = (
  component: cd.ComponentIdentity | cd.IComponent | cd.ICodeComponentDocument,
  projectId: string,
  id: string
): CdComponentFactory => {
  if (!projectId) throw Error('Must provide projectId');
  if (!id) throw Error('Must provide id');

  // Use component object directly if passed in, otherwise get retrieve from
  // the registry if a component identity is passed.
  const cmp = isObjectLegacy(component)
    ? (component as cd.IComponent)
    : getComponent(component as cd.ComponentIdentity);
  if (!cmp) throw Error(`Component "${cmp}" not found`);

  // Factory can be a custom one defined on component, or the generic one
  const Factory = (cmp.factory || CdComponentFactory) as typeof CdComponentFactory;
  return new Factory(projectId, id, cmp);
};

export const createAssetInstance = (
  id: string,
  projectId: string,
  name: string,
  assetId: string,
  width: number,
  height: number
) => {
  const src: cd.IValue = { id: assetId };
  return createInstance(cd.ElementEntitySubType.Image, projectId, id)
    .assignName(name)
    .addInputs<cd.IImageInputs>({ src })
    .assignWidth(width)
    .assignHeight(height)
    .lockFrame()
    .build();
};

/** Creates a component instance based on a component type. */
export const createCodeComponentInstance = (
  id: string,
  codeComponent: cd.ICodeComponentDocument
): cd.ICodeComponentInstance => {
  if (!id) throw new Error('Must provide id');
  const { projectId, frame } = codeComponent;
  return (
    createInstance(codeComponent, projectId, id)
      // mark this as a code component instance for easier checking
      .setIsCodeComponent()
      // use codeComponent frame as initial width/height of a new instance
      .assignWidth(frame.width)
      .assignHeight(frame.height)
      .build() as cd.ICodeComponentInstance
  );
};
