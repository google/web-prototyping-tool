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

import type { IA11yAttr } from 'cd-interfaces';
import {
  isA11yAttrDisabled,
  getDefaultAttrValueForRole,
  getImplicitRoleFromTag,
  isAttrRoleDefault,
} from './a11y.utils';

const labelAttr: IA11yAttr = { name: 'aria-label', value: 'foo' };

describe('a11y utils', () => {
  it('isA11yAttrDisabled util', () => {
    const disabled: IA11yAttr = { ...labelAttr, disabled: true };
    const invalid: IA11yAttr = { ...labelAttr, invalid: true };
    const blank1: IA11yAttr = { ...labelAttr, value: '' };
    const blank2: IA11yAttr = { name: 'aria-label' };

    expect(isA11yAttrDisabled(labelAttr)).toBeFalse();
    expect(isA11yAttrDisabled(disabled)).toBeTrue();
    expect(isA11yAttrDisabled(invalid)).toBeTrue();
    expect(isA11yAttrDisabled(blank1)).toBeTrue();
    expect(isA11yAttrDisabled(blank2)).toBeTrue();
  });

  it('getDefaultAttrValueForRole util', () => {
    expect(getDefaultAttrValueForRole('alert', 'aria-live')).toBe('assertive');
    expect(getDefaultAttrValueForRole('alertdialog', 'aria-live')).toBeUndefined();
  });

  it('getImplicitRoleFromTag util', () => {
    expect(getImplicitRoleFromTag('header')).toBe('banner');
    expect(getImplicitRoleFromTag('div')).toBeUndefined();
  });

  it('isAttrRoleDefault util', () => {
    let liveAttr: IA11yAttr = { name: 'aria-live', value: 'polite' };
    // on role, but not default value
    expect(isAttrRoleDefault(liveAttr, 'alert')).toBeFalse();
    // on role, default value
    liveAttr.value = 'assertive';
    expect(isAttrRoleDefault(liveAttr, 'alert')).toBeTrue();
    // not on role
    expect(isAttrRoleDefault(liveAttr, 'button')).toBeFalse();
    // invalid role
    expect(isAttrRoleDefault(liveAttr, 'foo')).toBeFalse();
  });
});
