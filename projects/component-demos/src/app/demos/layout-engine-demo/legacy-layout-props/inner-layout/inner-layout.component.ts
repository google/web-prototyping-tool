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

import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter } from '@angular/core';
import { GridInteractionService } from '../grid-props/grid-interaction.service';
import { layoutModeFromModel, generateGridLayout } from '../grid.utils';
import { constructKebabCase } from 'cd-utils/string';
import { deepCopy } from 'cd-utils/object';
import { UnitTypes } from 'cd-metadata/units';
import * as consts from 'cd-common/consts';
import * as utils from '../layout.utils';
import * as cdUtils from 'cd-common/utils';
import * as cd from 'cd-interfaces';

const ROW_TITLE = 'Rows';
const COL_TITLE = 'Columns';
const GAP_TITLE = 'Gap';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'cd-inner-layout-props',
  templateUrl: './inner-layout.component.html',
  styleUrls: ['./inner-layout.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InnerLayoutComponent {
  private _model!: cd.IStyleDeclaration;
  private _childCount = 0;
  public GRID_AUTO_MODE = cd.GridAutoMode;
  public gridAutoMode = cd.GridAutoMode.Auto;

  public LAYOUT_MODE = cd.LayoutMode;
  public layoutMode = cd.LayoutMode.Auto;
  public align = consts.LayoutAlignment.TopLeft;
  public isGrid = false;

  public gridAutocomplete = consts.sizeMenuConfig;
  public rowTitle = ROW_TITLE;
  public colTitle = COL_TITLE;

  @Input()
  set childCount(value) {
    this._childCount = value;
    this.updateChildCount();
  }
  get childCount() {
    return this._childCount;
  }

  @Input()
  set model(value: cd.IStyleDeclaration) {
    this._model = value;
    this.align = utils.layoutAlignmentFromModel(value);
    this.layoutMode = layoutModeFromModel(value);
    this.gridAutoMode = utils.autoFlowFromModel(value, this.layoutMode);
    this.isGrid = cdUtils.isDisplayGrid(value.display);
    this.updateChildCount();
  }
  get model(): cd.IStyleDeclaration {
    return this._model;
  }

  constructor(private _gridService: GridInteractionService) {}

  get rowGapLabel() {
    return this.gridMode ? 'Row gap' : GAP_TITLE;
  }

  get colGapLabel() {
    return this.gridMode ? 'Col gap' : GAP_TITLE;
  }

  @Output() modelChange = new EventEmitter<cd.IStyleDeclaration>();

  applyAutoLayout() {
    const styles = utils.resetGridLayout(this.model.display);
    this.modelChange.emit(styles);
  }

  updateGrid(update: any) {
    const { _model } = this;
    const styles = utils.resetGridLayout(_model.display);
    const display = cdUtils.isDisplayInline(_model.display)
      ? constructKebabCase(consts.CSS_DISPLAY_INLINE, consts.CSS_DISPLAY_GRID)
      : consts.CSS_DISPLAY_GRID;

    const obj = { display, ...update };
    Object.assign(styles, obj);
    this.modelChange.emit(styles);
  }

  applyColumnLayout() {
    const gridAutoFlow = consts.CSS_GRID_COLUMN;
    const gridAutoColumns = this.isGrid ? this.gridAutoMode : cd.GridAutoMode.MinContent;
    // If columnGap is unset use rowGap if available
    const gridColumnGap = this.model.gridColumnGap || this.model.gridRowGap || 0;
    const alignmentPayload = this.getGridAlignment(this.align, gridAutoColumns, cd.LayoutMode.Cols);
    this.updateGrid({ gridAutoFlow, gridAutoColumns, gridColumnGap, ...alignmentPayload });
  }

  applyRowLayout() {
    const gridAutoFlow = consts.CSS_GRID_ROW;
    const gridAutoRows = this.isGrid ? this.gridAutoMode : cd.GridAutoMode.MinContent;
    // If columnGap is unset use rowGap if available
    const gridRowGap = this.model.gridRowGap || this.model.gridColumnGap || 0;
    const alignmentPayload = this.getGridAlignment(this.align, gridAutoRows, cd.LayoutMode.Rows);
    this.updateGrid({ gridAutoFlow, gridAutoRows, gridRowGap, ...alignmentPayload });
  }

  buildTitle(label: string, count = 0) {
    return `${label}: ${count}`;
  }

  updateChildCount() {
    const { _model, isGrid } = this;
    if (!isGrid) return;
    const { gridTemplateColumns = [], gridTemplateRows = [] } = _model;
    this.rowTitle = this.buildTitle(ROW_TITLE, gridTemplateRows.length);
    this.colTitle = this.buildTitle(COL_TITLE, gridTemplateColumns.length);
  }

  applyGridLayout() {
    const { layoutMode, _childCount, model } = this;
    const { gridTemplateColumns, gridTemplateRows } = generateGridLayout(_childCount, layoutMode);

    const gridRowGap = model.gridRowGap || model.gridColumnGap || 0;
    const gridColumnGap = model.gridColumnGap || model.gridRowGap || 0;
    const payload = this.getGridAlignment(this.align);
    this.updateGrid({
      gridTemplateColumns,
      gridTemplateRows,
      gridRowGap,
      gridColumnGap,
      ...payload,
    });
  }

  onLayoutModeChange(mode: cd.LayoutMode) {
    if (mode === cd.LayoutMode.Auto) return this.applyAutoLayout();
    if (mode === cd.LayoutMode.Cols) return this.applyColumnLayout();
    if (mode === cd.LayoutMode.Rows) return this.applyRowLayout();
    if (mode === cd.LayoutMode.Grid) return this.applyGridLayout();
  }

  get columnMode() {
    return this.layoutMode === cd.LayoutMode.Cols;
  }

  get showRowGap() {
    return this.gridMode || this.rowMode;
  }

  get showColGap() {
    return this.gridMode || this.columnMode;
  }

  get rowMode() {
    return this.layoutMode === cd.LayoutMode.Rows;
  }

  get gridMode() {
    return this.layoutMode === cd.LayoutMode.Grid;
  }

  get showDistribute() {
    const { layoutMode } = this;
    return layoutMode !== cd.LayoutMode.Auto && layoutMode !== cd.LayoutMode.Grid;
  }

  getGridAlignment(
    alignment: consts.LayoutAlignment,
    autoMode?: cd.GridAutoMode,
    layoutMode?: cd.LayoutMode
  ): utils.IGridAlignment {
    const gridAutoMode = autoMode || this.gridAutoMode;
    const layout = layoutMode || this.layoutMode;
    const [align, justify] = consts.ALIGNMENT_TO_GRID_MAP[alignment];
    return utils.getAlignmentForGridMode(gridAutoMode, align, justify, layout);
  }

  onAlignmentChange(alignment: consts.LayoutAlignment) {
    const payload = this.getGridAlignment(alignment);
    this.modelChange.emit(payload);
  }

  onColumnGapChange(gridColumnGap: number) {
    this.modelChange.emit({ gridColumnGap });
  }

  onRowGapChange(gridRowGap: number) {
    this.modelChange.emit({ gridRowGap });
  }

  onDistributionChange(mode: cd.GridAutoMode) {
    const distribution = this.rowMode ? { gridAutoRows: mode } : { gridAutoColumns: mode };
    const [align, justify] = consts.ALIGNMENT_TO_GRID_MAP[this.align];
    const alignment = utils.getAlignmentForGridMode(mode, align, justify, this.layoutMode);
    const payload = { ...distribution, ...alignment };
    this.modelChange.emit(payload);
  }

  onRowAdd() {
    const rows = this._model.gridTemplateRows || [];
    const items = deepCopy(rows);
    const lastItem = items[items.length - 1];
    const units = lastItem ? lastItem.units : UnitTypes.Fr;
    const value = utils.defaultGridValueForUnit(units, items, true);
    const added = { units, ...value };
    const gridTemplateRows = [...items, added];
    this.modelChange.emit({ gridTemplateRows });
    this._gridService.reset();
  }

  onColumnAdd() {
    const columns = this._model.gridTemplateColumns || [];
    const items = deepCopy(columns);
    const lastItem = items[items.length - 1];
    const units = lastItem ? lastItem.units : UnitTypes.Fr;
    const value = utils.defaultGridValueForUnit(units, items, true);
    const added = { units, ...value };
    const gridTemplateColumns = [...items, added];
    this.modelChange.emit({ gridTemplateColumns });
    this._gridService.reset();
  }

  onRowChange(gridTemplateRows: cd.IValue[]) {
    this.modelChange.emit({ gridTemplateRows });
  }

  onColumnChange(gridTemplateColumns: cd.IValue[]) {
    this.modelChange.emit({ gridTemplateColumns });
  }

  get gridInfo() {
    const rows = this._model.gridTemplateRows || [];
    const columns = this._model.gridTemplateColumns || [];
    return [rows.length, columns.length];
  }

  onColHover(idx: number) {
    this._gridService.overColumn(idx, ...this.gridInfo);
  }

  onColHoverOut(idx: number) {
    this._gridService.out(idx);
  }

  onRowHover(idx: number) {
    this._gridService.overRow(idx, ...this.gridInfo);
  }

  onRowHoverOut(idx: number) {
    this._gridService.out(idx);
  }
}
