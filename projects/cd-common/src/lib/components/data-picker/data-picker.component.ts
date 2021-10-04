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
  AfterViewInit,
  OnInit,
  ViewChild,
  OnDestroy,
  ChangeDetectorRef,
  HostBinding,
} from '@angular/core';
import { createDataBoundValue } from 'cd-common/utils';
import { IPickerDataset, IDataBoundValue } from 'cd-interfaces';
import { Subscription } from 'rxjs';
import { OverlayInitService } from '../overlay/overlay.init.service';
import { OverlayService } from '../overlay/overlay.service';
import { DataPickerService } from './data-picker.service';
import { DataViewerComponent } from './data-viewer/data-viewer.component';

@Component({
  selector: 'cd-data-picker',
  templateUrl: './data-picker.component.html',
  styleUrls: ['./data-picker.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataPickerComponent implements AfterViewInit, OnInit, OnDestroy {
  private _subscription = new Subscription();
  public sourceList: IPickerDataset[] = [];

  /** Currently viewed source data */
  public currentDataSource?: IPickerDataset;

  /**
   * Used to filter out the currently selected element in the properties panel
   * from selectable input values
   */
  @Input() filterElementIds: string[] = [];

  /** Currently viewed data sourceId */
  @Input() currentDataSourceId?: string;

  /** Currently selected source value  */
  @Input() selectedValue?: IDataBoundValue;

  @Input() editing = false;

  @HostBinding('class.fullscreen')
  fullscreen = false;

  @HostBinding('style.--expanded-y.px')
  @Input()
  expandedDeltaY = 0;

  @HostBinding('class.right-align')
  @Input()
  rightAligned = true;

  /**
   * Prevent navigating through multiple datasets. This fixes the data picker to view only
   * a single data source
   */
  @HostBinding('class.single-source')
  @Input()
  singleDataSource = false;

  @HostBinding('class.expanded')
  get expanded() {
    return !!this.currentDataSourceId;
  }

  @Output() selectedValueChange = new EventEmitter<IDataBoundValue | undefined>();
  @Output() activeValue = new EventEmitter<string>();
  @Output() addDataset = new EventEmitter<void>();

  @ViewChild('dataViewer', { read: DataViewerComponent, static: false })
  _viewer!: DataViewerComponent;

  constructor(
    private _overlayInit: OverlayInitService,
    private _elemRef: ElementRef,
    private _dataService: DataPickerService,
    private _overlayService: OverlayService,
    private _cdRef: ChangeDetectorRef
  ) {}

  ngOnDestroy(): void {
    this._subscription.unsubscribe();
  }

  ngOnInit(): void {
    this.sourceList = this._dataService.getSourceList();
    this._subscription.add(this._dataService.loadedData$.subscribe(this.onDataUpdate));
    this._subscription.add(
      this._overlayService.prepareForClose.subscribe(this.handlePrepareForClose)
    );

    const { singleDataSource, currentDataSourceId } = this;
    if (!singleDataSource || !currentDataSourceId) return;
    this.updateCurrentDataSource(currentDataSourceId);
  }

  handlePrepareForClose = () => {
    if (!this.expanded) this._overlayService.detachAndClose();
  };

  onAddDataset = () => {
    this.addDataset.emit();
  };

  onDataUpdate = () => {
    this.sourceList = this._dataService.getSourceList();
    if (this.currentDataSourceId) {
      this.currentDataSource = this._dataService.getParsedDataSourceForId(this.currentDataSourceId);
    }
    this._cdRef.markForCheck();
  };

  ngAfterViewInit() {
    this._overlayInit.componentLoaded();
    if (this._viewer && this.selectedValue) {
      this._viewer.scrollToSelected(false);
    }
  }

  get element() {
    return this._elemRef.nativeElement;
  }

  openDataEditorForCurrentSource = () => {
    const { _viewer, currentDataSourceId } = this;
    if (!_viewer || !currentDataSourceId) return;
    this._viewer.editing = true;
    this._cdRef.markForCheck();
  };

  initBinding(value: IDataBoundValue) {
    if (!value._$coDatasetId) return;
    this.updateCurrentDataSource(value._$coDatasetId);
    this.selectedValue = value;
  }

  updateCurrentDataSource(id: string) {
    this.currentDataSource = this._dataService.getParsedDataSourceForId(id);
    this.currentDataSourceId = id;
  }

  onSourceSelect(id: string) {
    this.updateCurrentDataSource(id);
  }

  onDataSourceUpdate(value: IPickerDataset) {
    this._dataService.sourceUpdate(value);
  }

  onSelectedLookupPathChange(lookupPath?: string) {
    const { currentDataSourceId } = this;
    this.selectedValue =
      currentDataSourceId && lookupPath
        ? createDataBoundValue(currentDataSourceId, lookupPath)
        : undefined;
    this.selectedValueChange.emit(this.selectedValue);
  }

  onHoverId(id: string) {
    this.activeValue.emit(id);
  }

  trackByFn(_index: number, item: IPickerDataset) {
    return item.id;
  }

  onFullscreenChange(fullscreen: boolean) {
    this._overlayService.toggleFullscreen(fullscreen);
  }

  onBack() {
    if (this.singleDataSource) return;
    this.currentDataSourceId = '';
  }
}
