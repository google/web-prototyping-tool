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
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { DataPickerService } from 'cd-common';
import * as cd from 'cd-interfaces';
// import { deepCopy } from 'cd-utils/object';
////////////////////////////////////////////////////////////////
import tableSampleData from './data/table-sample-data.json';
import elemProps from './data/element-properties.json';
import demoData from './data/demo-data.json';
import a11yData from './data/a11y-data.json';
import { Subscription } from 'rxjs';
import { createChangeMarker } from 'cd-common/utils';

export const createDemoDataset = (id: string, name: string): cd.IDataset => {
  const jsonDataset: cd.IJsonDataset = {
    id,
    name,
    changeMarker: createChangeMarker(),
    type: cd.EntityType.Dataset,
    datasetType: cd.DatasetType.Json,
    projectId: 'demoProject',
    storagePath: 'datasets/1234/data.json',
  };
  return jsonDataset;
};

@Component({
  selector: 'app-data-picker-demo',
  template: `
    <cd-data-picker
      class="picker"
      [selectedValue]="selectedValue"
      (selectedValueChange)="onSelection($event)"
    ></cd-data-picker>
    <div class="output">
      <div class="group">
        <h3>Binding</h3>
        <span>The chip's value</span>
        <span class="binding">{{ binding }}</span>
      </div>
      <ng-container *ngIf="selectedValue | dataSourcesBindingPipe: sources; let value">
        <div class="group" *ngIf="value | dataSourcesKeyPipe; let datakeys">
          <h3>Data Keys</h3>
          <span>Used by the table component</span>
          <span class="value">
            {{ datakeys }}
          </span>
        </div>
        <div class="group">
          <h3>Bound Value</h3>
          <span>The output</span>
          <span class="value">
            {{ value }}
          </span>
        </div>
      </ng-container>
    </div>
  `,
  styleUrls: ['./data-picker-demo.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataPickerDemoComponent implements OnInit, OnDestroy {
  private _subscription = Subscription.EMPTY;
  public selectedValue?: cd.IValue;
  public sources: cd.IPickerDataset[] = [];
  constructor(private _cdRef: ChangeDetectorRef, public dataService: DataPickerService) {}

  ngOnInit(): void {
    this.dataService.setElementProperties(elemProps as cd.ElementPropertiesMap);
    this.dataService.addDataSource(createDemoDataset('demo-qshTXF0M', 'Demo data'), demoData);
    this.dataService.addDataSource(
      createDemoDataset('table-2gNKKt4m', 'Table Sample'),
      tableSampleData
    );
    this.dataService.addDataSource(
      createDemoDataset('accessibility-properties', 'Accessibility Props'),
      a11yData,
      cd.DataPickerType.A11yProps
    );
    this.sources = this.dataService.sources;
    // Note this needs to happen after inital data has been added
    this._subscription = this.dataService.updateData$.subscribe(this.onDataSourceUpdate);
  }

  get binding() {
    const { selectedValue } = this;
    const prefix = selectedValue?.id || '';
    const suffix = selectedValue?.value ? `.${selectedValue?.value}` : '';
    return prefix + suffix;
  }

  ngOnDestroy(): void {
    this._subscription.unsubscribe();
  }

  onDataSourceUpdate = (data: cd.IPickerDataset) => {
    const value = data.value ? JSON.parse(data.value) : {};
    const dataset = createDemoDataset(data.id, data.name);
    this.dataService.addDataSource(dataset, value);
    this._cdRef.markForCheck();
  };

  onSelection(value: cd.IValue) {
    this.selectedValue = value;
  }
}
