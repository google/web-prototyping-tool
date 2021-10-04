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
  ElementRef,
  OnDestroy,
  OnInit,
  ChangeDetectorRef,
  HostBinding,
} from '@angular/core';
import { IPickerDataset, DataPickerType } from 'cd-interfaces';
import { IObjectNode, ProcessedData } from './data-tree.interfaces';
import { DATASET_DELIMITER, ScrollBehavior } from 'cd-common/consts';
import * as utils from './data-tree.utils';
import { Subject, Subscription } from 'rxjs';
import { auditTime } from 'rxjs/operators';

const ARROW_CLASS = 'cell-arrow';
const CELL_CLASS = '.cell';

@Component({
  selector: 'cd-data-tree',
  templateUrl: './data-tree.component.html',
  styleUrls: ['./data-tree.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataTreeComponent implements OnDestroy, OnInit {
  private _subscription = Subscription.EMPTY;
  private _filterBuffer$ = new Subject<string>();
  private _cells: IObjectNode[] = [];
  private _selectedRootId = '';
  private _hasContent = false;
  private _data?: IPickerDataset;
  private _init = false;

  public visibleCells: IObjectNode[] = [];
  public expanded = new Set<string>();
  public filterValue = '';

  @Input() ignoreEmpty = false;
  @Input() filterElementIds: string[] = [];
  @Input() selectedId?: string;
  @Input() hoveredId?: string;
  @Input() hideFilter = false;

  @Input()
  set data(value: IPickerDataset) {
    this._data = value;
    this.processData();
  }

  @Input()
  set selectedRootId(id: string) {
    this._selectedRootId = id;
    this.updateVisible();
  }

  @HostBinding('class.show-filter')
  get canShowFilterBar() {
    if (this.hideFilter) return false;
    // Only show the filter bar when we have content (not zero state) and not coming from the data panel
    return !this.fromDataPanel && this._hasContent;
  }

  @Output() selectedIdChange = new EventEmitter<string>();
  @Output() hoveredIdChange = new EventEmitter<string>();

  constructor(private _cdRef: ChangeDetectorRef, private _elemRef: ElementRef) {}

  trackByFn(_idx: number, item: IObjectNode) {
    return _idx + item.id;
  }

  get symbolId(): string | undefined {
    return this._data?.symbolId;
  }

  get filteredCells(): IObjectNode[] {
    const { _cells, _selectedRootId } = this;
    return _selectedRootId ? utils.getSelectedBoardCells(_cells, _selectedRootId) : _cells;
  }

  get fromDataPanel(): boolean {
    return this.ignoreEmpty; // alias
  }

  get isProjectElementsType(): boolean {
    return this._data?.pickerType === DataPickerType.ProjectElements;
  }

  get hasContent(): boolean {
    if (this.fromDataPanel) return true; // Ignore empty when coming from the data panel
    return this._hasContent;
  }

  get isFiltering(): boolean {
    return !!this.filterValue;
  }

  updateVisible = () => {
    this.visibleCells = utils.getVisibleCells(this.filteredCells, this.expanded, this.filterValue);
  };

  ngOnInit(): void {
    this._init = true;
    // debounce search input to avoid heavy cpu processing of large datasets
    this._subscription = this._filterBuffer$.pipe(auditTime(100)).subscribe(this.onFilterBuffer);
    this.processData();
  }

  processData = () => {
    const { _data, _init } = this;
    if (!_init || !_data?.value) return;
    this._cdRef.detach();
    const parsedData = JSON.parse(_data.value);
    const [cells, expanded] = this.processDataForType(_data.pickerType, parsedData);
    this._cells = cells;
    this.expanded = new Set(expanded);
    this.updateVisible();
    // Min length is different for projects because we're not showing the root node for json files
    const minLength = this.isProjectElementsType ? 1 : 0;
    this._hasContent = this.filteredCells.length > minLength;
    this._cdRef.reattach();
    this._cdRef.markForCheck();
  };

  processDataForType(type: DataPickerType, parsedData: {}): ProcessedData {
    if (type === DataPickerType.A11yProps) return this.processAllyData(parsedData);
    if (type === DataPickerType.ProjectElements) return this.processElementPropsData(parsedData);
    return this.processGenericData(parsedData);
  }

  processAllyData(parsedData: {}): ProcessedData {
    const cells = utils.convertA11yElementPropsToNodes(parsedData);
    const expanded = this.expandAll(cells);
    return [cells, expanded];
  }

  processElementPropsData(parsedData: {}): ProcessedData {
    const { filterElementIds, symbolId } = this;
    const cells = utils.convertElementPropsToNodes(parsedData, filterElementIds, symbolId);
    const expanded = this.expandAllExceptNestedInputs(cells, this.selectedId);
    return [cells, expanded];
  }

  processGenericData(parsedData: {}): ProcessedData {
    const cells = utils.convertGenericDataToTreeNodes(parsedData, this._data);
    const expanded = this.expandFirstLevel(cells, this.selectedId);
    return [cells, expanded];
  }

  mapNodeId = (node: IObjectNode): string => node.id;

  expandSelectedId(id?: string) {
    if (!id) return [];
    return id.split(DATASET_DELIMITER).map((item, idx, arr) => {
      if (idx === 0) return item;
      return arr.slice(0, idx).join(DATASET_DELIMITER) + DATASET_DELIMITER + item;
    });
  }

  expandAllExceptNestedInputs(cells: IObjectNode[], selectedId?: string): string[] {
    const items = cells.filter((item) => item.type !== utils.OBJ_TYPE).map(this.mapNodeId);
    const selected = this.expandSelectedId(selectedId);
    return [...items, ...selected];
  }

  expandFirstLevel(cells: IObjectNode[], selectedId?: string): string[] {
    const firstLevel = cells.filter((item) => item.level === 1).map(this.mapNodeId);
    const selected = this.expandSelectedId(selectedId);
    return [...firstLevel, ...selected];
  }

  expandAll(cells: IObjectNode[]): string[] {
    return cells.map(this.mapNodeId);
  }

  toggleCollapse(id: string) {
    if (this.expanded.has(id)) {
      this.expanded.delete(id);
    } else {
      this.expanded.add(id);
    }

    this.updateVisible();
  }

  toggleSelectedId(id: string) {
    if (this.fromDataPanel) return;
    const value = this.selectedId === id ? '' : id;
    this.selectedIdChange.emit(value);
  }

  onFilter(value: string) {
    this._filterBuffer$.next(value);
  }

  onFilterBuffer = (value: string) => {
    this.filterValue = value;
    this.updateVisible();
    this._cdRef.markForCheck();
  };

  onTreeClick(e: MouseEvent) {
    const target = e.target as HTMLElement;
    const cellId = this.getCellId(target);
    const isArrow = target.classList.contains(ARROW_CLASS);
    if (!cellId) return;
    const element = this._cells.find((item) => item.id === cellId);

    if (isArrow || !element?.selectable) {
      if (this.isFiltering) return; // Dont collapse when searching
      if (element?.id === element?.rootId) return; // Dont collapse root nodes
      return this.toggleCollapse(cellId);
    }
    if (cellId) this.toggleSelectedId(cellId);
  }

  onTreeMouseOver(e: MouseEvent) {
    const target = e.target as HTMLElement;
    const cellId = this.getCellId(target);
    if (!cellId || this.hoveredId === cellId) return;
    this.hoveredId = cellId;
    this.hoveredIdChange.emit(this.hoveredId);
  }

  onTreeMouseLeave() {
    this.clearHoveredElement();
  }

  clearHoveredElement() {
    this.hoveredId = '';
    this.hoveredIdChange.emit(this.hoveredId);
  }

  getCellId(target: HTMLElement) {
    const cellRef = target.closest(CELL_CLASS) as HTMLElement;
    return cellRef?.dataset?.id;
  }

  scrollIntoView(animated = true) {
    const { selectedId } = this;
    const selector = `[data-id="${selectedId}"`;
    const element = this._elemRef.nativeElement.querySelector(selector);
    if (!element) return;
    const behavior = animated ? ScrollBehavior.Smooth : ScrollBehavior.Auto;
    element.scrollIntoView({ behavior, block: 'center' });
  }

  ngOnDestroy() {
    this._subscription.unsubscribe();
    this.clearHoveredElement();
  }
}
