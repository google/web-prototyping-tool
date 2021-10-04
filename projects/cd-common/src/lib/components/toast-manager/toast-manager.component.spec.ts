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
import { ToastManagerComponent } from './toast-manager.component';

xdescribe('ToastManagerComponent', () => {
  let component: ToastManagerComponent;
  let fixture: ComponentFixture<ToastManagerComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        imports: [CdCommonModule],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(ToastManagerComponent);
    component = fixture.componentInstance;

    const textButtonsToast = {
      id: '0',
      iconName: 'home',
      message: 'Text buttons toast',
      duration: 3000,
      confirmLabel: 'Confirm',
      dismissLabel: 'Dismiss',
    };

    const iconButtonsToast = {
      id: '1',
      iconName: 'favorite',
      message: 'Icon buttons toast',
      duration: 3000,
      confirmLabel: 'Confirm',
      dismissLabel: 'Dismiss',
      confirmIconName: 'check',
      dismissIconName: 'close',
    };

    const lingeringMessageToast = {
      id: '2',
      duration: undefined,
      message: 'Lingering message toast',
    };

    const lingeringIconButtons = {
      id: '3',
      iconName: 'star_rate',
      message:
        'Lingering icon buttons toast: Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
      duration: -1,
      confirmLabel: 'Confirm',
      dismissLabel: 'Dismiss',
      confirmIconName: 'check',
      dismissIconName: 'close',
    };

    component.toasts = [
      textButtonsToast,
      iconButtonsToast,
      lingeringMessageToast,
      lingeringIconButtons,
    ];

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
