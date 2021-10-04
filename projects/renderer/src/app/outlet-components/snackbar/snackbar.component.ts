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
  AfterViewInit,
  ElementRef,
  ViewChild,
  Output,
  EventEmitter,
  OnDestroy,
  HostBinding,
} from '@angular/core';
import * as cd from 'cd-interfaces';
import { fromEvent, Subscription, timer } from 'rxjs';
import { take } from 'rxjs/operators';
import { IRenderComponent } from '../../outlets/abstract.outlet';

const START_ANIMATION = { opacity: 0, transform: 'scale(0.8)' };
const END_ANIMATION = { opacity: 1, transform: 'scale(1)' };
const ANIMATION_CONFIG = { duration: 150, easing: 'cubic-bezier(0, 0, 0.2, 1)', fill: 'forwards' };

@Component({
  selector: 'cdr-snackbar',
  templateUrl: './snackbar.component.html',
  styleUrls: ['./snackbar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SnackbarComponent implements AfterViewInit, OnDestroy, IRenderComponent {
  private _subscription = new Subscription();

  @Input() details?: cd.IActionBehaviorSnackbar;
  @Output() closed = new EventEmitter<void>();

  @ViewChild('barRef', { read: ElementRef, static: true }) _barRef!: ElementRef;

  @HostBinding('class.align-top')
  get top() {
    return this.details?.verticalPosition === cd.SnackBarVerticalPosition.Top;
  }

  @HostBinding('class.align-bottom')
  get bottom() {
    return this.details?.verticalPosition === cd.SnackBarVerticalPosition.Bottom;
  }

  @HostBinding('class.align-left')
  get left() {
    return this.details?.horizontalPosition === cd.SnackBarHorizontalPosition.Left;
  }

  @HostBinding('class.align-right')
  get right() {
    return this.details?.horizontalPosition === cd.SnackBarHorizontalPosition.Right;
  }

  @HostBinding('class.align-center')
  get center() {
    return this.details?.horizontalPosition === cd.SnackBarHorizontalPosition.Center;
  }

  get barElement() {
    return this._barRef.nativeElement;
  }

  ngAfterViewInit(): void {
    this.show();
    if (this.details?.duration === undefined) return;
    this._subscription.add(timer(this.details.duration).pipe(take(1)).subscribe(this.close));
  }

  show() {
    this.barElement.animate([START_ANIMATION, END_ANIMATION], ANIMATION_CONFIG);
  }

  ngOnDestroy(): void {
    this._subscription.unsubscribe();
  }

  sendClosedEvent = () => this.closed.emit();

  close = () => {
    const animation = this.barElement.animate([END_ANIMATION, START_ANIMATION], ANIMATION_CONFIG);
    const finish$ = fromEvent(animation, 'finish').pipe(take(1));
    this._subscription.add(finish$.subscribe(this.sendClosedEvent));
  };

  onActionBtnClick() {
    this.close();
  }
}
