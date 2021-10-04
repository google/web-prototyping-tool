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
  Input,
  EventEmitter,
  Output,
  HostListener,
  HostBinding,
  NgZone,
  ChangeDetectionStrategy,
  ViewChild,
  ElementRef,
  AfterViewInit,
} from '@angular/core';
import { IRenderComponent } from '../../outlets/abstract.outlet';
import { queryAndSetInitialFocus } from '../../utils/query.utils';
import { DEFAULT_MODAL_WIDTH, MODAL_FIT_CONTENT, DEFAULT_MODAL_HEIGHT } from './modal.consts';
import { UnitTypes } from 'cd-metadata/units';
import * as cd from 'cd-interfaces';

const HIDE_DIALOG_ANIMATION = 'hidedialog';
const SHOW_DIALOG_ANIMATION = 'showdialog';

@Component({
  selector: 'cdr-modal',
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.scss'],
  // DO NOT USE OnPush Change detection
  changeDetection: ChangeDetectionStrategy.Default,
})
export class ModalComponent implements IRenderComponent, AfterViewInit {
  @Input() backdropColor?: string;
  @Input() contentWidth = DEFAULT_MODAL_WIDTH;
  @Input() contentHeight = DEFAULT_MODAL_HEIGHT;
  @Input() borderRadius: number | undefined = 0;
  @Input() boxShadow: string | undefined = '';
  @Input() hasFocusTrap = true;
  @Input() initialFocusElementId?: string;
  @Input() modalTriggerElement?: HTMLElement;
  @Input() size: cd.OverlaySize = cd.OverlaySize.Board;
  @Output() closed = new EventEmitter<void>();

  @ViewChild('contentRef', { read: ElementRef, static: true }) _contentRef!: ElementRef;

  @HostBinding('class.init') init = false;
  @HostBinding('class.hide')
  hide = false;

  constructor(private _zone: NgZone) {}

  get width(): string {
    if (this.size === cd.OverlaySize.Content) return MODAL_FIT_CONTENT;
    return `${this.contentWidth}${UnitTypes.Pixels}`;
  }

  get height(): string {
    if (this.size === cd.OverlaySize.Content) return MODAL_FIT_CONTENT;
    return `${this.contentHeight}${UnitTypes.Pixels}`;
  }

  ngAfterViewInit(): void {
    // Wait for inital view
    setTimeout(this.didAppear, 0);
  }

  didAppear = () => {
    this.init = true;
  };

  get content() {
    return this._contentRef.nativeElement;
  }

  close() {
    this._zone.runGuarded(() => {
      this.hide = true;
    });
    if (this.modalTriggerElement) this.modalTriggerElement.focus();
  }

  animateIn() {
    /** TODO: update with animation api instead of transition */
  }

  @HostListener('animationend', ['$event'])
  animationEnd(e: AnimationEvent) {
    if (e.animationName === HIDE_DIALOG_ANIMATION) {
      this.closed.emit();
    }

    if (e.animationName === SHOW_DIALOG_ANIMATION) {
      queryAndSetInitialFocus(this.content, this.initialFocusElementId);
    }
  }
}
