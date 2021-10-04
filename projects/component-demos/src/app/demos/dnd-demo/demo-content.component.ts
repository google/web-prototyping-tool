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
  ElementRef,
  Renderer2,
  Output,
  EventEmitter,
} from '@angular/core';
import { IRectElem, IElement } from './dnd-interfaces';
import { DropLocation } from './dnd.utils';
const OFFSET = 60;

@Component({
  selector: 'app-demo-content',
  template: `
    <header id="header" allowChildren>
      <h4 id="cloud-title">Google Cloud</h4>
      <div class="right" id="header-right" allowChildren>
        <div class="icon" id="header-icon-1"></div>
        <div class="icon" id="header-icon-2"></div>
      </div>
    </header>
    <div class="main" id="main" allowChildren>
      <aside class="nav" id="sidebar" allowChildren>
        <ul id="nav" allowChildren>
          <li class="active" id="nav-li-1">Home</li>
          <li id="nav-li-2">Sky City</li>
          <li id="nav-li-3">Nimbus</li>
          <li id="nav-li-4">Zeus</li>
        </ul>
      </aside>
      <div class="page" id="main-page" allowChildren>
        <div class="inner-page" id="inner-page" allowChildren></div>
        <div class="page-content" id="page-content" allowChildren>
          <div class="box-item" id="box-item-1" allowChildren></div>
          <div class="box-item" id="box-item-2" allowChildren></div>
          <div class="box-item" id="box-item-3" allowChildren></div>
          <div class="box-item" id="box-item-4" allowChildren></div>
          <div class="box-item" id="box-item-5" allowChildren></div>
          <div class="box-item" id="box-item-6" allowChildren></div>
          <div class="box-item" id="box-item-7" allowChildren></div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./demo-content.styles.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DemoContentComponent {
  private _inserted?: HTMLElement;
  private _timer = 0;
  private _previous?: { id: string | undefined; dropLocation: DropLocation };
  @Output() update = new EventEmitter<Map<string, IElement>>();

  constructor(private _elemRef: ElementRef, private _renderer: Renderer2) {}

  get element() {
    return this._elemRef.nativeElement;
  }

  rectForElement = (elem: HTMLElement): IRectElem => {
    const { top: y, left: x, width, height } = (elem as HTMLElement).getBoundingClientRect();
    const id = elem.id || 'root';
    return { id, x, y, width, height };
  };

  adjustRectForRoot(rect: IRectElem, rootRect?: IRectElem): IRectElem {
    if (!rootRect) return { ...rect, x: OFFSET, y: OFFSET };
    const x = rect.x - rootRect.x + OFFSET;
    const y = rect.y - rootRect.y + OFFSET;
    return { ...rect, x, y };
  }

  buildElementTree(
    element: HTMLElement,
    tree = new Map<string, IElement>(),
    parentId?: string,
    rootRect?: IRectElem,
    level = 0
  ) {
    const rect = this.rectForElement(element);
    const adjustedRect = this.adjustRectForRoot(rect, rootRect);
    if (!parentId) rootRect = rect;
    const children = Array.from(element.children) || [];
    const childIds = children.map((child) => child.id);
    const allowChildren = !parentId || element.getAttribute('allowChildren') !== null;
    const item: IElement = { ...adjustedRect, childIds, parentId, level, allowChildren };
    tree.set(item.id, item);
    for (const child of children) {
      this.buildElementTree(child as HTMLElement, tree, item.id, rootRect, level + 1);
    }
    return tree;
  }

  get inserted() {
    if (this._inserted) return this._inserted;
    const { _renderer } = this;
    const inserted = _renderer.createElement('div');
    this._renderer.setStyle(inserted, 'width', '20px');
    this._renderer.setStyle(inserted, 'height', '20px');
    this._renderer.setStyle(inserted, 'background', 'red');
    this._renderer.setAttribute(inserted, 'id', 'inserted');
    this._inserted = inserted;
    return inserted;
  }

  destroyElement() {
    this._inserted?.remove();
    this.sendUpdate();
  }

  get elem() {
    return this._elemRef.nativeElement.parentElement;
  }

  insertBeforeElem(elem: HTMLElement) {
    elem.parentElement?.insertBefore(this.inserted, elem);
    this.sendUpdate();
  }

  insertAfterElem(elem: HTMLElement) {
    elem.parentElement?.insertBefore(this.inserted, elem.nextElementSibling);
    this.sendUpdate();
  }

  prependElem(elem: HTMLElement) {
    elem.insertBefore(this.inserted, elem.firstChild);
    this.sendUpdate();
  }

  appendElem(elem: HTMLElement) {
    elem.appendChild(this.inserted);
    this.sendUpdate();
  }

  checkPrevious(activeElement: IElement | undefined, dropLocation: DropLocation) {
    const { _previous } = this;
    const same = _previous?.id === activeElement?.id && dropLocation === _previous?.dropLocation;
    if (!same) this._previous = { id: activeElement?.id, dropLocation };
    return same;
  }

  insertChild(activeElement: IElement | undefined, dropLocation: DropLocation) {
    window.clearTimeout(this._timer);
    this._timer = window.setTimeout(() => {
      if (this.checkPrevious(activeElement, dropLocation)) return;
      const element = activeElement && document.getElementById(activeElement.id);
      if (!element) return this.destroyElement();
      // prettier-ignore
      switch (dropLocation) {
      case DropLocation.Before:   return this.insertBeforeElem(element)
      case DropLocation.After:    return this.insertAfterElem(element)
      case DropLocation.Prepend:  return this.prependElem(element)
      case DropLocation.Append:   return this.appendElem(element)
      default : return this.destroyElement();
    }
    }, 140);
  }

  sendUpdate() {
    this.update.emit(this.buildElementTree(this.element));
  }
  getElementsTree() {
    return this.buildElementTree(this.element);
  }
}
