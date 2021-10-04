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
  EventEmitter,
  Output,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { GridInteractionService } from './grid-props/grid-interaction.service';
import { LayoutAlignment, sizeMenuConfig } from 'cd-common/consts';
import { isDisplayGrid } from 'cd-common/utils';
import * as consts from './layout-engine.consts';
import * as utils from './layout-engine.utils';
import * as cd from 'cd-interfaces';

@Component({
  selector: 'app-layout-props',
  templateUrl: './layout-props.component.html',
  styleUrls: ['./layout-props.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayoutPropsComponent implements OnChanges {
  private _layoutMode = cd.LayoutMode.Auto;

  public SIZE_MENU = sizeMenuConfig;
  public DISPLAY_MODE = cd.Display;
  public LAYOUT_MODE = cd.LayoutMode;
  public GRID_AUTO_MODE = cd.GridAutoMode;
  public GRID_AUTO_MENU = utils.convertStrArrToSelect(consts.GRID_AUTO_PROPS_VALUES);
  public ALIGN_ITEMS_MENU = utils.convertStrArrToSelect(consts.ALIGN_ITEMS_PROPS);
  public ALIGN_CONTENT_MENU = utils.convertStrArrToSelect(consts.ALIGN_CONTENT_PROPS);
  public JUSTIFY_ITEMS_MENU = utils.convertStrArrToSelect(consts.JUSTIFY_ITEMS_PROPS);
  public JUSTIFY_CONTENT_MENU = utils.convertStrArrToSelect(consts.JUSTIFY_CONTENT_PROPS);
  public isDisplayGrid = false;
  public align = LayoutAlignment.TopLeft;
  public rowTitle = consts.ROW_TITLE;
  public colTitle = consts.COL_TITLE;
  public gridAutoMode = cd.GridAutoMode.Auto;

  @Input() childCount = 0;
  @Input() advancedMode = false;
  @Input() showAdvancedToggleBtn = false;
  @Input() model: cd.IStyleDeclaration = {};

  @Output() modelChange = new EventEmitter<Partial<cd.IStyleDeclaration>>();
  @Output() advancedModeChange = new EventEmitter<boolean>();

  constructor(private _gridService: GridInteractionService) {}

  get showToggleBtn(): boolean {
    return this.showAdvancedToggleBtn && !this.isAutoMode;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.model) this.handleModelChange();
    if (changes.childCount) this.updateChildCount();
  }

  buildTitle(label: string, count = 0) {
    return `${label}: ${count}`;
  }

  updateChildCount() {
    const { gridTemplateColumns = [], gridTemplateRows = [] } = this.model;
    this.rowTitle = this.buildTitle(consts.ROW_TITLE, gridTemplateRows.length);
    this.colTitle = this.buildTitle(consts.COL_TITLE, gridTemplateColumns.length);
  }

  handleModelChange() {
    const { model } = this;
    const layoutMode = utils.detectLayoutMode(model);
    this._layoutMode = layoutMode;
    this.align = utils.alignmentFromModel(model);
    this.isDisplayGrid = isDisplayGrid(model.display);
    this.gridAutoMode = utils.getGridAutoMode(model, layoutMode);
    this.updateChildCount();
  }

  get layoutMode(): cd.LayoutMode {
    return this._layoutMode;
  }

  set layoutMode(mode: cd.LayoutMode) {
    this._layoutMode = mode;
  }

  get advancedLabel(): string {
    return consts.ADVANCED_TOGGLE_LABEL[Number(this.advancedMode)];
  }

  get isAutoMode(): boolean {
    return this.layoutMode === cd.LayoutMode.Auto;
  }

  get isGridMode(): boolean {
    return this.layoutMode === cd.LayoutMode.Grid;
  }

  get isColMode(): boolean {
    return this.layoutMode === cd.LayoutMode.Cols;
  }

  get isRowMode(): boolean {
    return this.layoutMode === cd.LayoutMode.Rows;
  }

  get isRowsOrColsMode(): boolean {
    return this.isColMode || this.isRowMode;
  }

  get colGapValue(): number {
    return this.model.gridColumnGap || this.model.columnGap || 0;
  }

  get rowGapValue(): number {
    return this.model.gridRowGap || this.model.rowGap || 0;
  }

  get gapValue(): number {
    return this.model.gap || (this.isColMode ? this.colGapValue : this.rowGapValue);
  }

  get showAdvanced(): boolean {
    return !this.isAutoMode && this.advancedMode;
  }

  get gridChildDetails(): [rowCount: number, colCount: number] {
    const rows = this.model?.gridTemplateRows || [];
    const columns = this.model?.gridTemplateColumns || [];
    return [rows.length, columns.length];
  }

  onLayoutModeChange(mode: cd.LayoutMode) {
    const { model, childCount } = this;
    const update = utils.convertToLayout(mode, model, childCount);
    this.layoutMode = mode;
    this.modelChange.emit(update);
  }

  onDisplayModeChange(mode: cd.Display) {
    const update = utils.processAdvancedDisplayModeChange(mode, this.layoutMode, this.model);
    this.modelChange.emit(update);
  }

  onAdvancedToggle() {
    this.advancedModeChange.emit(!this.advancedMode);
  }

  onGapChange(gap: number) {
    const update = utils.processGapChange(gap, this.isColMode, this.model);
    this.modelChange.emit(update);
  }

  onRowGapChange(rowGap: number) {
    const update = utils.processGapChange(rowGap, false, this.model);
    this.modelChange.emit(update);
  }

  onColGapChange(colGap: number) {
    const update = utils.processGapChange(colGap, true, this.model);
    this.modelChange.emit(update);
  }

  onDistributionChange(mode: cd.GridAutoMode) {
    const update = utils.processDistributionChange(mode, this.layoutMode, this.model);
    this.modelChange.emit(update);
  }

  onAlignmentChange(alignment: LayoutAlignment) {
    const payload = utils.processAlignmentChange(alignment, this.layoutMode, this.model);
    this.modelChange.emit(payload);
  }

  onAlignContentChange({ value: alignContent }: cd.ISelectItem) {
    this.modelChange.emit({ alignContent });
  }

  onAlignItemsChange({ value: alignItems }: cd.ISelectItem) {
    this.modelChange.emit({ alignItems });
  }

  onJustifyContentChange({ value: justifyContent }: cd.ISelectItem) {
    this.modelChange.emit({ justifyContent });
  }

  onJustifyItemsChange({ value: justifyItems }: cd.ISelectItem) {
    this.modelChange.emit({ justifyItems });
  }

  onGridAutoModeChange(item: cd.ISelectItem) {
    const update = utils.processGridAutoModeChange(item.value, this.isColMode);
    this.modelChange.emit(update);
  }

  onRowChange(gridTemplateRows: cd.IValue[]) {
    this.modelChange.emit({ gridTemplateRows });
  }

  onColumnChange(gridTemplateColumns: cd.IValue[]) {
    this.modelChange.emit({ gridTemplateColumns });
  }

  onRowAdd() {
    const gridTemplateRows = utils.incrementGridItems(this.model.gridTemplateRows);
    this.modelChange.emit({ gridTemplateRows });
    this._gridService.reset();
  }

  onColumnAdd() {
    const gridTemplateColumns = utils.incrementGridItems(this.model.gridTemplateColumns);
    this.modelChange.emit({ gridTemplateColumns });
    this._gridService.reset();
  }

  onColHover(idx: number) {
    this._gridService.overColumn(idx, ...this.gridChildDetails);
  }

  onColHoverOut(idx: number) {
    this._gridService.out(idx);
  }

  onRowHover(idx: number) {
    this._gridService.overRow(idx, ...this.gridChildDetails);
  }

  onRowHoverOut(idx: number) {
    this._gridService.out(idx);
  }
}
