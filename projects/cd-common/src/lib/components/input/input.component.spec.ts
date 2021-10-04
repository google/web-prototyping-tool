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

import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { InputComponent } from './input.component';
import { InputModule } from './input.module';
import { UnitTypes } from 'cd-metadata/units';
import * as cd from 'cd-interfaces';

const FOO_STRING = 'foo';

describe('InputComponent', () => {
  let component: InputComponent;
  let fixture: ComponentFixture<InputComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        imports: [InputModule],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(InputComponent);
    component = fixture.componentInstance;
  });

  it('should create instance', () => {
    expect(component).toBeTruthy();
  });

  it('outputs strings', () => {
    spyOn(component.change, 'emit');

    component.outputValue(FOO_STRING);
    fixture.detectChanges();
    expect(component.change.emit).toHaveBeenCalledWith(FOO_STRING);
  });

  it('outputs numbers', () => {
    const testValue = 2;
    spyOn(component.change, 'emit');

    component.outputValue(testValue);
    fixture.detectChanges();
    expect(component.change.emit).toHaveBeenCalledWith(testValue);
  });

  it('outputs ISelectItems with no number casting', () => {
    const testValue = {
      id: FOO_STRING,
      title: 'Title Town',
      value: 'Green Bay',
    };
    spyOn(component.change, 'emit');

    component.outputValue(testValue);
    fixture.detectChanges();
    expect(component.change.emit).toHaveBeenCalledWith(testValue);
  });

  it('outputs IValues with no number casting', () => {
    const testValue = {
      id: FOO_STRING,
      value: FOO_STRING,
    };
    spyOn(component.change, 'emit');

    component.outputValue(testValue);
    fixture.detectChanges();
    expect(component.change.emit).toHaveBeenCalledWith(testValue);
  });

  it('should set a placeholder from @Input', () => {
    component.placeholder = FOO_STRING;
    fixture.detectChanges();
    const inputElement = component.inputRefElem;
    expect(inputElement.placeholder).toEqual(FOO_STRING);
  });

  it('can trigger input focus', () => {
    const element = component.wrapperRef.nativeElement;
    component.triggerComponentFocus();
    expect(element.contains(document.activeElement)).toBeTruthy();
  });

  it('attaches events when input is focused', () => {
    const element = component.wrapperRef.nativeElement.querySelector('input');
    const keyDownSpy = spyOn(component, 'onKeyDown');
    const shiftKeySpy = spyOn(component, 'onShiftKey');
    const inputBlurSpy = spyOn(component, 'onInputBlur');
    const shiftKeyEvent = new KeyboardEvent('keydown', {
      key: 'Shift',
    });

    // test that no one's listening
    // before input focus
    element.dispatchEvent(shiftKeyEvent);
    element.dispatchEvent(new Event('keydown'));
    element.dispatchEvent(new Event('blur'));
    expect(shiftKeySpy).toHaveBeenCalledTimes(0);
    expect(keyDownSpy).toHaveBeenCalledTimes(0);
    expect(inputBlurSpy).toHaveBeenCalledTimes(0);

    component.onInputFocus();

    // test that everyone's listening
    // after input focus
    element.dispatchEvent(shiftKeyEvent);
    element.dispatchEvent(new Event('keydown'));
    element.dispatchEvent(new Event('blur'));
    expect(keyDownSpy).toHaveBeenCalled();
    expect(shiftKeySpy).toHaveBeenCalled();
    expect(inputBlurSpy).toHaveBeenCalled();
  });

  it('removes events when input is blurred', () => {
    const inputElement = component.inputRefElem;
    const keyDownSpy = spyOn(component, 'onKeyDown');
    const shiftKeySpy = spyOn(component, 'onShiftKey');
    const inputBlurSpy = spyOn(component, 'onInputBlur');
    const shiftKeyEvent = new KeyboardEvent('keydown', {
      key: 'Shift',
    });

    component.onInputBlur();

    inputElement.dispatchEvent(shiftKeyEvent);
    inputElement.dispatchEvent(new Event('keydown'));
    inputElement.dispatchEvent(new Event('blur'));

    expect(keyDownSpy).toHaveBeenCalledTimes(0);
    expect(shiftKeySpy).toHaveBeenCalledTimes(0);
    // native input blur 1x
    expect(inputBlurSpy).toHaveBeenCalledTimes(1);
  });

  it('can cancel input', () => {
    const element = component.wrapperRef.nativeElement;

    // Check that we start blurred
    expect(element.contains(document.activeElement)).toBe(false);

    component.triggerComponentFocus();

    // Check that we're now focused
    expect(element.contains(document.activeElement)).toBe(true);

    component.handleInputCancel();
    fixture.detectChanges();

    // Check that we successfully blurred again
    expect(element.contains(document.activeElement)).toBe(false);
  });

  it('emits empty IValue if no value on unit selection', () => {
    const testMenuConfigItem = {
      title: 'Auto',
      value: undefined,
    };
    spyOn(component.change, 'emit');

    component.onUnitSelection(testMenuConfigItem);

    fixture.detectChanges();

    expect(component.change.emit).toHaveBeenCalledWith({ value: '', units: '' });
  });

  it('emits % IValue when percentage unit selected', () => {
    const testUnit = UnitTypes.Percent;
    const testMenuConfigItem = {
      title: '',
      value: testUnit,
    };
    spyOn(component.change, 'emit');

    component.onUnitSelection(testMenuConfigItem);

    fixture.detectChanges();

    expect(component.change.emit).toHaveBeenCalledWith({ value: 0, units: testUnit });
  });

  it('emits px IValue when pixel unit selected', () => {
    const testUnit = UnitTypes.Pixels;
    const testMenuConfigItem = {
      title: '',
      value: testUnit,
    };
    spyOn(component.change, 'emit');

    component.onUnitSelection(testMenuConfigItem);

    fixture.detectChanges();

    expect(component.change.emit).toHaveBeenCalledWith({ value: '', units: testUnit });
  });

  // This test is wrong
  // it('converts string inputs to Auto', () => {
  //   const expected = {
  //     value: '',
  //     units: '',
  //   };
  //   spyOn(component.change, 'emit');
  //   component.handleUnitTypeInputChange(FOO_STRING);
  //   fixture.detectChanges();
  //   expect(component.change.emit).toHaveBeenCalledWith(expected);
  // });
});

describe('InputComponent with inner label', () => {
  let component: InputComponent;
  let fixture: ComponentFixture<InputComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        imports: [InputModule],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(InputComponent);
    component = fixture.componentInstance;
    component.type = cd.InputType.Text;
    component.innerLabel = FOO_STRING;

    fixture.detectChanges();
  });

  it('can have an inner label', () => {
    const element = component.wrapperRef.nativeElement;
    expect(element.querySelector('.inner-label').innerText).toBeTruthy();
  });

  it('upper cases the label', () => {
    const element = component.wrapperRef.nativeElement;
    expect(element.querySelector('.inner-label').innerText).toEqual(FOO_STRING.toUpperCase());
  });
});

describe('NumberInputComponent', () => {
  let component: InputComponent;
  let fixture: ComponentFixture<InputComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        imports: [InputModule],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(InputComponent);
    component = fixture.componentInstance;
    component.type = cd.InputType.Number;

    fixture.detectChanges();
  });

  it('emits undefined for no value', () => {
    spyOn(component.change, 'emit');
    component.resetNumberOnDelete = true;
    component.outputValue('');

    expect(component.change.emit).toHaveBeenCalledWith(undefined);
  });

  it('can increment', () => {
    const initialValue = '1';
    const expectedValue = 2;
    const inputElement = component.inputRefElem;

    inputElement.value = initialValue;
    component.onStepperChange({ shiftKey: false, increment: true });

    expect(component.numberValue).toEqual(expectedValue);
  });

  it('can decrement', () => {
    const initialValue = '1';
    const expectedValue = 0;
    const inputElement = component.inputRefElem;

    inputElement.value = initialValue;
    component.onStepperChange({ shiftKey: false, increment: false });

    expect(component.numberValue).toEqual(expectedValue);
  });

  it('can increment by 10', () => {
    const initialValue = '1';
    const expectedValue = 11;
    const inputElement = component.inputRefElem;

    inputElement.value = initialValue;
    component.onStepperChange({ shiftKey: true, increment: true });

    expect(component.numberValue).toEqual(expectedValue);
  });

  it('can decrement by 10', () => {
    const initialValue = '11';
    const expectedValue = 1;
    const inputElement = component.inputRefElem;

    inputElement.value = initialValue;
    component.onStepperChange({ shiftKey: true, increment: false });

    expect(component.numberValue).toEqual(expectedValue);
  });

  it('accepts numbers', () => {
    const inputValue = '1234';
    const expectedValue = '1234';
    const inputElement = component.inputRefElem;

    inputElement.value = inputValue;

    expect(inputElement.value).toEqual(expectedValue);
  });

  it('does not accept strings', () => {
    const EMPTY_STRING = '';
    const inputValue = 'abcdef';
    const inputElement = component.inputRefElem;

    inputElement.value = inputValue;

    expect(inputElement.value).toEqual(EMPTY_STRING);
  });
});
