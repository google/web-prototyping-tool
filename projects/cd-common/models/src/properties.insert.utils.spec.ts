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
import * as utils from './properties.insert.utils';

describe('Properties Insert Utils', () => {
  it('insert an element and element in a parent with no children', () => {
    const boardId = 'board1';
    const board = { id: boardId, rootId: boardId, childIds: [] } as unknown as cd.IBoardProperties;

    const elementId = 'element1';
    const el = { id: elementId } as unknown as cd.PropertyModel;

    const insertIds = [elementId];
    const insertLocation: cd.IInsertLocation = {
      elementId: boardId,
      relation: cd.InsertRelation.Append,
    };

    const elementProps = { [boardId]: board };

    const change = utils.insertElements(insertIds, insertLocation, elementProps, [el], true);
    const setElement = change.sets?.[0];

    expect(setElement?.rootId).toEqual(boardId);
    expect(setElement?.parentId).toEqual(boardId);
    expect(setElement?.fractionalIndex).toEqual('a0');
    expect(setElement?.showPreviewStyles).toEqual(true);
  });

  it('insert a new element between 2 existing children', () => {
    const boardId = 'board1';
    const elementId1 = 'element1';
    const elementId2 = 'element2';
    const newElementId = 'newElement';

    const board = { id: boardId, rootId: boardId, childIds: [elementId1, elementId2] };
    const el1 = { id: elementId1, fractionalIndex: 'a0', parentId: boardId, rootId: boardId };
    const el2 = { id: elementId2, fractionalIndex: 'a2', parentId: boardId, rootId: boardId };
    const newElement = { id: newElementId } as unknown as cd.PropertyModel;

    const insertIds = [newElementId];
    const insertLocation: cd.IInsertLocation = {
      elementId: elementId1,
      relation: cd.InsertRelation.After,
    };

    const elementProps = {
      [boardId]: board,
      [elementId1]: el1,
      [elementId2]: el2,
    } as unknown as cd.ElementPropertiesMap;

    const change = utils.insertElements(
      insertIds,
      insertLocation,
      elementProps,
      [newElement],
      true
    );
    const setElement = change.sets?.[0];

    expect(setElement?.rootId).toEqual(boardId);
    expect(setElement?.parentId).toEqual(boardId);
    expect(setElement?.fractionalIndex).toEqual('a1');
    expect(setElement?.showPreviewStyles).toEqual(true);
  });

  it('should update rootId on nested child', () => {
    const boardId = 'board1';
    const elementId1 = 'element1';
    const elementId2 = 'element2';

    const board = { id: boardId, rootId: boardId, childIds: [] };
    const el1 = {
      id: elementId1,
      fractionalIndex: 'a0',
      parentId: 'other',
      rootId: 'other',
      childIds: [elementId2],
    };
    const el2 = { id: elementId2, fractionalIndex: 'a2', parentId: elementId1, rootId: 'other' };

    // insert element1 into board
    const insertIds = [elementId1];
    const insertLocation: cd.IInsertLocation = {
      elementId: boardId,
      relation: cd.InsertRelation.Append,
    };

    const elementProps = {
      [boardId]: board,
      [elementId1]: el1,
      [elementId2]: el2,
    } as unknown as cd.ElementPropertiesMap;

    const { updates } = utils.insertElements(insertIds, insertLocation, elementProps, [], true);

    expect(updates?.length).toEqual(2);
    expect(updates?.[0].update.rootId).toEqual(boardId);
    expect(updates?.[0].update.parentId).toEqual(boardId);
    expect(updates?.[1].update.rootId).toEqual(boardId);
  });

  it('should set all new elements', () => {
    const boardId = 'board1';
    const elementId1 = 'element1';
    const elementId2 = 'element2';

    const board = { id: boardId, rootId: boardId, childIds: [] };
    const el1 = {
      id: elementId1,
      fractionalIndex: 'a0',
      parentId: 'other',
      rootId: 'other',
      childIds: [elementId2],
    };
    const el2 = { id: elementId2, fractionalIndex: 'a2', parentId: elementId1, rootId: 'other' };

    // insert element1 into board
    const insertIds = [elementId1];
    const insertLocation: cd.IInsertLocation = {
      elementId: boardId,
      relation: cd.InsertRelation.Append,
    };

    // Only el1 is being inserted, but el2 should also be created since it is a child of el1
    const newElements = [el1, el2] as cd.PropertyModel[];
    const elementProps = { [boardId]: board } as unknown as cd.ElementPropertiesMap;
    const change = utils.insertElements(insertIds, insertLocation, elementProps, newElements, true);
    const { sets } = change;

    expect(sets?.length).toEqual(2);
    expect(sets?.[0].rootId).toEqual(boardId);
    expect(sets?.[0].parentId).toEqual(boardId);
    expect(sets?.[1].rootId).toEqual(boardId);
    expect(sets?.[1].parentId).toEqual(elementId1);
  });
});
