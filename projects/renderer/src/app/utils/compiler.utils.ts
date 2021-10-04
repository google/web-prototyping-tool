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

import {
  NgModule,
  Component,
  ViewEncapsulation,
  CUSTOM_ELEMENTS_SCHEMA,
  ComponentFactory,
  Compiler,
} from '@angular/core';
import { DEFAULT_COMPONENT_MODULES } from '../configs/compiler.config';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { OutletComponentDirective } from '../outlets/outlet.component';
import { assembleAllTemplates } from 'cd-common/models';
import { CD_OUTLET_TAGNAME } from 'cd-common/consts';
import { PerfEvent } from './performance.utils';
import { postError } from './messaging.utils';
import { ICompilationPayload } from './interfaces';
import { Subject } from 'rxjs';
// Needed to enable use of Jit Compiler at runtime
import '@angular/compiler';

export const compilationUpdate$ = new Subject<void>();

const compilerProviders = [{ provide: Compiler, useValue: new Compiler() }];
const platformRef = platformBrowserDynamic(compilerProviders);
const jitCompiler: Compiler = platformRef.injector.get(Compiler);

let _compiledOutletComponents: ICompilationPayload<OutletComponentDirective> | undefined;

const generateModule = (declarations: any[]) => {
  return NgModule({
    imports: DEFAULT_COMPONENT_MODULES,
    declarations,
    exports: declarations,
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
  })(class {});
};

const generateComponent = () => {
  const template = assembleAllTemplates();

  return Component({
    selector: CD_OUTLET_TAGNAME,
    template,
    encapsulation: ViewEncapsulation.None,
  })(class extends OutletComponentDirective {});
};

export const compileModule = async <T>(
  ngModule: any,
  compilationId = 'component-set'
): Promise<ICompilationPayload<T> | undefined> => {
  try {
    performance.mark(PerfEvent.JitStart);
    const result = await jitCompiler.compileModuleAndAllComponentsAsync(ngModule);
    performance.mark(PerfEvent.JitEnd);
    performance.measure(`JIT - ${compilationId}`, PerfEvent.JitStart, PerfEvent.JitEnd);

    // save compilation result
    const { componentFactories, ngModuleFactory } = result;

    // our dynamically defined component will always be last in this list
    const cmpFactory: ComponentFactory<T> = componentFactories[componentFactories.length - 1];
    return { cmpFactory, ngModuleFactory };
  } catch (err) {
    // Catch error here instead of in global error handler, so that we know which board caused
    // the compiler error
    console.log('Compiler error', err);
    performance.clearMarks(PerfEvent.JitEnd);
    postError(err);
    return undefined;
  }
};

/**
 *  on initialization compile initial set of components
 */
export const compileOutletComponentDirectiveSet = async () => {
  const component = generateComponent();
  const ngModule = generateModule([component]);
  _compiledOutletComponents = await compileModule(ngModule);
  compilationUpdate$.next();
};

export const getOutletCompilationPayload = ():
  | ICompilationPayload<OutletComponentDirective>
  | undefined => {
  return _compiledOutletComponents;
};
