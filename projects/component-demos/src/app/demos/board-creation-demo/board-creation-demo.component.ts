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

import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { generateBounds, boundsToIRect } from 'src/app/routes/project/utils/canvas.utils';
import * as utils from './board-creation-demo.utils';
import * as cd from 'cd-interfaces';

@Component({
  selector: 'app-board-creation-demo',
  templateUrl: './board-creation-demo.component.html',
  styleUrls: ['./board-creation-demo.component.scss'],
})
export class BoardCreationDemoComponent implements OnInit {
  private _boards: cd.IRect[] = utils.STARTING_BOARDS;
  public lastSelectedBoardId?: number;
  public canvas?: cd.IRect;
  public boards$ = new BehaviorSubject<cd.IRect[]>(this._boards);
  public methodOptions = utils.METHOD_OPTIONS;
  public selectedMethod = utils.METHOD_OPTIONS[0];
  public newBoardPlaceholderFrame?: cd.IRect;
  public showCanvasBounds = true;

  @ViewChild('canvasRef') canvasRef!: ElementRef<HTMLElement>;

  get canvasDiv() {
    return this.canvasRef.nativeElement;
  }

  constructor(private _cdRef: ChangeDetectorRef) {}

  ngOnInit() {
    this._generateCanvasBounds();
  }

  private _updateBoardsPosition(distance: utils.IDragDistance, index: number) {
    const { x, y } = distance;
    const rect = this._boards[index];
    const newX = Math.max(rect.x + x, 0);
    const newY = Math.max(rect.y + y, 0);
    this._boards[index] = { ...rect, x: newX, y: newY };
    this._generateCanvasBounds();
  }

  onDragEnded(dragEvent: CdkDragDrop<any>, index: number) {
    const { distance } = dragEvent;
    this._updateBoardsPosition(distance, index);
    this.lastSelectedBoardId = index;
    this.clearNextBoard();
  }

  private _generateCanvasBounds() {
    const bounds = generateBounds(this._boards);
    this.canvas = boundsToIRect(bounds);
    this._cdRef.markForCheck();
  }

  onFindNextBoard() {
    const frame = utils.generateFakeBoard();
    const elemPropsMap = utils.boardRectsToFakeElemPropsMap(this._boards);
    const { canvas, selectedMethod, lastSelectedBoardId: boardId } = this;
    const method = selectedMethod.value as utils.MethodOption;
    const result = utils.getNewBoardPlacholderFrame(method, frame, elemPropsMap, canvas, boardId);
    this.newBoardPlaceholderFrame = result;
  }

  onShowBoundsChange(value: boolean) {
    this.showCanvasBounds = value;
  }

  onMethodChange(item: cd.SelectItemOutput) {
    this.selectedMethod = item as cd.ISelectItem;
    this.onFindNextBoard();
  }

  private _createNewBoard(x: number, y: number) {
    const newBoard = utils.generateNewBoard(x, y);
    this._boards.push(newBoard);
    this.lastSelectedBoardId = this._boards.length - 1;
    this._updateBoardsSubscription();
  }

  onRightClick(e: MouseEvent) {
    e.preventDefault();
    const bounds = this.canvasDiv.getBoundingClientRect();
    const x = e.clientX - bounds.left;
    const y = e.clientY - bounds.top;
    this._createNewBoard(x, y);
    this.clearNextBoard();
  }

  onBoardRightClick(e: MouseEvent, boardIndex: number) {
    e.preventDefault();
    e.stopImmediatePropagation();
    const { _boards } = this;
    const boards = [..._boards.slice(0, boardIndex), ..._boards.slice(boardIndex + 1)];
    this._boards = boards;
    this._updateBoardsSubscription();
  }

  onBoardClick(e: MouseEvent, boardIndex: number) {
    e.preventDefault();
    e.stopImmediatePropagation();
    this.lastSelectedBoardId = boardIndex;
  }

  clearSelected() {
    this.lastSelectedBoardId = undefined;
  }

  public clearNextBoard() {
    this.newBoardPlaceholderFrame = undefined;
  }

  private _updateBoardsSubscription() {
    this.boards$.next(this._boards);
    this._generateCanvasBounds();
  }
}
