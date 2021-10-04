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
import { ElementPropertiesFixer } from './health.repair.utils';
import { findCircularRefs } from '../../utils/dependency.utils';

describe('HealthCheck', () => {
  it('should repair orphaned child Ids', () => {
    const props: cd.IStringMap<Partial<cd.PropertyModel>> = {
      'board-1': {
        childIds: ['div-1', 'div-4', 'div-5'],
        id: 'board-1',
        rootId: 'board-1',
        elementType: cd.ElementEntitySubType.Board,
        type: cd.EntityType.Element,
      },
      'div-1': {
        childIds: ['div-3', 'div-4', 'div-5'],
        id: 'div-1',
        rootId: 'board-1',
        parentId: 'board-1',
        elementType: cd.ElementEntitySubType.Generic,
        type: cd.EntityType.Element,
      },
    };

    const { elementProperties } = new ElementPropertiesFixer(props as cd.ElementPropertiesMap)
      .repairOrphanedChildIds()
      .build();

    // Remove div-4, div-5 which don't exist from board-1
    expect(elementProperties['board-1']?.childIds).toEqual(['div-1']);
    // Remove div-4, div-5 which don't exist from div-1
    expect(elementProperties['div-1']?.childIds).toEqual([]);
  });

  it('should repair children whose parentId does not exist', () => {
    const props: cd.IStringMap<Partial<cd.PropertyModel>> = {
      'board-1': {
        childIds: ['div-1', 'div-2', 'div-3'],
        id: 'board-1',
        rootId: 'board-1',
        elementType: cd.ElementEntitySubType.Board,
        type: cd.EntityType.Element,
      },
      'div-1': {
        childIds: [],
        id: 'div-1',
        rootId: 'board-1',
        parentId: 'board-1',
        elementType: cd.ElementEntitySubType.Generic,
        type: cd.EntityType.Element,
      },
      'div-2': {
        childIds: [],
        id: 'div-2',
        rootId: 'board-1',
        parentId: 'board-1',
        elementType: cd.ElementEntitySubType.Generic,
        type: cd.EntityType.Element,
      },
      'div-3': {
        childIds: [],
        id: 'div-3',
        rootId: 'board-1',
        parentId: 'board-5',
        elementType: cd.ElementEntitySubType.Generic,
        type: cd.EntityType.Element,
      },
      'div-5': {
        childIds: [],
        id: 'div-5',
        rootId: 'board-5',
        parentId: 'board-5',
        elementType: cd.ElementEntitySubType.Generic,
        type: cd.EntityType.Element,
      },
    };

    const { elementProperties } = new ElementPropertiesFixer(props as cd.ElementPropertiesMap)
      .repairOrphanedChildIds()
      .repairOrphanedElements()
      .build();

    // div-3 is reassigned to board-1 because board-1 points to div-3
    expect(elementProperties['div-3']?.parentId).toEqual('board-1');
    // div-5 is removed because there are no references
    expect(elementProperties['div-5']).toBeUndefined();
  });

  it('should repair elements who have parentIds where their parent isnt pointing to them', () => {
    const props: cd.IStringMap<Partial<cd.PropertyModel>> = {
      'board-1': {
        childIds: [],
        id: 'board-1',
        rootId: 'board-1',
        elementType: cd.ElementEntitySubType.Board,
        type: cd.EntityType.Element,
      },
      'div-1': {
        childIds: [],
        id: 'div-1',
        rootId: 'board-1',
        parentId: 'board-1',
        elementType: cd.ElementEntitySubType.Generic,
        type: cd.EntityType.Element,
      },
      'div-2': {
        childIds: [],
        id: 'div-2',
        rootId: 'board-1',
        parentId: 'board-1',
        elementType: cd.ElementEntitySubType.Generic,
        type: cd.EntityType.Element,
      },
    };

    const { elementProperties } = new ElementPropertiesFixer(props as cd.ElementPropertiesMap)
      .repairOrphanedChildIds()
      .repairOrphanedElements()
      .repairIfElementExistsOnTheirParent()
      .build();

    // Add div-1 and div-2 as childIds to board-1
    expect(elementProperties['board-1']?.childIds).toEqual(['div-1', 'div-2']);
  });

  it('should remove elements who have parentIds where their parent isnt pointing to them', () => {
    const props: cd.IStringMap<Partial<cd.PropertyModel>> = {
      'board-1': {
        childIds: [],
        id: 'board-1',
        rootId: 'board-1',
        elementType: cd.ElementEntitySubType.Board,
        type: cd.EntityType.Element,
      },
      'div-1': {
        childIds: [],
        id: 'div-1',
        rootId: 'board-1',
        parentId: 'board-1',
        elementType: cd.ElementEntitySubType.Generic,
        type: cd.EntityType.Element,
      },
      'div-2': {
        childIds: [],
        id: 'div-2',
        rootId: 'board-1',
        parentId: 'board-1',
        elementType: cd.ElementEntitySubType.Generic,
        type: cd.EntityType.Element,
      },
    };

    const { elementProperties } = new ElementPropertiesFixer(props as cd.ElementPropertiesMap)
      .repairOrphanedChildIds()
      .removeOrphanedElements()
      .repairIfElementExistsOnTheirParent()
      .build();

    expect(elementProperties['div-1']).toBeUndefined();
    expect(elementProperties['div-2']).toBeUndefined();
  });

  it('should find multiple circular references', () => {
    const props: cd.IStringMap<Partial<cd.PropertyModel>> = {
      'board-1': {
        childIds: ['div-1', 'div-2'],
        id: 'board-1',
        rootId: 'board-1',
        elementType: cd.ElementEntitySubType.Board,
        type: cd.EntityType.Element,
      },
      'div-1': {
        childIds: ['board-1'],
        id: 'div-1',
        rootId: 'board-1',
        parentId: 'board-1',
        elementType: cd.ElementEntitySubType.Generic,
        type: cd.EntityType.Element,
      },
      'div-2': {
        childIds: ['board-1'],
        id: 'div-2',
        rootId: 'board-1',
        parentId: 'board-1',
        elementType: cd.ElementEntitySubType.Generic,
        type: cd.EntityType.Element,
      },
    };

    const circularRefs = findCircularRefs(props as cd.ElementPropertiesMap);
    expect(circularRefs.length).toEqual(2);
  });

  it('should find circular references on single node', () => {
    const props: cd.IStringMap<Partial<cd.PropertyModel>> = {
      'board-1': {
        childIds: ['board-1'],
        id: 'board-1',
        rootId: 'board-1',
        elementType: cd.ElementEntitySubType.Board,
        type: cd.EntityType.Element,
      },
    };

    const circularRefs = findCircularRefs(props as cd.ElementPropertiesMap);
    expect(circularRefs.length).toEqual(1);
  });

  it('should repair circular references', () => {
    const props: cd.IStringMap<Partial<cd.PropertyModel>> = {
      'board-1': {
        childIds: ['div-1', 'div-2'],
        id: 'board-1',
        rootId: 'board-1',
        elementType: cd.ElementEntitySubType.Board,
        type: cd.EntityType.Element,
      },
      'div-1': {
        childIds: ['board-1'],
        id: 'div-1',
        rootId: 'board-1',
        parentId: 'board-1',
        elementType: cd.ElementEntitySubType.Generic,
        type: cd.EntityType.Element,
      },
      'div-2': {
        childIds: ['board-1'],
        id: 'div-2',
        rootId: 'board-1',
        parentId: 'board-1',
        elementType: cd.ElementEntitySubType.Generic,
        type: cd.EntityType.Element,
      },
    };

    const { elementProperties } = new ElementPropertiesFixer(props as cd.ElementPropertiesMap)
      .repairCircularReferences()
      .build();

    const circularRefs = findCircularRefs(elementProperties);
    expect(circularRefs.length).toEqual(0);
  });
});
