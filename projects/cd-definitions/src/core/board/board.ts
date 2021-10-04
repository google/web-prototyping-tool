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
import {
  CdComponent,
  CdComponentFactory,
  getComponent,
  DEFAULT_BOARD_STYLES,
} from 'cd-common/models';
import { INNER_LAYOUT_CONFIG, PADDING_CONFIG, OVERFLOW_CONFIG } from '../../shared';
import templateFunction from './board.template';

export class Board extends CdComponent {
  tagName = consts.DIV_TAG;
  title = 'Board';
  icon = consts.LayerIcons.Board;
  childrenAllowed = true;
  autoAddDefaultProperties = false;

  styles = DEFAULT_BOARD_STYLES.base.style;

  properties: cd.IPropertyGroup[] = [
    { type: cd.PropertyType.BoardSize },
    { children: [PADDING_CONFIG] },
    { children: [OVERFLOW_CONFIG] },
    { type: cd.PropertyType.BoardBackground },
    INNER_LAYOUT_CONFIG,
    { type: cd.PropertyType.BoardPreviewVisibility },
  ];

  template = templateFunction;
  factory = BoardFactory;
}

class BoardFactory extends CdComponentFactory implements cd.IBoardProperties {
  elementType: cd.ElementEntitySubType.Board = cd.ElementEntitySubType.Board;

  constructor(public projectId: string, id: string) {
    super(projectId, id, getComponent(cd.ElementEntitySubType.Board) as Board);
    this.assignFrame(800, 600, 40, 40);
  }
}
