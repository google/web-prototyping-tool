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
  ComponentRef,
  OnDestroy,
  EventEmitter,
  Output,
} from '@angular/core';
import { LayoutPickerComponent } from './layout-picker.component';
import { OverlayService } from 'cd-common';
import { Subscription } from 'rxjs';
import * as cd from 'cd-interfaces';

const OFFSET_X = 80;
const OFFSET_Y = 32;

@Component({
  selector: 'app-layout-dropdown',
  template: `
    <button
      cd-button
      iconName="/assets/icons/layout-preset.svg"
      iconSize="large"
      size="medium"
      cdTooltip="Layout presets..."
      cdTooltipDirection="bottom"
      (click)="onShowLayouts()"
    ></button>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayoutDropdownComponent implements OnDestroy {
  private _subscription = Subscription.EMPTY;
  private _componentRef?: ComponentRef<LayoutPickerComponent>;

  @Output() selectLayout = new EventEmitter<cd.ILayoutDefinition>();

  constructor(private _elemRef: ElementRef, private _overlayService: OverlayService) {}

  ngOnDestroy(): void {
    this.cleanupComponentRef();
    this._subscription.unsubscribe();
  }

  get element(): HTMLElement {
    return this._elemRef.nativeElement;
  }

  cleanupComponentRef() {
    if (!this._componentRef) return;
    this._overlayService.close();
    this._componentRef = undefined;
  }

  onShowLayouts() {
    const { top, left } = this.element.getBoundingClientRect();
    const x = left - OFFSET_X;
    const y = top + OFFSET_Y;
    const componentRef = this._overlayService.attachComponent(LayoutPickerComponent, { x, y });
    this._subscription = componentRef.instance.selectLayout.subscribe(this.onLayoutSelection);
    this._componentRef = componentRef;
  }

  onLayoutSelection = (layout: cd.ILayoutDefinition) => {
    this.selectLayout.emit(layout);
    this._overlayService.close();
    this._subscription.unsubscribe();
  };
}
