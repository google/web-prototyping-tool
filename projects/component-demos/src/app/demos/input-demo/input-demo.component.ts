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
  Component,
  OnInit,
  ChangeDetectionStrategy,
  OnDestroy,
  ChangeDetectorRef,
} from '@angular/core';
import { DataPickerService } from 'cd-common';
import { ElementPropertiesMap, IDataBoundValue, IPickerDataset, ITextInputs } from 'cd-interfaces';
import tableSampleData from '../data-picker-demo/data/table-sample-data.json';
import elemProps from '../data-picker-demo/data/element-properties.json';
import demoData from '../data-picker-demo/data/demo-data.json';
import { ELEMENT_PROPS_DATASET_KEY } from 'cd-common/consts';
import { Subscription } from 'rxjs';
import { createDemoDataset } from '../data-picker-demo/data-picker-demo.component';

@Component({
  selector: 'app-input-demo',
  template: `
    <div class="container">
      <cd-input [value]="firstInputValue" (change)="onFirstInputChange($event)"></cd-input>
      <cd-input
        type="number"
        placeholder="type:numbers"
        [value]="thirdInputValue"
        (change)="onThirdInputChange($event)"
      ></cd-input>
      <cd-color-input></cd-color-input>
      <cd-input [value]="secondInputvalue" (change)="onSecondInputChange($event)"></cd-input>
    </div>
    <div class="container right">
      <cd-rich-text-editor
        [bindable]="true"
        [richText]="true"
        [value]="richText"
        (valueChange)="onTextChange($event)"
      ></cd-rich-text-editor>

      <div>{{ richText }}</div>
    </div>
  `,
  styles: [
    `
      :host {
        display: grid;
        grid-template-columns: auto auto;
      }
      .right {
        justify-self: end;
      }
      .container {
        padding-top: 100px;
        width: 400px;
        display: grid;
        gap: 10px;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InputDemoComponent implements OnInit, OnDestroy {
  private _subscription = Subscription.EMPTY;
  public firstInputValue = 'foo';
  public thirdInputValue = 44;
  public richText: string | IDataBoundValue = '';
  public secondInputvalue = {
    id: ELEMENT_PROPS_DATASET_KEY,
    value: 'xC16iFVwFGDjz1Pp4SUj.inputs.src',
  };

  constructor(private _cdRef: ChangeDetectorRef, private _dataService: DataPickerService) {}

  onTextChange(value: ITextInputs) {
    if (value.innerHTML !== undefined) {
      this.richText = value.innerHTML;
    }
  }

  ngOnDestroy(): void {
    this._subscription.unsubscribe();
  }

  onFirstInputChange(value: any) {
    this.firstInputValue = value;
  }

  onSecondInputChange(value: any) {
    this.secondInputvalue = value;
  }

  onThirdInputChange(value: any) {
    this.thirdInputValue = value;
  }

  ngOnInit(): void {
    this._dataService.setElementProperties(elemProps as ElementPropertiesMap);
    this._dataService.addDataSource(createDemoDataset('demo-qshTXF0M', 'Demo data'), demoData);
    this._dataService.addDataSource(
      createDemoDataset('table-2gNKKt4m', 'Table Sample'),
      tableSampleData
    );
    this._dataService.addDataSource(
      createDemoDataset('table-2233', 'Table Sample B'),
      tableSampleData
    );
    this._dataService.addDataSource(
      createDemoDataset('table-223333', 'Table Sample C'),
      tableSampleData
    );
    this._dataService.addDataSource(
      createDemoDataset('table-223333', 'Table Sample E'),
      tableSampleData
    );
    // Note this needs to happen after inital data has been added
    this._subscription = this._dataService.updateData$.subscribe(this.onDataSourceUpdate);
  }

  onDataSourceUpdate = (data: IPickerDataset) => {
    const value = data.value ? JSON.parse(data.value) : {};
    this._dataService.addDataSource(createDemoDataset(data.id, data.name), value);
    this._cdRef.markForCheck();
  };
}
