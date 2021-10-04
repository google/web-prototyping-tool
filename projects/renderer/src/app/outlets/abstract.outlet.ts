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

import { ComponentRef, NgModuleRef } from '@angular/core';
import { createComponent } from './outlet.utils';
import { ICompilationPayload, IOutletRef } from '../utils/interfaces';
import { getOutletCompilationPayload } from '../utils/compiler.utils';
import { rendererState } from '../state.manager';
import { Observable, Subscription } from 'rxjs';
import type * as cd from 'cd-interfaces';

export interface IRenderComponent {
  animateIn?: () => void;
  /** Close public method */
  close: () => void;
  /** Close animation completed */
  closed: Observable<void>;
}

export default abstract class AbstractOutlet {
  public tagName = '';
  public subscription = Subscription.EMPTY;
  public outletRef?: IOutletRef<any>;

  get isActive() {
    return this.outletRef !== undefined;
  }

  get contentComponent() {
    return this.outletRef?.contentRef;
  }

  get component() {
    return this.outletRef?.compRef as ComponentRef<IRenderComponent>;
  }

  attachInputs(_action: cd.ActionBehavior, _targetBoard: cd.PropertyModel) {}

  insertIntoOutlet = <T>(
    outletDocument: HTMLDocument,
    outletAppModuleRef: NgModuleRef<cd.IRenderOutletApp>,
    compilationPayload: ICompilationPayload<T> | undefined,
    tagName: string
  ): IOutletRef<T> | undefined => {
    const outletCompilation = getOutletCompilationPayload();
    if (!compilationPayload || !outletCompilation) return undefined;

    const contentRef = createComponent(outletCompilation, outletDocument, outletAppModuleRef);
    if (!contentRef) return undefined;
    // Setting the elementClassPrefix will create a namespace for this board which prevents style conflicts
    contentRef.instance.elementClassPrefix = this.tagName;
    // create modal component with outlet component as child content
    const compRef = createComponent(
      compilationPayload,
      outletDocument,
      outletAppModuleRef,
      tagName,
      [[contentRef.location.nativeElement]]
    );

    // insert modal component into body
    outletDocument.body.appendChild(compRef.location.nativeElement);
    return { compRef, contentRef };
  };

  insertComponent<T>(
    outletDocument: HTMLDocument,
    outletAppModuleRef: NgModuleRef<cd.IRenderOutletApp> | undefined,
    compilationPayload: ICompilationPayload<T> | undefined
  ) {
    if (this.isActive || !outletAppModuleRef) return;
    this.outletRef = this.insertIntoOutlet<T>(
      outletDocument,
      outletAppModuleRef,
      compilationPayload,
      this.tagName
    );
  }

  updateStyles = () => {
    const { contentComponent } = this;
    if (!contentComponent) return;
    contentComponent.instance.styleMap = rendererState.stylesMap;
  };

  close() {
    this.component?.instance.close();
  }

  dismiss(outletDocument: HTMLDocument) {
    const { outletRef } = this;
    if (!outletRef) return;
    this.subscription.unsubscribe();
    outletDocument.body.removeChild(outletRef.compRef.location.nativeElement);
    outletRef.contentRef.destroy();
    outletRef.compRef.destroy();
    delete this.outletRef;
  }

  subscribeToDismiss(fn: () => void) {
    const { component } = this;
    if (!component) return;
    this.subscription = component.instance.closed.subscribe(fn);
  }
}
