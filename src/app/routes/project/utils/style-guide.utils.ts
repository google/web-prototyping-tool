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

import { TextType } from 'cd-themes';
import { DEFAULT_UNITS } from 'cd-common/consts';
import * as cd from 'cd-interfaces';
import { createInstance } from 'cd-common/models';
import { createId } from 'cd-utils/guid';

const UNDERSCORE_REGEX = /_/g;

const SWATCH_BORDER = {
  borderWidth: 1,
  units: DEFAULT_UNITS,
  lineStyle: 'solid',
  borderColor: { value: 'rgba(0,0,0,0.7)' },
};

export const generateBoardWithAllIcons = (
  _designSystem: cd.IDesignSystem,
  projectId: string,
  icons: string[]
): cd.ICreateBoardPayload => {
  const boardId = createId();
  const board = createInstance(cd.ElementEntitySubType.Board, projectId, boardId)
    .assignPadding(10, 10, 10, 10)
    .build();
  const boardContent: cd.IComponentInstanceGroup = { rootIds: [], models: [] };

  for (const icon of icons) {
    const name = icon.replace(UNDERSCORE_REGEX, ' ');
    const id = createId();
    const iconElem = createInstance(cd.ElementEntitySubType.Icon, projectId, id)
      .assignName(name)
      .addInputs<cd.IIconInputs>({ iconName: icon })
      .build();
    boardContent.rootIds.push(iconElem.id);
    boardContent.models.push(iconElem);
  }

  return { boards: [board], boardContents: [boardContent] };
};

const createSwatch = (cid: string, color: cd.IDesignColor, projectId: string) => {
  const { value, name } = color;
  const id = createId();
  return createInstance(cd.ElementEntitySubType.Generic, projectId, id)
    .assignName(name)
    .assignBackgroundColor(value, cid)
    .assignDisplayStyle(cd.Display.InlineFlex)
    .assignWidth(100)
    .assignHeight(100)
    .assignOverflow(cd.Overflow.Hidden, cd.Overflow.Auto)
    .addBaseStyle({ border: [SWATCH_BORDER] })
    .assignPadding()
    .build();
};

const sortEntries = (a: [string, cd.ITypographyStyle], b: [string, cd.ITypographyStyle]) => {
  const [, aType] = a;
  const [, bType] = b;
  if (aType.size < bType.size) return 1;
  if (aType.size > bType.size) return -1;
  return 0;
};

export const generateStyleGuideBoard = (
  designSystem: cd.IDesignSystem,
  projectId: string
): cd.ICreateBoardPayload => {
  const boardId = createId();
  const board = createInstance(cd.ElementEntitySubType.Board, projectId, boardId)
    .assignPadding(10, 10, 10, 10)
    .assignWidth(540)
    .assignHeight(760)
    .build();
  const boardContent: cd.IComponentInstanceGroup = { rootIds: [], models: [] };
  const colorEntries = Object.entries(designSystem.colors);

  for (const [colorId, color] of colorEntries) {
    const swatchEl = createSwatch(colorId, color, projectId);
    boardContent.rootIds.push(swatchEl.id);
    boardContent.models.push(swatchEl);
  }

  const typeEntries = Object.entries(designSystem.typography).filter(
    ([key]) => key !== TextType.IconFontFamily
  );
  // sort type ramp entries by font size
  const sortedTypeEntries = typeEntries.sort(sortEntries);

  for (const [typeId, type] of sortedTypeEntries) {
    const { name } = type;
    const id = createId();
    const typeElement = createInstance(cd.ElementEntitySubType.Text, projectId, id)
      .assignName(name)
      .addInputs<cd.ITextInputs>({ innerHTML: name })
      .assignDisplayStyle(cd.Display.Block)
      .assignFont(type, typeId)
      .build();

    boardContent.rootIds.push(typeElement.id);
    boardContent.models.push(typeElement);
  }
  return { boards: [board], boardContents: [boardContent] };
};
