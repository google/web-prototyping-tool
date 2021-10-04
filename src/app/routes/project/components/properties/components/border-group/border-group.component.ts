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

// prettier-ignore
import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter, ChangeDetectorRef, } from '@angular/core';
import { DEFAULT_BORDER_CONFIG } from 'src/app/routes/project/configs/properties.config';
import { isBorderSet, resetBorder } from './border.utils';
import { deepCopy } from 'cd-utils/object';
import * as cd from 'cd-interfaces';

enum BorderEdge {
  All = 'border',
  Top = 'borderTop',
  Right = 'borderRight',
  Bottom = 'borderBottom',
  Left = 'borderLeft',
}

const BORDER_MENU_CONFIG: ReadonlyArray<cd.IMenuConfig> = [
  {
    title: 'All sides',
    icon: '/assets/icons/border/all.svg',
    value: BorderEdge.All,
    divider: true,
  },
  { title: 'Top', icon: '/assets/icons/border/top.svg', value: BorderEdge.Top },
  { title: 'Right', icon: '/assets/icons/border/right.svg', value: BorderEdge.Right },
  { title: 'Bottom', icon: '/assets/icons/border/bottom.svg', value: BorderEdge.Bottom },
  { title: 'Left', icon: '/assets/icons/border/left.svg', value: BorderEdge.Left },
];

@Component({
  selector: 'app-border-group',
  templateUrl: './border-group.component.html',
  styleUrls: ['./border-group.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BorderGroupComponent {
  private _model!: cd.IStyleDeclaration;
  public borderExists = false;
  public border?: cd.IBorderStyle;
  public borderTop?: cd.IBorderStyle;
  public borderRight?: cd.IBorderStyle;
  public borderBottom?: cd.IBorderStyle;
  public borderLeft?: cd.IBorderStyle;
  public borderMenu: cd.IMenuConfig[] = [];
  public BorderEdge = BorderEdge;
  public edgeCount = 0;

  @Input() colorMenuData: ReadonlyArray<cd.ISelectItem> = [];
  @Input() designSystem?: cd.IDesignSystem;

  @Input()
  set model(value: cd.IStyleDeclaration) {
    const { border: newBorder, ...newModel } = value;
    newModel.border = Array.isArray(newBorder) ? newBorder[0] : newBorder;

    this._model = newModel;
    const { border, borderTop, borderRight, borderBottom, borderLeft } = newModel;

    this.borderExists = isBorderSet(value);
    this.border = border;
    this.borderTop = borderTop;
    this.borderRight = borderRight;
    this.borderBottom = borderBottom;
    this.borderLeft = borderLeft;

    this.updateEdgeCount();
    this.updateMenu();
  }
  get model(): cd.IStyleDeclaration {
    return this._model;
  }

  @Output() modelChange = new EventEmitter<cd.IStyleDeclaration>();
  @Output() action = new EventEmitter<cd.ISelectItem>();

  constructor(private _cdRef: ChangeDetectorRef) {}

  get hasEdge(): boolean {
    return !!this.borderLeft || !!this.borderRight || !!this.borderTop || !!this.borderBottom;
  }

  get showDeleteAll() {
    return this.borderExists && !this.border && this.edgeCount > 1;
  }

  get showAllBorderInput() {
    return this.borderExists && this.border;
  }

  updateEdgeCount() {
    this.edgeCount = [this.borderTop, this.borderRight, this.borderBottom, this.borderLeft]
      .map((item) => Number(!!item))
      .reduce((acc, item) => (acc += item), 0);
  }

  hasBorderEdge(edge: BorderEdge): boolean {
    if (edge === BorderEdge.Left) return !!this.borderLeft;
    if (edge === BorderEdge.Right) return !!this.borderRight;
    if (edge === BorderEdge.Top) return !!this.borderTop;
    if (edge === BorderEdge.Bottom) return !!this.borderBottom;
    return false;
  }

  updateMenu() {
    this.borderMenu = BORDER_MENU_CONFIG.map((item) => {
      const disabled = this.hasBorderEdge(item.value as BorderEdge);
      return { ...item, disabled };
    });
    this._cdRef.markForCheck();
  }

  onMenuSelect(item: cd.IMenuConfig) {
    this.onAdd(item.value as BorderEdge);
  }

  private assignBorderObjectPerEdge(style: cd.IBorderStyle | null, edge?: BorderEdge) {
    const borderEdge = edge || BorderEdge.All;
    return { [borderEdge]: style };
  }

  onAction(item: cd.ISelectItem) {
    this.action.emit(item);
  }

  updateBorder(style: cd.IBorderStyle | null, edge?: BorderEdge) {
    const styles = resetBorder(!!edge);
    const borderObject = this.assignBorderObjectPerEdge(style, edge);
    const obj = { ...borderObject };
    Object.assign(styles, obj);
    this.modelChange.emit(styles);
  }

  addAllEdgesBorder() {
    const styles = resetBorder(false);
    const border = deepCopy(DEFAULT_BORDER_CONFIG);
    const update = { ...styles, border };
    this.modelChange.emit(update);
  }

  // Returns the current border style
  get activeBorder() {
    // prettier-ignore
    return (this.border || this.borderTop || this.borderRight || this.borderBottom || this.borderLeft || DEFAULT_BORDER_CONFIG);
  }

  onAdd(edge?: BorderEdge) {
    if (edge === BorderEdge.All) return this.addAllEdgesBorder();
    const newBorder = deepCopy(this.activeBorder);
    this.updateBorder(newBorder, edge);
  }

  onDeleteEdge(edge: BorderEdge) {
    this.updateBorder(null, edge);
  }

  resetBorder() {
    // Resets the border for the model
    const styles = resetBorder(false);
    this.modelChange.emit(styles);
  }
}
