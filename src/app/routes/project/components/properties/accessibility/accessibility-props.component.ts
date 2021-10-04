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
  ariaAttributes,
  ariaRoleDefaults,
  ariaRoleAttrsSupported,
  globalAriaAttrs,
} from 'cd-metadata/aria';
import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { IA11yAttr, IA11yInputs } from 'cd-interfaces';
import { AnalyticsEvent, IAnalyticsEvent } from 'cd-common/analytics';
import * as consts from 'cd-common/consts';
import { findA11yAttributeByName, isAttrRoleDefault } from 'cd-common/utils';

@Component({
  selector: 'app-accessibility-props',
  templateUrl: './accessibility-props.component.html',
  styleUrls: ['./accessibility-props.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccessibilityPropsComponent {
  private _a11yInputs: IA11yInputs = {};
  public ariaLabelResetState = '';
  public ariaLabelValue = this.ariaLabelResetState;
  public roleResetState = '(no role)';
  public selectedRole = this.roleResetState;
  public roleDefaultAttrs: IA11yAttr[] = [];
  public a11yNotes = '';
  public additionalAriaAttrs: IA11yAttr[] = [];
  public allAdditionalAriaKeys: string[] = [];
  public allAriaAttributesKeys: string[] = Object.keys(ariaAttributes);
  /** aria attributes that get sorted into the top global section */
  public globalAriaAttributeKeys = [consts.ARIA_LABEL_ATTR, consts.ARIA_ROLE_ATTR];
  public globalAriaAttrs: IA11yAttr[] = [];

  @Input()
  get a11yInputs(): IA11yInputs {
    return this._a11yInputs;
  }
  set a11yInputs(inputs: IA11yInputs) {
    // TODO: cleanup
    this._a11yInputs = inputs || {};
    this.globalAriaAttrs = this.getGlobalAttrs();
    this.selectedRole = this.getAriaAttrValue(consts.ARIA_ROLE_ATTR) || '';
    this.roleDefaultAttrs = this.getDefaultAttrsForRole(this.selectedRole);

    // List of leftover aria attrs that aren't top level (global or defaults sections)
    this.additionalAriaAttrs =
      this._a11yInputs.ariaAttrs?.filter((attr: IA11yAttr) => {
        return this.ariaAdditionalKeysFilter(attr.name);
      }) || [];

    // Get supported attrs if a role is selected, otherwise allow all attrs
    const supportedKeysForRole = this.selectedRole
      ? [...(ariaRoleAttrsSupported[this.selectedRole] || []), ...globalAriaAttrs]
      : this.allAriaAttributesKeys;
    // These keys are used for the additional attrs dropdown population
    this.allAdditionalAriaKeys = supportedKeysForRole.filter(this.ariaAdditionalKeysFilter);

    this.a11yNotes = this._a11yInputs.notes || '';
  }

  @Output() a11yInputsChange = new EventEmitter<IA11yInputs>();
  @Output() analyticsEvent = new EventEmitter<IAnalyticsEvent>();

  get topLevelA11yKeys(): string[] {
    const defaultKeys: string[] = this.roleDefaultAttrs?.map((attr) => attr.name) || [];
    return [...this.globalAriaAttributeKeys, ...defaultKeys];
  }

  // Any aria attrs that are not already being used as global/defaults attrs will filter down to additional attrs section
  ariaAdditionalKeysFilter = (value: string): boolean => !this.topLevelA11yKeys.includes(value);

  getAriaAttrValue(attrName: string) {
    const value = findA11yAttributeByName(this.a11yInputs.ariaAttrs, attrName)?.value;
    return value ? String(value) : undefined;
  }

  getGlobalAttrs() {
    return this.globalAriaAttributeKeys.map((attrKey: string) => {
      const existingGlobalAttr = findA11yAttributeByName(this.a11yInputs.ariaAttrs, attrKey);
      return existingGlobalAttr || { name: attrKey, value: '' };
    });
  }

  /** Pull default attr meta for the role, replace if any have been updated by the user */
  getDefaultAttrsForRole(selectedRole: string): IA11yAttr[] {
    const roleDefaultAttrs = ariaRoleDefaults[selectedRole] || [];
    const updatedRoleDefaultAttrs = roleDefaultAttrs.map((defaultAttr: IA11yAttr) => {
      const existingDefaultAttr = findA11yAttributeByName(
        this.a11yInputs.ariaAttrs,
        defaultAttr.name
      );
      return existingDefaultAttr || { ...defaultAttr };
    });
    return updatedRoleDefaultAttrs;
  }

  resetAttrs() {
    const ariaAttrs: IA11yAttr[] = [];
    this.a11yInputsChange.emit({ ...this.a11yInputs, ariaAttrs });
  }

  onAriaAttrChange(updatedAttr: IA11yAttr, deleteAttr = false) {
    // TODO:() cleanup
    const { ariaAttrs } = this.a11yInputs;
    let updatedAriaAttrs: IA11yAttr[] | undefined = [];

    const isTopLevelAttribute = !this.ariaAdditionalKeysFilter(updatedAttr.name);
    const isEmptyValue = updatedAttr.value === '' || updatedAttr.value === undefined;
    const isRoleDefault = isAttrRoleDefault(updatedAttr, this.selectedRole);
    if (deleteAttr || isRoleDefault || (isTopLevelAttribute && isEmptyValue)) {
      // Delete as user action, or remove the attribute because empty is not allowed for top level global attributes
      updatedAriaAttrs = ariaAttrs?.filter((attr: IA11yAttr) => attr.name !== updatedAttr.name);
    } else {
      const existingAttr = findA11yAttributeByName(ariaAttrs, updatedAttr.name);
      if (existingAttr) {
        // If the valid attr already exists on the instance, update it
        updatedAriaAttrs = ariaAttrs?.map((attr: IA11yAttr) => {
          return attr.name === updatedAttr.name ? updatedAttr : attr;
        });
      } else {
        // If the attr does not exist on the instance, add it.
        updatedAriaAttrs = [...(ariaAttrs || []), updatedAttr];
        this.sendAddedAnalyticsEvent(updatedAttr.name);
      }
    }

    this.a11yInputsChange.emit({ ...this.a11yInputs, ariaAttrs: updatedAriaAttrs });
  }

  sendAddedAnalyticsEvent(name: string) {
    this.analyticsEvent.emit({ type: AnalyticsEvent.A11yAttrAdded, params: { name } });
  }

  onNotesChange(updatedNotes: string) {
    const { notes } = this.a11yInputs;
    if (notes === updatedNotes) return;
    this.a11yInputsChange.emit({ ...this.a11yInputs, notes: updatedNotes });
    this.analyticsEvent.emit({ type: AnalyticsEvent.A11yNotesModified });
  }
}
