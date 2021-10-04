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

import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';

import { CdCommonModule } from '../../cd-common.module';
import { ToastComponent } from './toast.component';

xdescribe('ToastComponent', () => {
  let component: ToastComponent;
  let fixture: ComponentFixture<ToastComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        imports: [CdCommonModule],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(ToastComponent);
    component = fixture.componentInstance;

    component.id = '1234567890';
    component.opened = false;
    component.duration = 3000;
    component.iconName = 'favorite';
    component.message = 'Lorem ipsum dolor';
    component.confirmLabel = 'Confirm';
    component.dismissLabel = 'Dismiss';
    component.confirmIconName = 'check';
    component.dismissIconName = 'close';

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
