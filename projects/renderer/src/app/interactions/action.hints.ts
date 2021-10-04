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

import { rendererState } from '../state.manager';
import { TEMPLATE_ID_ATTR } from 'cd-common/consts';
import { isButton, wrapInBrackets } from 'cd-common/models';
import * as cd from 'cd-interfaces';

/** Defined in renderer/src/styles/index.scss */
const CANVAS_CLASS = 'co-hint-canvas';
const HINT_COLOR = '250,123,23';
const HINT_FILL_ALPHA = '0.2';

const APPROVED_HINT_SUBTYPES: ReadonlyArray<string> = [
  cd.ElementEntitySubType.Board,
  cd.ElementEntitySubType.Button,
  cd.ElementEntitySubType.BoardPortal,
  cd.ElementEntitySubType.Symbol,
  cd.ElementEntitySubType.SymbolInstance,
  cd.ElementEntitySubType.Generic,
  cd.ElementEntitySubType.Icon,
  cd.ElementEntitySubType.Image,
  cd.ElementEntitySubType.Text,
  cd.ElementEntitySubType.Spinner,
];

/**
 * Dont show a hint if the user clicks a component with built-in behavior
 * i.e A dropdown, code component, date picker etc
 */
const canShowHintForElementType = (element: cd.PropertyModel): boolean => {
  if (isButton(element) && element.inputs.menu?.length) return false;
  return APPROVED_HINT_SUBTYPES.includes(element.elementType);
};

const lookupElementsAndReturnRects = (
  elements: ReadonlyArray<string>,
  doc: HTMLDocument
): ReadonlyArray<cd.IRect> => {
  return (
    elements
      // Batch querySelector calls
      .map((id) => {
        const selector = wrapInBrackets(`${TEMPLATE_ID_ATTR}="${id}"`);
        return doc.querySelector(selector);
      })
      // Batch getClientRectCalls
      .reduce<cd.IRect[]>((acc, elem) => {
        if (!elem) return acc;
        const { left: x, top: y, width, height } = elem.getBoundingClientRect();
        acc.push({ x, y, width, height });
        return acc;
      }, [])
  );
};

/** Visual overlay within preview showing where to interact */
export const generateActionHints = (
  target: HTMLElement,
  type: cd.EventTriggerType,
  actions: cd.ActionBehavior[],
  elementId: string,
  _instanceId?: string // todo for embeded elements
) => {
  // Only show if click event and actions have length
  if (type !== cd.EventTrigger.Click || actions.length) return;

  const doc = target.ownerDocument;
  const win = doc.defaultView;
  if (!win) return;

  // A hint is already being shown
  if (doc.body.querySelector(`.${CANVAS_CLASS}`)) return;

  const element = rendererState.getElementById(elementId);
  if (!element || !canShowHintForElementType(element)) return;

  const instance = _instanceId && rendererState.getElementById(_instanceId);
  const rootId = (instance as any)?.inputs?.referenceId || element.rootId;
  const boardElementsWithClickActions = rendererState.boardClickActionElementIds.get(rootId) || [];

  if (!boardElementsWithClickActions.length) return;

  const rects = lookupElementsAndReturnRects(boardElementsWithClickActions, doc);
  if (!rects.length) return;

  const canvas: HTMLCanvasElement = doc.createElement('canvas');
  canvas.classList.add(CANVAS_CLASS);
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  canvas.width = win.innerWidth;
  canvas.height = win.innerHeight;
  ctx.fillStyle = `rgba(${HINT_COLOR},${HINT_FILL_ALPHA})`;
  ctx.strokeStyle = `rgb(${HINT_COLOR})`;

  ctx.beginPath();

  for (const { x, y, width, height } of rects) {
    ctx.rect(x, y, width, height);
  }

  ctx.fill();
  ctx.stroke();

  doc.body.appendChild(canvas);

  const ani = [{ opacity: 0 }, { opacity: 1 }, { opacity: 1 }, { opacity: 0 }];
  const config = { duration: 1000, easing: cd.ActionEasing.EaseOut };
  canvas.animate(ani, config).finished.then(() => canvas.remove());
};
