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
import { createInstance, TemplateFactory } from 'cd-common/models';
import { EMPTY_REFERENCE_ID } from 'cd-common/consts';
import { runTemplateTests, runInstanceTests, formatHtml } from '../../test.utils';
import { SymbolInstanceFactory } from './symbol-instance';
import symbolInstanceTemplateFunction from './symbol-instance.template';
import { SymbolFactory } from '../symbol/symbol';

const internalTemplate = `
  <cd-outlet
    *ngIf="(props?.inputs?.referenceId | circularGuardPipe:ancestors:renderId) && props?.inputs?.referenceId | hasValuePipe:propertiesMap"
    [renderId]="props?.inputs?.referenceId"
    outletType="SymbolInstance"
    [instanceProps]="props"
    [instanceId]="elementId"
    [elementClassPrefix]="elementId | classPrefixPipe : elementClassPrefix"
    [propertiesMap]="propertiesMap"
    [styleMap]="styleMap"
    [assets]="assets"
    [designSystem]="designSystem"
    [ancestors]="ancestors"
    [datasets]="datasets"
    [loadedData]="loadedData"
    [addMarkerToInnerRoot]="outletRoot"
    [cdAttrs]="props?.attrs"
    [cdA11yAttrs]="props?.a11yInputs"
    [cdHidden]="props?.inputs?.hidden | dataBindingLookupPipe:dataBindingRefreshTrigger | coerceBooleanPipe"
  ></cd-outlet>
`;

const simpleTemplate = `<div class="symbol__testSymbolId"><img class="image__testImageId" /></div>`;

// Test internal template
runTemplateTests(cd.ElementEntitySubType.SymbolInstance, internalTemplate);

// Text export template, requires additional checks
describe('SymbolInstance template tests', () => {
  it('should create a simple template for export', () => {
    // Create a symbol that contains an image and then create instance of it
    const projectId = 'projectId';
    const testId = 'testId';
    const symbolId = 'testSymbolId';
    const imageId = 'testImageId';

    const symbol = new SymbolFactory(projectId, symbolId).addChildId(imageId).build();

    const image = createInstance(cd.ElementEntitySubType.Image, projectId, imageId)
      .assignParentId(symbolId)
      .assignRootId(symbolId)
      .build();

    const symbolInstance = new SymbolInstanceFactory(projectId, testId)
      .assignReferenceId(symbolId)
      .build();

    TemplateFactory.projectProperties = {
      [testId]: symbolInstance,
      [symbolId]: symbol,
      [imageId]: image,
    };

    const template = symbolInstanceTemplateFunction(cd.TemplateBuildMode.Simple, symbolInstance);
    const formattedTemplate = formatHtml(template);
    const expected = formatHtml(simpleTemplate);
    expect(formattedTemplate).toEqual(expected);
  });
});

runInstanceTests(
  cd.ElementEntitySubType.SymbolInstance,
  {
    name: 'My Component',
    elementType: cd.ElementEntitySubType.SymbolInstance,
    styles: {
      base: {
        style: {
          position: cd.PositionType.Relative,
          opacity: 1,
        },
      },
    },
    inputs: { referenceId: EMPTY_REFERENCE_ID, hidden: false } as cd.IRootInstanceInputs,
    instanceInputs: {},
    variant: null,
    dirtyInputs: Object({}),
  } as Partial<SymbolInstanceFactory>,
  { position: cd.PositionType.Relative, opacity: 1 }
);
