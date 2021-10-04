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

import { DEFAULT_BACKDROP_COLOR } from '../modal/modal.consts';
import { ICompilationPayload } from '../../utils/interfaces';
import { CD_OUTLET_DRAWER_TAGNAME } from 'cd-common/consts';
import AbstractOutlet from '../../outlets/abstract.outlet';
import { compileModule } from '../../utils/compiler.utils';
import { DrawerComponent } from './drawer.component';
import { ComponentRef } from '@angular/core';
import { OutletDrawerModule } from './drawer.module';
import type * as cd from 'cd-interfaces';

let _compiledPayload: ICompilationPayload<DrawerComponent> | undefined;

/** Wrapper interface for controlling the Drawer outlet */
export default class DrawerOutlet extends AbstractOutlet {
  public tagName = CD_OUTLET_DRAWER_TAGNAME;

  static async compile() {
    _compiledPayload = await compileModule<DrawerComponent>(
      OutletDrawerModule,
      'drawer-component-set'
    );
  }

  static getCompilationPayoad() {
    return _compiledPayload;
  }

  get component() {
    return super.component as ComponentRef<DrawerComponent>;
  }

  attachInputs(action: cd.IActionBehaviorOpenDrawer, targetBoard: cd.PropertyModel) {
    const { component } = this;
    if (!component) return;
    const { size, backdropColor, position, shadow, mode } = action;
    component.instance.backdropColor = String(backdropColor?.value) ?? DEFAULT_BACKDROP_COLOR;
    component.instance.position = position;
    component.instance.mode = mode;
    component.instance.shadow = shadow ?? '';
    component.instance.size = size ?? targetBoard.frame.width;
  }
}
