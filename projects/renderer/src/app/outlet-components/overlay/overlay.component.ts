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
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ComponentRef,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  QueryList,
  ViewChild,
  ViewChildren,
  ViewContainerRef,
} from '@angular/core';
import { OutletComponentDirective } from '../../outlets/outlet.component';
import { queryElementByDataId } from '../../utils/query.utils';
import { removeValueFromArrayAtIndex } from 'cd-utils/array';
import { overlaySizeFromAction } from 'cd-common/utils';
import { rendererState } from '../../state.manager';
import { calculatePosition } from './overlay.utils';
import { fromEvent, Subscription } from 'rxjs';
import { isBoard } from 'cd-common/models';
import { translate } from 'cd-utils/css';
import { take } from 'rxjs/operators';
import * as cd from 'cd-interfaces';

export interface IOverlayItem {
  action: cd.IActionBehaviorPresentOverlay;
  outletRef: ComponentRef<OutletComponentDirective>;
  target: cd.PropertyModel;
  triggerId: string;
}

const SHOW_ANIMATION_CONFIG: KeyframeAnimationOptions = {
  duration: 250,
  easing: 'cubic-bezier(0.25, 0.8, 0.25, 1)',
  fill: 'both',
};

@Component({
  selector: 'cdr-overlay-item',
  template: `
    <div
      #containerRef
      class="container"
      [style.transform]="pos"
      [style.width.px]="contentWidth"
      [style.height.px]="contentHeight"
      [style.borderRadius.px]="borderRadius"
      [style.boxShadow]="boxShadow"
      [attr.data-overlay-idx]="idx"
    >
      <ng-template #contentRef></ng-template>
    </div>
    <div *ngIf="hasBackdrop" class="backdrop" (click)="close()"></div>
  `,
  styleUrls: ['./overlay.component.scss'],
  // DO NOT USE OnPush Change detection
  changeDetection: ChangeDetectionStrategy.Default,
})
export class OverlayItemComponent implements OnInit, AfterViewInit, OnDestroy {
  private _subscription = Subscription.EMPTY;
  private _details!: IOverlayItem;
  private _init = false;
  public pos: string = '';
  public closing = false;
  public spacing = 0;
  public contentWidth = 0;
  public contentHeight = 0;
  public hasBackdrop = true;
  public borderRadius = 0;
  public boxShadow: string | undefined = '';
  public position: cd.ActionOverlayPosition = cd.ActionOverlayPosition.Bottom;
  public alignment: cd.ActionOverlayPosition = cd.ActionOverlayPosition.Center;
  public size: cd.OverlaySize = cd.OverlaySize.Board;

  @Input() idx = 0;
  @Input()
  set details(details: IOverlayItem) {
    const { action, target } = details;
    this.updateDimensions(action, target.frame);
    this.borderRadius = action.borderRadius ?? 0;
    this.boxShadow = action.shadow ?? '';
    this.position = action.position;
    this.alignment = action.alignment;
    this.spacing = action.spacing ?? 0;
    const showBackdrop = action.closeOnOutsideClick && action.trigger !== cd.EventTrigger.Hover;
    this.hasBackdrop = showBackdrop;
    this._details = details;
    if (this._init) this.updatePosition();
  }
  get details(): IOverlayItem {
    return this._details;
  }

  @ViewChild('containerRef', { read: ElementRef, static: true }) _containerRef!: ElementRef;
  @ViewChild('contentRef', { read: ViewContainerRef, static: true }) _contentRef!: ViewContainerRef;

  @Output() closed = new EventEmitter<void>();

  constructor(private _cdRef: ChangeDetectorRef, private _elemRef: ElementRef) {}

  get container(): HTMLElement {
    return this._containerRef.nativeElement;
  }

  get outletDocument() {
    return this._elemRef.nativeElement.ownerDocument;
  }

  ngOnInit(): void {
    // insert Render Outlet into view container slot
    this._contentRef.insert(this.details.outletRef.hostView);
  }

  ngAfterViewInit(): void {
    this.updatePosition();
    this.animateIn();
    this._init = true;
  }

  updateDimensions(action: cd.IActionBehaviorPresentOverlay, frame: cd.IRect) {
    const { width, height } = action;
    const size = overlaySizeFromAction(action);
    this.size = size;
    if (size === cd.OverlaySize.Custom) {
      this.contentWidth = width ?? frame.width;
      this.contentHeight = height ?? frame.height;
    }
    if (size === cd.OverlaySize.Board) {
      this.contentWidth = frame.width;
      this.contentHeight = frame.height;
    }
  }

  animate(show: boolean) {
    const contentAnimation = [{ opacity: 1 }, { opacity: 0 }];
    if (show) contentAnimation.reverse();
    return this.container.animate(contentAnimation, SHOW_ANIMATION_CONFIG);
  }

  updatePosition() {
    const { contentWidth: width, contentHeight: height, position, spacing, alignment } = this;
    const triggerId = this.details.triggerId;
    const overlayTriggerElement = queryElementByDataId(this.outletDocument, triggerId);
    const triggerProps = rendererState.getElementById(triggerId);
    const isTriggerBoard = triggerProps ? isBoard(triggerProps) : false;
    const rect = overlayTriggerElement?.getBoundingClientRect() as DOMRect;
    const pt = calculatePosition(position, alignment, width, height, rect, spacing, isTriggerBoard);
    this.pos = translate(pt.x, pt.y);
  }

  animateIn() {
    this.animate(true);
    this._cdRef.detectChanges();
  }

  ngOnDestroy(): void {
    this._subscription.unsubscribe();
  }

  onClosed = () => {
    this.closed.emit();
  };

  close() {
    if (this.closing) return;
    this.closing = true;
    const animation = this.animate(false);
    this._subscription = fromEvent(animation, 'finish').pipe(take(1)).subscribe(this.onClosed);
  }
}

/** This component manages the list of overlays */
@Component({
  selector: 'cdr-overlay',
  template: `
    <cdr-overlay-item
      *ngFor="let overlay of overlays; index as i"
      [details]="overlay"
      [idx]="i"
      (closed)="onClosedEvent(overlay)"
    ></cdr-overlay-item>
  `,
  // DO NOT USE OnPush Change detection
  changeDetection: ChangeDetectionStrategy.Default,
})
export class OverlayManagerComponent {
  public overlays: IOverlayItem[] = [];

  @ViewChildren(OverlayItemComponent) overlayItems!: QueryList<OverlayItemComponent>;

  constructor(private _cdRef: ChangeDetectorRef) {}

  onClosedEvent(details: IOverlayItem) {
    const idx = this.indexForItem(details);
    if (idx === -1) return;
    details.outletRef.destroy();
    this.overlays = removeValueFromArrayAtIndex(idx, this.overlays);
    this._cdRef.detectChanges();
  }

  getOverlayAtIndex(idx: number): OverlayItemComponent | undefined {
    return [...this.overlayItems][idx];
  }

  remove() {
    const { overlays } = this;
    if (!overlays.length) return;
    this.getOverlayAtIndex(overlays.length - 1)?.close();
  }

  cleanup() {
    for (let overlay of this.overlays) {
      overlay.outletRef.destroy();
    }
    this.overlays = [];
    this._cdRef.detectChanges();
  }

  indexForItem(item: IOverlayItem) {
    return this.overlays.findIndex((overlay) => overlay.action.id === item.action.id);
  }

  add(item: IOverlayItem, didHover: boolean) {
    const existingIdx = this.indexForItem(item);
    const hoverType = item.action.trigger === cd.EventTrigger.Hover;
    if (existingIdx !== -1) {
      if (hoverType) {
        this.getOverlayAtIndex(existingIdx)?.close();
      }
      return;
    }
    // Prevent timing issue
    if (hoverType && !didHover) return;
    this.overlays.push(item);
    this._cdRef.detectChanges();
  }
}
