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

import { Directive, Input, OnInit } from '@angular/core';
import { PropertyGroupComponent } from 'cd-common';
import { getElementBaseStyles } from 'cd-common/utils';
import * as cd from 'cd-interfaces';

@Directive({ selector: '[appDynamicGroupCollapsed]' })
export class DynamicGroupCollapsedDirective implements OnInit {
  @Input() props?: cd.PropertyModel;
  @Input() appDynamicGroupCollapsed?: cd.IPropertyGroup;

  constructor(private _groupParent: PropertyGroupComponent) {}

  ngOnInit(): void {
    const { props, appDynamicGroupCollapsed } = this;
    if (!props || !appDynamicGroupCollapsed) return;
    this._groupParent.collapsed = this.getCollapsedValue(appDynamicGroupCollapsed, props);
  }

  getCollapsedValue(group: cd.IPropertyGroup, mergedProps: cd.PropertyModel) {
    if (!group.collapsed) return false;
    if (!group.autoExpand) return group.collapsed;
    // Look at the property group's children to see if any values are set
    const inputs = mergedProps.inputs as Record<string, any>;
    const hasInputMatch = group.children?.some(({ name }) => {
      if (!name) return false;
      const value = inputs[name];
      return !!value;
    });

    const styles = group.autoExpandStyles || [];
    if (!styles.length) return !hasInputMatch;
    // Look at the list of autoExpandStyles to see if any values are set
    const baseStyles = getElementBaseStyles(mergedProps);
    const hasStyleMatch = styles.some((name) => {
      const value = (baseStyles as cd.IStyleDeclaration)[name];
      return !!value;
    });
    return !(hasInputMatch || hasStyleMatch);
  }
}
