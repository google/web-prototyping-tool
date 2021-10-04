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

import { Frame, ElementHandle } from 'puppeteer';
import { ICSSValues } from '../../models/props.interfaces';
import { getPartialStyles } from '../common/dom.utils';
import { POLLING } from '../../consts/puppeteer.consts';

// Disabling tslint rule to make the following in-frame evaluator cleaner --
// if queries result in null elements, by definition we should fail

export const waitForElement = async (
  iframe: ElementHandle<HTMLIFrameElement>,
  selector: string
): Promise<ElementHandle<Element>> => {
  const frame = (await iframe.contentFrame()) as Frame;
  await frame.waitForSelector(selector);
  const elem = await frame.$(selector);
  return elem as ElementHandle<Element>;
};

export const waitForElementExit = async (
  iframe: ElementHandle<Element>,
  selector: string
): Promise<boolean> => {
  const frame = (await iframe.contentFrame()) as Frame;
  await frame.waitForFunction(
    (elementSelector: string) => document.querySelector(elementSelector) === null,
    POLLING,
    selector
  );

  return true;
};

export const getElementStyles = async (
  iframe: ElementHandle<Element>,
  selector: string,
  props: string[]
): Promise<ICSSValues> => {
  const elem = await waitForElement(iframe, selector);
  const frame = (await iframe.contentFrame()) as Frame;
  const styles = await getPartialStyles(frame, elem as ElementHandle<Element>, props);

  return styles;
};

export const clickElement = async (iframe: ElementHandle<Element>, selector: string) => {
  const elem = await waitForElement(iframe, selector);
  await elem.click();
};

export const waitForElementToDisappear = async (
  iframe: ElementHandle<Element>,
  selector: string
): Promise<boolean> => {
  return await waitForElementExit(iframe, selector);
};
