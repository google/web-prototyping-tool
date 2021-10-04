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
  ChangeDetectorRef,
  Directive,
  ElementRef,
  Input,
  OnDestroy,
  SkipSelf,
} from '@angular/core';

import { CLASS_ATTR, STYLE_TAG } from 'cd-common/consts';
import { Subscription, Subject, fromEvent, animationFrameScheduler } from 'rxjs';
import { auditTime, take } from 'rxjs/operators';
import { MAT_LABEL } from '../material-shared';

export const MAT_GAP_FIX_DIRECTIVE = 'cdMatGapFix';

const MAT_FORM_FIELD_OUTLINE_GAP_CLASS = '.mat-form-field-outline-gap';
const MAT_FORM_FIELD_REQUIRED_CLASS = '.mat-form-field-required-marker';
const MAT_LABEL_PADDING = 8;

/** This ensures that mat-label is updates when  */
@Directive({ selector: '[cdMatLabelFix]' })
export class MatLabelFixDirective {
  private _value: string | undefined = '';

  @Input()
  set value(value: string | undefined) {
    if (this._value === value) return;
    this._cdRef.markForCheck();
    this._value = value;
  }

  constructor(@SkipSelf() private _cdRef: ChangeDetectorRef) {}
}
/**
 * Angular Material FormField Patch
 * There is a bug inside Mat Form field where removing the label value prevents calculating
 *
 * This fix targets the gap directly and sets its width to zero
 * when the label content is empty...
 *
 * Note: This could also be used to remove the extra background color that cloud applies as a hack
 */
@Directive({ selector: '[cdMatGapFix]' })
export class MatLabelGapFixDirective implements AfterViewInit, OnDestroy {
  private _subscription = Subscription.EMPTY;
  private _observer: MutationObserver;
  private _update$ = new Subject<void>();

  constructor(private _elemRef: ElementRef) {
    this._observer = new MutationObserver(this.onUpdate);
  }

  get elem() {
    return this._elemRef.nativeElement;
  }

  get matLabel() {
    return this.elem.querySelector(MAT_LABEL);
  }

  get gapElements(): HTMLElement[] {
    return this.elem.querySelectorAll(MAT_FORM_FIELD_OUTLINE_GAP_CLASS) ?? [];
  }

  ngAfterViewInit(): void {
    // Fix: When  loads in the background ( embed iframe or background tab )  it can result in a zero width measurement.
    const doc = this.elem.ownerDocument;
    const win = doc.defaultView;
    if (!win) return;

    const config: MutationObserverInit = {
      attributes: true,
      characterData: true,
      subtree: true,
      childList: true,
      attributeOldValue: true,
      attributeFilter: [CLASS_ATTR, STYLE_TAG],
    };

    const updateGap$ = this._update$.pipe(auditTime(60, animationFrameScheduler));
    this._subscription = updateGap$.subscribe(this.handleUpdate);
    this._observer.observe(this.elem, config);
    this._update$.next();

    if (win.innerWidth === 0 && win.innerHeight === 0) {
      this._subscription.add(fromEvent(win, 'resize').pipe(take(1)).subscribe(this.onUpdate));
    }
  }

  ngOnDestroy(): void {
    this._observer.disconnect();
    this._subscription.unsubscribe();
  }

  onUpdate = () => this._update$.next();

  /** only update gap width if size isnt zero */
  canUpdateWidth(size: number) {
    return size === 0;
  }

  /** Read the dimensions of the mat label and required asterisk  */
  processSize = (): number => {
    const { elem, matLabel } = this;
    const requiredElem = elem.querySelector(MAT_FORM_FIELD_REQUIRED_CLASS);
    const labelWidth = matLabel?.getBoundingClientRect().width || 0;
    const requiredWidth = requiredElem?.getBoundingClientRect().width || 0;
    const size = Math.round(labelWidth + requiredWidth);
    return size === 0 ? 0 : size + MAT_LABEL_PADDING;
  };

  handleUpdate = () => {
    const size = this.processSize();
    if (!this.canUpdateWidth(size)) return;
    const update = `${size}px`;
    const { gapElements } = this;
    for (const gap of gapElements) {
      gap.style.width = update;
    }
  };
}
