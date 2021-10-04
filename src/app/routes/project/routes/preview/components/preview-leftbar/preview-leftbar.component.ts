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
  ChangeDetectorRef,
} from '@angular/core';
import { IOutletListItem } from '../preview-outlet-list/preview-outlet-list.component';
import { sortElementsByName } from 'cd-common/utils';
import { isBoardPortal } from 'cd-common/models';
import type * as cd from 'cd-interfaces';

@Component({
  selector: 'app-preview-leftbar',
  templateUrl: './preview-leftbar.component.html',
  styleUrls: ['./preview-leftbar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PreviewLeftbarComponent implements OnChanges {
  public componentList: ReadonlyArray<IOutletListItem> = [];
  public boardList: ReadonlyArray<IOutletListItem> = [];
  public portalList: ReadonlyArray<IOutletListItem> = [];

  @Input() homeBoardId?: string;
  @Input() activeOutletId?: string;

  @Input() elementProperties?: cd.ElementPropertiesMap;
  @Input() boards: ReadonlyArray<cd.IBoardProperties> = [];
  @Input() symbols: ReadonlyArray<cd.ISymbolProperties> = [];
  @Input() codeComponents: ReadonlyArray<cd.ICodeComponentDocument> = [];
  @Input() commentCounts: Map<string, number> = new Map();

  @Output() paramChange = new EventEmitter<Partial<cd.IPreviewParams>>();
  @Output() jumpToBoard = new EventEmitter<string>();

  constructor(private _cdRef: ChangeDetectorRef) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes.codeComponents ||
      changes.symbols ||
      changes.commentCounts ||
      changes.boards ||
      changes.elementProperties ||
      changes.homeBoardId
    ) {
      this.buildOutletList();
    }
  }

  updateCommentsForOutlets() {
    this._cdRef.markForCheck();
  }

  buildOutletList() {
    const { commentCounts, elementProperties, boards } = this;
    if (!elementProperties) return;
    const codeCompList = this.convertCodeComponentsToListItems(this.codeComponents, commentCounts);
    const symList = this.convertOutletToListItem(this.symbols, commentCounts);
    this.componentList = sortElementsByName<IOutletListItem>([...symList, ...codeCompList]);

    const portalList = Object.values(elementProperties).filter(isBoardPortal);
    const portalTargets = portalList.reduce((acc, portal) => {
      const portalTarget = portal.inputs?.referenceId;
      if (portalTarget) acc.add(portalTarget);
      return acc;
    }, new Set());

    const convertedBoards = this.convertOutletToListItem(boards, commentCounts);
    const boardList = convertedBoards.filter((elem) => !portalTargets.has(elem.id));
    const potalList = convertedBoards.filter((elem) => portalTargets.has(elem.id));
    this.boardList = sortElementsByName<IOutletListItem>(boardList, this.homeBoardId);
    this.portalList = sortElementsByName<IOutletListItem>(potalList);
    // TODO: also add modals and drawers
    this._cdRef.markForCheck();
  }

  private buildListItem = (
    id: string,
    name: string,
    type: cd.EntityType,
    commentCounts: Map<string, number>
  ): IOutletListItem => {
    const commentCount = commentCounts.get(id) ?? 0;
    return { id, name, type, commentCount };
  };

  private convertOutletToListItem(
    outlets: ReadonlyArray<cd.RootElement>,
    commentCounts: Map<string, number>
  ): ReadonlyArray<IOutletListItem> {
    return outlets
      .filter((item) => !!!item.inputs?.exclude) // filter out excluded
      .map(({ id, name, type }) => {
        return this.buildListItem(id, name, type, commentCounts);
      });
  }

  private convertCodeComponentsToListItems(
    codeComponents: ReadonlyArray<cd.ICodeComponentDocument>,
    commentCounts: Map<string, number>
  ): ReadonlyArray<IOutletListItem> {
    return codeComponents.map(({ id, title: name, type }) => {
      return this.buildListItem(id, name, type, commentCounts);
    });
  }

  onParamChange(params: Partial<cd.IPreviewParams>) {
    this.paramChange.emit(params);
  }

  onBoardClick(boardId: string) {
    this.jumpToBoard.emit(boardId);
  }
}
