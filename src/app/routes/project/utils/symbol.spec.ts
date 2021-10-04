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

import data from './symbol.spec.json';
import * as models from 'cd-common/models';
import * as utils from './symbol-overrides';
import * as inputUtils from './symbol-input.utils';
import * as symUtils from './symbol.utils';
import * as cd from 'cd-interfaces';
import { applyChangeToElementContent, createContentSection } from 'cd-common/utils';

describe('Create Symbol - ', () => {
  const { before, after } = data.create;
  const project = before.project as unknown as cd.IProject;
  const symbolID = after.symbolId;
  const symbolMap: cd.ISymbolMap = {};
  const elementProperties = before.elementProperties as cd.ElementPropertiesMap;
  const elementContent = createContentSection(elementProperties, true);
  const afterProperties = after.elementProperties as cd.ElementPropertiesMap;
  const selected = before.selected as string[];
  const elements = selected.map((id) => elementProperties[id]) as cd.PropertyModel[];
  const rootElements = models.sortAndFilterElements(elements, elementProperties);
  const firstRootName = (rootElements.length === 1 && rootElements[0]?.name) || undefined;
  const name = symUtils.incrementedSymbolName(symbolMap, firstRootName);
  const dimension = afterProperties[symbolID]?.frame as cd.Dimensions;
  const renderRects: cd.RenderRectMap = new Map(Object.entries(before.renderRects));
  const { symbol, symbolInstance, change } = symUtils.createSymbolFromElements(
    name,
    project.id,
    rootElements,
    elementProperties,
    renderRects,
    dimension,
    symbolMap
  );

  const contentAfterChange = applyChangeToElementContent(change, elementContent);
  const { records } = contentAfterChange;
  const testSymbol = {
    ...records[symbol.id],
    id: symbolID,
    rootId: symbolID,
  } as cd.ISymbolProperties;
  (testSymbol as any).position = []; // legacy requirement

  const expectedSymbol = afterProperties[symbolID] as cd.ISymbolProperties;
  const testInstance = records[symbolInstance.id] as cd.ISymbolInstanceProperties;

  it('Should not create legacy symbolInputs', () => {
    expect(testSymbol.symbolInputs).toEqual({});
  });

  it('Did generate symbol', () => {
    expect(testSymbol).toEqual(expectedSymbol);
  });

  it('Did generate symbol instance', () => {
    expect(testInstance).toBeDefined();
    const symbolChildren = new Set(testSymbol.childIds);
    const inputKeys = Object.keys(testInstance.instanceInputs);
    const validInputsOnInstance = inputKeys.every((id) => symbolChildren.has(id));
    // Checks to see if every symbol instances's inputs are exist on the symbol
    expect(validInputsOnInstance).toBeTrue();

    // The inital state of a symbol instance instanceInputs should match defaultInputs
    expect(testSymbol.defaultInputs).toEqual(testInstance.instanceInputs);

    const validDirectChildren = testSymbol.childIds.every((id) => symbolChildren.has(id));
    expect(validDirectChildren).toBeTrue();
  });
});

describe('Convert Legacy Symbol Overrides - ', () => {
  const { overrides } = data;
  const symbolID = overrides.symbolId;
  const elementProperties = overrides.legacy as cd.ElementPropertiesMap;
  const symbol = elementProperties[symbolID] as cd.ISymbolProperties;
  const symbolChildren = models.getChildren(symbol.id, elementProperties);
  const instanceInputs = utils.generateSymbolInstanceDefaults(symbolChildren);
  const prevInputs = inputUtils.processPrevSymbolInputs(symbol, instanceInputs);
  const changes = inputUtils.processInstanceToNullifyChanges(instanceInputs, prevInputs);
  const exposedInputs = symUtils.updateExposedSymbolInputs(symbol, symbolChildren);
  const updatePayload = symUtils.getSymInstUpdate(symbolID, changes, exposedInputs);
  const symUpdate = updatePayload.properties as cd.ISymbolProperties;
  const expected = overrides.expected as cd.ElementPropertiesMap;
  const expectedSymbol = expected[symbolID] as cd.ISymbolProperties;

  it('Did generate exposed inputs', () => {
    expect(symbol.exposedInputs).toBeUndefined();
    expect(exposedInputs).toEqual(expectedSymbol.exposedInputs as Record<string, boolean>);
  });

  /** We want to remove symbolInputs after migrating to reduce the size of the stored object */
  it('Did remove symbolInputs', () => {
    expect(symbol.symbolInputs).toBeDefined();
    // null values get purged by the database
    expect(symUpdate.symbolInputs).toBeNull();
  });

  /**
   * defaultInputs replaces symbolInputs (legacy) for defining which properties are exposed by a symbol,
   * this data model reuses SymbolInstanceInputs instead of the unique one used by symbolInputs
   */
  it('Did add defaultInputs', () => {
    expect(symbol.defaultInputs).toBeUndefined();
    expect(symUpdate.defaultInputs).toEqual(expectedSymbol.defaultInputs);
  });
});
