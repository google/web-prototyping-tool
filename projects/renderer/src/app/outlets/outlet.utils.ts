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

import { ICompilationPayload } from '../utils/interfaces';
import { NgModuleRef, ComponentRef, Injector } from '@angular/core';
import { generateElementsStyles } from '../utils/renderer.utils';
import { OutletComponentDirective } from './outlet.component';
import * as utils from '../utils/compiler.utils';
import { STYLES_PROP } from 'cd-common/consts';
import getProviders from './outlet.providers';
import * as consts from 'cd-common/consts';
import type * as cd from 'cd-interfaces';

const createOutletInjector = (
  outletDocument: HTMLDocument,
  outletAppModuleRef: NgModuleRef<cd.IRenderOutletApp>
): Injector => {
  return Injector.create({
    providers: getProviders(outletDocument, outletAppModuleRef),
    parent: outletAppModuleRef.injector,
  });
};

export const createDetachedOutlet = <T>(
  compilationPayload: ICompilationPayload<T>,
  outletDocument: HTMLDocument,
  outletAppModuleRef: NgModuleRef<cd.IRenderOutletApp>,
  cmpTagname: string = consts.CD_OUTLET_TAGNAME
): ComponentRef<T> => {
  const { cmpFactory, ngModuleFactory } = compilationPayload;
  const outletInjector = createOutletInjector(outletDocument, outletAppModuleRef);
  const targetEl = outletDocument.createElement(cmpTagname);
  const ngMod = ngModuleFactory.create(outletInjector);
  const cmpRef = cmpFactory.create(ngMod.injector, undefined, targetEl, ngMod);
  // ensure that component host element and all child elements list outletDocument as ownerDocument
  outletDocument.adoptNode(cmpRef.location.nativeElement);
  // // Attach component to outlet app change detection
  cmpRef.changeDetectorRef.detectChanges();
  return cmpRef;
};

export const createComponent = <T>(
  compilationPayload: ICompilationPayload<T>,
  outletDocument: HTMLDocument,
  outletAppModuleRef: NgModuleRef<cd.IRenderOutletApp>,
  cmpTagname: string = consts.CD_OUTLET_TAGNAME,
  projectableNodes?: any[][]
): ComponentRef<T> => {
  const { cmpFactory, ngModuleFactory } = compilationPayload;
  const { appRef } = outletAppModuleRef.instance;
  const outletInjector = createOutletInjector(outletDocument, outletAppModuleRef);
  const targetEl = outletDocument.createElement(cmpTagname);
  const ngMod = ngModuleFactory.create(outletInjector);
  const cmpRef = cmpFactory.create(ngMod.injector, projectableNodes, targetEl, ngMod);

  // ensure that component host element and all child elements list outletDocument as ownerDocument
  outletDocument.adoptNode(cmpRef.location.nativeElement);
  // Attach component to outlet app change detection
  appRef.attachView(cmpRef.hostView);
  cmpRef.changeDetectorRef.detectChanges();
  return cmpRef;
};

/**
 * Create outlet component and insert it into body of outlet document
 */
export const insertComponentIntoOutlet = (
  outletDocument: HTMLDocument,
  outletAppModuleRef: NgModuleRef<cd.IRenderOutletApp>
): ComponentRef<OutletComponentDirective> | undefined => {
  const compilation = utils.getOutletCompilationPayload();
  if (!compilation) return undefined;
  const cmpRef = createComponent(compilation, outletDocument, outletAppModuleRef);
  // insert component into outlet document body
  outletDocument.body.appendChild(cmpRef.location.nativeElement);
  return cmpRef;
};

export const mergeStyles = (
  styleMap: cd.IStringMap<cd.IStyleAttributes> = {},
  overridesMap: cd.IStringMap<cd.IStyleAttributes> = {}
): cd.IStyleDeclaration => {
  const merged: cd.IStringMap<cd.IStyleAttributes> = { ...styleMap };
  for (const override of Object.entries(overridesMap)) {
    const [key, value] = override;
    const styles = styleMap[key];
    const update = {} as cd.IStyleAttributes;
    for (const [styleKey, styleValue] of Object.entries(styles)) {
      if (!(styleKey in value)) continue;
      const valueStyle = value[styleKey] || {};
      update[styleKey] = { ...styleValue, ...valueStyle };
    }
    merged[key] = update;
  }
  return merged;
};

export const generateMergedStyles = (
  instanceProps: cd.ISymbolInstanceProperties,
  stylesMap: cd.IStringMap<cd.IStyleAttributes>,
  mergedProps: cd.ElementPropertiesMap,
  bindings: cd.IProjectBindings
): cd.IStringMap<cd.IStyleAttributes> => {
  const { instanceInputs } = instanceProps;
  const instanceKeys = Object.keys(instanceInputs);
  const styleOverrideKeys = instanceKeys.filter((key) => STYLES_PROP in instanceInputs[key]);
  const { referenceId } = instanceProps.inputs;
  if (referenceId) styleOverrideKeys.push(referenceId);
  const styleOverrideProps = styleOverrideKeys.reduce<cd.ElementPropertiesMap>((acc, curr) => {
    acc[curr] = mergedProps[curr];
    return acc;
  }, {});
  const styleOverrides = generateElementsStyles(styleOverrideProps, bindings);
  return mergeStyles(stylesMap, styleOverrides);
};
