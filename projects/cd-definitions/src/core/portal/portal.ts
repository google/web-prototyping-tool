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
import * as consts from 'cd-common/consts';
import * as shared from '../../shared';
import templateFunction from './portal.template';

export class Portal extends shared.PrimitiveComponent {
  tagName = consts.DIV_TAG;
  title = 'Portal';
  icon = '/assets/icons/board-portal.svg';
  width = 400;
  height = 400;

  styles = {
    overflow: { x: cd.Overflow.Hidden, y: cd.Overflow.Hidden },
  };

  inputs = {
    referenceId: consts.EMPTY_REFERENCE_ID,
  } as cd.IRootInstanceInputs;

  properties: cd.IPropertyGroup[] = [
    shared.BORDER_RADIUS_CONFIG,
    { children: [shared.OPACITY_CONFIG, shared.OVERFLOW_CONFIG] },
    { type: cd.PropertyType.BoardPortal },
    shared.BORDER_CONFIG,
  ];

  template = templateFunction;
}
