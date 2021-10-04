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

import { CdComponent, CdComponentFactory, getComponent, ADVANCED_CONFIG } from 'cd-common/models';
import * as consts from 'cd-common/consts';
import * as shared from '../../shared';
import * as cd from 'cd-interfaces';

export class SymbolIsolated extends CdComponent {
  title = 'Symbol';
  tagName = consts.DIV_TAG;
  childrenAllowed = true;
  icon = consts.LayerIcons.Component;
  autoAddDefaultProperties = false;

  styles = { background: [{ value: 'rgba(255,255,255,0)' }] };

  properties: cd.IPropertyGroup[] = [
    { type: cd.PropertyType.InitialSize },
    shared.POSITION_CONFIG,
    { children: [shared.PADDING_CONFIG, shared.BORDER_RADIUS_CONFIG] },
    { children: [shared.OPACITY_CONFIG, shared.OVERFLOW_CONFIG] },
    shared.INNER_LAYOUT_CONFIG,
    { type: cd.PropertyType.BoardBackground },
    shared.BORDER_CONFIG,
    shared.SHADOW_CONFIG,
    shared.TOOLTIP_CONFIG,
    shared.MATERIAL_RIPPLE_CONFIG,
    ADVANCED_CONFIG,
    { type: cd.PropertyType.BoardPreviewVisibility },
  ];

  factory = SymbolFactory;
}

export class SymbolFactory extends CdComponentFactory implements cd.ISymbolProperties {
  elementType: cd.ElementEntitySubType.Symbol = cd.ElementEntitySubType.Symbol;
  defaultInputs: cd.SymbolInstanceInputs = {};
  exposedInputs: Record<string, boolean> = {};
  /** @deprecated */
  symbolInputs: cd.IStringMap<cd.SymbolInput[]> = {};

  constructor(public projectId: string, id: string) {
    super(projectId, id, getComponent(cd.ElementEntitySubType.Symbol) as SymbolIsolated);
  }

  addExposedInputsForIds(ids: string[]) {
    const values = ids.reduce<Record<string, boolean>>((acc, id) => {
      acc[id] = true;
      return acc;
    }, {});
    this.exposedInputs = { ...this.exposedInputs, ...values };
    return this;
  }

  addDefaultInstanceInputs(inputs: cd.SymbolInstanceInputs) {
    this.defaultInputs = { ...this.defaultInputs, ...inputs };
    return this;
  }
}
