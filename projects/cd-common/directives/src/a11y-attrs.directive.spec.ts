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

import { Component, Input } from '@angular/core';
import { ComponentFixture, ComponentFixtureAutoDetect, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { IA11yAttr, IA11yInputs } from 'cd-interfaces';
import { A11yAttrsDirective } from './a11y-attrs.directive';

const ATTR1 = { name: 'aria-label', value: 'foo' };
const ATTR2 = { name: 'aria-hidden', value: 'true' };

@Component({
  template: `
    <div [cdA11yAttrs]="a11yInputs">attrs</div>
  `,
})
class TestComponent {
  @Input()
  attrs: IA11yAttr[] = [];

  get a11yInputs(): IA11yInputs {
    return {
      ariaAttrs: this.attrs,
    };
  }

  reset() {
    this.attrs = [];
  }
}

describe('A11yAttrsDirective', () => {
  let fixture: ComponentFixture<TestComponent>;
  let component: TestComponent;
  let element: HTMLElement;

  beforeEach(() => {
    fixture = TestBed.configureTestingModule({
      declarations: [A11yAttrsDirective, TestComponent],
      providers: [{ provide: ComponentFixtureAutoDetect, useValue: true }],
    }).createComponent(TestComponent);

    fixture.detectChanges(); // initial binding
    component = fixture.componentInstance;
    element = fixture.debugElement.query(By.directive(A11yAttrsDirective)).nativeElement;
  });

  it('directive should init', () => {
    const directive = fixture.debugElement.query(By.directive(A11yAttrsDirective));
    expect(directive).toBeDefined();
  });

  it('should add/update/remove attrs', () => {
    // add an attr, attr renders
    component.attrs = [ATTR1];
    fixture.detectChanges();
    expect(element.getAttribute(ATTR1.name)).toBe(ATTR1.value);

    // add another attr, both attrs render
    component.attrs = [ATTR1, ATTR2];
    fixture.detectChanges();
    expect(element.getAttribute(ATTR1.name)).toBe(ATTR1.value);
    expect(element.getAttribute(ATTR2.name)).toBe(ATTR2.value);

    // remove one attr, other attr remains
    component.attrs = [ATTR1];
    fixture.detectChanges();
    expect(element.getAttribute(ATTR2.name)).toBeNull();
    expect(element.getAttribute(ATTR1.name)).toBe(ATTR1.value);

    // update attr
    component.attrs = [{ ...ATTR1, value: 'bar' }];
    fixture.detectChanges();
    expect(element.getAttribute(ATTR1.name)).toBe('bar');
  });

  it('should not render invalid attrs', () => {
    // invalid attr
    component.attrs = [{ ...ATTR1, invalid: true }];
    fixture.detectChanges();
    expect(element.getAttribute(ATTR1.name)).toBeNull();

    // disabled attr
    component.attrs = [{ ...ATTR1, disabled: true }];
    fixture.detectChanges();
    expect(element.getAttribute(ATTR1.name)).toBeNull();

    // empty attr
    component.attrs = [{ ...ATTR1, value: '' }];
    fixture.detectChanges();
    expect(element.getAttribute(ATTR1.name)).toBeNull();

    // remove valid attr updated to be invalid
    component.attrs = [ATTR1]; // valid
    fixture.detectChanges();
    expect(element.getAttribute(ATTR1.name)).toBe(ATTR1.value);
    component.attrs = [{ ...ATTR1, invalid: true }];
    fixture.detectChanges();
    expect(element.getAttribute(ATTR1.name)).toBeNull();
  });
});
