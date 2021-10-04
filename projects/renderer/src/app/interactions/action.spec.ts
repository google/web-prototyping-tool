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
import { bufferTime } from 'rxjs/operators';
import InteractionManager from '../interaction.manager';
import { ActionQueue, IActionPayload } from './action.queue';
import props from './action.spec.json';

describe('Renderer Actions lookup', () => {
  it('Found action for element within symbol - (From)', () => {
    const manager = new InteractionManager(null);
    const trigger = 'click';
    const elementId = 'DGJRHFU1oWyKTRuqfLbr';
    const instanceId = 'XaDl0dTWYNbqXd31QQKk';
    const targetId = 'hItpNEdTC3OD2FqcXQpX';
    const action = manager.findActionsForTrigger(
      trigger,
      elementId,
      props as cd.ElementPropertiesMap,
      instanceId
    );
    const [first] = action;
    expect(action.length).toEqual(1);
    expect(first.childRef).toEqual(elementId);
    expect(first.target).toEqual(targetId);
    expect(first.trigger).toEqual(cd.EventTrigger.Click);
    expect(first.type).toEqual(cd.ActionType.NavigateToBoard);
  });

  it('Found action for parent element within symbol - (From)', () => {
    const manager = new InteractionManager(null);
    const trigger = 'click';
    const elementId = '0Hyz4jMrsckKEZkb2Koh';
    const instanceId = 'XaDl0dTWYNbqXd31QQKk';
    const action = manager.findActionsForTrigger(
      trigger,
      elementId,
      props as cd.ElementPropertiesMap,
      instanceId
    );
    const [first] = action;
    expect(action.length).toEqual(1);
    expect(first.childRef).toEqual('22tuvyRP9uXFyvPY7hiv');
    expect(first.trigger).toEqual(cd.EventTrigger.Click);
    expect(first.type).toEqual(cd.ActionType.RecordState);
  });

  it('Should not find action for element within symbol - (From)', () => {
    const manager = new InteractionManager(null);
    const trigger = 'click';
    const elementId = 'XaDl0dTWYNbqXd31QQKk';
    const instanceId = 'XaDl0dTWYNbqXd31QQKk';
    const action = manager.findActionsForTrigger(
      trigger,
      elementId,
      props as cd.ElementPropertiesMap,
      instanceId
    );

    expect(action.length).toEqual(0);
  });
});

describe('ActionQueue', () => {
  it('Queue with delay', (done) => {
    const actionQueue = new ActionQueue();

    const actionA: IActionPayload = {
      elementId: 'foo',
      action: {
        type: cd.ActionType.NavigateToBoard,
        trigger: cd.EventTrigger.Click,
        target: 'foo',
        id: '124',
        delay: 100,
      },
    };

    const actionB: IActionPayload = {
      elementId: 'bar',
      action: {
        type: cd.ActionType.NavigateToBoard,
        trigger: cd.EventTrigger.Click,
        target: 'foo',
        id: '125',
        delay: 100,
      },
    };

    const actionC: IActionPayload = {
      elementId: 'baz',
      action: {
        type: cd.ActionType.NavigateToBoard,
        trigger: cd.EventTrigger.BoardAppear,
        target: 'foo',
        id: '1325',
        delay: 20,
      },
    };

    actionQueue.queue$.pipe(bufferTime(200)).subscribe((payload: IActionPayload[]) => {
      expect(payload.length).toEqual(2);
      expect(payload[0]).toEqual(actionA);
      expect(payload[1]).toEqual(actionB);
      done();
    });

    // This tests if the queue ignores duplicate actions
    // Also tests to make sure items are removed from the queue
    actionQueue.add(actionA);
    actionQueue.add(actionC);
    actionQueue.add(actionA);
    actionQueue.add(actionA);
    actionQueue.add(actionA);
    actionQueue.add(actionB);
    actionQueue.add(actionA);
    actionQueue.add(actionB);
    actionQueue.clearActionsForType(cd.EventTrigger.BoardAppear);
    actionQueue.add(actionC);
    const cKey = actionQueue.keyForPayload(actionC);
    if (cKey) actionQueue.removeFromQueue(cKey, actionC);
  });
});
