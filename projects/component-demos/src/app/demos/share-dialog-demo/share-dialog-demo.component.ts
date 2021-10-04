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

import { Component, AfterViewInit, ChangeDetectionStrategy, ViewChild } from '@angular/core';
import { ShareDialogComponent } from 'src/app/components/share-dialog/share-dialog.component';

import { MOCK_USER } from '../../mock-data/user';
import { MOCK_PROJECT } from '../../mock-data/project';

@Component({
  selector: 'app-share-dialog-demo',
  templateUrl: './share-dialog-demo.component.html',
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShareDialogDemoComponent implements AfterViewInit {
  project = MOCK_PROJECT;

  @ViewChild(ShareDialogComponent)
  shareDialog: ShareDialogComponent = {} as ShareDialogComponent;

  ngAfterViewInit(): void {
    this.shareDialog.owner = MOCK_USER;
  }
}
