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

/* eslint-disable max-lines */

import { FlatLayersNode, ILayersNode } from '../../interfaces/layers.interface';
import { areStringMapsEqual, areSetsEqual, areObjectsEqual } from 'cd-utils/object';
import { mapFromArrayOfObjectsWithId } from 'cd-utils/map';
import { isBetween } from 'cd-utils/numeric';
import * as utils from './layers-tree.utils';
import * as models from 'cd-common/models';
import * as cd from 'cd-interfaces';
import { LayerIcons } from 'cd-common/consts';

export class TreeController {
  private _homeBoardId = '';
  private _searchString = '';
  public flatData: FlatLayersNode[] = [];
  public _visibleData: FlatLayersNode[] = [];
  public expandedNodes = new Set<string>();
  public selectionIds = new Set<string>();
  public previousSelectedIds = new Set<string>();
  public nextSelectedIds = new Set<string>();
  public iconMap: ReadonlyMap<string, string> = new Map();
  public nameMap: ReadonlyMap<string, string[]> = new Map();
  public hiddenSet: ReadonlySet<string> = new Set();
  public actionSet: ReadonlySet<string> = new Set();
  public highlighted: ReadonlyArray<string> = [];

  updateProps(props: cd.ElementPropertiesMap) {
    const values = models.getModels(props);
    const iconMap = utils.buildIconMap(values);
    const hiddenSet = utils.buildHiddenSet(values);
    const nameMap = utils.buildNameMap(values);
    const actionSet = utils.buildActionsSet(values);

    if (
      areStringMapsEqual(iconMap, this.iconMap) &&
      areStringMapsEqual(nameMap, this.nameMap) &&
      areSetsEqual(actionSet, this.actionSet) &&
      areSetsEqual(hiddenSet, this.hiddenSet)
    ) {
      return;
    }

    this.iconMap = iconMap;
    this.hiddenSet = hiddenSet;
    this.nameMap = nameMap;
    this.actionSet = actionSet;
    this.updateData(this.flatData, this.expandedNodes);
  }

  updateSearchString(search: string) {
    if (this._searchString === search) return;
    this._searchString = search;
    this.updateData(this.flatData, this.expandedNodes);
  }

  // When the homeboard changes,
  // this is used to update the icon
  set homeBoardId(value: string) {
    if (this._homeBoardId === value) return;
    this._homeBoardId = value;
    this.updateData(this.flatData, this.expandedNodes);
  }

  get flatLayersNodeMap(): Map<string, FlatLayersNode> {
    return mapFromArrayOfObjectsWithId(this.flatData);
  }

  decorateData(data: FlatLayersNode[]): FlatLayersNode[] {
    const { iconMap, hiddenSet, nameMap, actionSet, _homeBoardId } = this;
    return data.reduce<FlatLayersNode[]>((acc, item) => {
      const { id } = item;
      const icon = iconMap.get(id);
      item.icon = id === _homeBoardId ? LayerIcons.Home : icon;
      item.hidden = hiddenSet.has(id);
      item.label = nameMap.get(id);
      item.actions = actionSet.has(id);
      acc.push(item);
      return acc;
    }, []);
  }

  createParentNodeMapping(
    rootId: string,
    parentNodes: FlatLayersNode[],
    nodeMap: Map<string, Map<string, FlatLayersNode>>
  ): Map<string, FlatLayersNode> {
    if (nodeMap.has(rootId)) return nodeMap.get(rootId) as Map<string, FlatLayersNode>;
    const parentsForBoard = parentNodes.filter((child) => child.rootId === rootId);
    const nodeMapping = new Map(parentsForBoard.map((node) => [node.id, node]));
    nodeMap.set(rootId, nodeMapping);
    return nodeMapping;
  }

  getVisibleData(data: FlatLayersNode[], expandedNodes: Set<string>): FlatLayersNode[] {
    const { _searchString } = this;
    if (_searchString) return this.getFilteredVisibleData(_searchString, data);
    // Optimization since parents have children
    const visible: FlatLayersNode[] = [];
    const parentNodes = data.filter((item) => item.children.length > 0);
    const parentBoardMap = new Map<string, Map<string, FlatLayersNode>>();
    for (const item of data) {
      const rootId = item.rootId;
      const nodeMapping = this.createParentNodeMapping(rootId, parentNodes, parentBoardMap);
      const ancestorsVisible = this.areAncestorsVisible(item, expandedNodes, nodeMapping);
      if (ancestorsVisible) visible.push(item);
    }
    return visible;
  }

  getFilteredVisibleData(searchStr: string, data: FlatLayersNode[]): FlatLayersNode[] {
    // NOTE: Filter down nodes to string match
    const searchValue = searchStr.toLowerCase();
    const filteredNodes = data.filter((item) => {
      if (!item.label) return false;
      return item.label.some((label) => label.toLowerCase().includes(searchValue));
    });

    const ids = filteredNodes.reduce<Set<string>>((acc, item) => {
      const newIds = [...item.ancestors, item.id];
      return new Set([...acc, ...newIds]);
    }, new Set());

    const { flatLayersNodeMap } = this;
    return [...ids].reduce<FlatLayersNode[]>((acc, id) => {
      const node = flatLayersNodeMap.get(id);
      if (node) return [...acc, node];
      return acc;
    }, []);
  }

  // FIND NODE ////////////////////////////////////////////////

  checkNode(node: FlatLayersNode, idList: Set<string>): boolean {
    return idList.has(node.id);
  }

  getParentNode = (node: FlatLayersNode): FlatLayersNode | undefined => {
    if (models.isBoard(node)) return;
    const { parentId } = node;
    return parentId ? this.findNodeWithId(parentId) : undefined;
  };

  // EXPAND NODE ////////////////////////////////////////////////

  expandNode = (node: FlatLayersNode | undefined) => {
    if (!node) return;
    const { id, expandable } = node;
    if (id && expandable) {
      if (this.isExpanded(node)) return;
      this.expand(node);
    }

    this.expandAncestors(node);
  };

  expand(node: FlatLayersNode) {
    if (this.isExpanded(node)) return;
    this.expandedNodes.add(node.id);
    this.updateData(this.flatData, this.expandedNodes);
  }

  // Expand all the ancestors of a given element
  expandAncestors(node: FlatLayersNode | undefined) {
    if (!node || !node.parentId || models.isBoard(node)) return;
    const { parentId } = node;
    const parent = this.findNodeWithId(parentId);
    if (!parent) return;
    // expand parent and ancestors of parent
    this.expand(parent);
    this.expandAncestors(parent);
  }

  toggleNodeAndDescendants(node: FlatLayersNode) {
    if (!node.expandable) return;
    const isExpanded = this.expandedNodes.has(node.id);
    const { flatData, flatLayersNodeMap } = this;
    const allIds = utils.getAllDescendantsFromNode(node, flatData, flatLayersNodeMap);
    for (const id of allIds) {
      if (isExpanded) {
        this.expandedNodes.delete(id);
      } else {
        this.expandedNodes.add(id);
      }
    }
    this.updateData(this.flatData, this.expandedNodes);
  }

  toggle(nodeId: string) {
    this.expandedNodes = utils.toggleSet(this.expandedNodes, nodeId);
    this.updateData(this.flatData, this.expandedNodes);
  }

  isExpanded(node: FlatLayersNode) {
    return this.expandedNodes.has(node.id);
  }

  areAncestorsVisible = (
    node: FlatLayersNode,
    expandedNodes: Set<string>,
    fullDataMap: Map<string, FlatLayersNode>
  ): boolean => {
    const parentId = node.parentId;
    const parentNode = parentId && fullDataMap.get(parentId);
    if (!parentNode) return true;
    const parentIsCollapsed = expandedNodes.has(parentNode.id);
    if (!parentIsCollapsed) return false;
    return this.areAncestorsVisible(parentNode, expandedNodes, fullDataMap);
  };

  visibleIndexOfNode(node: FlatLayersNode) {
    return this._visibleData.findIndex((n) => n.id === node.id);
  }

  findNodeWithId(id: string): FlatLayersNode | undefined {
    return this.flatLayersNodeMap.get(id);
  }

  // Expand all new boards / roots
  expandRootNodes(newData: FlatLayersNode[]) {
    const newRootNodes = utils.identifyNewRootNodes(newData, this.flatData);
    for (const id of newRootNodes) {
      this.expandedNodes.add(id);
    }
  }

  set data(data: ILayersNode[]) {
    const flatData = utils.flattenData(data);
    this.expandRootNodes(flatData);
    this.flatData = flatData;
    this.updateData(this.flatData, this.expandedNodes);
  }

  removeOrphanedExpandedNodes(data: FlatLayersNode[]) {
    const ids = new Set(data.map((item) => item.id));
    for (const expandedId of this.expandedNodes) {
      if (!ids.has(expandedId)) this.expandedNodes.delete(expandedId);
    }
  }

  updateData(data: FlatLayersNode[], expandedNodes: Set<string>) {
    const decorated = this.decorateData(data);
    const visibleData = this.getVisibleData(decorated, expandedNodes);
    this.removeOrphanedExpandedNodes(data);
    if (areObjectsEqual(visibleData, this._visibleData)) return;
    this._visibleData = visibleData;
  }

  get visibleData(): FlatLayersNode[] {
    return this._visibleData;
  }

  // COLLAPSE ALL //////////////////////////////////////////////////////

  collapseAllNodes() {
    this.expandedNodes.clear();
    this.updateData(this.flatData, this.expandedNodes);
  }

  // HIGHLIGHT /////////////////////////////////////////////////////////

  set highlight(highlights: cd.RenderElementMap) {
    const list = Array.from(highlights.values());
    this.highlighted = list.reduce<string[]>((acc, curr) => [...acc, ...curr], []);
  }

  // SELECTION /////////////////////////////////////////////////////////

  isSiblingSelected(node: FlatLayersNode, lookup: (node: FlatLayersNode) => FlatLayersNode | void) {
    const sibling = lookup(node);
    if (!sibling) return false;
    if (models.isBoard(node) !== models.isBoard(sibling)) return false;
    return this.isSelected(sibling);
  }

  updateSelectionState() {
    const previousSelectedIds = new Set<string>();
    const nextSelectedIds = new Set<string>();
    for (const node of this._visibleData) {
      if (!this.isSelected(node)) continue;
      const previousVisibleNode = this.isSiblingSelected(node, this._getPreviousVisibleNode);
      const nextVisibleNode = this.isSiblingSelected(node, this._getNextVisibleNode);
      if (previousVisibleNode) previousSelectedIds.add(node.id);
      if (nextVisibleNode) nextSelectedIds.add(node.id);
    }
    this.previousSelectedIds = previousSelectedIds;
    this.nextSelectedIds = nextSelectedIds;
  }

  isSelected = (node: FlatLayersNode): boolean => this.checkNode(node, this.selectionIds);

  set selection(ids: Set<string>) {
    this.selectionIds = ids;
  }

  findClosestSelectedNodeIndex(nodeIndex: number, selectionSet: Set<string>): number {
    // if nothing else is selected, just return this node's index
    if (selectionSet.size === 0) return nodeIndex;
    let currDist = 0;
    const { flatLayersNodeMap } = this;
    return [...selectionSet].reduce((acc, selectedNodeId) => {
      const selectedNode = flatLayersNodeMap.get(selectedNodeId);
      if (selectedNode) {
        const selectedNodeIndex = this.visibleIndexOfNode(selectedNode);
        const dist = Math.abs(nodeIndex - selectedNodeIndex);
        if (!currDist || dist < currDist) {
          acc = selectedNodeIndex;
          currDist = dist;
        }
      }
      return acc;
    }, -1);
  }

  expandSelection() {
    const { flatLayersNodeMap } = this;
    const selectedId = Array.from(this.selectionIds).reduce((_acc, id) => {
      const node = flatLayersNodeMap.get(id);
      this.expandAncestors(node);
      return id;
    }, '');

    return selectedId;
  }

  addAllToSelectionBetweenNodes(node: FlatLayersNode): Set<string> {
    const isTypeBoard = models.isBoard(node);
    const nodeIndex = this.visibleIndexOfNode(node);
    const { selectionIds, _visibleData } = this;
    const closestSelectedIndex = this.findClosestSelectedNodeIndex(nodeIndex, selectionIds);
    return _visibleData.reduce<Set<string>>((acc, item, i) => {
      const allowed = isTypeBoard === models.isBoard(item);
      if (allowed && isBetween(i, nodeIndex, closestSelectedIndex)) {
        const parent = this.getParentNode(item);
        // Ignore elements inside collapsed parents
        if (!parent || (parent && this.isExpanded(parent))) {
          acc.add(item.id as string);
        }
      }
      return acc;
    }, new Set(selectionIds));
  }

  // VISIBILITY /////////////////////////////////////////////////////////////

  private _isVisible = (node: FlatLayersNode): boolean => {
    const parentNode = this.getParentNode(node);
    if (!parentNode) return true;
    return this.isExpanded(parentNode) && this._isVisible(parentNode);
  };

  private _getPreviousVisibleNode = (node: FlatLayersNode): FlatLayersNode | void => {
    const { _visibleData } = this;
    const prevIndex = this.visibleIndexOfNode(node) - 1;
    for (let i = prevIndex; i >= 0; i--) {
      const prevNode = _visibleData[i];
      if (this._isVisible(prevNode)) return prevNode;
    }
  };

  private _getNextVisibleNode = (node: FlatLayersNode): FlatLayersNode | void => {
    const { _visibleData } = this;
    const { expandable } = node;
    const nextIndex = this.visibleIndexOfNode(node) + 1;
    // if node has children and is expanded, return first child

    if (expandable && this.isExpanded(node)) {
      return _visibleData[nextIndex];
    }
    // else find first node at same level or higher up the tree and return it
    for (let i = nextIndex; i < _visibleData.length; i++) {
      const nextNode = _visibleData[i];
      if (nextNode.level <= node.level) return nextNode;
    }
  };

  isHidden(id: string) {
    return this.hiddenSet.has(id);
  }

  // DRAG & DROP GROUP PARENT //////////////////////////////////
  // TODO Refactor with DND service

  getLastChildForNode({ children }: FlatLayersNode): FlatLayersNode | undefined {
    const lastChildId = children && children[children.length - 1];
    return (lastChildId && this.findNodeWithId(lastChildId)) || undefined;
  }

  lastChildFromTargetNode(
    relation: cd.InsertRelation,
    targetNode: FlatLayersNode,
    parentNode: FlatLayersNode
  ): FlatLayersNode {
    if (relation === cd.InsertRelation.AfterGroup) {
      if (!this.isExpanded(targetNode)) return targetNode;
      const last = this._getLastGrandchild(parentNode);
      return last || targetNode;
    }
    return this.getLastChildForNode(targetNode) || targetNode;
  }

  private _getLastGrandchild = (node: FlatLayersNode): FlatLayersNode | void => {
    const { children } = node;
    if (children && children.length > 0) {
      const lastChildId = children[children.length - 1];
      const lastChildNode = this.findNodeWithId(lastChildId);
      if (!lastChildNode) return;
      return lastChildNode.children.length > 0
        ? this._getLastGrandchild(lastChildNode)
        : lastChildNode;
    }
  };
}
