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
import * as shared from '../../shared';
import { deepCopy } from 'cd-utils/object';
import { DIV_TAG, EMPTY_REFERENCE_ID, LayerIcons } from 'cd-common/consts';
import { CdComponent, CdComponentFactory, getComponent } from 'cd-common/models';
import { extractPositionFromStyle, getElementBaseStyles } from 'cd-common/utils';
import templateFunction from './symbol-instance.template';

export class SymbolInstance extends CdComponent {
  tagName = DIV_TAG;
  title = 'My Component';
  childrenAllowed = false;
  icon = LayerIcons.Component;

  inputs: cd.IRootInstanceInputs = {
    referenceId: EMPTY_REFERENCE_ID,
    hidden: false,
  };

  // Note: Any additional properties added to properties panel for a
  // symbol instance need to be added to ignored list in `merge.utils.ts`.
  properties: cd.IPropertyGroup[] = [
    { children: [shared.OVERFLOW_CONFIG] },
    { type: cd.PropertyType.SymbolOverrides, standalone: true },
  ];

  template = templateFunction;
  factory = SymbolInstanceFactory;
}

export class SymbolInstanceFactory
  extends CdComponentFactory
  implements cd.ISymbolInstanceProperties
{
  type: cd.EntityType.Element = cd.EntityType.Element;
  elementType: cd.ElementEntitySubType.SymbolInstance = cd.ElementEntitySubType.SymbolInstance;
  instanceInputs: cd.SymbolInstanceInputs = {};
  variant: string | null = null;
  dirtyInputs = {};

  inputs: cd.IRootInstanceInputs = {
    referenceId: EMPTY_REFERENCE_ID,
    hidden: false,
  };

  constructor(public projectId: string, id: string) {
    super(projectId, id, getComponent(cd.ElementEntitySubType.SymbolInstance) as SymbolInstance);
  }

  assignReferenceId(id: string) {
    this.inputs.referenceId = id;
    return this;
  }

  assignStyles(styles: cd.IStyleAttributes) {
    this.styles = deepCopy(styles);
    return this;
  }

  assignInstanceInputs(inputs: cd.SymbolInstanceInputs) {
    this.instanceInputs = deepCopy(inputs);
    return this;
  }

  assignPositionFromSymbol(symbol: cd.ISymbolProperties) {
    const styles = getElementBaseStyles(symbol);
    const position = extractPositionFromStyle(styles);
    Object.assign(this.styles.base.style, position);
    return this;
  }
}
