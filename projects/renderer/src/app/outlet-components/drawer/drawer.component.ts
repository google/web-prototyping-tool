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
  HostBinding,
  ViewChild,
  ElementRef,
  OnDestroy,
} from '@angular/core';
import { ActionDrawerMode, ActionDrawerPosition } from 'cd-interfaces';
import { fromEvent, Subscription } from 'rxjs';
import { take } from 'rxjs/operators';
import { IRenderComponent } from '../../outlets/abstract.outlet';
import { queryAndSetInitialFocus } from '../../utils/query.utils';

const EASING = 'cubic-bezier(0.25, 0.8, 0.25, 1)';
const FILL = 'both';
const BACKDROP_ANI_CONFIG = { duration: 400, easing: EASING, fill: FILL };
const CONTENT_ANI_CONFIG = { duration: 250, easing: EASING, fill: FILL };

@Component({
  selector: 'cdr-drawer',
  template: `
    <div #contentRef class="content" [style.width.px]="size" [cdkTrapFocus]="hasFocusTrap">
      <ng-content></ng-content>
    </div>
    <div
      #backDropRef
      class="backdrop"
      (click)="close()"
      [style.--backdrop-color]="backdropColor"
    ></div>
  `,
  styleUrls: ['./drawer.component.scss'],
  // DO NOT USE OnPush Change detection
  changeDetection: ChangeDetectionStrategy.Default,
})
export class DrawerComponent implements IRenderComponent, OnDestroy {
  private _subscription = Subscription.EMPTY;

  @Input() backdropColor?: string;
  @Input() mode = ActionDrawerMode.Overlay;
  @Input() position = ActionDrawerPosition.Right;
  @Input() shadow: string | undefined = '';
  @Input() size = 300;

  // TODO: remember to add user option to remove focus trap
  @Input() hasFocusTrap = true;
  @Input() initialFocusElementId?: string;
  @Input() drawerTriggerElement?: HTMLElement;

  @Output() closed = new EventEmitter<void>();

  @ViewChild('contentRef', { read: ElementRef, static: true }) _contentRef!: ElementRef;
  @ViewChild('backDropRef', { read: ElementRef, static: true }) _backDropRef!: ElementRef;

  @HostBinding('class.right')
  get right() {
    return this.position === ActionDrawerPosition.Right;
  }

  ngOnDestroy(): void {
    this._subscription.unsubscribe();
  }

  get content() {
    return this._contentRef.nativeElement;
  }

  get backdrop() {
    return this._backDropRef.nativeElement;
  }
  constructor() {}

  get direction() {
    return this.position === ActionDrawerPosition.Right ? '100%' : '-100%';
  }

  animateIn = () => {
    const animation = this.animate(true);

    this._subscription = fromEvent(animation, 'finish')
      .pipe(take(1))
      .subscribe(() => {
        queryAndSetInitialFocus(this.content, this.initialFocusElementId);
      });
  };

  animate(show: boolean) {
    const backdropAnimation = [{ opacity: 1 }, { opacity: 0 }];
    if (show) backdropAnimation.reverse();
    this.backdrop.animate(backdropAnimation, BACKDROP_ANI_CONFIG);

    const { direction } = this;
    const startOpacity = show ? 0.5 : 0;
    const contentAnimation = [
      { opacity: 1, transform: 'translateX(0)' },
      { opacity: startOpacity, transform: `translateX(${direction})` },
    ];
    if (show) contentAnimation.reverse();
    return this.content.animate(contentAnimation, CONTENT_ANI_CONFIG);
  }

  onClosed = () => {
    this.closed.emit();
  };
  close() {
    const animation = this.animate(false);
    this._subscription = fromEvent(animation, 'finish').pipe(take(1)).subscribe(this.onClosed);
    if (this.drawerTriggerElement) this.drawerTriggerElement.focus();
  }
}
