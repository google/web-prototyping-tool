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

import { ICompilationPayload } from '../../utils/interfaces';
import AbstractOutlet from '../../outlets/abstract.outlet';
import { CD_OUTLET_MODAL_TAGNAME } from 'cd-common/consts';
import { compileModule } from '../../utils/compiler.utils';
import { overlaySizeFromAction } from 'cd-common/utils';
import { DEFAULT_BACKDROP_COLOR } from './modal.consts';
import { OutletModalModule } from './modal.module';
import { ModalComponent } from './modal.component';
import { ComponentRef } from '@angular/core';
import * as cd from 'cd-interfaces';

let _compiledPayload: ICompilationPayload<ModalComponent> | undefined;

/** Wrapper interface for controlling the Modal outlet */
export default class ModalOutlet extends AbstractOutlet {
  public tagName = CD_OUTLET_MODAL_TAGNAME;

  static async compile() {
    _compiledPayload = await compileModule<ModalComponent>(
      OutletModalModule,
      'modal-component-set'
    );
  }

  static getCompilationPayoad() {
    return _compiledPayload;
  }

  get component() {
    return super.component as ComponentRef<ModalComponent>;
  }

  attachInputs(action: cd.IActionBehaviorPresentModal, targetBoard: cd.PropertyModel) {
    const { component } = this;
    if (!component) return;
    const { width, height, backgroundColor, shadow, borderRadius } = action;
    const backdropColor = String(backgroundColor?.value);
    component.instance.backdropColor = backdropColor ?? DEFAULT_BACKDROP_COLOR;
    const size = overlaySizeFromAction(action);
    const isBoardSize = size === cd.OverlaySize.Board;
    const { width: fw, height: fh } = targetBoard.frame;
    component.instance.contentWidth = isBoardSize ? fw : width ?? fw;
    component.instance.contentHeight = isBoardSize ? fh : height ?? fh;
    component.instance.borderRadius = borderRadius ?? 0;
    component.instance.boxShadow = shadow ?? '';
    component.instance.size = size;
  }

  updateSize(frame?: cd.IRect) {
    const instance = this.component.instance;
    if (!instance || !frame) return;
    // Size was specified by the action or defined by the content
    if (instance.size === cd.OverlaySize.Custom || instance.size === cd.OverlaySize.Content) return;
    this.component.instance.contentWidth = frame.width;
    this.component.instance.contentHeight = frame.height;
  }
}
