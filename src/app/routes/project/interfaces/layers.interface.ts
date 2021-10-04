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
export type PartialElemProps = Pick<
  cd.IComponentInstance,
  'id' | 'elementType' | 'parentId' | 'rootId'
>;
export interface ILayersNode extends PartialElemProps {
  children: ILayersNode[];
}

/** Flat node with expandable and level information */

export class FlatLayersNode implements PartialElemProps {
  public id: string;
  public parentId?: string;
  public elementType: cd.ComponentIdentity;
  public rootId: string;
  public expandable = false;
  public dropAbove = false;
  public dropBelow = false;
  public dropParent = false;
  public editingLabel = false;
  public icon?: string;
  public label?: string[];
  public hidden?: boolean;
  /** Does this element have actions attached */
  public actions?: boolean;

  constructor(
    props: PartialElemProps,
    public children: string[],
    public level: number,
    public ancestors: string[]
  ) {
    const { id, parentId, elementType, rootId } = props;
    this.id = id;
    this.parentId = parentId;
    this.elementType = elementType;
    this.rootId = rootId;
    this.expandable = children.length > 0;
  }
}

export interface IToggleElementsHidden {
  hidden: boolean;
  elementIds: Set<string>;
}

export interface ILabelUpdate {
  id: string;
  label: string;
}
