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

import { ElementPropertiesMap } from './property-models';
import { IStringMap } from './index';

export interface ITemplateTextNode {
  value: string;
}

export interface ITemplateElement {
  tagName: string;
  // TODO: This should always be in with this element's property map in the project store, see b/122900592
  attrs?: IStringMap<string>;
  children?: TemplateTreeItem[];
  markForDelete?: boolean;
}

export type TemplateTreeItem = ITemplateTree | ITemplateTextNode | ITemplateElement;

export interface ITemplateTree {
  children: TemplateTreeItem[];
}

export interface ITemplateElementPosition {
  /**
   * representation of where in the HTML heirarchy this element is located
   * example:
   *
   * <div></div>        "0"
   * <div>              "1"
   *   <span></span>    "1,0"
   *   <span></span>    "1,1"
   * <div>
   *
   */
  hierarchyLocation: string;
  rootId: string;
}

export interface IPositionAssignment {
  id: string;
  position: ITemplateElementPosition;
}

export const isImage = (treeItem: TemplateTreeItem): treeItem is ITemplateElement => {
  return (treeItem as ITemplateElement).tagName === 'IMG';
};

export const isElement = (treeItem: TemplateTreeItem): treeItem is ITemplateElement => {
  return (treeItem as ITemplateElement).tagName !== undefined;
};

export const isTextNode = (treeItem: TemplateTreeItem): treeItem is ITemplateTextNode =>
  (treeItem as ITemplateTextNode).value !== undefined;

export const isTree = (treeItem: TemplateTreeItem): treeItem is ITemplateTree =>
  !isElement(treeItem) && !isTextNode(treeItem);

export interface IReplacedElementIds {
  [oldId: string]: string;
}

export interface ITemplateReplaceElementIdResult {
  template: string;
  replacedIds: IReplacedElementIds;
}

export interface ICopyTemplateElemsAndPropsResult {
  elemTemplates: {
    [hierarchyLocation: string]: string;
  };
  propertiesMap: ElementPropertiesMap;
  elementPositions: IStringMap<ITemplateElementPosition>;
}

export interface ITemplateElementUpdate {
  template: string;
  element: ITemplateElement;
}
