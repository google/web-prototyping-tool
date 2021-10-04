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
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import * as cd from 'cd-interfaces';
// import { DataPickerService } from 'cd-common';

@Component({
  selector: 'app-table-column-props',
  templateUrl: './table-column-props.component.html',
  styleUrls: ['./table-column-props.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableColumnPropsComponent implements OnChanges {
  public dataFieldItems: cd.ISelectItem[] = [];
  public dynamicPropsSchema: cd.IPropertyGroup[] = [];
  public currencyItems = [];
  public cellTypeItems = [];
  public optionsConfig: cd.IGenericListConfig = {
    valueType: cd.GenericListValueType.String,
    supportsSelection: false,
    addButtonLabel: 'Add column',
  };

  @Input() prop?: cd.IPropertyGroup;
  @Input() data: cd.IGenericConfig[] = [];
  @Input() parentMergedProps?: cd.PropertyModel;

  @Input()
  set datasetId(_datasetId: string) {
    // const { value } = this.dataPickerService.loadedData$;
    this.dataFieldItems = [];
  }

  @Output() dataChange = new EventEmitter<cd.IGenericConfig[]>();

  // constructor(private dataPickerService: DataPickerService) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes.prop || changes.options || changes.datasetId) this._setSchema();
  }

  onColumnsChange(columns: cd.IGenericConfig[]) {
    this.dataChange.emit(columns);
  }

  private _setSchema() {
    // const { dataFieldItems, cellTypeItems, currencyItems } = this;
    this.dynamicPropsSchema = [];
  }
}
