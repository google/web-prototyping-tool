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

import { coerceBooleanProperty } from '@angular/cdk/coercion';
import { Subscription, fromEvent, merge, animationFrameScheduler } from 'rxjs';
import { auditTime } from 'rxjs/operators';
import {
  Component,
  ChangeDetectionStrategy,
  Directive,
  HostBinding,
  Input,
  ViewChild,
  ElementRef,
  OnDestroy,
  ChangeDetectorRef,
  EventEmitter,
  Output,
  OnInit,
  AfterContentInit,
} from '@angular/core';

/**
 * Scroll Header used as a selector
 */

@Directive({
  selector: '[cdScrollHeader]',
})
export class ScrollViewHeaderDirective {}

/**
 * Scroll Footer used as a selector
 */

@Directive({
  selector: '[cdScrollFooter]',
})
export class ScrollViewFooterDirective {}

const SCROLL_BOTTOM_THRESHOLD = 0.98;
@Component({
  selector: 'cd-scroll-view',
  templateUrl: './scroll-view.component.html',
  styleUrls: ['./scroll-view.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScrollViewComponent implements OnInit, OnDestroy, AfterContentInit {
  private _subscription = new Subscription();
  private _atTop = true;
  private _atBottom = false;
  public canEmitScroll = false;

  @ViewChild('bodyRef', { read: ElementRef, static: true }) _bodyRef!: ElementRef;

  @HostBinding('class.native-scrollbars') nativeSb = false;

  @Input()
  @HostBinding('class.shaded')
  shaded = false;

  @Input()
  set nativeScrollbars(value: boolean | string) {
    this.nativeSb = coerceBooleanProperty(value);
  }

  @Input()
  @HostBinding('class.at-top')
  set atTop(value: boolean) {
    this._atTop = value;
  }
  get atTop(): boolean {
    return this._atTop;
  }

  @Input()
  @HostBinding('class.at-bottom')
  set atBottom(value: boolean) {
    this._atBottom = value;
  }
  get atBottom(): boolean {
    return this._atBottom;
  }

  @Input()
  @HostBinding('class.horizontal-scroll')
  horizontalScroll = false;

  @Output() scrollChange = new EventEmitter<[number, number, number]>();

  constructor(private _cdRef: ChangeDetectorRef) {}

  get bodyElem() {
    return this._bodyRef.nativeElement;
  }

  ngOnInit(): void {
    this.canEmitScroll = this.scrollChange.observers.length > 0;
    if (this.canEmitScroll || this.shaded) {
      const config = { passive: true };
      this._subscription.add(
        merge(
          fromEvent<Event>(this._bodyRef.nativeElement, 'scroll', config),
          fromEvent<Event>(window, 'resize', config)
        )
          .pipe(auditTime(0, animationFrameScheduler))
          .subscribe(this.onScroll)
      );
    }
  }

  get scrollDetails(): [number, number, number] {
    const { scrollTop, scrollHeight, offsetHeight } = this.bodyElem;
    return [scrollTop, scrollHeight, offsetHeight];
  }

  onContentChange() {
    this.onScroll();
  }

  onScroll = () => {
    const { scrollDetails } = this;
    if (this.shaded) {
      this.updateShade(...scrollDetails);
    }
    if (this.canEmitScroll) {
      this.scrollChange.emit(scrollDetails);
    }
  };

  ngAfterContentInit() {
    if (this.canEmitScroll === false) return;
    this.onScroll();
  }

  ngOnDestroy() {
    this._subscription.unsubscribe();
  }

  private updateShade = (scrollTop: number, scrollHeight: number, containerHeight: number) => {
    const scrollableHeight = scrollHeight - containerHeight;

    if (scrollableHeight) {
      const scrollPercentage = Math.max(0, Math.min(1, scrollTop / scrollableHeight));
      this.atTop = scrollPercentage === 0;
      this.atBottom = scrollPercentage > SCROLL_BOTTOM_THRESHOLD;
    } else {
      this.atTop = true;
      this.atBottom = true;
    }

    this._cdRef.markForCheck();
  };

  scrollToTop() {
    this._bodyRef.nativeElement.scrollTop = 0;
    this.onScroll();
  }
}
