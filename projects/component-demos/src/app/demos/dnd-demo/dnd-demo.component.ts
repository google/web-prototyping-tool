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
  ViewChild,
  AfterViewInit,
  ElementRef,
  ChangeDetectorRef,
} from '@angular/core';
import { IElement } from './dnd-interfaces';
import { DemoContentComponent } from './demo-content.component';
import { createPoint, IPoint } from 'cd-utils/geometry';
import {
  findClosestElement,
  getDropLocation,
  DropLocation,
  dropLocationLabel,
  INSERTED_ID,
  trimRect,
  drawTop,
  drawBottom,
  drawLeft,
  drawRight,
} from './dnd.utils';

const PI2 = 2 * Math.PI;

@Component({
  selector: 'app-dnd-demo',
  template: `
    <ul app-demo-tree [data]="elementList" [active]="activeId"></ul>

    <div
      class="design-surface"
      (mousemove)="onMouseMove($event)"
      (mouseenter)="onMouseEnter()"
      (mouseleave)="onMouseLeave()"
    >
      <app-demo-content #contentRef (update)="onContentUpdate($event)"></app-demo-content>
      <canvas #glassCanvasRef width="520" height="370"></canvas>
    </div>

    <div class="controls">
      <cd-checkbox
        label="Show Rects"
        [checked]="showRects"
        (change)="onShowRects($event)"
      ></cd-checkbox>
      <cd-checkbox
        label="Debug Drop location"
        [checked]="showGlass"
        (change)="onShowGlass($event)"
      ></cd-checkbox>
    </div>
  `,
  styleUrls: ['./dnd-styles.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DndDemoComponent implements AfterViewInit {
  private _didCursorMove = false;
  public mousePos: IPoint = createPoint();
  public showCursor = false;

  public canvasBounds?: DOMRect;
  public ctx?: CanvasRenderingContext2D | null;
  public elements = new Map<string, IElement>();
  public elementList: IElement[] = [];
  public showRects = false;
  public clearLine = true;
  public showGlass = false;
  public activeId?: string;
  public dropLocation = DropLocation.None;

  @ViewChild('glassCanvasRef') canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('contentRef') content!: DemoContentComponent;

  constructor(private _cdRef: ChangeDetectorRef) {}

  onContentUpdate(tree: Map<string, IElement>) {
    this.elements = tree;
    this.elementList = [...this.elements.values()];
    this.clearLine = true;
    this.render();
  }

  get canvas() {
    return this.canvasRef.nativeElement;
  }

  ngAfterViewInit(): void {
    this.ctx = this.canvas.getContext('2d');
    this.canvasBounds = this.canvas.getBoundingClientRect();
    this.elements = this.content.getElementsTree();
    this.elementList = [...this.elements.values()];
    this.loop();
    this._cdRef.detectChanges();
  }

  get activeElement() {
    const { activeId, elements } = this;
    return activeId && elements.get(activeId);
  }

  getParentElement(parentId: string | undefined) {
    return parentId && this.elements.get(parentId);
  }

  render() {
    const { ctx, canvas } = this;
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (this.showRects) this.renderRects(ctx);
    const { activeElement } = this;
    if (activeElement) {
      this.drawActiveId(ctx, activeElement);
      if (this.showGlass) this.drawDropLocation(ctx, activeElement);
      if (this.dropLocation !== DropLocation.None)
        this.drawDropLocationLine(ctx, activeElement, this.dropLocation, this.mousePos);
    }

    if (this.showCursor) this.drawCursor(ctx);
  }

  drawDropLocationLine(
    ctx: CanvasRenderingContext2D,
    activeElem: IElement,
    _dropLocation: DropLocation,
    mousePos: IPoint
  ) {
    if (this.clearLine) return;
    ctx.strokeStyle = 'red';
    ctx.fillStyle = 'rgba(255,0,0,0.2)';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';

    if (
      (activeElem.childIds.length === 0 && _dropLocation === DropLocation.Prepend) ||
      _dropLocation === DropLocation.Append
    ) {
      ctx.fillRect(activeElem.x, activeElem.y, activeElem.width, activeElem.height);
      return;
    }

    ctx.beginPath();
    if (_dropLocation === DropLocation.Before || _dropLocation === DropLocation.Prepend) {
      const deltaX = mousePos.x - activeElem.x;
      const deltaY = mousePos.y - activeElem.y;
      if (deltaY < deltaX) {
        drawTop(ctx, activeElem);
      } else {
        drawLeft(ctx, activeElem);
      }
    } else {
      const deltaX = activeElem.x + activeElem.width - mousePos.x;
      const deltaY = activeElem.y + activeElem.height - mousePos.y;

      if (deltaY < deltaX) {
        drawBottom(ctx, activeElem);
      } else {
        drawRight(ctx, activeElem);
      }
    }
    ctx.stroke();
    ctx.lineWidth = 1;
  }

  onShowRects(value: boolean) {
    this.showRects = value;
    this._didCursorMove = true;
  }

  onShowGlass(value: boolean) {
    this.showGlass = value;
    this._didCursorMove = true;
  }

  onMouseEnter() {
    this.showCursor = true;
  }

  onMouseLeave() {
    this.showCursor = false;
  }

  update() {
    if (!this._didCursorMove) return false; // optimization
    const { elementList, mousePos, activeId } = this;
    const _activeElement = findClosestElement(elementList, mousePos, activeId);
    this.dropLocation = getDropLocation(_activeElement, mousePos);
    if (_activeElement?.id !== INSERTED_ID) {
      this.content.insertChild(_activeElement, this.dropLocation);
    }

    this.activeId = _activeElement?.id;
    this._didCursorMove = false;
    return true;
  }

  loop = () => {
    if (this.update()) this.render();
    requestAnimationFrame(this.loop);
  };

  onMouseMove(e: MouseEvent) {
    const { clientX, clientY } = e;
    if (!this.canvasBounds) return;
    const { top, left } = this.canvasBounds;
    const x = clientX - left;
    const y = clientY - top;
    if (x === this.mousePos.x && y === this.mousePos.y) return;
    this._didCursorMove = true;
    this.clearLine = false;
    this.mousePos = { x, y };
  }

  drawActiveId(ctx: CanvasRenderingContext2D, activeElem: IElement) {
    const { mousePos, dropLocation } = this;
    const parentRect = this.getParentElement(activeElem?.parentId);
    ctx.strokeStyle = '#7c4dff';
    ctx.fillStyle = '#7c4dff';
    ctx.textAlign = 'left';
    if (this.showGlass) {
      ctx.strokeRect(activeElem.x, activeElem.y, activeElem.width, activeElem.height);
      ctx.globalAlpha = 0.1;
      const trimmed = trimRect(activeElem);
      ctx.fillRect(trimmed.x, trimmed.y, trimmed.width, trimmed.height);
    }

    ctx.globalAlpha = 1;
    const dropLabel = dropLocationLabel[dropLocation];

    ctx.fillText(activeElem.id, mousePos.x + 10, mousePos.y + 10);
    ctx.fillText(dropLabel, mousePos.x + 10, mousePos.y + 25);
    if (!parentRect) return;
    ctx.fillStyle = '#c9b5ff';
    ctx.strokeStyle = '#c9b5ff';
    ctx.textAlign = 'end';
    ctx.strokeRect(parentRect.x, parentRect.y, parentRect.width, parentRect.height);
    ctx.fillText(parentRect.id, parentRect.x - 8, parentRect.y + parentRect.height * 0.5);
  }

  drawDropLocation(ctx: CanvasRenderingContext2D, aElem: IElement) {
    const { dropLocation } = this;
    if (dropLocation === DropLocation.None) return;
    const { x, y, width, height } = aElem;
    const tr: IPoint = { x: x + width, y };
    const bl: IPoint = { y: y + height, x };
    const br: IPoint = { y: bl.y, x: tr.x };
    const opacity = dropLocation % 2 ? 8 : 20;
    ctx.fillStyle = `rgb(124 77 255 / ${opacity}%)`;
    ctx.beginPath();
    if (dropLocation <= 2) {
      ctx.moveTo(x, y);
      ctx.lineTo(tr.x, tr.y);
      ctx.lineTo(bl.x, bl.y);
    } else {
      ctx.moveTo(br.x, br.y);
      ctx.lineTo(tr.x, tr.y);
      ctx.lineTo(bl.x, bl.y);
    }

    ctx.fill();
  }

  drawCursor(ctx: CanvasRenderingContext2D) {
    ctx.beginPath();
    const { x, y } = this.mousePos;
    ctx.fillStyle = '#7c4dff85';
    ctx.arc(x, y, 4, 0, PI2);
    ctx.fill();
  }

  renderRects(ctx: CanvasRenderingContext2D) {
    ctx.strokeStyle = '#9e9e9e';
    for (const rect of this.elementList) {
      ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
    }
  }
}
