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

import { Pipe, PipeTransform } from '@angular/core';
import { isBoard, isSymbol } from 'cd-common/models';
import { FlatLayersNode } from '../../interfaces/layers.interface';

@Pipe({ name: 'nodeIsBoard' })
export class TreeItemIsBoard implements PipeTransform {
  transform(node: FlatLayersNode): boolean {
    return isBoard(node);
  }
}

@Pipe({ name: 'nodeIsNotBoard' })
export class TreeItemINotBoard implements PipeTransform {
  transform(node: FlatLayersNode): boolean {
    return isBoard(node) === false;
  }
}

@Pipe({ name: 'nodeIsSymbol' })
export class TreeItemIsSymbol implements PipeTransform {
  transform(node: FlatLayersNode): boolean {
    return isSymbol(node);
  }
}

@Pipe({ name: 'nodeInMapOrSet' })
export class TreeNodeInMapOrSet implements PipeTransform {
  transform(node: FlatLayersNode, nodeMap: Map<string, string> | Set<string>): boolean {
    return nodeMap.has(node.id);
  }
}

@Pipe({ name: 'nodeInArray' })
export class TreeNodeInArray implements PipeTransform {
  transform(node: FlatLayersNode, nodeArray: ReadonlyArray<string>): boolean {
    return nodeArray.includes(node.id);
  }
}
